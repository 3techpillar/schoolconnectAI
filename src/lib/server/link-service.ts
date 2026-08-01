import {
  linkToClient,
  ParentStudentLink,
} from "@/lib/models/ParentStudentLink";
import { User, userToClient, type UserDoc } from "@/lib/models/User";
import type { Types } from "mongoose";

type UserInstance = InstanceType<typeof User>;

export async function ensureParentStudentLink(input: {
  schoolId: Types.ObjectId;
  parentUserId: Types.ObjectId;
  studentUserId: Types.ObjectId;
  relationship?: "father" | "mother" | "guardian" | "other";
  primary?: boolean;
  note?: string;
}) {
  let link = await ParentStudentLink.findOne({
    parentUserId: input.parentUserId,
    studentUserId: input.studentUserId,
  });
  if (link) {
    if (link.status === "revoked") {
      link.status = "active";
      link.relationship = input.relationship || link.relationship;
      link.primary = input.primary ?? link.primary;
      if (input.note) link.note = input.note;
      await link.save();
    }
    return { link, created: false };
  }
  link = await ParentStudentLink.create({
    schoolId: input.schoolId,
    parentUserId: input.parentUserId,
    studentUserId: input.studentUserId,
    relationship: input.relationship || "guardian",
    status: "active",
    primary: input.primary ?? true,
    note: input.note,
  });
  return { link, created: true };
}

export async function listLinksForUser(user: UserInstance) {
  if (user.role === "parent") {
    const links = await ParentStudentLink.find({
      parentUserId: user._id,
      status: "active",
    }).sort({ primary: -1, createdAt: -1 });
    const studentIds = links.map((l) => l.studentUserId);
    const students = await User.find({ _id: { $in: studentIds } });
    const byId = new Map(students.map((s) => [String(s._id), s]));
    return links.map((l) => ({
      ...linkToClient(l),
      student: byId.has(String(l.studentUserId))
        ? userToClient(byId.get(String(l.studentUserId)) as UserDoc)
        : null,
    }));
  }

  if (user.role === "student") {
    const links = await ParentStudentLink.find({
      studentUserId: user._id,
      status: "active",
    }).sort({ createdAt: -1 });
    const parentIds = links.map((l) => l.parentUserId);
    const parents = await User.find({ _id: { $in: parentIds } });
    const byId = new Map(parents.map((p) => [String(p._id), p]));
    return links.map((l) => ({
      ...linkToClient(l),
      parent: byId.has(String(l.parentUserId))
        ? userToClient(byId.get(String(l.parentUserId)) as UserDoc)
        : null,
    }));
  }

  // Admin / teacher: school-scoped
  const filter: Record<string, unknown> = { status: { $ne: "revoked" } };
  if (user.role !== "super_admin" && user.schoolId) {
    filter.schoolId = user.schoolId;
  }
  const links = await ParentStudentLink.find(filter)
    .sort({ createdAt: -1 })
    .limit(200);
  return links.map(linkToClient);
}

/** Primary linked student for a parent (attendance / AI context). */
export async function getPrimaryLinkedStudent(parent: UserInstance) {
  if (parent.role !== "parent") return null;
  const link = await ParentStudentLink.findOne({
    parentUserId: parent._id,
    status: "active",
  }).sort({ primary: -1, createdAt: -1 });
  if (!link) return null;
  return User.findById(link.studentUserId);
}
