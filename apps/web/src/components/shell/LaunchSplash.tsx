"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type SplashVariant = "full" | "compact" | "inline";

const LOADING_TIPS = [
  "Waking up Buddy, your AI study companion… 🤖",
  "Preparing today's learning quests… 🚀",
  "Preserving your streak bonus XP… 🔥",
  "Loading subject adventure kingdoms… 🗺️",
  "Ready to explore and level up! ⭐",
];

export function LaunchSplash({
  label = "Opening EduWorld…",
  variant = "full",
}: {
  label?: string;
  variant?: SplashVariant;
}) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`edu-splash-root edu-splash-${variant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="edu-splash-content">
        {/* Soft Ambient Background Glows */}
        <div className="edu-splash-glow glow-primary" />
        <div className="edu-splash-glow glow-secondary" />

        {/* 3D Buddy Mascot Stage */}
        <div className="edu-mascot-stage">
          <div className="edu-mascot-ring">
            <Image
              src="/assets/mascots/buddy_robot.jpg"
              alt="Buddy Robot Mascot"
              width={120}
              height={120}
              priority
              className="edu-mascot-img"
            />
            <div className="edu-pulse-ring" />
          </div>

          {/* Floating Game Badges */}
          <span className="edu-float-badge badge-top-right">⭐</span>
          <span className="edu-float-badge badge-bottom-left">🚀</span>
          <span className="edu-float-badge badge-right-center">🔥</span>
        </div>

        {/* Brand Pill */}
        <div className="edu-brand-badge mt-3">
          <span className="edu-brand-emoji">🏫</span>
          <span className="edu-brand-title">SchoolConnect EduWorld</span>
        </div>

        {/* Status Label & Cycling Tip */}
        <div className="edu-status-stack mt-2">
          <p className="edu-status-label">{label}</p>
          <p className="edu-tip-ticker">{LOADING_TIPS[tipIndex]}</p>
        </div>

        {/* Sleek Gradient Progress Bar */}
        <div className="edu-progress-track mt-3" aria-hidden>
          <div className="edu-progress-shimmer" />
        </div>
      </div>
    </div>
  );
}
