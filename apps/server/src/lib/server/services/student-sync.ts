import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import { ClassModel } from "@/lib/models/core/Class";
import {
  StudentProfile,
  studentProfileToClient,
  type StudentProfileDoc,
} from "@/lib/models/erp/StudentProfile";
import type { Types } from "mongoose";

function avatarFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function rosterKeyFromProfile(profileId: string) {
  return `sp-${profileId}`;
}

/** Upsert StudentProfile and sync ClassDesk roster projection. */
export async function upsertStudentProfileAndSyncRoster(input: {
  schoolId: Types.ObjectId | string;
  name: string;
  className: string;
  classSectionId?: Types.ObjectId | string | null;
  rollNo?: string;
  userId?: Types.ObjectId | string | null;
  admissionNo?: string;
  guardians?: Array<{
    name: string;
    relationship?: "father" | "mother" | "guardian" | "other";
    phone?: string;
    email?: string;
    isPrimary?: boolean;
    userId?: Types.ObjectId | string;
  }>;
  status?: "prospect" | "enrolled" | "alumni" | "left" | "inactive";
  academicYear?: string;
  existingProfileId?: Types.ObjectId | string | null;
}): Promise<StudentProfileDoc> {
  const schoolId = input.schoolId as Types.ObjectId;
  let classSectionId = input.classSectionId as Types.ObjectId | undefined;
  if (!classSectionId && input.className) {
    const cls = await ClassModel.findOne({
      schoolId,
      className: input.className,
    });
    classSectionId = cls?._id;
  }

  let profile: StudentProfileDoc | null = null;
  if (input.existingProfileId) {
    profile = await StudentProfile.findById(input.existingProfileId);
  }
  if (!profile && input.userId) {
    profile = await StudentProfile.findOne({
      schoolId,
      userId: input.userId,
    });
  }
  if (!profile && input.admissionNo) {
    profile = await StudentProfile.findOne({
      schoolId,
      admissionNo: input.admissionNo,
    });
  }
  if (!profile) {
    profile = await StudentProfile.findOne({
      schoolId,
      name: input.name,
      className: input.className,
      status: { $in: ["prospect", "enrolled"] },
    });
  }

  const guardianPayload = (input.guardians || []).map((g) => ({
    name: g.name,
    relationship: g.relationship || ("guardian" as const),
    phone: g.phone || "",
    email: g.email || "",
    isPrimary: Boolean(g.isPrimary),
    userId: g.userId as Types.ObjectId | undefined,
  }));

  if (!profile) {
    profile = await StudentProfile.create({
      schoolId,
      name: input.name,
      className: input.className,
      classSectionId,
      rollNo: input.rollNo || "",
      userId: input.userId || undefined,
      admissionNo: input.admissionNo || undefined,
      guardians: guardianPayload,
      status: input.status || "enrolled",
      academicYear: input.academicYear || "2025-26",
    });
  } else {
    profile.name = input.name;
    profile.className = input.className;
    if (classSectionId) profile.classSectionId = classSectionId;
    if (input.rollNo !== undefined) profile.rollNo = input.rollNo;
    if (input.userId) profile.userId = input.userId as Types.ObjectId;
    if (input.admissionNo) profile.admissionNo = input.admissionNo;
    if (input.guardians) profile.guardians = guardianPayload as never;
    if (input.status) profile.status = input.status;
    if (input.academicYear) profile.academicYear = input.academicYear;
    await profile.save();
  }

  await syncClassDeskRosterFromProfile(profile);
  return profile;
}

/**
 * Atomic roster upsert — avoids Mongoose VersionError under concurrent
 * ensureSchoolDemoData / enrollment sync.
 */
export async function syncClassDeskRosterFromProfile(
  profile: StudentProfileDoc,
) {
  if (!profile.className || profile.status !== "enrolled") {
    await removeProfileFromAllRosters(profile);
    return;
  }

  const schoolId = profile.schoolId;
  const className = profile.className;
  const profileId = String(profile._id);
  const userId = profile.userId ? String(profile.userId) : undefined;

  await ClassDesk.updateOne(
    { schoolId, className },
    {
      $setOnInsert: {
        schoolId,
        className,
        attendanceByDay: {},
        circulars: [],
      },
    },
    { upsert: true },
  );

  const desk = await ClassDesk.findOne({ schoolId, className }).lean();
  const existingKey =
    (desk?.roster || []).find(
      (r) =>
        r.studentProfileId === profileId ||
        (userId && r.userId === userId) ||
        r.name.trim().toLowerCase() === profile.name.trim().toLowerCase(),
    )?.key || rosterKeyFromProfile(profileId);

  const primaryGuardian =
    (profile.guardians || []).find((g) => g.isPrimary) ||
    (profile.guardians || [])[0];

  const entry = {
    key: existingKey,
    name: profile.name,
    rollNo: profile.rollNo || "00",
    parentName: primaryGuardian?.name || "",
    avatar: avatarFromName(profile.name),
    parentChatId: `parent-${existingKey}`,
    className,
    userId,
    studentProfileId: profileId,
  };

  // Pipeline update: filter old rows for this student, append entry, sort by roll
  await ClassDesk.collection.updateOne({ schoolId, className }, [
    {
      $set: {
        roster: {
          $sortArray: {
            input: {
              $concatArrays: [
                {
                  $filter: {
                    input: { $ifNull: ["$roster", []] },
                    as: "r",
                    cond: {
                      $and: [
                        { $ne: ["$$r.studentProfileId", profileId] },
                        { $ne: ["$$r.key", existingKey] },
                        ...(userId
                          ? [{ $ne: ["$$r.userId", userId] }]
                          : []),
                      ],
                    },
                  },
                },
                [entry],
              ],
            },
            sortBy: { rollNo: 1 },
          },
        },
      },
    },
  ]);
}

async function removeProfileFromAllRosters(profile: StudentProfileDoc) {
  const profileId = String(profile._id);
  await ClassDesk.updateMany(
    { schoolId: profile.schoolId, "roster.studentProfileId": profileId },
    { $pull: { roster: { studentProfileId: profileId } } },
  );
}

export async function ensureProfilesForEnrollment(input: {
  schoolId: Types.ObjectId | string;
  studentName: string;
  className: string;
  classId?: Types.ObjectId | string | null;
  studentUserId?: Types.ObjectId | string | null;
  identifier?: string | null;
  parentName?: string;
}) {
  return upsertStudentProfileAndSyncRoster({
    schoolId: input.schoolId,
    name: input.studentName,
    className: input.className,
    classSectionId: input.classId,
    userId: input.studentUserId,
    guardians: input.parentName
      ? [{ name: input.parentName, isPrimary: true, relationship: "guardian" }]
      : undefined,
    status: "enrolled",
  });
}

export { studentProfileToClient, rosterKeyFromProfile };
