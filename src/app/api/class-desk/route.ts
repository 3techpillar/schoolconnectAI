import { ClassDesk, classDeskToClient } from "@/lib/models/ClassDesk";
import { jsonError, jsonOk } from "@/lib/server/response";
import {
  markCircularRead,
  publishCircular,
} from "@/lib/server/circular-service";
import { requireUser } from "@/lib/server/http";
import { ensureSchoolDemoData } from "@/lib/server/seed-school";
import { canBroadcastNotification } from "@/lib/shared/roles";

export async function GET(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  await ensureSchoolDemoData(user.schoolId);

  const { searchParams } = new URL(req.url);
  const className =
    searchParams.get("className") || user.className || "6-B";

  let desk = await ClassDesk.findOne({
    schoolId: user.schoolId,
    className,
  });
  if (!desk) {
    desk = await ClassDesk.create({
      schoolId: user.schoolId,
      className,
      roster: [],
      attendanceByDay: {},
      circulars: [],
    });
  }

  return jsonOk({
    className,
    ...classDeskToClient(desk, String(user._id)),
  });
}

export async function PATCH(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const body = (await req.json()) as {
    className?: string;
    attendance?: { dateKey: string; marks: Record<string, string> };
    setMark?: { dateKey: string; studentId: string; mark: string };
    circular?: {
      title: string;
      body: string;
      tag?: string;
    };
    markCircularRead?: { key: string };
    promote?: Array<{ studentId: string; result: "pass" | "fail" }>;
  };

  const className = body.className || user.className || "6-B";
  const uid = String(user._id);

  // Any authenticated school user can mark a circular as read.
  if (body.markCircularRead?.key) {
    const desk = await markCircularRead({
      schoolId: user.schoolId,
      className,
      circularKey: body.markCircularRead.key,
      userId: uid,
    });
    if (!desk) return jsonError("Class desk not found", 404);
    return jsonOk({ className, ...desk });
  }

  const staff = canBroadcastNotification(user.role);
  if (!staff) {
    return jsonError("Only teachers or admins can update the class desk", 403);
  }

  // Dedicated circular publish path (unread + notification fan-out).
  if (body.circular?.title && body.circular?.body) {
    const result = await publishCircular({
      schoolId: user.schoolId,
      className,
      title: body.circular.title,
      body: body.circular.body,
      tag: body.circular.tag,
      actor: user,
    });
    return jsonOk({
      className,
      ...result.desk,
      notification: result.notification,
    });
  }

  let desk = await ClassDesk.findOne({ schoolId: user.schoolId, className });
  if (!desk) {
    desk = await ClassDesk.create({
      schoolId: user.schoolId,
      className,
      roster: [],
      attendanceByDay: {},
      circulars: [],
    });
  }

  if (body.setMark) {
    const { dateKey, studentId, mark } = body.setMark;
    const day = {
      ...((desk.attendanceByDay as Record<string, Record<string, string>>)[
        dateKey
      ] || {}),
      [studentId]: mark,
    };
    desk.attendanceByDay = {
      ...(desk.attendanceByDay as object),
      [dateKey]: day,
    };
    desk.markModified("attendanceByDay");
  }

  if (body.attendance) {
    desk.attendanceByDay = {
      ...(desk.attendanceByDay as object),
      [body.attendance.dateKey]: body.attendance.marks,
    };
    desk.markModified("attendanceByDay");
  }

  if (body.promote?.length) {
    const nextGrade = (cn: string) => {
      const m = cn.match(/^(\d{1,2})-([A-Za-z])$/);
      if (!m) return cn;
      const g = Number(m[1]);
      if (g >= 12) return cn;
      return `${g + 1}-${m[2].toUpperCase()}`;
    };
    desk.roster = (desk.roster || []).map((s) => {
      const d = body.promote!.find((p) => p.studentId === s.key);
      if (!d) return s;
      return {
        key: s.key,
        name: s.name,
        rollNo: s.rollNo,
        parentName: s.parentName,
        avatar: s.avatar,
        parentChatId: s.parentChatId,
        className:
          d.result === "pass" ? nextGrade(s.className) : s.className,
        userId: s.userId,
      };
    }) as typeof desk.roster;
  }

  await desk.save();
  return jsonOk({
    className,
    ...classDeskToClient(desk, uid),
  });
}
