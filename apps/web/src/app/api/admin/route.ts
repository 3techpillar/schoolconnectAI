import { nextClassName } from "@/lib/shared/class-utils";
import { AdminData } from "@/lib/models/core/AdminData";
import { School } from "@/lib/models/core/School";
import { User, userToClient } from "@/lib/models/core/User";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import type { Types } from "mongoose";

async function ensureAdminDoc(
  schoolId: Types.ObjectId | undefined,
  schoolName: string,
) {
  const filter = schoolId
    ? { schoolId, scope: "school" }
    : { scope: "platform" };
  let doc = await AdminData.findOne(filter);
  if (!doc) {
    doc = await AdminData.create({
      schoolId: schoolId || undefined,
      scope: schoolId ? "school" : "platform",
      sessions: [
        {
          key: "ay-2025-26",
          label: "2025-26",
          schoolId,
          schoolName,
          status: "active",
          startsOn: "2025-04-01",
          endsOn: "2026-03-31",
        },
        {
          key: "ay-2024-25",
          label: "2024-25",
          schoolId,
          schoolName,
          status: "completed",
          startsOn: "2024-04-01",
          endsOn: "2025-03-31",
        },
      ],
      promotionLog: [],
    });
  }
  return doc;
}

async function schoolsPayload(actorSchoolId?: Types.ObjectId | null) {
  const schools = await School.find(
    actorSchoolId ? { _id: actorSchoolId } : {},
  ).sort({ name: 1 });

  const out = [];
  for (const s of schools) {
    const adminCount = await User.countDocuments({
      schoolId: s._id,
      role: { $in: ["admin", "super_admin"] },
    });
    const studentCount = await User.countDocuments({
      schoolId: s._id,
      role: "student",
    });
    out.push({
      id: String(s._id),
      name: s.name,
      city: s.city || "",
      adminCount,
      studentCount,
      status: s.status as "active" | "paused",
    });
  }
  return out;
}

