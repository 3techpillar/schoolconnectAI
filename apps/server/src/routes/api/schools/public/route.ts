import { connectMongo, isMongoConfigured } from "@/lib/db/mongodb";
import { School } from "@/lib/models/core/School";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { withApiHandler } from "@/lib/server/http";
import { normalizeProductMode } from "@schoolconnect/shared";

/** Public list of active schools for signup (no auth). */
export const GET = withApiHandler(async (req: Request) => {
  if (!isMongoConfigured()) {
    return jsonError("MONGODB_URI is not configured", 503);
  }
  await connectMongo();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const filter: Record<string, unknown> = { status: "active" };
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: new RegExp(safe, "i") },
      { city: new RegExp(safe, "i") },
      { code: new RegExp(safe, "i") },
      { branchName: new RegExp(safe, "i") },
    ];
  }

  const schools = await School.find(filter).sort({ name: 1 }).limit(100);

  return jsonOk({
    schools: schools.map((s) => ({
      id: String(s._id),
      name: s.name,
      city: s.city || "",
      code: s.code || undefined,
      branchName: s.branchName || "",
      productMode: normalizeProductMode(s.productMode),
    })),
  });
});
