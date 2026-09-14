import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import { Homework } from "@/lib/models/comms/Homework";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireErpUser, resolveErpSchoolId } from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";

/** Read-only circulars + homework overview for ERP ops. */
export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const [desks, homework] = await Promise.all([
    ClassDesk.find({ schoolId: scope.schoolId }).limit(50),
    Homework.find({ schoolId: scope.schoolId })
      .sort({ createdAtMs: -1 })
      .limit(40),
  ]);

  const circulars = desks.flatMap((d) =>
    (d.circulars || []).map((c) => ({
      id: c.key,
      className: c.className || d.className,
      title: c.title,
      body: c.body,
      tag: c.tag || "Notice",
      postedBy: c.postedBy,
      createdAt: c.createdAt || Date.now(),
      unreadCount: (c.unreadBy || []).length,
    })),
  );
  circulars.sort((a, b) => b.createdAt - a.createdAt);

  return jsonOk({
    circulars: circulars.slice(0, 40),
    homework: homework.map((h) => ({
      id: String(h._id),
      subject: h.subject,
      title: h.title,
      dueDate: h.dueDate,
      due: h.due,
      priority: h.priority,
      status: h.status,
      className: h.className,
      postedBy: h.postedBy,
      createdAt: h.createdAtMs || Date.now(),
    })),
  });
});
