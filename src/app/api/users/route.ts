import { User, userToClient } from "@/lib/models/User";
import { jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";

export async function GET() {
  const { error, user } = await requireUser([
    "admin",
    "super_admin",
    "principal",
    "class_teacher",
  ]);
  if (error || !user) return error!;

  const filter: Record<string, unknown> = {};
  if (user.role !== "super_admin" && user.schoolId) {
    filter.schoolId = user.schoolId;
  }
  if (user.role === "class_teacher" && user.className) {
    filter.className = user.className;
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
  return jsonOk({ users: users.map(userToClient) });
}
