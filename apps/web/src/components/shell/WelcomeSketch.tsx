"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export interface TourSlide {
  id: string;
  eyebrow: string;
  title: string;
  hint: string;
  accent: "blue" | "green" | "amber" | "teal";
}

const SLIDES: TourSlide[] = [
  {
    id: "bus",
    eyebrow: "Live tracking",
    title: "See the school bus move in real time",
    hint: "Tip: Open Bus from Home when pickup is near — ETA updates live.",
    accent: "blue",
  },
  {
    id: "attend",
    eyebrow: "Attendance",
    title: "Know the moment your child is marked present",
    hint: "Tip: Teachers mark P/A/L/H from Class desk; parents see it instantly.",
    accent: "green",
  },
  {
    id: "fees",
    eyebrow: "Fees",
    title: "Pay dues in one tap — receipts stay here",
    hint: "Tip: Late payment shows a Penalty tooltip on the Fees card.",
    accent: "amber",
  },
  {
    id: "chat",
    eyebrow: "School chat",
    title: "Homework, circulars & teacher notes in one thread",
    hint: "Tip: Class chat works like WhatsApp — react, reply, stay updated.",
    accent: "teal",
  },
];

const ACCENT_BG: Record<TourSlide["accent"], string> = {
  blue: "var(--blue-light)",
  green: "var(--green-tint)",
  amber: "var(--amber-tint)",
  teal: "#d1fae5",
};

export function WelcomeSketch({
  autoPlay = true,
  intervalMs = 4800,
}: {
  autoPlay?: boolean;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef<{ x: number; active: boolean }>({ x: 0, active: false });
  const slide = SLIDES[index];

  useEffect(() => {
    if (!autoPlay || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [autoPlay, paused, intervalMs, index]);

  const go = useCallback((dir: -1 | 1) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  }, []);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragRef.current = { x: e.clientX, active: true };
    setPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    dragRef.current.active = false;
    if (dx < -48) go(1);
    else if (dx > 48) go(-1);
    window.setTimeout(() => setPaused(false), 1200);
  };

  return (
    <section
      className="welcome-tour"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="How SchoolConnect works"
    >
      <div className="welcome-tour-head">
        <span className="welcome-eyebrow">How it works</span>
        <div className="welcome-dots" role="tablist">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`welcome-dot ${i === index ? "active" : ""}`}
              onClick={() => {
                setIndex(i);
                setPaused(true);
                window.setTimeout(() => setPaused(false), 1800);
              }}
              aria-label={s.eyebrow}
            />
          ))}
        </div>
      </div>

      <div
        className="welcome-stage"
        key={slide.id}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
        style={{ touchAction: "pan-y" }}
      >
        <p className="welcome-swipe-hint">Swipe scenes · tap dots</p>
        <SketchFrame accent={slide.accent} kind={slide.id} />
        <div className="welcome-copy">
          <p
            className="welcome-slide-eyebrow"
            style={{ background: ACCENT_BG[slide.accent] }}
          >
            {slide.eyebrow}
          </p>
          <h2 className="welcome-slide-title">{slide.title}</h2>
          <p className="welcome-hint">
            <span className="welcome-hint-pulse" />
            {slide.hint}
          </p>
        </div>
      </div>

      <div className="welcome-progress">
        <span
          key={`${slide.id}-bar`}
          className={`welcome-progress-bar ${paused ? "is-paused" : ""}`}
          style={{ animationDuration: `${intervalMs}ms` }}
        />
      </div>
    </section>
  );
}

function SketchFrame({
  accent,
  kind,
}: {
  accent: TourSlide["accent"];
  kind: string;
}) {
  return (
    <div className={`welcome-sketch accent-${accent}`}>
      {kind === "bus" && <BusSketch />}
      {kind === "attend" && <AttendSketch />}
      {kind === "fees" && <FeesSketch />}
      {kind === "chat" && <ChatSketch />}
    </div>
  );
}

