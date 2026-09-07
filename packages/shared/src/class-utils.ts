export function parseClassName(className: string): {
  grade: number;
  section: string;
} | null {
  const m = className.trim().match(/^(\d{1,2})\s*[-–]?\s*([A-Za-z])$/);
  if (!m) return null;
  return { grade: Number(m[1]), section: m[2].toUpperCase() };
}

/** Normalize "6B" / "6-B" → { grade, section, className } for enrollments & register. */
export function parseClassLabel(className?: string): {
  grade: string;
  section: string;
  className: string;
} {
  const raw = (className || "6-B").trim();
  const m = raw.match(/^(\d{1,2})\s*[-–]?\s*([A-Za-z])$/);
  if (m) {
    return {
      grade: m[1],
      section: m[2].toUpperCase(),
      className: `${m[1]}-${m[2].toUpperCase()}`,
    };
  }
  return { grade: raw || "6", section: "A", className: raw || "6-B" };
}

export function nextClassName(className: string): string | null {
  const parsed = parseClassName(className);
  if (!parsed) return null;
  if (parsed.grade >= 12) return null;
  return `${parsed.grade + 1}-${parsed.section}`;
}
