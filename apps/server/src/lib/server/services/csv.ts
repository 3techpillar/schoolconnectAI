/** Minimal CSV helpers for ERP bulk import/export. */

export function escapeCsv(value: string) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Split a CSV line respecting double-quoted fields. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseCsvText(csv: string): {
  headers: string[];
  rows: Array<Record<string, string>>;
} {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

export const STUDENT_CSV_HEADERS = [
  "admissionNo",
  "name",
  "className",
  "rollNo",
  "status",
  "dob",
  "gender",
  "guardianName",
  "guardianPhone",
] as const;

export const STUDENT_CSV_TEMPLATE = [
  STUDENT_CSV_HEADERS.join(","),
  "ADM-001,Aarav Sharma,6-B,12,enrolled,2014-05-12,male,Rahul Sharma,9876543210",
  "ADM-002,Diya Verma,6-B,13,enrolled,2014-08-03,female,Neha Verma,9876543211",
].join("\n");

export const STAFF_CSV_HEADERS = [
  "employeeId",
  "name",
  "designation",
  "subjects",
  "phone",
  "email",
  "status",
] as const;

/** subjects use pipe | so commas in CSV stay safe */
export const STAFF_CSV_TEMPLATE = [
  STAFF_CSV_HEADERS.join(","),
  "EMP-101,Ms. Kapoor,Class Teacher,Math|Science,9876500001,kapoor@school.demo,active",
  "EMP-102,Mr. Singh,Subject Teacher,English|Hindi,9876500002,singh@school.demo,active",
].join("\n");