function BusSketch() {
  return (
    <svg viewBox="0 0 320 180" className="welcome-svg" aria-hidden>
      <defs>
        <linearGradient id="busSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="55%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="busGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="320" height="180" fill="url(#busSky)" />
      {/* Clouds */}
      <g className="sketch-cloud c1" opacity="0.85">
        <ellipse cx="48" cy="36" rx="22" ry="10" fill="#fff" />
        <ellipse cx="66" cy="36" rx="14" ry="8" fill="#fff" />
      </g>
      <g className="sketch-cloud c2" opacity="0.7">
        <ellipse cx="250" cy="28" rx="26" ry="11" fill="#fff" />
        <ellipse cx="272" cy="28" rx="14" ry="8" fill="#fff" />
      </g>
      {/* School */}
      <g>
        <rect x="248" y="78" width="52" height="48" rx="4" fill="#fff" />
        <path d="M242 78 L274 54 L306 78 Z" fill="#1e40af" />
        <rect x="268" y="102" width="12" height="24" fill="#2563eb" />
        <rect x="254" y="88" width="10" height="10" rx="1" fill="#bfdbfe" />
        <rect x="284" y="88" width="10" height="10" rx="1" fill="#bfdbfe" />
      </g>
      {/* Trees */}
      <circle cx="36" cy="118" r="16" fill="#4ade80" opacity="0.85" />
      <rect x="33" y="118" width="6" height="18" fill="#166534" />
      <circle cx="210" cy="112" r="12" fill="#22c55e" opacity="0.8" />
      <rect x="207" y="112" width="5" height="14" fill="#166534" />

      <path
        d="M16 148 C 70 148, 90 92, 160 92 S 240 70, 304 78"
        fill="none"
        stroke="#1e40af"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.15"
      />
      <path
        d="M16 148 C 70 148, 90 92, 160 92 S 240 70, 304 78"
        fill="none"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
        className="sketch-road"
      />
      <circle cx="16" cy="148" r="6" fill="#2563eb" />
      <circle cx="304" cy="78" r="6" fill="#16a34a" />

      <g className="sketch-bus">
        <animateMotion
          dur="6.5s"
          repeatCount="indefinite"
          path="M16 148 C 70 148, 90 92, 160 92 S 240 70, 304 78"
        />
        <circle r="18" fill="url(#busGlow)">
          <animate attributeName="r" values="12;20;12" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <rect x="-18" y="-11" width="36" height="18" rx="5" fill="#2563eb" />
        <rect x="4" y="-7" width="10" height="8" rx="2" fill="#bfdbfe" />
        <circle cx="-8" cy="9" r="3.5" fill="#1e3a8a" />
        <circle cx="10" cy="9" r="3.5" fill="#1e3a8a" />
      </g>

      <g className="sketch-float">
        <rect x="18" y="16" width="100" height="34" rx="12" fill="#fff" filter="drop-shadow(0 4px 10px rgba(37,99,235,.18))" />
        <circle cx="36" cy="33" r="6" fill="#4ade80">
          <animate attributeName="opacity" values="1;0.45;1" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <text x="48" y="30" fontSize="10" fontFamily="Nunito Sans,sans-serif" fill="#0F172A" fontWeight="800">
          ETA 6 min
        </text>
        <text x="48" y="42" fontSize="8" fontFamily="Inter,sans-serif" fill="#5B6779" fontWeight="600">
          Near Sunshine Apts
        </text>
      </g>
    </svg>
  );
}

function AttendSketch() {
  const kids = [
    { name: "Aarav", mark: "P", ok: true },
    { name: "Ananya", mark: "P", ok: true },
    { name: "Kabir", mark: "A", ok: false },
    { name: "Diya", mark: "P", ok: true },
  ];
  return (
    <svg viewBox="0 0 320 180" className="welcome-svg" aria-hidden>
      <defs>
        <linearGradient id="attSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#attSky)" />
      {/* Board */}
      <rect x="24" y="18" width="272" height="44" rx="10" fill="#14532d" />
      <text x="40" y="44" fontSize="13" fontFamily="Nunito Sans,sans-serif" fill="#bbf7d0" fontWeight="700">
        {`Class 6-B · Today's roll`}
      </text>
      {kids.map((k, i) => (
        <g key={k.name} className="sketch-row" style={{ animationDelay: `${0.12 * i}s` }}>
          <rect
            x="28"
            y={78 + i * 24}
            width="264"
            height="20"
            rx="8"
            fill="#fff"
            opacity="0.95"
          />
          <circle
            cx="48"
            cy={88 + i * 24}
            r="7"
            fill={k.ok ? "#bbf7d0" : "#fecaca"}
          />
          <text
            x="64"
            y={92 + i * 24}
            fontSize="11"
            fontFamily="Inter,sans-serif"
            fill="#0f172a"
            fontWeight="700"
          >
            {k.name}
          </text>
          <rect
            x="250"
            y={81 + i * 24}
            width="28"
            height="14"
            rx="4"
            fill={k.ok ? "#16a34a" : "#ef4444"}
          />
          <text
            x="258"
            y={92 + i * 24}
            fontSize="9"
            fontFamily="Nunito Sans,sans-serif"
            fill="#fff"
            fontWeight="800"
          >
            {k.mark}
          </text>
        </g>
      ))}
      <g className="sketch-check">
        <circle cx="286" cy="40" r="18" fill="#16a34a" opacity="0.2" />
        <path
          d="M276 40 l6 6 12-12"
          fill="none"
          stroke="#16a34a"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="sketch-check-path"
        />
      </g>
    </svg>
  );
}

function FeesSketch() {
  return (
    <svg viewBox="0 0 320 180" className="welcome-svg" aria-hidden>
      <defs>
        <linearGradient id="feeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#ffedd5" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#feeSky)" />
      {/* Coin stack */}
      <g className="sketch-coins">
        {[0, 1, 2].map((i) => (
          <ellipse
            key={i}
            cx="64"
            cy={128 - i * 10}
            rx="28"
            ry="9"
            fill={i === 2 ? "#fbbf24" : "#f59e0b"}
            opacity={0.9 - i * 0.08}
            className="sketch-coin"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </g>
      <rect
        x="112"
        y="36"
        width="184"
        height="108"
        rx="16"
        fill="#fff"
        filter="drop-shadow(0 8px 18px rgba(245,158,11,.2))"
      />
      <text x="128" y="62" fontSize="11" fontFamily="Inter,sans-serif" fill="#92400e" fontWeight="700">
        Term fee due
      </text>
      <text x="128" y="96" fontSize="28" fontFamily="Nunito Sans,sans-serif" fill="#0f172a" fontWeight="800">
        ₹4,200
      </text>
      <rect
        x="200"
        y="112"
        width="78"
        height="22"
        rx="10"
        fill="#2563eb"
        className="sketch-pay-pulse"
      />
      <text x="214" y="127" fontSize="11" fontFamily="Inter,sans-serif" fill="#fff" fontWeight="800">
        Pay now
      </text>
      <g className="sketch-receipt">
        <rect x="128" y="118" width="62" height="16" rx="6" fill="#dcfce7" />
        <text x="136" y="130" fontSize="9" fontFamily="Inter,sans-serif" fill="#166534" fontWeight="700">
          Receipt ✓
        </text>
      </g>
    </svg>
  );
}

function ChatSketch() {
  return (
    <svg viewBox="0 0 320 180" className="welcome-svg" aria-hidden>
      <defs>
        <linearGradient id="chatSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#chatSky)" />
      {/* Phone frame */}
      <rect x="96" y="12" width="128" height="156" rx="18" fill="#0f172a" />
      <rect x="102" y="22" width="116" height="136" rx="12" fill="#f0fdf4" />
      <rect x="140" y="16" width="40" height="5" rx="2" fill="#334155" />

      <g className="sketch-bubble b1">
        <rect x="112" y="36" width="96" height="34" rx="12" fill="#fff" />
        <text x="120" y="50" fontSize="8" fontFamily="Inter,sans-serif" fill="#0f172a" fontWeight="700">
          Homework · Maths
        </text>
        <text x="120" y="62" fontSize="7" fontFamily="Inter,sans-serif" fill="#64748b">
          Due Friday
        </text>
      </g>
      <g className="sketch-bubble b2">
        <rect x="112" y="78" width="96" height="34" rx="12" fill="#dcfce7" />
        <text x="120" y="92" fontSize="8" fontFamily="Inter,sans-serif" fill="#14532d" fontWeight="700">
          Sports Day Jul 5
        </text>
        <text x="120" y="104" fontSize="7" fontFamily="Inter,sans-serif" fill="#166534">
          Circular · New
        </text>
      </g>
      {/* Typing dots */}
      <g className="sketch-typing">
        <rect x="112" y="122" width="44" height="20" rx="10" fill="#fff" />
        <circle cx="124" cy="132" r="2.5" fill="#94a3b8">
          <animate attributeName="cy" values="132;128;132" dur="0.9s" repeatCount="indefinite" />
        </circle>
        <circle cx="134" cy="132" r="2.5" fill="#94a3b8">
          <animate attributeName="cy" values="132;128;132" dur="0.9s" begin="0.15s" repeatCount="indefinite" />
        </circle>
        <circle cx="144" cy="132" r="2.5" fill="#94a3b8">
          <animate attributeName="cy" values="132;128;132" dur="0.9s" begin="0.3s" repeatCount="indefinite" />
        </circle>
      </g>
      <g className="sketch-react">
        <circle cx="246" cy="56" r="14" fill="#fff" />
        <text x="239" y="61" fontSize="12">👍</text>
        <circle cx="246" cy="92" r="14" fill="#fff" />
        <text x="239" y="97" fontSize="12">❤️</text>
      </g>
    </svg>
  );
}

export function WelcomeHints() {
  const hints = [
    "Demo OTP is always 000000 — no SMS needed.",
    "Pick your role once at setup; it sticks on next login.",
    "Parents see child’s day; teachers get Class desk; admins get /admin.",
    "Try Bus, Fees, Chats and Engage after you sign in.",
  ];
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % hints.length), 5000);
    return () => window.clearInterval(t);
  }, [hints.length]);

  return (
    <div className="welcome-tips" aria-live="polite">
      <span className="welcome-tips-label">Hint</span>
      <p key={i} className="welcome-tips-text">
        {hints[i]}
      </p>
    </div>
  );
}
