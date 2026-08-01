"use client";

import { useEffect, useState } from "react";

export interface TourSlide {
  id: string;
  eyebrow: string;
  title: string;
  hint: string;
  accent: "blue" | "green" | "amber" | "violet";
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
    accent: "violet",
  },
];

const ACCENT_BG: Record<TourSlide["accent"], string> = {
  blue: "var(--blue-light)",
  green: "var(--green-tint)",
  amber: "var(--amber-tint)",
  violet: "var(--violet-tint)",
};

export function WelcomeSketch({
  autoPlay = true,
  intervalMs = 4200,
}: {
  autoPlay?: boolean;
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index];

  useEffect(() => {
    if (!autoPlay || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [autoPlay, paused, intervalMs]);

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
              onClick={() => setIndex(i)}
              aria-label={s.eyebrow}
            />
          ))}
        </div>
      </div>

      <div className="welcome-stage" key={slide.id}>
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
          className="welcome-progress-bar"
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
    <svg viewBox="0 0 280 140" className="welcome-svg" aria-hidden>
      <rect x="8" y="8" width="264" height="124" rx="18" fill="#F7F9FD" stroke="#E4E9F2" />
      <path
        d="M28 108 C 70 108, 80 52, 140 52 S 210 36, 252 42"
        fill="none"
        stroke="#C7D6FB"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="2 10"
        className="sketch-road"
      />
      <circle cx="28" cy="108" r="5" fill="#2563EB" />
      <circle cx="252" cy="42" r="5" fill="#16A34A" />
      <g className="sketch-bus">
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path="M28 108 C 70 108, 80 52, 140 52 S 210 36, 252 42"
        />
        <circle r="14" fill="#2563EB" opacity="0.2">
          <animate attributeName="r" values="10;16;10" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <rect x="-14" y="-9" width="28" height="16" rx="4" fill="#2563EB" />
        <circle cx="-7" cy="8" r="3" fill="#1E3A8A" />
        <circle cx="7" cy="8" r="3" fill="#1E3A8A" />
      </g>
      <g className="sketch-float" style={{ transformOrigin: "40px 28px" }}>
        <rect x="18" y="18" width="88" height="28" rx="8" fill="#fff" stroke="#E4E9F2" />
        <circle cx="32" cy="32" r="5" fill="#4ADE80" />
        <text x="42" y="36" fontSize="9" fontFamily="Inter,sans-serif" fill="#0F172A" fontWeight="700">
          ETA 6 min
        </text>
      </g>
    </svg>
  );
}

function AttendSketch() {
  return (
    <svg viewBox="0 0 280 140" className="welcome-svg" aria-hidden>
      <rect x="8" y="8" width="264" height="124" rx="18" fill="#F7F9FD" stroke="#E4E9F2" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} className="sketch-row" style={{ animationDelay: `${0.15 * i}s` }}>
          <rect
            x="24"
            y={28 + i * 24}
            width="232"
            height="18"
            rx="6"
            fill="#fff"
            stroke="#E4E9F2"
          />
          <circle cx="40" cy={37 + i * 24} r="6" fill={i === 2 ? "#FEE2E2" : "#E9F8EF"} />
          <text
            x="54"
            y={41 + i * 24}
            fontSize="9"
            fontFamily="Inter,sans-serif"
            fill="#5B6779"
            fontWeight="600"
          >
            {["Aarav", "Ananya", "Kabir", "Diya"][i]}
          </text>
          <rect
            x="210"
            y={31 + i * 24}
            width="32"
            height="12"
            rx="4"
            fill={i === 2 ? "#EF4444" : "#16A34A"}
          />
          <text
            x="218"
            y={40 + i * 24}
            fontSize="8"
            fontFamily="Sora,sans-serif"
            fill="#fff"
            fontWeight="700"
          >
            {i === 2 ? "A" : "P"}
          </text>
        </g>
      ))}
      <g className="sketch-check">
        <circle cx="230" cy="36" r="16" fill="#16A34A" opacity="0.15" />
        <path
          d="M222 36 l5 5 10-10"
          fill="none"
          stroke="#16A34A"
          strokeWidth="3"
          strokeLinecap="round"
          className="sketch-check-path"
        />
      </g>
    </svg>
  );
}

function FeesSketch() {
  return (
    <svg viewBox="0 0 280 140" className="welcome-svg" aria-hidden>
      <rect x="8" y="8" width="264" height="124" rx="18" fill="#F7F9FD" stroke="#E4E9F2" />
      <rect x="28" y="28" width="224" height="72" rx="12" fill="#fff" stroke="#E4E9F2" />
      <text x="40" y="48" fontSize="9" fontFamily="Inter,sans-serif" fill="#5B6779" fontWeight="600">
        Outstanding
      </text>
      <text x="40" y="72" fontSize="22" fontFamily="Sora,sans-serif" fill="#0F172A" fontWeight="800">
        ₹4,200
      </text>
      <rect x="168" y="52" width="68" height="28" rx="8" fill="#2563EB" className="sketch-pay-pulse" />
      <text x="180" y="70" fontSize="10" fontFamily="Inter,sans-serif" fill="#fff" fontWeight="700">
        Pay now
      </text>
      <text x="40" y="92" fontSize="9" fontFamily="Inter,sans-serif" fill="#B45309" fontWeight="600">
        Overdue · tap Penalty for late fee tip
      </text>
      <g className="sketch-receipt">
        <rect x="48" y="108" width="72" height="14" rx="4" fill="#E9F8EF" />
        <text x="56" y="118" fontSize="8" fontFamily="Inter,sans-serif" fill="#166534" fontWeight="700">
          Receipt ready
        </text>
      </g>
    </svg>
  );
}

function ChatSketch() {
  return (
    <svg viewBox="0 0 280 140" className="welcome-svg" aria-hidden>
      <rect x="8" y="8" width="264" height="124" rx="18" fill="#F7F9FD" stroke="#E4E9F2" />
      <g className="sketch-bubble b1">
        <rect x="24" y="24" width="150" height="36" rx="12" fill="#fff" stroke="#E4E9F2" />
        <text x="36" y="40" fontSize="9" fontFamily="Inter,sans-serif" fill="#0F172A" fontWeight="600">
          Homework: Ch.4 Maths
        </text>
        <text x="36" y="52" fontSize="8" fontFamily="Inter,sans-serif" fill="#5B6779">
          Due Friday · Ms. Kapoor
        </text>
      </g>
      <g className="sketch-bubble b2">
        <rect x="100" y="70" width="156" height="36" rx="12" fill="#DBEAFE" />
        <text x="112" y="86" fontSize="9" fontFamily="Inter,sans-serif" fill="#1E3A8A" fontWeight="600">
          Circular: Sports Day Jul 5
        </text>
        <text x="112" y="98" fontSize="8" fontFamily="Inter,sans-serif" fill="#5B6779">
          House T-shirt required
        </text>
      </g>
      <g className="sketch-react">
        <circle cx="48" cy="112" r="10" fill="#fff" stroke="#E4E9F2" />
        <text x="42" y="116" fontSize="10">👍</text>
        <circle cx="72" cy="112" r="10" fill="#fff" stroke="#E4E9F2" />
        <text x="66" y="116" fontSize="10">❤️</text>
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
