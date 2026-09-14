import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import { jsonError } from "@/lib/server/auth";
import { requireErpUser, resolveErpSchoolId } from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** School-wide attendance CSV export for a date (default today). */
export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const dateKey =
    url.searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const desks = await ClassDesk.find({ schoolId: scope.schoolId }).limit(100);
  const header = ["className", "rollNo", "studentName", "mark", "date"];
  const rows: string[] = [];
  for (const desk of desks) {
    const marks = (desk.attendanceByDay || {})[dateKey] || {};
    for (const s of desk.roster || []) {
      rows.push(
        [desk.className, s.rollNo, s.name, marks[s.key] || "", dateKey]
          .map((v) => escapeCsv(String(v)))
          .join(","),
      );
    }
  }

  const csv = [header.join(","), ...rows].join("\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${dateKey}.csv"`,
    },
  });
});
