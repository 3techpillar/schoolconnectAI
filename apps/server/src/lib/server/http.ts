import { asyncLocalStorage, wrapNextRoute } from "./express-wrapper.js";
import { connectMongo, isMongoConfigured } from "@/lib/db/mongodb.js";
import { School, schoolToClient } from "@/lib/models/core/School.js";
import { User, userToClient, type UserDoc } from "@/lib/models/core/User.js";
import { verifySessionToken, type SessionPayload } from "@/lib/server/auth.js";
import { isSchoolAdminRole, type Role } from "@/lib/shared/roles.js";
import { schoolCapabilities } from "@schoolconnect/shared";

export async function requireDb(): Promise<{ error?: Response }> {
  if (!isMongoConfigured()) {
    return { error: Response.json({ ok: false, error: "MONGODB_URI is not configured." }, { status: 503 }) };
  }
  await connectMongo();
  return {};
}

export async function requireUser(
  roles?: Role[],
): Promise<{ error?: Response; session?: SessionPayload; user?: UserDoc }> {
  const db = await requireDb();
  if (db.error) return { error: db.error };

  const store = asyncLocalStorage.getStore();
  if (!store) {
    return { error: Response.json({ ok: false, error: "Unauthorized (no store)" }, { status: 401 }) };
  }
  const req = store.req;

  let token =
    req.cookies?.["sc_session"] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    (req.headers["x-sc-session"] as string) ||
    undefined;

  if (!token) {
    return { error: Response.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }

  let session: SessionPayload;
  try {
    session = await verifySessionToken(token);
  } catch {
    return { error: Response.json({ ok: false, error: "Invalid token" }, { status: 401 }) };
  }

  const user = await User.findById(session.sub);
  if (!user) {
    return { error: Response.json({ ok: false, error: "User not found" }, { status: 401 }) };
  }

  if (roles && !roles.includes(user.role as Role)) {
    return { error: Response.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }

  return { session, user };
}

export function clientUser(user: UserDoc) {
  return userToClient(user);
}

export async function clientUserWithCapabilities(user: UserDoc) {
  const base = userToClient(user);
  if (base.role === "parent") {
    const raw = await User.collection.findOne(
      { _id: user._id },
      { projection: { parentAccess: 1 } },
    );
    base.parentAccess = raw?.parentAccess === "student" ? "student" : "guardian";
  }
  if (!user.schoolId) {
    const capabilities = schoolCapabilities({ productMode: "connect" });
    return { ...base, productMode: "connect" as const, capabilities };
  }
  const school = await School.findById(user.schoolId);
  if (!school) {
    const capabilities = schoolCapabilities({ productMode: "connect" });
    return { ...base, productMode: "connect" as const, capabilities };
  }
  const s = schoolToClient(school);
  return {
    ...base,
    productMode: s.productMode,
    capabilities: s.capabilities,
    transferPolicy: s.transferPolicy,
    subscriptionPlan: s.subscriptionPlan,
    subscriptionExpiresAt: s.subscriptionExpiresAt,
    subscriptionActive: s.subscriptionActive,
  };
}

export function isAdminRole(role: string) {
  return isSchoolAdminRole(role);
}

export const withApiHandler = wrapNextRoute;
