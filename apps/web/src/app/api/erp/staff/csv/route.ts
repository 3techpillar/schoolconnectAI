import {
  StaffProfile,
  staffProfileToClient,
} from "@/lib/models/erp/StaffProfile";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  escapeCsv,
  parseCsvText,
  STAFF_CSV_HEADERS,
} from "@/lib/server/services/csv";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const staff = await StaffProfile.find({ schoolId: scope.schoolId })
    .sort({ name: 1 })
    .limit(2000);

  const rows = staff.map((s) =>
    [
      s.employeeId || "",
      s.name,
      s.designation || "",
      (s.subjects || []).join("|"),
      s.phone || "",
      s.email || "",
      s.status || "active",
    ]
      .map((v) => escapeCsv(String(v)))
      .join(","),
  );
  const csv = [STAFF_CSV_HEADERS.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="staff-${scope.schoolId}.csv"`,
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

    const employeeId = (row.employeeId || "").trim() || undefined;
    const subjectsRaw = (row.subjects || "").trim();
    const subjects = subjectsRaw
      ? subjectsRaw
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const statusRaw = (row.status || "active").trim().toLowerCase();
    const status = statusRaw === "inactive" ? "inactive" : "active";

    let doc = employeeId
      ? await StaffProfile.findOne({
          schoolId: scope.schoolId,
          employeeId,
        })
      : null;

    if (!doc) {
      doc = await StaffProfile.create({
        schoolId: scope.schoolId,
        name,
        employeeId,
        designation: (row.designation || "").trim(),
        subjects,
        phone: (row.phone || "").trim(),
        email: (row.email || "").trim().toLowerCase(),
        status,
      });
    } else {
      doc.name = name;
      doc.designation = (row.designation || doc.designation || "").trim();
      if (subjects.length) doc.subjects = subjects;
      if (row.phone !== undefined) doc.phone = (row.phone || "").trim();
      if (row.email !== undefined)
        doc.email = (row.email || "").trim().toLowerCase();
      doc.status = status;
      await doc.save();
    }

    created.push(staffProfileToClient(doc));
  }

  await writeErpAudit({
    user,
    schoolId: scope.schoolId,
    action: "csvImport",
    entityType: "StaffProfile",
    meta: { count: created.length, errors: errors.length },
  });

  return jsonOk({ imported: created.length, staff: created, errors }, 201);
});
