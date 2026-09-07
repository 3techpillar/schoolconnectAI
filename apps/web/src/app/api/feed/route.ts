import { jsonError, jsonOk } from "@/lib/server/auth";
import { buildHomeFeed, homeworkStats } from "@/lib/server/services/feed-service";
import { requireUser, withApiHandler } from "@/lib/server/http";

async function getHandler(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) {
    return jsonOk({
      feed: [],
      homework: { label: "0", hint: "School not linked" },
    });
  }

  const url = new URL(req.url);
  const limit = Math.min(
    20,
    Math.max(1, Number(url.searchParams.get("limit") || 8) || 8),
  );

  const [feed, homework] = await Promise.all([
    buildHomeFeed(user, { limit }),
    homeworkStats(user),
  ]);

  return jsonOk({ feed, homework });
}

export const GET = withApiHandler(getHandler);
