"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import {
  ArrowLeft,
  Bus,
  Phone,
  MessageCircle,
  Navigation2,
  Clock,
  ShieldCheck,
  Plus,
  Minus,
  Layers,
  Locate,
  ChevronUp,
} from "@/components/Icons";

const ROUTE_PATH =
  "M 40 540 C 80 480, 60 420, 120 380 S 220 320, 200 250 S 120 180, 180 120 S 300 100, 320 60";

const STOPS = [
  { id: "s1", name: "Green Park Society", time: "7:25 AM", x: 40, y: 540, status: "done" },
  { id: "s2", name: "MG Road Crossing", time: "7:34 AM", x: 110, y: 395, status: "done" },
  { id: "s3", name: "Sunshine Apartments", time: "7:41 AM", x: 198, y: 258, status: "current" },
  { id: "s4", name: "Lake View Block C", time: "7:48 AM", x: 168, y: 150, status: "upcoming" },
  { id: "s5", name: "Springdale School", time: "7:58 AM", x: 320, y: 60, status: "upcoming" },
] as const;

export default function BusTrackingPage() {
  const [progress, setProgress] = useState(0.42);
  const [eta, setEta] = useState(8);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 0.96 ? 0.05 : p + 0.004));
      setEta((e) => (e <= 1 ? 12 : Math.max(1, e - (Math.random() > 0.6 ? 1 : 0))));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneShell showHeader={false}>
      <div className="map-wrap">
        <div className="map-top">
          <Link href="/" className="icon-btn muted" aria-label="Back" style={{ background: "rgb(255 255 255 / 0.95)", boxShadow: "var(--shadow-card)" }}>
            <ArrowLeft size={20} />
          </Link>
          <div className="map-chip">
            <Bus size={16} className="tone-primary" />
            <div className="grow">
              <p className="text-11 muted" style={{ margin: 0 }}>
                Route 12 · DL 1X 4567
              </p>
              <p className="text-sm font-semibold truncate" style={{ margin: 0 }}>
                Morning · To school
              </p>
            </div>
            <span className="live-pill">
              <span className="pulse-dot" /> LIVE
            </span>
          </div>
        </div>

        <MapCanvas progress={progress} />

        <div className="map-controls">
          {[Plus, Minus, Layers, Locate].map((Icon, i) => (
            <button key={i} className="map-control" aria-label="map control">
              <Icon size={16} />
            </button>
          ))}
        </div>

        <div className="eta-pill">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: "rgb(255 255 255 / 0.2)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Clock size={16} />
          </div>
          <div>
            <p className="text-10" style={{ margin: 0, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Arriving in
            </p>
            <p className="font-bold" style={{ margin: 0, fontSize: "1.125rem" }}>
              {eta} min
            </p>
          </div>
          <div style={{ width: 1, height: 36, background: "rgb(255 255 255 / 0.25)", margin: "0 4px" }} />
          <div>
            <p className="text-10" style={{ margin: 0, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Next stop
            </p>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              Sunshine Apts.
            </p>
          </div>
        </div>
      </div>

      <section className="sheet">
        <button onClick={() => setExpanded((v) => !v)} className="sheet-handle" aria-label="Toggle">
          <span />
        </button>

        <div className="page-x row" style={{ paddingBottom: "1rem" }}>
          <div
            className="avatar"
            style={{
              background: "var(--gradient-primary)",
              borderRadius: "1rem",
              boxShadow: "var(--shadow-pop)",
            }}
          >
            RS
          </div>
          <div className="grow">
            <p className="font-semibold truncate" style={{ margin: 0 }}>
              Rajesh Singh
            </p>
            <p className="text-11 muted row" style={{ margin: 0, gap: 4 }}>
              <ShieldCheck size={12} className="tone-success" /> Verified · 8 yrs · Lic. DL-32-2018
            </p>
          </div>
          <button className="wa-btn" aria-label="Message">
            <MessageCircle size={20} />
          </button>
          <a href="tel:+91" className="call-btn" aria-label="Call driver">
            <Phone size={20} />
          </a>
        </div>

        {expanded && (
          <>
            <div className="page-x stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", paddingBottom: "1rem" }}>
              <MiniStat label="Speed" value="34 km/h" />
              <MiniStat label="Distance" value="2.1 km" />
              <MiniStat label="Stops left" value="3" />
            </div>

            <div className="page-x row" style={{ justifyContent: "space-between", paddingBottom: 4 }}>
              <h3 className="text-sm font-semibold" style={{ margin: 0 }}>
                Route stops
              </h3>
              <button className="text-xs font-semibold tone-primary row" style={{ gap: 4 }}>
                Full route <ChevronUp size={12} style={{ transform: "rotate(90deg)" }} />
              </button>
            </div>

            <ol className="page-x" style={{ paddingBottom: "1.25rem", paddingTop: "0.5rem" }}>
              {STOPS.map((s, i) => {
                const isCurrent = s.status === "current";
                const isDone = s.status === "done";
                return (
                  <li key={s.id} className="row" style={{ alignItems: "stretch", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span className={`stop-dot ${s.status}${isCurrent ? " pulse" : ""}`} />
                      {i < STOPS.length - 1 && (
                        <span className={`stop-line ${isDone ? "done" : ""}`} />
                      )}
                    </div>
                    <div className="grow" style={{ paddingBottom: "1rem", marginTop: -2 }}>
                      <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                        <p
                          className="text-sm font-medium truncate"
                          style={{
                            margin: 0,
                            textDecoration: isDone ? "line-through" : undefined,
                            color: isDone ? "var(--muted-fg)" : undefined,
                          }}
                        >
                          {s.name}
                        </p>
                        <span
                          className={`text-11 font-semibold ${isCurrent ? "tone-primary" : "muted"}`}
                        >
                          {s.time}
                        </span>
                      </div>
                      {isCurrent && (
                        <p className="text-11 tone-primary row mt-1" style={{ gap: 4, marginBottom: 0 }}>
                          <Navigation2 size={12} /> Bus approaching · {eta} min
                        </p>
                      )}
                      {isDone && (
                        <p className="text-11 tone-success mt-1" style={{ marginBottom: 0 }}>
                          Picked up
                        </p>
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
    <div className="metric">
      <p className="font-bold text-sm" style={{ margin: 0 }}>
        {value}
      </p>
      <p className="text-10 muted mt-1" style={{ marginBottom: 0 }}>
        {label}
      </p>
    </div>
  );
}

function MapCanvas({ progress }: { progress: number }) {
  const [pos, setPos] = useState({ x: 0, y: 0, angle: 0 });

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
    <svg
      viewBox="0 0 360 600"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid slice"
    >
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
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2.5"
            floodColor="oklch(0.2 0.05 265)"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <rect width="360" height="600" fill="url(#land)" />
      <path d="M 0 480 Q 80 460 140 500 T 360 470 L 360 600 L 0 600 Z" fill="url(#park)" opacity="0.55" />
      <circle cx="280" cy="200" r="55" fill="url(#park)" opacity="0.75" />
      <circle cx="60" cy="220" r="30" fill="url(#park)" opacity="0.7" />
      <path
        d="M -10 320 C 80 300, 160 360, 260 330 S 380 300, 380 320 L 380 360 C 280 340, 200 390, 100 360 S 0 380, -10 360 Z"
        fill="url(#water)"
        opacity="0.75"
      />

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

      <g fill="oklch(0.93 0.01 250)" stroke="oklch(0.88 0.01 250)" strokeWidth="0.8">
        <rect x="20" y="50" width="40" height="35" rx="3" />
        <rect x="100" y="40" width="55" height="45" rx="3" />
        <rect x="170" y="55" width="30" height="30" rx="3" />
        <rect x="20" y="160" width="35" height="40" rx="3" />
        <rect x="240" y="320" width="60" height="40" rx="3" />
        <rect x="20" y="490" width="40" height="35" rx="3" />
        <rect x="280" y="500" width="55" height="50" rx="3" />
      </g>

      <path
        id="bus-route-path"
        d={ROUTE_PATH}
        fill="none"
        stroke="url(#routeGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.35"
      />
      <ProgressOverlay progress={progress} />

      {STOPS.map((s) => {
        const isCurrent = s.status === "current";
        const isDone = s.status === "done";
        return (
          <g key={s.id}>
            <circle
              cx={s.x}
              cy={s.y}
              r={isCurrent ? 9 : 6}
              fill={
                isDone
                  ? "oklch(0.72 0.16 160)"
                  : isCurrent
                    ? "oklch(0.56 0.22 265)"
                    : "oklch(1 0 0)"
              }
              stroke={isDone ? "oklch(0.72 0.16 160)" : "oklch(0.56 0.22 265)"}
              strokeWidth="2.5"
            />
            {isCurrent && (
              <circle
                cx={s.x}
                cy={s.y}
                r="9"
                fill="none"
                stroke="oklch(0.56 0.22 265)"
                strokeWidth="2"
              >
                <animate attributeName="r" from="9" to="22" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      <g transform="translate(320 60)">
        <circle r="14" fill="oklch(0.55 0.27 295)" />
        <text textAnchor="middle" y="4" fontSize="14" fill="white" fontWeight="700">
          S
        </text>
      </g>

      <g transform={`translate(${pos.x} ${pos.y})`} filter="url(#busShadow)">
        <circle r="16" fill="white" />
        <circle r="13" fill="oklch(0.56 0.22 265)" />
        <g transform="translate(-7 -7)" stroke="white" strokeWidth="1.4" fill="none">
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
