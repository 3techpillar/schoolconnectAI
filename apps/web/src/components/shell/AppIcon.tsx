"use client";

import type { ComponentType, SVGProps } from "react";

export type IconComp = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number | string }
>;

export type AppIconTone =
  | "blue"
  | "teal"
  | "green"
  | "yellow"
  | "orange"
  | "amber"
  | "slate"
  | "rose";

/**
 * Soft colored well + micro-motion around stroke icons.
 * Tones follow design system: blue primary, teal secondary, yellow rewards.
 */
export function AppIcon({
  icon: Icon,
  tone = "blue",
  size = 20,
  active = false,
  pulse = false,
  label,
}: {
  icon: IconComp;
  tone?: AppIconTone;
  size?: number;
  active?: boolean;
  pulse?: boolean;
  label?: string;
}) {
  const resolved = tone === "amber" ? "orange" : tone === "rose" ? "orange" : tone;
  return (
    <span
      className={`app-icon app-icon-${resolved}${active ? " is-active" : ""}${pulse ? " is-pulse" : ""}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <Icon size={size} className="app-icon-svg" strokeWidth={1.75} />
    </span>
  );
}
