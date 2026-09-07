import {
  StudentProfile,
  studentProfileToClient,
} from "@/lib/models/erp/StudentProfile";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  escapeCsv,
  parseCsvText,
  STUDENT_CSV_HEADERS,
} from "@/lib/server/services/csv";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { upsertStudentProfileAndSyncRoster } from "@/lib/server/services/student-sync";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const students = await StudentProfile.find({ schoolId: scope.schoolId })
    .sort({ className: 1, rollNo: 1 })
    .limit(2000);

  const rows = students.map((s) => {
    const g = (s.guardians || [])[0];
    return [
      s.admissionNo || "",
      s.name,
      s.className || "",
      s.rollNo || "",
      s.status || "",
      s.dob || "",
      s.gender || "",
      g?.name || "",
      g?.phone || "",
    ]
      .map((v) => escapeCsv(String(v)))
      .join(",");
  });
  const csv = [STUDENT_CSV_HEADERS.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-${scope.schoolId}.csv"`,
    },
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as {
    schoolId?: string;
    csv?: string;
    rows?: Array<Record<string, string>>;
  };
  const scope = resolveErpSchoolId(user, body.schoolId);
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  let rows = body.rows || [];
  if ((!rows || rows.length === 0) && body.csv) {
    const parsed = parseCsvText(body.csv);
    if (parsed.headers.length < 1 || parsed.rows.length < 1) {
      return jsonError("CSV needs header + at least one data row");
    }
    rows = parsed.rows;
  }

  if (!rows.length) return jsonError("No rows to import");

  const created = [];
  const errors: string[] = [];

  for (const [idx, row] of rows.slice(0, 500).entries()) {
    const name = (row.name || row.Name || "").trim();
    if (!name) {
      errors.push(`Row ${idx + 2}: name is required`);
      continue;
    }
    const admissionNo = (row.admissionNo || "").trim() || undefined;
    const genderRaw = (row.gender || "").trim().toLowerCase();
    const gender =
      genderRaw === "male" ||
      genderRaw === "female" ||
      genderRaw === "other"
        ? genderRaw
        : "unspecified";

    const profile = await upsertStudentProfileAndSyncRoster({
      schoolId: scope.schoolId,
      name,
      className: (row.className || row.class || "").trim(),
      rollNo: (row.rollNo || row.roll || "").trim(),
      admissionNo,
      status: "enrolled",
      guardians: row.guardianName
        ? [
            {
              name: row.guardianName,
              phone: row.guardianPhone || "",
              isPrimary: true,
              relationship: "guardian",
            },
          ]
        : undefined,
    });
    if (row.dob) profile.dob = row.dob.trim();
    profile.gender = gender;
    await profile.save();
    created.push(studentProfileToClient(profile));
  }

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: "csvImport",
    entityType: "StudentProfile",
    meta: { count: created.length, errors: errors.length },
  });

  return jsonOk(
    { imported: created.length, students: created, errors },
    201,
  );
});
