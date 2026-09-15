import { isMongoConfigured, connectMongo } from "@/lib/db/mongodb";
import { jsonOk, jsonError } from "@/lib/server/auth";

export async function GET() {
  try {
    if (!isMongoConfigured()) {
      return jsonOk({
        status: "degraded",
        mongo: false,
        message: "MONGODB_URI missing",
        time: new Date().toISOString(),
      });
    }
    await connectMongo();
    return jsonOk({
      status: "ok",
      mongo: true,
      time: new Date().toISOString(),
    });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Health check failed",
      500,
    );
  }
}
