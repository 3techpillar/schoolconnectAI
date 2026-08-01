import { BusRoute, busRouteToClient } from "@/lib/models/BusRoute";
import { BusState } from "@/lib/models/BusState";
import {
  DEFAULT_BUS_STOPS,
  DEFAULT_ROUTE_PATH,
} from "@/lib/shared/bus-defaults";
import type { Types } from "mongoose";

export async function ensureBusRoute(
  schoolId: Types.ObjectId,
  routeId = "route-12",
) {
  let route = await BusRoute.findOne({ routeId });
  if (!route) {
    route = await BusRoute.create({
      routeId,
      schoolId,
      name: "Route 12",
      pathSvg: DEFAULT_ROUTE_PATH,
      stops: DEFAULT_BUS_STOPS,
    });
  } else if (!route.stops?.length) {
    route.stops = DEFAULT_BUS_STOPS as typeof route.stops;
    route.pathSvg = route.pathSvg || DEFAULT_ROUTE_PATH;
    await route.save();
  }
  return route;
}

export async function ensureBusState(
  schoolId: Types.ObjectId,
  routeId = "route-12",
) {
  const day = new Date().toISOString().slice(0, 10);
  let doc = await BusState.findOne({ routeId, schoolId });
  if (!doc) {
    doc = await BusState.create({
      routeId,
      schoolId,
      progress: 0.08,
      alertDay: day,
      alertTen: false,
      alertFive: false,
      updatedAtMs: Date.now(),
    });
  } else if (doc.alertDay !== day) {
    doc.alertDay = day;
    doc.alertTen = false;
    doc.alertFive = false;
    await doc.save();
  }
  return doc;
}

export function busStateToClient(
  doc: InstanceType<typeof BusState>,
  route: InstanceType<typeof BusRoute>,
) {
  return {
    routeId: doc.routeId,
    progress: doc.progress,
    fired: {
      day: doc.alertDay,
      ten: doc.alertTen,
      five: doc.alertFive,
    },
    updatedAtMs: doc.updatedAtMs,
    route: busRouteToClient(route),
  };
}
