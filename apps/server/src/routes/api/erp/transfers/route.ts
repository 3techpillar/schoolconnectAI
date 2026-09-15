import { BranchTransfer, branchTransferToClient } from "@/lib/models/erp/BranchTransfer";
import { ClassModel } from "@/lib/models/core/Class";
import { School, schoolToClient } from "@/lib/models/core/School";
import { StudentProfile } from "@/lib/models/erp/StudentProfile";
import { User } from "@/lib/models/core/User";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { writeErpAudit } from "@/lib/server/services/erp";
import { requireUser, withApiHandler } from "@/lib/server/http";
import { canTransferBetweenCampuses } from "@/lib/server/services/school-group";
import { syncClassDeskRosterFromProfile } from "@/lib/server/services/student-sync";
import { isSchoolAdminRole, isSuperAdminRole } from "@/lib/shared/roles";
import {
  erpTransferCreateSchema,
  erpTransferReviewSchema,
  isSubscriptionActive,
} from "@schoolconnect/shared";
import mongoose from "mongoose";
import type { Role } from "@/lib/shared/roles";

const TRANSFER_ROLES: Role[] = ["admin", "super_admin", "principal"];

async function requireTransferAdmin() {
  const result = await requireUser(TRANSFER_ROLES);
  if (result.error || !result.user) return result;
  if (
    !isSchoolAdminRole(result.user.role) &&
    !isSuperAdminRole(result.user.role) &&
    result.user.role !== "principal"
  ) {
    return {
      error: jsonError("Forbidden", 403),
      session: result.session,
      user: null,
    };
  }
  return result;
}

async function assertSchoolSubscription(schoolId: unknown) {
  if (!schoolId) return null;
  const school = await School.findById(schoolId);
  if (!school) return jsonError("School not found", 404);
  if (!isSubscriptionActive(school)) {
    return jsonError(
      "School subscription expired. Ask Super Admin to extend the end date.",
      403,
    );
  }
  return null;
}

