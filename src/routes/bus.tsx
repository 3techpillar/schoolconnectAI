import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Bus, Phone, MessageCircle, Navigation2, Clock, MapPin,
  ShieldCheck, Plus, Minus, Layers, Locate, ChevronUp,
} from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/bus")({
  head: () => ({
    meta: [
      { title: "Live Bus Tracking — SchoolConnect AI" },
      { name: "description", content: "Real-time bus location, route, driver info and ETA for your child's school bus." },
    ],
  }),
  component: BusTrackingPage,
});

// Route polyline (SVG path coordinates in a 360x600 viewBox)
const ROUTE_PATH =
  "M 40 540 C 80 480, 60 420, 120 380 S 220 320, 200 250 S 120 180, 180 120 S 300 100, 320 60";

// Stops along the route (matched roughly to the path)
const STOPS = [
  { id: "s1", name: "Green Park Society", time: "7:25 AM", x: 40,  y: 540, status: "done" },
  { id: "s2", name: "MG Road Crossing",  time: "7:34 AM", x: 110, y: 395, status: "done" },
  { id: "s3", name: "Sunshine Apartments", time: "7:41 AM", x: 198, y: 258, status: "current" },
  { id: "s4", name: "Lake View Block C",  time: "7:48 AM", x: 168, y: 150, status: "upcoming" },
  { id: "s5", name: "Springdale School",  time: "7:58 AM", x: 320, y: 60,  status: "upcoming" },
] as const;

