import { User } from "@/lib/models/core/User";
import type { Types } from "mongoose";

/**
 * MOCKED: Send a push notification to specific users.
 * In production, replace the console.log with Expo Server SDK or Firebase Admin SDK.
 */
export async function sendPushNotification(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (!userIds || userIds.length === 0) return;

  // 1. Fetch users to get their push tokens
  const users = await User.find({
    _id: { $in: userIds },
    pushTokens: { $exists: true, $not: { $size: 0 } },
  }).select("pushTokens");

  const tokens = users.flatMap((u) => u.pushTokens || []);
  if (tokens.length === 0) return;

  // 2. Dispatch to provider
  // e.g., await expo.sendPushNotificationsAsync([{ to: tokens, title, body, data }]);
  console.log(`[PUSH NOTIFICATION] Sending to ${tokens.length} devices...`);
  console.log(`  Title: ${title}`);
  console.log(`  Body:  ${body}`);
  if (data) console.log(`  Data:  ${JSON.stringify(data)}`);
}

/**
 * MOCKED: Broadcast a push notification to an entire school or specific class.
 */
export async function broadcastPushNotification(
  schoolId: string | Types.ObjectId,
  title: string,
  body: string,
  data?: Record<string, any>,
  className?: string
) {
  const query: any = {
    schoolId,
    pushTokens: { $exists: true, $not: { $size: 0 } },
  };

  if (className) {
    query.className = className;
  }

  const users = await User.find(query).select("_id");
  const userIds = users.map((u) => String(u._id));

  await sendPushNotification(userIds, title, body, data);
}
