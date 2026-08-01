import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  DEFAULT_BUS_STOPS,
  DEFAULT_ROUTE_PATH,
} from "@/lib/shared/bus-defaults";

export { DEFAULT_BUS_STOPS, DEFAULT_ROUTE_PATH };

const BusStopSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    shortName: { type: String, required: true },
    etaFromStart: { type: Number, required: true },
    progress: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const BusRouteSchema = new Schema(
  {
    routeId: { type: String, required: true, unique: true, index: true },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      index: true,
    },
    name: { type: String, default: "Route 12" },
    pathSvg: { type: String, default: DEFAULT_ROUTE_PATH },
    stops: { type: [BusStopSchema], default: [] },
  },
  { timestamps: true },
);

export type BusRouteDoc = InferSchemaType<typeof BusRouteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const BusRoute: Model<BusRouteDoc> =
  mongoose.models.BusRoute ||
  mongoose.model<BusRouteDoc>("BusRoute", BusRouteSchema);

export function busRouteToClient(r: BusRouteDoc) {
  return {
    routeId: r.routeId,
    name: r.name || "Route 12",
    pathSvg: r.pathSvg || DEFAULT_ROUTE_PATH,
    stops: (r.stops?.length ? r.stops : DEFAULT_BUS_STOPS).map((s) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      etaFromStart: s.etaFromStart,
      progress: s.progress,
      x: s.x,
      y: s.y,
    })),
  };
}
