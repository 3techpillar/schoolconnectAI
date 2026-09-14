import { requireApiUser } from "@/shared/auth/require-api";
import { studentController } from "@/modules/student";
import { jsonError } from "@/lib/server/auth";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { error, user } = await requireApiUser();
    if (error || !user) return error!;
    const { id } = await ctx.params;
    return studentController.get(req, user, id);
  } catch (err) {
    console.error("[api/v1/students/:id]", err);
    return jsonError(
      err instanceof Error ? err.message : "Internal server error",
      500,
    );
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { error, user } = await requireApiUser();
    if (error || !user) return error!;
    const { id } = await ctx.params;
    return studentController.update(req, user, id);
  } catch (err) {
    console.error("[api/v1/students/:id]", err);
    return jsonError(
      err instanceof Error ? err.message : "Internal server error",
      500,
    );
  }
}
