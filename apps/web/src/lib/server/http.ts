import { connectMongo, isMongoConfigured } from "@/lib/db/mongodb";
import { School, schoolToClient } from "@/lib/models/core/School";
import { User, userToClient, type UserDoc } from "@/lib/models/core/User";
import { getSessionFromCookiesOrBearer, type SessionPayload } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/response";
import { isSchoolAdminRole, type Role } from "@/lib/shared/roles";
import { schoolCapabilities } from "@schoolconnect/shared";

export async function requireDb() {
  if (!isMongoConfigured()) {
    return {
      error: jsonError(
        "MONGODB_URI is not configured. Add it to .env.local",
        503,
      ),
    };
  }
  await connectMongo();
  return { error: null };
}

export async function requireUser(roles?: Role[]) {
  const db = await requireDb();
  if (db.error) return { error: db.error, session: null, user: null };

  const session = await getSessionFromCookiesOrBearer();
  if (!session) {
    return {
      error: jsonError("Unauthorized", 401),
      session: null,
      user: null,
    };
  }

  const user = await User.findById(session.sub);
  if (!user) {
    return {
      error: jsonError("User not found", 401),
      session: null,
      user: null,
    };
  }

  if (roles && !roles.includes(user.role as Role)) {
    return {
      error: jsonError("Forbidden", 403),
      session,
      user: null,
    };
  }

  return { error: null, session, user };
}

export function clientUser(user: UserDoc) {
  return userToClient(user);
}

/** User profile + school productMode / module capabilities for clients. */
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

/** @deprecated Prefer `isSchoolAdminRole` from `@/lib/shared/roles` */
export function isAdminRole(role: string) {
  return isSchoolAdminRole(role);
}

type Handler = (req: Request) => Promise<Response> | Response;

/** Wrap route handlers so unexpected errors become JSON 500s. */
export function withApiHandler(handler: Handler): Handler {
  return async (req) => {
    try {
      return await handler(req);
    } catch (err) {
      console.error("[api]", err);
      return jsonError(
        err instanceof Error ? err.message : "Internal server error",
        500,
      );
    }
  };
}

export type { SessionPayload };