/** Transfers work for Connect + ERP (admin/principal). Destinations include same group + open campuses. */
export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireTransferAdmin();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const requestedSchoolId = url.searchParams.get("schoolId");
  const schoolId =
    isSuperAdminRole(user.role) && requestedSchoolId
      ? requestedSchoolId
      : user.schoolId
        ? String(user.schoolId)
        : null;

  let transfers;
  let destinations: ReturnType<typeof schoolToClient>[] = [];

  if (isSuperAdminRole(user.role) && !schoolId) {
    transfers = await BranchTransfer.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    const schools = await School.find({ status: "active" })
      .sort({ name: 1 })
      .limit(200);
    destinations = schools.map(schoolToClient);
  } else {
    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      return jsonError("schoolId required", 400);
    }
    const sid = new mongoose.Types.ObjectId(schoolId);
    const mine = await School.findById(sid);
    transfers = await BranchTransfer.find({
      ...filter,
      $or: [{ fromSchoolId: sid }, { toSchoolId: sid }],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    if (mine) {
      const group = (mine.groupCode || "").toUpperCase();
      const peers = await School.find({
        status: "active",
        _id: { $ne: sid },
        $or: [
          ...(group ? [{ groupCode: group }] : []),
          { transferPolicy: "open" },
        ],
      })
        .sort({ name: 1 })
        .limit(100);
      destinations = peers.map(schoolToClient);
    }
  }

  return jsonOk({
    transfers: transfers.map(branchTransferToClient),
    destinations,
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireTransferAdmin();
  if (error || !user) return error!;
  if (!isSchoolAdminRole(user.role) && !isSuperAdminRole(user.role)) {
    return jsonError("Only school admin can create transfer requests", 403);
  }

  const subErr = await assertSchoolSubscription(user.schoolId);
  if (subErr) return subErr;

  const parsed = erpTransferCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const { studentUserId, toSchoolId, toClassName, reason } = parsed.data;

  if (!mongoose.Types.ObjectId.isValid(studentUserId)) {
    return jsonError("Invalid studentUserId");
  }
  if (!mongoose.Types.ObjectId.isValid(toSchoolId)) {
    return jsonError("Invalid toSchoolId");
  }

  const student = await User.findById(studentUserId);
  if (!student || student.role !== "student") {
    return jsonError("Student user not found", 404);
  }
  if (!student.schoolId) {
    return jsonError("Student has no school");
  }

  const fromSchool = await School.findById(student.schoolId);
  const toSchool = await School.findById(toSchoolId);
  if (!fromSchool || !toSchool) return jsonError("School not found", 404);

  const gate = canTransferBetweenCampuses(fromSchool, toSchool);
  if (!gate.ok) {
    return jsonError(gate.reason || "Transfer not allowed", 403);
  }

  if (
    !isSuperAdminRole(user.role) &&
    String(user.schoolId) !== String(fromSchool._id)
  ) {
    return jsonError("You can only transfer students from your own campus", 403);
  }

  const existing = await BranchTransfer.findOne({
    studentUserId: student._id,
    status: "pending",
  });
  if (existing) {
    return jsonError("A pending transfer already exists for this student");
  }

  const profile = await StudentProfile.findOne({
    userId: student._id,
    schoolId: fromSchool._id,
  });

  const transfer = await BranchTransfer.create({
    studentUserId: student._id,
    studentProfileId: profile?._id,
    studentName: student.name,
    fromSchoolId: fromSchool._id,
    toSchoolId: toSchool._id,
    groupCode: fromSchool.groupCode || toSchool.groupCode || "",
    fromClassName: student.className || profile?.className || "",
    toClassName: toClassName || student.className || profile?.className || "",
    reason: reason || "",
    status: "pending",
    requestedById: user._id,
    requestedByName: user.name,
  });

  await writeErpAudit({
    user,
    schoolId: fromSchool._id,
    action: "create",
    entityType: "BranchTransfer",
    entityId: String(transfer._id),
    meta: {
      toSchoolId: String(toSchool._id),
      studentUserId,
      kind: gate.kind,
    },
  });

  return jsonOk({ transfer: branchTransferToClient(transfer) }, 201);
});

export const PATCH = withApiHandler(async (req: Request) => {
  const { error, user } = await requireTransferAdmin();
  if (error || !user) return error!;
  if (!isSchoolAdminRole(user.role) && !isSuperAdminRole(user.role)) {
    return jsonError("Only school admin can review transfers", 403);
  }

  const subErr = await assertSchoolSubscription(user.schoolId);
  if (subErr) return subErr;

  const parsed = erpTransferReviewSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid body");
  }
  const { id, status, toClassName, note } = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid id");
  }

  const transfer = await BranchTransfer.findById(id);
  if (!transfer) return jsonError("Transfer not found", 404);
  if (transfer.status !== "pending") {
    return jsonError("Transfer is not pending");
  }

  if (
    !isSuperAdminRole(user.role) &&
    String(user.schoolId) !== String(transfer.toSchoolId)
  ) {
    return jsonError(
      "Only the destination campus admin can approve or reject",
      403,
    );
  }

  if (status === "rejected") {
    transfer.status = "rejected";
    transfer.reviewedById = user._id;
    transfer.reviewedByName = user.name;
    transfer.reviewNote = note || "";
    transfer.reviewedAt = new Date();
    await transfer.save();
    await writeErpAudit({
      user,
      schoolId: transfer.toSchoolId,
      action: "reject",
      entityType: "BranchTransfer",
      entityId: String(transfer._id),
    });
    return jsonOk({ transfer: branchTransferToClient(transfer) });
  }

  const toSchool = await School.findById(transfer.toSchoolId);
  const fromSchool = await School.findById(transfer.fromSchoolId);
  if (!toSchool || !fromSchool) return jsonError("School missing", 404);

  const student = await User.findById(transfer.studentUserId);
  if (!student) return jsonError("Student missing", 404);

  const className =
    toClassName || transfer.toClassName || student.className || "6-B";
  let classDoc = await ClassModel.findOne({
    schoolId: toSchool._id,
    className,
  });
  if (!classDoc) {
    const [grade, section] = className.includes("-")
      ? className.split("-")
      : [className, "A"];
    classDoc = await ClassModel.create({
      schoolId: toSchool._id,
      grade: grade || "6",
      section: section || "A",
      className,
    });
  }

  student.schoolId = toSchool._id;
  student.schoolName = toSchool.name;
  student.className = className;
  student.classId = classDoc._id;
  student.enrollmentStatus = "approved";
  await student.save();

  const profile = transfer.studentProfileId
    ? await StudentProfile.findById(transfer.studentProfileId)
    : await StudentProfile.findOne({ userId: student._id });

  if (profile) {
    profile.schoolId = toSchool._id;
    profile.classSectionId = classDoc._id;
    profile.className = className;
    profile.branchId = toSchool.branchName || toSchool.city || "";
    profile.status = "enrolled";
    await profile.save();
    await syncClassDeskRosterFromProfile(profile);
  }

  const { ParentStudentLink } = await import("@/lib/models/family/ParentStudentLink");
  const links = await ParentStudentLink.find({ studentUserId: student._id });
  for (const link of links) {
    link.schoolId = toSchool._id;
    await link.save();
    const parent = await User.findById(link.parentUserId);
    if (parent && parent.role === "parent") {
      parent.schoolId = toSchool._id;
      parent.schoolName = toSchool.name;
      parent.className = className;
      await parent.save();
    }
  }

  transfer.status = "approved";
  transfer.toClassName = className;
  transfer.reviewedById = user._id;
  transfer.reviewedByName = user.name;
  transfer.reviewNote = note || "";
  transfer.reviewedAt = new Date();
  await transfer.save();

  await writeErpAudit({
    user,
    schoolId: toSchool._id,
    action: "approve",
    entityType: "BranchTransfer",
    entityId: String(transfer._id),
    meta: {
      fromSchoolId: String(fromSchool._id),
      studentUserId: String(student._id),
      className,
    },
  });

  return jsonOk({ transfer: branchTransferToClient(transfer) });
});
