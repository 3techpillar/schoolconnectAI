import { Doubt, doubtToClient } from "@/lib/models/learning/Doubt";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid doubt id");
  }

  const body = (await req.json()) as {
    answerText?: string;
    resolve?: boolean;
    upvoteAnswerId?: string;
  };

  const doubt = await Doubt.findById(id);
  if (!doubt) return jsonError("Doubt not found", 404);

  if (body.answerText) {
    doubt.answers.push({
      answerId: `ans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorId: String(user._id),
      authorName: user.name,
      authorRole: user.role,
      text: body.answerText.trim(),
      isAccepted: false,
      upvotes: 0,
      createdAtMs: Date.now(),
    });
  }

  if (body.resolve !== undefined) {
    doubt.isResolved = body.resolve;
  }

  if (body.upvoteAnswerId) {
    const ans = (doubt.answers || []).find((a) => a.answerId === body.upvoteAnswerId);
    if (ans) {
      ans.upvotes = (ans.upvotes || 0) + 1;
    }
  }

  await doubt.save();
  return jsonOk({ doubt: doubtToClient(doubt) });
}