export default function BusTrackingPage() {
  // Bus progress along the route (0..1)
  const [progress, setProgress] = useState(0.42);
  const [eta, setEta] = useState(8); // minutes
  const [expanded, setExpanded] = useState(true);

  // Simulate live movement
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 0.96 ? 0.05 : p + 0.004));
      setEta((e) => (e <= 1 ? 12 : Math.max(1, e - (Math.random() > 0.6 ? 1 : 0))));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneShell
      showHeader={false}
    >
      {/* Full-bleed map area */}
      <div className="-mx-4 relative h-[68vh] min-h-[480px] rounded-3xl overflow-hidden shadow-card bg-[oklch(0.96_0.02_220)]">
        {/* Floating top bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2">
          <Link
            to="/"
            className="grid place-items-center h-10 w-10 rounded-full bg-surface/95 backdrop-blur shadow-card text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 rounded-full bg-surface/95 backdrop-blur shadow-card px-4 py-2.5 flex items-center gap-2 min-w-0">
            <Bus className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="text-[11px] text-muted-foreground">Route 12 · DL 1X 4567</p>
              <p className="text-sm font-semibold truncate">Morning · To school</p>
            </div>
            <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded-full bg-success/10 text-success shrink-0 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE
            </span>
          </div>
        </div>

        {/* The map */}
        <MapCanvas progress={progress} />

        {/* Map controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          {[Plus, Minus, Layers, Locate].map((Icon, i) => (
            <button
              key={i}
              className="grid place-items-center h-10 w-10 rounded-xl bg-surface/95 backdrop-blur shadow-card text-foreground hover:bg-surface transition"
              aria-label="map control"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* ETA pill */}
        <div className="absolute left-3 bottom-3 z-20">
          <div className="rounded-2xl bg-gradient-primary text-white px-4 py-3 shadow-pop flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center">
              <Clock className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-white/80">Arriving in</p>
              <p className="text-lg font-extrabold">{eta} min</p>
            </div>
            <div className="h-9 w-px bg-white/25 mx-1" />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wider text-white/80">Next stop</p>
              <p className="text-sm font-semibold">Sunshine Apts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <section className="mt-4 rounded-3xl bg-surface shadow-card overflow-hidden">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 pt-3 pb-2"
        >
          <span className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
        </button>

        {/* Driver card */}
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary text-white grid place-items-center text-lg font-bold shadow-pop">
            RS
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">Rajesh Singh</p>
            <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-success" /> Verified · 8 yrs · Lic. DL-32-2018
            </p>
          </div>
          <button className="grid place-items-center h-10 w-10 rounded-xl bg-whatsapp/10 text-whatsapp" aria-label="Message">
            <MessageCircle className="h-5 w-5" />
          </button>
          <a href="tel:+91" className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-success text-white shadow-pop" aria-label="Call driver">
            <Phone className="h-5 w-5" />
          </a>
        </div>

        {expanded && (
          <>
            <div className="mx-4 grid grid-cols-3 gap-2 pb-4">
              <MiniStat label="Speed" value="34 km/h" />
              <MiniStat label="Distance" value="2.1 km" />
              <MiniStat label="Stops left" value="3" />
            </div>

            <div className="px-4 pb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Route stops</h3>
              <button className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                Full route <ChevronUp className="h-3 w-3 rotate-90" />
              </button>
            </div>

            <ol className="px-4 pb-5 pt-2">
              {STOPS.map((s, i) => {
                const isCurrent = s.status === "current";
                const isDone = s.status === "done";
                return (
                  <li key={s.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`h-3 w-3 rounded-full ring-4 ${
                          isCurrent
                            ? "bg-primary ring-primary/20 animate-pulse"
                            : isDone
                            ? "bg-success ring-success/15"
                            : "bg-muted-foreground/40 ring-muted"
                        }`}
                      />
                      {i < STOPS.length - 1 && (
                        <span className={`w-0.5 flex-1 my-1 ${isDone ? "bg-success/50" : "bg-border"}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4 -mt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${isCurrent ? "text-foreground" : isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {s.name}
                        </p>
                        <span className={`text-[11px] font-semibold shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                          {s.time}
                        </span>
                      </div>
                      {isCurrent && (
                        <p className="text-[11px] text-primary mt-0.5 inline-flex items-center gap-1">
                          <Navigation2 className="h-3 w-3" /> Bus approaching · {eta} min
                        </p>
                      )}
                      {isDone && (
                        <p className="text-[11px] text-success mt-0.5">Picked up</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>
    </PhoneShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-2.5 text-center">
      <p className="text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

/* ---------------- Map canvas ---------------- */

function MapCanvas({ progress }: { progress: number }) {
  // Compute bus position along path
  const [pos, setPos] = useState<{ x: number; y: number; angle: number }>({ x: 0, y: 0, angle: 0 });

  useEffect(() => {
    const path = document.getElementById("bus-route-path") as SVGPathElement | null;
    if (!path) return;
    const len = path.getTotalLength();
    const p1 = path.getPointAtLength(len * progress);
    const p2 = path.getPointAtLength(Math.min(len, len * progress + 1));
    const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    setPos({ x: p1.x, y: p1.y, angle });
  }, [progress]);

  return (
    <svg viewBox="0 0 360 600" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.97 0.01 110)" />
          <stop offset="100%" stopColor="oklch(0.94 0.02 145)" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.86 0.06 220)" />
          <stop offset="100%" stopColor="oklch(0.8 0.08 230)" />
        </linearGradient>
        <linearGradient id="park" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.88 0.09 150)" />
          <stop offset="100%" stopColor="oklch(0.82 0.11 155)" />
        </linearGradient>
        <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.56 0.22 265)" />
          <stop offset="100%" stopColor="oklch(0.55 0.27 295)" />
        </linearGradient>
        <filter id="busShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="oklch(0.2 0.05 265)" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* base land */}
      <rect width="360" height="600" fill="url(#land)" />

      {/* parks / blocks */}
      <path d="M 0 480 Q 80 460 140 500 T 360 470 L 360 600 L 0 600 Z" fill="url(#park)" opacity="0.55" />
      <circle cx="280" cy="200" r="55" fill="url(#park)" opacity="0.75" />
      <circle cx="60" cy="220" r="30" fill="url(#park)" opacity="0.7" />

      {/* river */}
      <path d="M -10 320 C 80 300, 160 360, 260 330 S 380 300, 380 320 L 380 360 C 280 340, 200 390, 100 360 S 0 380, -10 360 Z" fill="url(#water)" opacity="0.75" />

      {/* road grid */}
      <g stroke="oklch(1 0 0)" strokeWidth="6" strokeLinecap="round" opacity="0.95">
        <line x1="0" y1="120" x2="360" y2="100" />
        <line x1="0" y1="260" x2="360" y2="280" />
        <line x1="0" y1="430" x2="360" y2="445" />
        <line x1="80" y1="0" x2="60" y2="600" />
        <line x1="220" y1="0" x2="240" y2="600" />
      </g>
      <g stroke="oklch(0.88 0.01 250)" strokeWidth="1.2" opacity="0.9">
        <line x1="0" y1="120" x2="360" y2="100" />
        <line x1="0" y1="260" x2="360" y2="280" />
        <line x1="0" y1="430" x2="360" y2="445" />
        <line x1="80" y1="0" x2="60" y2="600" />
        <line x1="220" y1="0" x2="240" y2="600" />
      </g>

      {/* building footprints */}
      <g fill="oklch(0.93 0.01 250)" stroke="oklch(0.88 0.01 250)" strokeWidth="0.8">
        <rect x="20" y="50" width="40" height="35" rx="3" />
        <rect x="100" y="40" width="55" height="45" rx="3" />
        <rect x="170" y="55" width="30" height="30" rx="3" />
        <rect x="20" y="160" width="35" height="40" rx="3" />
        <rect x="240" y="320" width="60" height="40" rx="3" />
        <rect x="20" y="490" width="40" height="35" rx="3" />
        <rect x="280" y="500" width="55" height="50" rx="3" />
      </g>

      {/* completed route (lighter) */}
      <path id="bus-route-path" d={ROUTE_PATH} fill="none" stroke="url(#routeGrad)" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
      {/* progress overlay using stroke-dasharray */}
      <ProgressOverlay progress={progress} />

      {/* stops */}
      {STOPS.map((s) => {
        const isCurrent = s.status === "current";
        const isDone = s.status === "done";
        return (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={isCurrent ? 9 : 6}
              fill={isDone ? "oklch(0.72 0.16 160)" : isCurrent ? "oklch(0.56 0.22 265)" : "oklch(1 0 0)"}
              stroke={isDone ? "oklch(0.72 0.16 160)" : "oklch(0.56 0.22 265)"}
              strokeWidth="2.5"
            />
            {isCurrent && (
              <circle cx={s.x} cy={s.y} r="9" fill="none" stroke="oklch(0.56 0.22 265)" strokeWidth="2">
                <animate attributeName="r" from="9" to="22" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* school destination marker */}
      <g transform="translate(320 60)">
        <circle r="14" fill="oklch(0.55 0.27 295)" />
        <text textAnchor="middle" y="4" fontSize="14" fill="white" fontWeight="700">S</text>
      </g>

      {/* bus marker */}
      <g transform={`translate(${pos.x} ${pos.y})`} filter="url(#busShadow)">
        <circle r="16" fill="white" />
        <circle r="13" fill="oklch(0.56 0.22 265)" />
        <g transform="translate(-7 -7)" stroke="white" strokeWidth="1.4" fill="none">
          {/* tiny bus glyph */}
          <rect x="1" y="2.5" width="12" height="9" rx="2" fill="white" />
          <line x1="1" y1="7.5" x2="13" y2="7.5" />
          <circle cx="4" cy="12" r="1.2" fill="oklch(0.19 0.04 264)" />
          <circle cx="10" cy="12" r="1.2" fill="oklch(0.19 0.04 264)" />
        </g>
      </g>
    </svg>
  );
}

function ProgressOverlay({ progress }: { progress: number }) {
  const [len, setLen] = useState(1);
  useEffect(() => {
    const p = document.getElementById("bus-route-path") as SVGPathElement | null;
    if (p) setLen(p.getTotalLength());
  }, []);
  return (
    <path
      d={ROUTE_PATH}
      fill="none"
      stroke="url(#routeGrad)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray={`${len * progress} ${len}`}
    />
  );
}
