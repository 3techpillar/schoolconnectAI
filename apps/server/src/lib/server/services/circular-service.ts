import { ClassDesk, classDeskToClient } from "@/lib/models/ops/ClassDesk";
import { Notification, notificationToClient } from "@/lib/models/comms/Notification";
import { User, type UserDoc } from "@/lib/models/core/User";
import type { Types } from "mongoose";

/** Parents/students who should see class circulars as unread. */
export async function circularRecipientIds(
  schoolId: Types.ObjectId,
  className: string,
  excludeUserId?: string,
) {
  const users = await User.find({
    schoolId,
    role: { $in: ["parent", "student"] },
  })
    .select("_id className")
    .lean();

  return users
    .filter((u) => !u.className || u.className === className)
    .map((u) => String(u._id))
    .filter((id) => id !== excludeUserId);
}

export async function publishCircular(input: {
  schoolId: Types.ObjectId;
  className: string;
  title: string;
  body: string;
  tag?: string;
  actor: UserDoc;
}) {
  const { schoolId, className, actor } = input;
  let desk = await ClassDesk.findOne({ schoolId, className });
  if (!desk) {
    desk = await ClassDesk.create({
      schoolId,
      className,
      roster: [],
      attendanceByDay: {},
      circulars: [],
    });
  }

  const uid = String(actor._id);
  const recipients = await circularRecipientIds(schoolId, className, uid);
  const key = `c-${Date.now()}`;
  const createdAt = Date.now();
  const circular = {
    key,
    title: input.title.trim(),
    body: input.body.trim(),
    tag: input.tag || "Notice",
    createdAt,
    unreadBy: recipients,
    postedBy: actor.name,
    className,
  };

  const nextCirculars = [
    circular,
    ...((desk.circulars || []).map((c) => ({
      key: c.key,
      title: c.title,
      body: c.body,
      tag: c.tag,
      createdAt: c.createdAt,
      unreadBy: c.unreadBy || [],
      postedBy: c.postedBy,
      className: c.className,
    })) || []),
  ];
  desk.set("circulars", nextCirculars);
  await desk.save();

  const notif = await Notification.create({
    schoolId,
    title: `${circular.tag} · ${circular.title}`,
    body: circular.body.slice(0, 160),
    type: "circular",
    href: "/circulars",
    createdAtMs: createdAt,
    readBy: [uid],
  });

  return {
    desk: classDeskToClient(desk, uid),
    notification: notificationToClient(notif, uid),
    circularKey: key,
  };
}

export async function markCircularRead(input: {
  schoolId: Types.ObjectId;
  className: string;
  circularKey: string;
  userId: string;
}) {
  const desk = await ClassDesk.findOne({
    schoolId: input.schoolId,
    className: input.className,
  });
  if (!desk) return null;

  const next = (desk.circulars || []).map((c) => {
    if (c.key !== input.circularKey) {
      return {
        key: c.key,
        title: c.title,
        body: c.body,
        tag: c.tag,
        createdAt: c.createdAt,
        unreadBy: c.unreadBy || [],
        postedBy: c.postedBy,
        className: c.className,
      };
    }
    return {
      key: c.key,
      title: c.title,
      body: c.body,
      tag: c.tag,
      createdAt: c.createdAt,
      unreadBy: (c.unreadBy || []).filter((id) => id !== input.userId),
      postedBy: c.postedBy,
      className: c.className,
    };
  });
  desk.set("circulars", next);
  await desk.save();
  return classDeskToClient(desk, input.userId);
}

/** Also mark matching circular-type notifications as read when opening circulars. */
export async function markCircularNotificationsRead(
  schoolId: Types.ObjectId,
  userId: string,
) {
  await Notification.updateMany(
    { schoolId, type: "circular", readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } },
  );
}
