import { clientUser, requireUser, withApiHandler } from "@/lib/server/http";
import { jsonOk } from "@/lib/server/auth";
import { listLinksForUser } from "@/lib/server/link-service";

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  const links =
    user.role === "parent" || user.role === "student"
      ? await listLinksForUser(user)
      : [];
  return jsonOk({ user: clientUser(user), links });
}

async function patchHandler(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const body = (await req.json()) as {
    name?: string;
    school?: string;
    className?: string;
    childName?: string;
    homeStopId?: string;
    busAlert10?: boolean;
    busAlert5?: boolean;
  };

  if (body.name?.trim()) user.name = body.name.trim();
  if (body.school?.trim()) user.schoolName = body.school.trim();
  if (body.className !== undefined) {
    user.className = body.className.trim() || undefined;
  }
  if (body.childName !== undefined) {
    user.childName = body.childName.trim() || undefined;
  }
  if (body.homeStopId) user.homeStopId = body.homeStopId;
  if (typeof body.busAlert10 === "boolean") user.busAlert10 = body.busAlert10;
  if (typeof body.busAlert5 === "boolean") user.busAlert5 = body.busAlert5;

  await user.save();
  return jsonOk({ user: clientUser(user) });
}

export const GET = withApiHandler(getHandler);
export const PATCH = withApiHandler(patchHandler);
