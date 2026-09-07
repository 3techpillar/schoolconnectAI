/** Fallback bus geometry when Mongo is unavailable. Prefer /api/bus. */

export interface BusStopDef {
  id: string;
  name: string;
  shortName: string;
  etaFromStart: number;
  progress: number;
  x: number;
  y: number;
}

export const DEFAULT_ROUTE_PATH =
  "M 40 540 C 80 480, 60 420, 120 380 S 220 320, 200 250 S 120 180, 180 120 S 300 100, 320 60";

export const DEFAULT_BUS_STOPS: BusStopDef[] = [
  {
    id: "s1",
    name: "Green Park Society",
    shortName: "Green Park",
    etaFromStart: 0,
    progress: 0,
    x: 40,
    y: 540,
  },
  {
    id: "s2",
    name: "MG Road Crossing",
    shortName: "MG Road",
    etaFromStart: 7,
    progress: 0.22,
    x: 110,
    y: 395,
  },
  {
    id: "s3",
    name: "Sunshine Apartments",
    shortName: "Sunshine Apts.",
    etaFromStart: 14,
    progress: 0.45,
    x: 198,
    y: 258,
  },
  {
    id: "s4",
    name: "Lake View Block C",
    shortName: "Lake View",
    etaFromStart: 21,
    progress: 0.68,
    x: 168,
    y: 150,
  },
  {
    id: "s5",
    name: "Springdale School",
    shortName: "School",
    etaFromStart: 30,
    progress: 1,
    x: 320,
    y: 60,
  },
];