export async function GET() {
  const { error, user } = await requireUser([
    "admin",
    "super_admin",
    "principal",
  ]);
  if (error || !user) return error!;

  const schoolId =
    user.role === "super_admin" ? undefined : user.schoolId || undefined;
  const doc = await ensureAdminDoc(
    schoolId,
    user.schoolName || "",
  );

  const userFilter: Record<string, unknown> = {};
  if (user.role !== "super_admin" && user.schoolId) {
    userFilter.schoolId = user.schoolId;
  }

  const users = await User.find(userFilter).sort({ createdAt: -1 }).limit(500);
  const schools = await schoolsPayload(
    user.role === "super_admin" ? null : user.schoolId,
  );

  return jsonOk({
    sessions: (doc.sessions || []).map((s) => ({
      id: s.key,
      label: s.label,
      school: s.schoolName || user.schoolName || "",
      status: s.status as "active" | "completed",
      startsOn: s.startsOn,
      endsOn: s.endsOn,
    })),
    schools,
    promotionLog: (doc.promotionLog || []).map((p) => ({
      id: p.key,
      sessionId: p.sessionId,
      at: p.at,
      by: p.by,
      results: (p.results || []).map((r) => ({
        studentId: r.studentId || "",
        name: r.name || "",
        fromClass: r.fromClass || "",
        toClass: r.toClass || null,
        result: (r.result || "pass") as "pass" | "fail",
      })),
    })),
    users: users.map(userToClient),
  });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser([
    "admin",
    "super_admin",
    "principal",
  ]);
  if (error || !user) return error!;

  const body = (await req.json()) as {
    action?:
      | "promote"
      | "completeSession"
      | "startNextSession"
      | "toggleSchool";
    sessionId?: string;
    decisions?: Array<{ studentId: string; result: "pass" | "fail" }>;
    externalResults?: Array<{
      studentId: string;
      name: string;
      fromClass: string;
      toClass: string | null;
      result: "pass" | "fail";
    }>;
    schoolId?: string;
  };

  const doc = await ensureAdminDoc(
    user.schoolId || undefined,
    user.schoolName || "",
  );

  if (body.action === "promote") {
    const session =
      (doc.sessions || []).find((s) => s.key === body.sessionId) ||
      (doc.sessions || []).find((s) => s.status === "active") ||
      (doc.sessions || [])[0];
    if (!session) return jsonError("No academic session found");

    const results = [...(body.externalResults || [])];
    for (const d of body.decisions || []) {
      const student = await User.findById(d.studentId);
      if (!student || student.role !== "student" || !student.className) continue;
      const fromClass = student.className;
      const toClass =
        d.result === "pass"
          ? nextClassName(student.className)
          : student.className;
      const history = [
        ...(student.classHistory || []),
        {
          sessionId: session.key,
          sessionLabel: session.label,
          className: fromClass,
          result: d.result,
          promotedTo: d.result === "pass" ? toClass || undefined : undefined,
          at: Date.now(),
        },
      ];
      student.className =
        d.result === "pass" && toClass ? toClass : fromClass;
      student.academicYear = session.label;
      student.classHistory = history as typeof student.classHistory;
      await student.save();
      results.push({
        studentId: String(student._id),
        name: student.name,
        fromClass,
        toClass: (d.result === "pass" ? toClass : fromClass) || fromClass,
        result: d.result,
      });
    }

    const log = [
      {
        key: `promo-${Date.now()}`,
        sessionId: session.key,
        at: Date.now(),
        by: user.name,
        results,
      },
      ...(doc.promotionLog || []),
    ];
    doc.set("promotionLog", log);
    await doc.save();
    return jsonOk({ results, promotionLog: log.map((p) => ({
      id: p.key,
      sessionId: p.sessionId,
      at: p.at,
      by: p.by,
      results: p.results,
    })) });
  }

  if (body.action === "completeSession") {
    if (!body.sessionId) return jsonError("sessionId required");
    const sessions = (doc.sessions || []).map((s) => ({
      key: s.key,
      label: s.label,
      schoolId: s.schoolId,
      schoolName: s.schoolName,
      status: s.key === body.sessionId ? ("completed" as const) : s.status,
      startsOn: s.startsOn,
      endsOn: s.endsOn,
    }));
    doc.set("sessions", sessions);
    const log = [
      {
        key: `promo-${Date.now()}`,
        sessionId: body.sessionId,
        at: Date.now(),
        by: user.name,
        results: [],
      },
      ...(doc.promotionLog || []).map((p) => ({
        key: p.key,
        sessionId: p.sessionId,
        at: p.at,
        by: p.by,
        results: p.results,
      })),
    ];
    doc.set("promotionLog", log);
    await doc.save();
    return jsonOk({ okSession: true });
  }

  if (body.action === "startNextSession") {
    const active = (doc.sessions || []).find((s) => s.status === "active");
    const label = active
      ? `${Number(active.label.slice(0, 4)) + 1}-${String(Number(active.label.slice(0, 4)) + 2).slice(2)}`
      : "2026-27";
    const next = {
      key: `ay-${label}`,
      label,
      schoolId: user.schoolId,
      schoolName: user.schoolName || "",
      status: "active" as const,
      startsOn: `${label.slice(0, 4)}-04-01`,
      endsOn: `20${label.slice(5)}-03-31`,
    };
    const sessions = [
      next,
      ...(doc.sessions || []).map((s) => ({
        key: s.key,
        label: s.label,
        schoolId: s.schoolId,
        schoolName: s.schoolName,
        status:
          s.status === "active" ? ("completed" as const) : s.status,
        startsOn: s.startsOn,
        endsOn: s.endsOn,
      })),
    ];
    doc.set("sessions", sessions);
    await doc.save();
    return jsonOk({
      session: {
        id: next.key,
        label: next.label,
        school: next.schoolName,
        status: next.status,
        startsOn: next.startsOn,
        endsOn: next.endsOn,
      },
    });
  }

  if (body.action === "toggleSchool") {
    if (user.role !== "super_admin") return jsonError("Forbidden", 403);
    if (!body.schoolId) return jsonError("schoolId required");
    const school = await School.findById(body.schoolId);
    if (!school) return jsonError("School not found", 404);
    school.status = school.status === "active" ? "paused" : "active";
    await school.save();
    return jsonOk({
      school: {
        id: String(school._id),
        status: school.status,
      },
    });
  }

  return jsonError("Unknown action");
}
