import { answerSchoolQuestion } from "@/lib/server/services/ai-service";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";
import { aiChatSchema } from "@/lib/server/schemas";
import { parseBodyWithSchema } from "@/lib/server/validate";

async function postHandler(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const parsed = await parseBodyWithSchema(req, aiChatSchema);
  if ("error" in parsed) return parsed.error;

  const result = await answerSchoolQuestion(user, parsed.data.message);
  return jsonOk(result);
}

export const POST = withApiHandler(postHandler);
