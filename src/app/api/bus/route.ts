import {
  ensureBusRoute,
  ensureBusState,
  busStateToClient,
} from "@/lib/server/bus-service";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser, withApiHandler } from "@/lib/server/http";
import { canWriteBusProgress } from "@/lib/shared/roles";
import { parseJsonBody } from "@/lib/server/request";

async function getHandler() {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const routeId = user.busRouteId || "route-12";
  const [route, doc] = await Promise.all([
    ensureBusRoute(user.schoolId, routeId),
    ensureBusState(user.schoolId, routeId),
  ]);

  return jsonOk(busStateToClient(doc, route));
}

async function patchHandler(req: Request) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;
  if (!user.schoolId) return jsonError("User has no school", 400);

  const parsed = await parseJsonBody<{
    progress?: number;
    fired?: { day: string; ten: boolean; five: boolean };
    reset?: boolean;
  }>(req);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const wantsProgress =
    typeof body.progress === "number" || body.reset === true;
  if (wantsProgress && !canWriteBusProgress(user.role)) {
    // Parents/students may still update personal alert-fired flags only.
    if (!body.fired) {
      return jsonError(
        "Only bus staff or admins can update live bus progress",
        403,
      );
    }
  }

  const routeId = user.busRouteId || "route-12";
  const [route, doc] = await Promise.all([
    ensureBusRoute(user.schoolId, routeId),
    ensureBusState(user.schoolId, routeId),
  ]);

  if (canWriteBusProgress(user.role)) {
    if (body.reset) {
      doc.progress = 0.05;
      const day = new Date().toISOString().slice(0, 10);
      doc.alertDay = day;
      doc.alertTen = false;
      doc.alertFive = false;
    }
    if (typeof body.progress === "number") {
      doc.progress = Math.min(0.995, Math.max(0, body.progress));
    }
  }

  if (body.fired) {
    doc.alertDay = body.fired.day;
    doc.alertTen = body.fired.ten;
    doc.alertFive = body.fired.five;
  }
  doc.updatedAtMs = Date.now();
  await doc.save();

  return jsonOk(busStateToClient(doc, route));
}

export const GET = withApiHandler(getHandler);
export const PATCH = withApiHandler(patchHandler);
