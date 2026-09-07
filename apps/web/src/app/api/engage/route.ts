import {
  applyEngageAction,
  ensureEngageDoc,
  engageToClient,
} from "@/lib/server/services/engage-service";
import { requireUser, withApiHandler } from "@/lib/server/http";
import { jsonError, jsonOk } from "@/lib/server/response";
import { engageActionSchema } from "@/lib/server/schemas";
import { parseBodyWithSchema } from "@/lib/server/validate";

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  const doc = await ensureEngageDoc(String(user._id));
  return jsonOk({ engage: engageToClient(doc) });
}

/** Server-authoritative XP / missions — do not accept client XP totals. */
async function postHandler(req: Request) {
  const { error, user } = await requireUser(["student", "parent"]);
  if (error || !user) return error!;

  const parsed = await parseBodyWithSchema(req, engageActionSchema);
  if ("error" in parsed) return parsed.error;

  const result = await applyEngageAction(String(user._id), parsed.data);
  return jsonOk({
    engage: result.engage,
    ok: result.ok,
    message: result.message,
    xpGained: result.xpGained,
  });
}

/** @deprecated Prefer POST actions. Rejects xp/streak writes. */
async function putHandler(req: Request) {
  const { error, user } = await requireUser(["student", "parent"]);
  if (error || !user) return error!;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (
    "xp" in body ||
    "streak" in body ||
    "focusMinutes" in body ||
    "missions" in body ||
    "badges" in body ||
    "challenge" in body
  ) {
    return jsonError(
      "Use POST /api/engage with an action — XP cannot be set directly",
      400,
    );
  }

  const doc = await ensureEngageDoc(String(user._id));
  if (body.mood !== undefined) doc.mood = body.mood as string | null;
  if (body.moodDay !== undefined) doc.moodDay = body.moodDay as string | null;
  if (body.reactions && typeof body.reactions === "object") {
    doc.reactions = body.reactions as Record<string, string[]>;
  }
  if (typeof body.celebrateUntil === "number") {
    doc.celebrateUntil = body.celebrateUntil;
  }
  await doc.save();
  return jsonOk({ engage: engageToClient(doc) });
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
export const PUT = withApiHandler(putHandler);
