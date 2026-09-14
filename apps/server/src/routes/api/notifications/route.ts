import {
  Notification,
  notificationToClient,
} from "@/lib/models/comms/Notification";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";
import { parseJsonBody, readTrimmed } from "@/lib/server/request";
import { ensureSchoolDemoData } from "@/lib/server/services/seed-school";
import { canBroadcastNotification } from "@/lib/shared/roles";

const SELF_TYPES = new Set(["bus", "system"]);

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonOk({ notifications: [] });

  await ensureSchoolDemoData(user.schoolId);
  const uid = String(user._id);
  const list = await Notification.find({ schoolId: user.schoolId })
    .sort({ createdAtMs: -1 })
    .limit(100);

  return jsonOk({
    notifications: list.map((n) => notificationToClient(n, uid)),
  });
}

async function postHandler(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const parsed = await parseJsonBody<{
    title?: string;
    body?: string;
    type?: string;
    href?: string;
  }>(req);
  if ("error" in parsed) return parsed.error;

  const title = readTrimmed(parsed.data.title, "title");
  if ("error" in title) return title.error;
  const bodyText = readTrimmed(parsed.data.body, "body");
  if ("error" in bodyText) return bodyText.error;

  const type = (parsed.data.type || "system").trim();
  const staff = canBroadcastNotification(user.role);
  if (!staff && !SELF_TYPES.has(type)) {
    return jsonError(
      "Only teachers or admins can post school-wide notifications",
      403,
    );
  }

  const n = await Notification.create({
    schoolId: user.schoolId,
    title: title.value,
    body: bodyText.value,
    type: type as
      | "homework"
      | "activity"
      | "progress"
      | "fees"
      | "circular"
      | "chat"
      | "system"
      | "bus",
    href: parsed.data.href,
    createdAtMs: Date.now(),
    readBy: [String(user._id)],
  });

  return jsonOk(
    { notification: notificationToClient(n, String(user._id)) },
    201,
  );
}

export const GET = withApiHandler(getHandler);
export const POST = withApiHandler(postHandler);
