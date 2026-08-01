"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { apiFetch } from "@/lib/shared/api-client";
import {
  DEFAULT_BUS_STOPS,
  DEFAULT_ROUTE_PATH,
  type BusStopDef,
} from "@/lib/shared/bus-defaults";
import { canWriteBusProgress, isFamilyRole } from "@/lib/shared/roles";

/** Offline / fallback geometry — prefer values from `/api/bus`. */
export const ROUTE_PATH = DEFAULT_ROUTE_PATH;
export type BusStop = BusStopDef;
export const BUS_STOPS: BusStop[] = DEFAULT_BUS_STOPS;

export type StopStatus = "done" | "current" | "upcoming";

export interface BusAlertToast {
  id: string;
  kind: "10" | "5";
  title: string;
  body: string;
  at: number;
}

interface BusTrackCtx {
  ready: boolean;
  progress: number;
  speedKmh: number;
  distanceKm: number;
  /** Geometry from DB when backend is up */
  routePath: string;
  allStops: BusStop[];
  stops: Array<BusStop & { status: StopStatus; etaMin: number }>;
  homeStopId: string;
  homeStop: BusStop;
  etaToHome: number;
  etaToNext: number;
  nextStop: BusStop;
  stopsBetween: number;
  stopsLeft: number;
  currentStopIndex: number;
  alertToast: BusAlertToast | null;
  dismissAlert: () => void;
  setHomeStopId: (id: string) => void;
  resetTrip: () => void;
}

const ALERT_KEY = "sc_bus_alert_fired_v1";
const Ctx = createContext<BusTrackCtx | null>(null);

function loadFired(): { day: string; ten: boolean; five: boolean } {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(ALERT_KEY);
    if (!raw) return { day, ten: false, five: false };
    const parsed = JSON.parse(raw) as {
      day: string;
      ten: boolean;
      five: boolean;
    };
    if (parsed.day !== day) return { day, ten: false, five: false };
    return parsed;
  } catch {
    return { day, ten: false, five: false };
  }
}

function saveFired(f: { day: string; ten: boolean; five: boolean }) {
  localStorage.setItem(ALERT_KEY, JSON.stringify(f));
}

function etaMinutes(progress: number, stop: BusStop): number {
  const tripMinutes = 30;
  const remain = Math.max(0, stop.progress - progress);
  return Math.max(0, Math.ceil(remain * tripMinutes));
}

