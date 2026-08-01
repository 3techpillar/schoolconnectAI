import { z } from "zod";
import { jsonError } from "@/lib/server/response";

export async function parseBodyWithSchema<T extends z.ZodType>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: jsonError("Invalid JSON body", 400) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ");
    return { error: jsonError(msg || "Validation failed", 400) };
  }
  return { data: result.data };
}
