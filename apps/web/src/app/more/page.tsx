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
  CheckCircle2,
  FileText,
  GraduationCap,
  Megaphone,
  School,
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

type MenuItem = {
  href: string;
  label: string;
  hint: string;
  icon: typeof Bus;
  tone: AppIconTone;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

export default function MorePage() {
  const { user } = useAuth();
  if (!user) return null;

  const caps = user.capabilities as Record<string, boolean> | undefined;

  // 1. Academic & Learning
  const academicItems: MenuItem[] = [
    moduleOn(caps, "homework")
      ? {
          href: "/homework",
          label: "Homework & Tasks",
          hint: "Assignments, submissions and due dates",
          icon: BookOpen,
          tone: "amber" as const,
        }
      : null,
    {
      href: "/engage",
      label: "Learning Zone",
      hint: "Quizzes, streaks and daily XP rewards",
      icon: Sparkles,
      tone: "yellow" as const,
    },
    {
      href: "/report",
      label: "Academic Report",
      hint: "Report card snapshot and subject performance",
      icon: FileText,
      tone: "teal" as const,
    },
  ].filter((i): i is MenuItem => Boolean(i));

  // 2. School Operations & Transport
  const operationItems: MenuItem[] = [
    moduleOn(caps, "bus")
      ? {
          href: "/bus",
          label: "Live Bus Tracker",
          hint: "Real-time GPS map, live ETA and pickup alerts",
          icon: Bus,
          tone: "blue" as const,
        }
      : null,
    moduleOn(caps, "attendance")
      ? {
          href: "/attendance",
          label: "Attendance & Leaves",
          hint: "Monthly calendar, attendance log and leave requests",
          icon: CalendarCheck,
          tone: "green" as const,
        }
      : null,
    moduleOn(caps, "fees", true)
      ? {
          href: "/fees",
          label: "Fees & Payments",
          hint: "Pending dues, fee invoices and digital receipts",
          icon: Wallet,
          tone: "green" as const,
        }
      : null,
  ].filter((i): i is MenuItem => Boolean(i));

  // 3. Notices & Broadcasts
  const noticeItems: MenuItem[] = [
    moduleOn(caps, "circulars")
      ? {
          href: "/circulars",
          label: "Circulars & Notices",
          hint: "Official school bulletins, holidays and events",
          icon: Megaphone,
          tone: "orange" as const,
        }
      : null,
    moduleOn(caps, "notifications")
      ? {
          href: "/notifications",
          label: "Notification Alerts",
          hint: "Push updates, urgent notices and reminders",
          icon: Bell,
          tone: "slate" as const,
        }
      : null,
  ].filter((i): i is MenuItem => Boolean(i));

  // 4. Role-specific staff controls
  const staffItems: MenuItem[] = [
    user.role === "class_teacher"
      ? {
          href: "/class",
          label: "Teacher Class Desk",
          hint: "Daily roll call, homework assigner and diary",
          icon: CheckCircle2,
          tone: "blue" as const,
        }
      : null,
    user.role === "admin" || user.role === "super_admin"
      ? {
          href: "/erp",
          label: "Desktop School ERP",
          hint: "Administrative suite, students, fees & staff",
          icon: School,
          tone: "purple" as const,
        }
      : null,
  ].filter((i): i is MenuItem => Boolean(i));

  // 5. Account
  const accountItems: MenuItem[] = [
    {
      href: "/profile",
      label: "My Profile & Account",
      hint: "User details, child switcher, bus stop & leaves",
      icon: GraduationCap,
      tone: "blue" as const,
    },
  ];

  const sections: MenuSection[] = [
    { title: "Academics & Learning", items: academicItems },
    { title: "Operations & Transport", items: operationItems },
    { title: "Communications", items: noticeItems },
    ...(staffItems.length > 0 ? [{ title: "Staff & Management", items: staffItems }] : []),
    { title: "Account & Preferences", items: accountItems },
  ].filter((s) => s.items.length > 0);

  return (
    <PhoneShell title="More" subtitle="All school tools & services">
      <div className="more-directory">
        {sections.map((sec) => (
          <div key={sec.title} className="more-group">
            <span className="more-group-title">{sec.title}</span>
            <div className="more-group-card">
              {sec.items.map((item) => (
                <Link key={item.href} href={item.href} className="more-row">
                  <AppIcon icon={item.icon} tone={item.tone} size={18} />
                  <span className="grow">
                    <span className="more-row-title">{item.label}</span>
                    <span className="more-row-hint">{item.hint}</span>
                  </span>
                  <span className="more-row-chev" aria-hidden>
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}
