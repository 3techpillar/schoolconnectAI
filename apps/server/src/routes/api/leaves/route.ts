import { Leave, leaveToClient } from "@/lib/models/ops/Leave";
import { StudentProfile } from "@/lib/models/erp/StudentProfile";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";

export async function GET() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonOk({ leaves: [] });

  const filter: Record<string, unknown> = { schoolId: user.schoolId };
  if (user.role === "parent" || user.role === "student") {
    filter.applicantId = String(user._id);
  } else if (user.role === "class_teacher" && user.className) {
    filter.className = user.className;
  }

  const list = await Leave.find(filter).sort({ appliedAt: -1 }).limit(200);
  return jsonOk({ leaves: list.map(leaveToClient) });
}

export async function POST(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const body = (await req.json()) as {
    studentName?: string;
    fromDate?: string;
    toDate?: string;
    reason?: string;
  };

  if (
    !body.studentName?.trim() ||
    !body.fromDate ||
    !body.toDate ||
    !body.reason?.trim()
  ) {
    return jsonError("studentName, fromDate, toDate and reason are required");
  }

  const studentName = body.studentName.trim();
  const escaped = studentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const profile =
    (await StudentProfile.findOne({
      schoolId: user.schoolId,
      name: new RegExp(`^${escaped}$`, "i"),
      status: "enrolled",
    })) ||
    (user.role === "student"
      ? await StudentProfile.findOne({
          schoolId: user.schoolId,
          userId: user._id,
        })
      : null);

  const leave = await Leave.create({
    schoolId: user.schoolId,
    applicantId: String(user._id),
    applicantName: user.name,
    applicantRole: user.role,
    studentName,
    studentProfileId: profile?._id,
    schoolName: user.schoolName,
    className: profile?.className || user.className,
    fromDate: body.fromDate,
    toDate: body.toDate,
    reason: body.reason.trim(),
    status: "pending",
    appliedAt: Date.now(),
  });

  return jsonOk({ leave: leaveToClient(leave) }, 201);
}
