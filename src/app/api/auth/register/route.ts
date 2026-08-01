import { connectMongo, isMongoConfigured } from "@/lib/db/mongodb";
import { ClassModel } from "@/lib/models/Class";
import { School } from "@/lib/models/School";
import { TeacherInvite } from "@/lib/models/TeacherInvite";
import { User, userToClient, USER_ROLES } from "@/lib/models/User";
import {
  AUTH_COOKIE,
  jsonError,
  jsonOk,
  sessionCookieOptions,
  signSession,
} from "@/lib/server/auth";
import { ensureStudentEnrollmentForUser } from "@/lib/server/enrollment-service";
import { consumeVerifiedMarker } from "@/lib/server/otp-service";
import { parseJsonBody, readTrimmed } from "@/lib/server/request";
import { parseClassLabel } from "@/lib/shared/class-utils";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    if (!isMongoConfigured()) {
      return jsonError("MONGODB_URI is not configured", 503);
    }

    const parsed = await parseJsonBody<{
      identifier?: string;
      identifierType?: "email" | "phone";
      name?: string;
      role?: string;
      school?: string;
      className?: string;
      childName?: string;
      inviteCode?: string;
    }>(req);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;

    const idField = readTrimmed(body.identifier, "identifier");
    if ("error" in idField) return idField.error;
    const nameField = readTrimmed(body.name, "name");
    if ("error" in nameField) return nameField.error;
    const schoolField = readTrimmed(body.school, "school");
    if ("error" in schoolField) return schoolField.error;

    const identifier = idField.value.toLowerCase();
    const name = nameField.value;
    const schoolName = schoolField.value;
    const role = body.role || "parent";
    const identifierType =
      body.identifierType ||
      (identifier.includes("@") ? "email" : "phone");

    if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
      return jsonError("Invalid role");
    }

    await connectMongo();

    const existing = await User.findOne({ identifier });
    if (existing) {
      return jsonError("Account already exists. Please sign in.", 409);
    }

    const hasVerified = await consumeVerifiedMarker(identifier);
    if (!hasVerified) {
      return jsonError("Please verify OTP before completing registration", 401);
    }

    let school = await School.findOne({
      name: new RegExp(
        `^${schoolName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    });
    if (!school) {
      school = await School.create({
        name: schoolName,
        city: "",
        status: "active",
      });
    }

    let invite = null as Awaited<ReturnType<typeof TeacherInvite.findOne>>;
    if (
      body.inviteCode ||
      ["class_teacher", "principal", "bus_attendant"].includes(role)
    ) {
      invite =
        (body.inviteCode &&
          (await TeacherInvite.findOne({
            code: body.inviteCode.trim().toUpperCase(),
            status: "pending",
          }))) ||
        (await TeacherInvite.findOne({
          identifier,
          status: "pending",
        }));

      if (
        ["class_teacher", "principal", "bus_attendant"].includes(role) &&
        !invite
      ) {
        return jsonError(
          "Teachers need a valid invite code from School Admin",
          400,
        );
      }
    }

    const resolvedRole = (
      invite ? invite.role : role
    ) as (typeof USER_ROLES)[number];
    const resolvedSchoolId = invite ? invite.schoolId : school._id;
    const resolvedSchoolName = invite ? invite.schoolName : school.name;
    const classParts = parseClassLabel(invite?.className || body.className);

    const needsApproval =
      resolvedRole === "student" ||
      (["class_teacher", "principal"].includes(resolvedRole) && !invite);
    const enrollmentStatus: "pending" | "approved" | "rejected" = invite
      ? "approved"
      : needsApproval
        ? "pending"
        : "approved";

    let classDoc = await ClassModel.findOne({
      schoolId: resolvedSchoolId,
      className: classParts.className,
    });
    if (
      !classDoc &&
      (resolvedRole === "student" || resolvedRole === "class_teacher")
    ) {
      classDoc = await ClassModel.create({
        schoolId: resolvedSchoolId,
        grade: classParts.grade,
        section: classParts.section,
        className: classParts.className,
      });
    }

    const user = await User.create({
      identifier,
      identifierType,
      name,
      role: resolvedRole,
      schoolId: resolvedSchoolId,
      schoolName: resolvedSchoolName,
      className: classParts.className,
      classId: classDoc?._id,
      childName: body.childName?.trim() || undefined,
      enrollmentStatus,
      inviteCode: invite?.code,
      busRouteId: "route-12",
      homeStopId: "s3",
      busAlert10: true,
      busAlert5: true,
      classHistory:
        resolvedRole === "student"
          ? [
              {
                sessionId: "ay-current",
                sessionLabel: "2025-26",
                className: classParts.className,
                result: "pending" as const,
                at: Date.now(),
              },
            ]
          : [],
    });

    if (invite) {
      invite.status = "accepted";
      invite.acceptedAt = new Date();
      invite.acceptedUserId = user._id;
      await invite.save();
    }

    if (resolvedRole === "student") {
      await ensureStudentEnrollmentForUser(user);
    }

    const token = await signSession({
      sub: String(user._id),
      role: user.role as never,
      schoolId: String(user.schoolId),
      enrollmentStatus: user.enrollmentStatus as never,
    });
    const jar = await cookies();
    jar.set(AUTH_COOKIE, token, sessionCookieOptions());

    return jsonOk({ user: userToClient(user), token }, 201);
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Registration failed",
      500,
    );
  }
}
