import { inviteToClient, TeacherInvite } from "@/lib/models/core/TeacherInvite";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireDb } from "@/lib/server/http";

/** Public lookup for signup — returns pending invite only. */
export async function GET(req: Request) {
  const db = await requireDb();
  if (db.error) return db.error;

  const { searchParams } = new URL(req.url);
  const code = (searchParams.get("code") || "").trim().toUpperCase();
  const identifier = (searchParams.get("identifier") || "")
    .trim()
    .toLowerCase();

  if (!code && !identifier) {
    return jsonError("code or identifier is required");
  }

  const invite = code
    ? await TeacherInvite.findOne({ code, status: "pending" })
    : await TeacherInvite.findOne({ identifier, status: "pending" });

  if (!invite) {
    return jsonOk({ invite: null });
  }

  return jsonOk({ invite: inviteToClient(invite) });
}
