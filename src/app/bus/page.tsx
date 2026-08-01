"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { useBusTrack } from "@/lib/providers/bus-track";
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
  Bell,
  AlertCircle,
} from "@/components/Icons";

export default function BusTrackingPage() {
  const { user } = useAuth();
  const bus = useBusTrack();
  const [expanded, setExpanded] = useState(true);

  if (!bus.ready) {
    return (
      <PhoneShell showHeader={false}>
        <p className="muted text-sm page-x" style={{ paddingTop: 40 }}>
          Loading live bus…
        </p>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell showHeader={false}>
      {bus.alertToast && (
        <div className="bus-alert-banner" role="alert">
          <div className="row" style={{ gap: 10 }}>
            <Bell size={18} />
            <div className="grow">
              <p className="font-semibold text-sm" style={{ margin: 0 }}>
                {bus.alertToast.title}
              </p>
              <p className="text-11" style={{ margin: "2px 0 0", opacity: 0.95 }}>
                {bus.alertToast.body}
              </p>
            </div>
            <button
              type="button"
              className="text-11 font-bold"
              style={{ color: "white" }}
              onClick={bus.dismissAlert}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="map-wrap">
        <div className="map-top">
          <Link
            href="/"
            className="icon-btn muted"
            aria-label="Back"
            style={{
              background: "rgb(255 255 255 / 0.95)",
              boxShadow: "var(--shadow-card)",
            }}
          >
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

        <MapCanvas progress={bus.progress} currentId={bus.stops.find((s) => s.status === "current")?.id} />

        <div className="map-controls">
          {[Plus, Minus, Layers, Locate].map((Icon, i) => (
            <button key={i} className="map-control" aria-label="map control" type="button">
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
            <p
              className="text-10"
              style={{
                margin: 0,
                opacity: 0.8,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Your stop
            </p>
            <p className="font-bold" style={{ margin: 0, fontSize: "1.125rem" }}>
              {bus.etaToHome} min
            </p>
          </div>
          <div
            style={{
              width: 1,
              height: 36,
              background: "rgb(255 255 255 / 0.25)",
              margin: "0 4px",
            }}
          />
          <div>
            <p
              className="text-10"
              style={{
                margin: 0,
                opacity: 0.8,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {bus.homeStop.shortName}
            </p>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              {bus.stopsBetween} stop{bus.stopsBetween === 1 ? "" : "s"} between
            </p>
          </div>
        </div>
      </div>

      <section className="sheet">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="sheet-handle"
          aria-label="Toggle"
          type="button"
        >
          <span />
        </button>

        <div className="page-x bus-path-summary">
          <div className="row" style={{ gap: 8 }}>
            <Navigation2 size={16} className="tone-primary" />
            <p className="text-sm" style={{ margin: 0 }}>
              Next stop <strong>{bus.nextStop.shortName}</strong> in{" "}
              <strong>{bus.etaToNext} min</strong>
              {" · "}
              Your stop <strong>{bus.homeStop.shortName}</strong> in{" "}
              <strong className="tone-primary">{bus.etaToHome} min</strong>
            </p>
          </div>
          <p className="text-11 muted" style={{ margin: "6px 0 0" }}>
            {bus.stopsBetween > 0
              ? `${bus.stopsBetween} stop${bus.stopsBetween === 1 ? "" : "s"} between the bus and your pickup.`
              : bus.etaToHome <= 0
                ? "Bus is at / past your stop."
                : "Bus is heading directly to your stop next."}
            {user?.busAlert10 !== false && " · Alerts at 10 & 5 min."}
          </p>
        </div>

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
              <ShieldCheck size={12} className="tone-success" /> Verified · 8 yrs ·
              Lic. DL-32-2018
            </p>
          </div>
          <button className="wa-btn" aria-label="Message" type="button">
            <MessageCircle size={20} />
          </button>
          <a href="tel:+91" className="call-btn" aria-label="Call driver">
            <Phone size={20} />
          </a>
        </div>

        {expanded && (
          <>
            <div
              className="page-x stats-grid"
              style={{ gridTemplateColumns: "repeat(3, 1fr)", paddingBottom: "1rem" }}
            >
              <MiniStat label="Speed" value={`${bus.speedKmh} km/h`} />
              <MiniStat label="Distance" value={`${bus.distanceKm} km`} />
              <MiniStat label="Stops left" value={String(bus.stopsLeft)} />
            </div>

            <div
              className="page-x row"
              style={{ justifyContent: "space-between", paddingBottom: 4 }}
            >
              <h3 className="text-sm font-semibold" style={{ margin: 0 }}>
                Route stops · live ETA
              </h3>
              <button
                type="button"
                className="text-xs font-semibold tone-primary"
                onClick={bus.resetTrip}
              >
                Replay trip
              </button>
            </div>

            <ol className="page-x" style={{ paddingBottom: "0.5rem", paddingTop: "0.5rem" }}>
              {bus.stops.map((s, i) => {
                const isCurrent = s.status === "current";
                const isDone = s.status === "done";
                const isHome = s.id === bus.homeStopId;
                return (
                  <li
                    key={s.id}
                    className="row"
                    style={{ alignItems: "stretch", gap: 12 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className={`stop-dot ${s.status}${isCurrent ? " pulse" : ""}`}
                      />
                      {i < bus.stops.length - 1 && (
                        <span className={`stop-line ${isDone ? "done" : ""}`} />
                      )}
                    </div>
                    <div
                      className="grow"
                      style={{ paddingBottom: "1rem", marginTop: -2 }}
                    >
                      <div
                        className="row"
                        style={{ justifyContent: "space-between", gap: 8 }}
                      >
                        <p
                          className="text-sm font-medium truncate"
                          style={{
                            margin: 0,
                            textDecoration: isDone ? "line-through" : undefined,
                            color: isDone ? "var(--muted-fg)" : undefined,
                          }}
                        >
                          {s.name}
                          {isHome ? " · Your stop" : ""}
                        </p>
                        <span
                          className={`text-11 font-semibold ${
                            isHome || isCurrent ? "tone-primary" : "muted"
                          }`}
                        >
                          {isDone ? "Done" : `${s.etaMin} min`}
                        </span>
                      </div>
                      {isCurrent && (
                        <p
                          className="text-11 tone-primary row mt-1"
                          style={{ gap: 4, marginBottom: 0 }}
                        >
                          <Navigation2 size={12} /> Bus here / approaching
                        </p>
                      )}
                      {isHome && !isDone && (
                        <p
                          className="text-11 muted mt-1"
                          style={{ marginBottom: 0 }}
                        >
                          {bus.stopsBetween} stop
                          {bus.stopsBetween === 1 ? "" : "s"} between · ETA{" "}
                          {bus.etaToHome} min
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="page-x" style={{ paddingBottom: "1.25rem" }}>
              <Link href="/profile" className="btn-secondary" style={{ width: "100%" }}>
                Change pickup stop & alerts in Profile
              </Link>
              <p className="text-11 muted row mt-2" style={{ gap: 6, marginBottom: 0 }}>
                <AlertCircle size={12} />
                Alerts fire once at 10 min and again at 5 min before your stop.
              </p>
            </div>
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

function MapCanvas({
  progress,
  currentId,
}: {
  progress: number;
  currentId?: string;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0, angle: 0 });
  const { stops, routePath } = useBusTrack();

  useEffect(() => {
    const path = document.getElementById(
      "bus-route-path",
    ) as SVGPathElement | null;
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
          <stop offset="0%" stopColor="#F7F9FD" />
          <stop offset="100%" stopColor="#E8F0E9" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BFDBFE" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
        <linearGradient id="park" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BBF7D0" />
          <stop offset="100%" stopColor="#86EFAC" />
        </linearGradient>
        <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <filter id="busShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2.5"
            floodColor="#152a63"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <rect width="360" height="600" fill="url(#land)" />
      <path
        d="M 0 480 Q 80 460 140 500 T 360 470 L 360 600 L 0 600 Z"
        fill="url(#park)"
        opacity="0.55"
      />
      <circle cx="280" cy="200" r="55" fill="url(#park)" opacity="0.75" />
      <circle cx="60" cy="220" r="30" fill="url(#park)" opacity="0.7" />
      <path
        d="M -10 320 C 80 300, 160 360, 260 330 S 380 300, 380 320 L 380 360 C 280 340, 200 390, 100 360 S 0 380, -10 360 Z"
        fill="url(#water)"
        opacity="0.75"
      />

      <g stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.95">
        <line x1="0" y1="120" x2="360" y2="100" />
        <line x1="0" y1="260" x2="360" y2="280" />
        <line x1="0" y1="430" x2="360" y2="445" />
        <line x1="80" y1="0" x2="60" y2="600" />
        <line x1="220" y1="0" x2="240" y2="600" />
      </g>

      <path
        id="bus-route-path"
        d={routePath}
        fill="none"
        stroke="url(#routeGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.35"
      />
      <ProgressOverlay progress={progress} routePath={routePath} />

      {stops.map((s) => {
        const isCurrent = s.id === currentId || s.status === "current";
        const isDone = s.status === "done";
        return (
          <g key={s.id}>
            <circle
              cx={s.x}
              cy={s.y}
              r={isCurrent ? 9 : 6}
              fill={isDone ? "#16A34A" : isCurrent ? "#2563EB" : "#fff"}
              stroke="#2563EB"
              strokeWidth="2.5"
            />
            {isCurrent && (
              <circle
                cx={s.x}
                cy={s.y}
                r="9"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
              >
                <animate
                  attributeName="r"
                  from="9"
                  to="22"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}

      <g transform="translate(320 60)">
        <circle r="14" fill="#1E3A8A" />
        <text
          textAnchor="middle"
          y="4"
          fontSize="14"
          fill="white"
          fontWeight="700"
        >
          S
        </text>
      </g>

      <g transform={`translate(${pos.x} ${pos.y})`} filter="url(#busShadow)">
        <circle r="16" fill="white" />
        <circle r="13" fill="#2563EB" />
        <g
          transform="translate(-7 -7)"
          stroke="white"
          strokeWidth="1.4"
          fill="none"
        >
          <rect x="1" y="2.5" width="12" height="9" rx="2" fill="white" />
          <line x1="1" y1="7.5" x2="13" y2="7.5" />
          <circle cx="4" cy="12" r="1.2" fill="#0F172A" />
          <circle cx="10" cy="12" r="1.2" fill="#0F172A" />
        </g>
      </g>
    </svg>
  );
}

function ProgressOverlay({
  progress,
  routePath,
}: {
  progress: number;
  routePath: string;
}) {
  const [len, setLen] = useState(1);
  useEffect(() => {
    const p = document.getElementById(
      "bus-route-path",
    ) as SVGPathElement | null;
    if (p) setLen(p.getTotalLength());
  }, [routePath]);
  return (
    <path
      d={routePath}
      fill="none"
      stroke="url(#routeGrad)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray={`${len * progress} ${len}`}
    />
  );
}
