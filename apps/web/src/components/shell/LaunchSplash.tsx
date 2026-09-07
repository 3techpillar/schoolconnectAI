"use client";

type SplashVariant = "full" | "compact" | "inline";

/**
 * Brand launch / opening splash — used while auth boots and on empty waits.
 * Pure CSS + SVG (no remote assets).
 */
export function LaunchSplash({
  label = "Opening SchoolConnect…",
  variant = "full",
}: {
  label?: string;
  variant?: SplashVariant;
}) {
  return (
    <div
      className={`launch-splash launch-splash-${variant}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="launch-splash-stage" aria-hidden>
        <div className="launch-splash-sky" />
        <svg
          className="launch-splash-art"
          viewBox="0 0 320 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft hills */}
          <path
            className="launch-hill launch-hill-a"
            d="M0 148 C40 128 70 160 110 148 C150 136 170 120 210 132 C250 144 280 128 320 140 L320 200 H0 Z"
            fill="#1e3a8a"
            opacity="0.35"
          />
          <path
            className="launch-hill launch-hill-b"
            d="M0 162 C50 148 90 170 140 158 C190 146 230 155 280 148 C300 145 310 150 320 154 L320 200 H0 Z"
            fill="#2563eb"
            opacity="0.45"
          />

          {/* School building */}
          <g className="launch-school">
            <rect x="118" y="72" width="84" height="68" rx="6" fill="#fff" />
            <rect x="118" y="64" width="84" height="14" rx="4" fill="#93c5fd" />
            <path d="M112 72 L160 42 L208 72 Z" fill="#1e40af" />
            <rect x="152" y="108" width="16" height="32" rx="2" fill="#2563eb" />
            <rect x="130" y="84" width="14" height="14" rx="2" fill="#bfdbfe" />
            <rect x="176" y="84" width="14" height="14" rx="2" fill="#bfdbfe" />
            <rect x="130" y="106" width="14" height="14" rx="2" fill="#bfdbfe" />
            <rect x="176" y="106" width="14" height="14" rx="2" fill="#bfdbfe" />
            <circle cx="160" cy="56" r="5" fill="#fbbf24" className="launch-bell" />
          </g>

          {/* Orbiting chat / fee / bus chips */}
          <g className="launch-orbit">
            <g className="launch-chip launch-chip-1">
              <rect x="28" y="48" width="56" height="24" rx="12" fill="#fff" />
              <circle cx="40" cy="60" r="5" fill="#25d366" />
              <text x="50" y="64" fontSize="9" fontFamily="Nunito Sans,sans-serif" fill="#0f172a" fontWeight="700">
                Chat
              </text>
            </g>
            <g className="launch-chip launch-chip-2">
              <rect x="236" y="40" width="58" height="24" rx="12" fill="#fff" />
              <circle cx="248" cy="52" r="5" fill="#f59e0b" />
              <text x="258" y="56" fontSize="9" fontFamily="Nunito Sans,sans-serif" fill="#0f172a" fontWeight="700">
                Fees
              </text>
            </g>
            <g className="launch-chip launch-chip-3">
              <rect x="42" y="118" width="64" height="24" rx="12" fill="#fff" />
              <circle cx="54" cy="130" r="5" fill="#16a34a" />
              <text x="64" y="134" fontSize="9" fontFamily="Nunito Sans,sans-serif" fill="#0f172a" fontWeight="700">
                Present
              </text>
            </g>
          </g>

          {/* Bus on road */}
          <path
            d="M24 168 H296"
            stroke="#93c5fd"
            strokeWidth="3"
            strokeDasharray="6 8"
            className="launch-road"
          />
          <g className="launch-bus">
            <animateMotion
              dur="4.8s"
              repeatCount="indefinite"
              path="M40 168 H280"
            />
            <circle cx="18" cy="-16" r="8" fill="#2563eb" opacity="0.2" className="launch-bus-glow" />
            <rect x="0" y="-10" width="36" height="18" rx="5" fill="#2563eb" />
            <rect x="22" y="-6" width="10" height="8" rx="2" fill="#bfdbfe" />
            <circle cx="8" cy="10" r="4" fill="#1e3a8a" />
            <circle cx="26" cy="10" r="4" fill="#1e3a8a" />
          </g>
        </svg>

        <div className="launch-splash-brand">
          <span className="launch-splash-mark">SC</span>
          <div>
            <p className="launch-splash-name">SchoolConnect</p>
            <p className="launch-splash-tag">{label}</p>
          </div>
        </div>

        <div className="launch-splash-bars" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
