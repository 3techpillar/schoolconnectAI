import { jsonError } from "@/lib/server/response";

export async function parseJsonBody<T extends Record<string, unknown>>(
  req: Request,
): Promise<{ data: T } | { error: Response }> {
  try {
    const data = (await req.json()) as T;
    if (!data || typeof data !== "object") {
      return { error: jsonError("Invalid JSON body", 400) };
    }
    return { data };
  } catch {
    return { error: jsonError("Invalid JSON body", 400) };
  }
}

export function readTrimmed(
  value: unknown,
  field: string,
): { value: string } | { error: Response } {
  if (typeof value !== "string" || !value.trim()) {
    return { error: jsonError(`${field} is required`, 400) };
  }
  return { value: value.trim() };
}

export function normalizeIdentifier(raw: string): string {
  return raw.trim().toLowerCase();
}