export function BusTrackProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, updateUser, backend, ready: authReady } = useAuth();
  const { pushNotification } = useSchoolData();
  const [progress, setProgress] = useState(0.08);
  const [routePath, setRoutePath] = useState(DEFAULT_ROUTE_PATH);
  const [allStops, setAllStops] = useState<BusStop[]>(DEFAULT_BUS_STOPS);
  const [alertToast, setAlertToast] = useState<BusAlertToast | null>(null);
  const [ready, setReady] = useState(false);
  const firedRef = useRef(loadFired());
  const lastEtaRef = useRef<number | null>(null);
  const syncTimer = useRef<number | null>(null);

  const homeStopId = user?.homeStopId || "s3";
  const homeStop =
    allStops.find((s) => s.id === homeStopId) ||
    allStops[2] ||
    DEFAULT_BUS_STOPS[2];

  const persistBus = useCallback(
    (patch: {
      progress?: number;
      fired?: { day: string; ten: boolean; five: boolean };
      reset?: boolean;
    }) => {
      if (!backend) {
        if (patch.fired) saveFired(patch.fired);
        return;
      }
      const canDrive = canWriteBusProgress(user?.role);
      const body: typeof patch = { ...patch };
      if (!canDrive) {
        delete body.progress;
        delete body.reset;
        if (!body.fired) return;
      }
      void apiFetch("/api/bus", {
        method: "PATCH",
        body: JSON.stringify(body),
      }).catch(() => undefined);
    },
    [backend, user?.role],
  );

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (backend && user) {
          const res = await apiFetch<{
            progress: number;
            fired: { day: string; ten: boolean; five: boolean };
            route?: {
              pathSvg: string;
              stops: BusStop[];
            };
          }>("/api/bus");
          if (!cancelled) {
            setProgress(res.progress);
            firedRef.current = res.fired;
            if (res.route?.pathSvg) setRoutePath(res.route.pathSvg);
            if (res.route?.stops?.length) setAllStops(res.route.stops);
          }
        } else {
          firedRef.current = loadFired();
          setRoutePath(DEFAULT_ROUTE_PATH);
          setAllStops(DEFAULT_BUS_STOPS);
        }
      } catch {
        firedRef.current = loadFired();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, backend, user?.id, user]);

  // Live simulation only on Bus screen (or home for parents) — save battery elsewhere.
  useEffect(() => {
    const onBusPage = pathname === "/bus";
    const onHomeFamily =
      pathname === "/" && isFamilyRole(user?.role);
    const active =
      (onBusPage || onHomeFamily) &&
      document.visibilityState === "visible";
    if (!active) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setProgress((p) => {
        const next = p >= 0.995 ? 0.05 : Math.min(0.995, p + 0.006);
        if (backend) {
          if (syncTimer.current) window.clearTimeout(syncTimer.current);
          syncTimer.current = window.setTimeout(() => {
            persistBus({ progress: next });
          }, 800);
        }
        if (p >= 0.995 && backend) {
          firedRef.current = {
            day: new Date().toISOString().slice(0, 10),
            ten: false,
            five: false,
          };
          persistBus({
            progress: 0.05,
            fired: firedRef.current,
          });
        }
        return next;
      });
    }, 1500);

    return () => {
      window.clearInterval(id);
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
    };
  }, [backend, persistBus, pathname, user?.role]);

  const currentStopIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < allStops.length; i++) {
      if (progress >= allStops[i].progress - 0.02) idx = i;
    }
    return Math.min(idx, Math.max(0, allStops.length - 1));
  }, [progress, allStops]);

  const stops = useMemo(() => {
    return allStops.map((s, i) => {
      let status: StopStatus = "upcoming";
      if (i < currentStopIndex) status = "done";
      else if (i === currentStopIndex) status = "current";
      return { ...s, status, etaMin: etaMinutes(progress, s) };
    });
  }, [progress, currentStopIndex, allStops]);

  const nextStop =
    allStops[Math.min(currentStopIndex + 1, allStops.length - 1)] ||
    homeStop;
  const etaToHome = etaMinutes(progress, homeStop);
  const etaToNext = etaMinutes(progress, nextStop);
  const homeIndex = allStops.findIndex((s) => s.id === homeStop.id);
  const stopsBetween = Math.max(0, homeIndex - currentStopIndex - 1);
  const stopsLeft = Math.max(0, allStops.length - 1 - currentStopIndex);
  const distanceKm = Math.max(
    0.1,
    Number(((1 - progress) * 4.8).toFixed(1)),
  );
  const speedKmh = 28 + Math.round((progress * 12) % 9);

  useEffect(() => {
    if (!user || !ready) return;
    const want10 = user.busAlert10 !== false;
    const want5 = user.busAlert5 !== false;
    const prev = lastEtaRef.current;
    lastEtaRef.current = etaToHome;

    const crossed10 =
      want10 &&
      !firedRef.current.ten &&
      etaToHome <= 10 &&
      etaToHome > 5 &&
      (prev === null || prev > 10);
    const crossed5 =
      want5 &&
      !firedRef.current.five &&
      etaToHome <= 5 &&
      etaToHome >= 1 &&
      (prev === null || prev > 5);

    if (crossed10 || (want10 && !firedRef.current.ten && etaToHome === 10)) {
      firedRef.current = { ...firedRef.current, ten: true };
      persistBus({ fired: firedRef.current });
      const toast: BusAlertToast = {
        id: crypto.randomUUID(),
        kind: "10",
        title: "Bus 10 min away",
        body: `${homeStop.shortName} in ~${etaToHome} min · ${stopsBetween} stop${stopsBetween === 1 ? "" : "s"} between`,
        at: Date.now(),
      };
      setAlertToast(toast);
      pushNotification({
        title: toast.title,
        body: toast.body,
        type: "bus",
        href: "/bus",
      });
    } else if (
      crossed5 ||
      (want5 && !firedRef.current.five && etaToHome === 5)
    ) {
      firedRef.current = { ...firedRef.current, five: true };
      persistBus({ fired: firedRef.current });
      const toast: BusAlertToast = {
        id: crypto.randomUUID(),
        kind: "5",
        title: "Bus 5 min away",
        body: `Almost there — ${homeStop.shortName} in ~${etaToHome} min. Get ready!`,
        at: Date.now(),
      };
      setAlertToast(toast);
      pushNotification({
        title: toast.title,
        body: toast.body,
        type: "bus",
        href: "/bus",
      });
    }
  }, [
    etaToHome,
    user,
    ready,
    homeStop.shortName,
    stopsBetween,
    pushNotification,
    persistBus,
  ]);

  const setHomeStopId = useCallback(
    (id: string) => {
      if (!user) return;
      void updateUser(user.id, { homeStopId: id, busRouteId: "route-12" });
      const day = new Date().toISOString().slice(0, 10);
      firedRef.current = { day, ten: false, five: false };
      persistBus({ fired: firedRef.current });
      lastEtaRef.current = null;
    },
    [user, updateUser, persistBus],
  );

  const resetTrip = useCallback(() => {
    setProgress(0.05);
    const day = new Date().toISOString().slice(0, 10);
    firedRef.current = { day, ten: false, five: false };
    persistBus({ reset: true, progress: 0.05, fired: firedRef.current });
    lastEtaRef.current = null;
    setAlertToast(null);
  }, [persistBus]);

  const value = useMemo<BusTrackCtx>(
    () => ({
      ready,
      progress,
      speedKmh,
      distanceKm,
      routePath,
      allStops,
      stops,
      homeStopId: homeStop.id,
      homeStop,
      etaToHome,
      etaToNext,
      nextStop,
      stopsBetween,
      stopsLeft,
      currentStopIndex,
      alertToast,
      dismissAlert: () => setAlertToast(null),
      setHomeStopId,
      resetTrip,
    }),
    [
      ready,
      progress,
      speedKmh,
      distanceKm,
      routePath,
      allStops,
      stops,
      homeStop,
      etaToHome,
      etaToNext,
      nextStop,
      stopsBetween,
      stopsLeft,
      currentStopIndex,
      alertToast,
      setHomeStopId,
      resetTrip,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBusTrack() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBusTrack must be used inside BusTrackProvider");
  return ctx;
}
