"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { AppIcon, type AppIconTone } from "@/components/shell/AppIcon";
import {
  Bell,
  BookOpen,
  Bus,
  CalendarCheck,
  FileText,
  GraduationCap,
  Megaphone,
  Sparkles,
  Wallet,
} from "@/components/shell/Icons";

function moduleOn(
  caps: Record<string, boolean> | undefined,
  key: string,
  fees = false,
) {
  if (fees) return Boolean(caps?.fees);
  if (caps && caps[key] === false) return false;
  return true;
}

export default function MorePage() {
  const { user } = useAuth();
  if (!user) return null;

  const caps = user.capabilities as Record<string, boolean> | undefined;
  const links: Array<{
    href: string;
    label: string;
    hint: string;
    icon: typeof Bus;
    tone: AppIconTone;
  }> = [
    moduleOn(caps, "bus")
      ? {
          href: "/bus",
          label: "Live bus",
          hint: "Map, ETA and pickup alerts",
          icon: Bus,
          tone: "blue" as const,
        }
      : null,
    moduleOn(caps, "attendance")
      ? {
          href: "/attendance",
          label: "Attendance",
          hint: "Month calendar and leaves",
          icon: CalendarCheck,
          tone: "green" as const,
        }
      : null,
    {
      href: "/report",
      label: "Report",
      hint: "Academic snapshot",
      icon: FileText,
      tone: "teal" as const,
    },
    {
      href: "/engage",
      label: "Progress",
      hint: "Learning Zone · XP and streaks",
      icon: Sparkles,
      tone: "yellow" as const,
    },
    moduleOn(caps, "circulars")
      ? {
          href: "/circulars",
          label: "Circulars",
          hint: "School notices and events",
          icon: Megaphone,
          tone: "orange" as const,
        }
      : null,
    moduleOn(caps, "notifications")
      ? {
          href: "/notifications",
          label: "Notifications",
          hint: "Alerts from school",
          icon: Bell,
          tone: "slate" as const,
        }
      : null,
    moduleOn(caps, "homework")
      ? {
          href: "/homework",
          label: "Homework",
          hint: "Assignments and due dates",
          icon: BookOpen,
          tone: "amber" as const,
        }
      : null,
    moduleOn(caps, "fees", true)
      ? {
          href: "/fees",
          label: "Fees",
          hint: "Dues and payment history",
          icon: Wallet,
          tone: "green" as const,
        }
      : null,
    {
      href: "/profile",
      label: "Profile",
      hint: "Account, bus stop, leave",
      icon: GraduationCap,
      tone: "blue" as const,
    },
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <PhoneShell title="More" subtitle="All school tools">
      <ul className="more-list">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="more-row">
              <AppIcon icon={item.icon} tone={item.tone} size={18} />
              <span className="grow">
                <span className="more-row-title">{item.label}</span>
                <span className="more-row-hint">{item.hint}</span>
              </span>
              <span className="more-row-chev" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
