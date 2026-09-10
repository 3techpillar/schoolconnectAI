"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth, isSchoolAdmin } from "@/lib/providers/auth";
import {
  isLimitedAccessPath,
  needsEnrollmentApproval,
  needsSchoolAssignment,
} from "@/lib/providers/enrollment";
import { useSchoolData } from "@/lib/providers/school-data";
import { isFamilyRole } from "@/lib/shared/roles";
import {
  Home,
  BookOpen,
  CalendarCheck,
  MessageCircle,
  Wallet,
  Bell,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  Menu,
} from "@/components/shell/Icons";
import { AppIcon, type AppIconTone } from "@/components/shell/AppIcon";
import { LoadingBlock } from "@/components/shell/StatusUI";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerAccent?: "primary" | "plain";
  rightSlot?: ReactNode;
  hideNav?: boolean;
}

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  tone: AppIconTone;
};

export function PhoneShell({
  children,
  title,
  subtitle,
  showHeader = true,
  headerAccent = "primary",
  rightSlot,
  hideNav = false,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isPrimary = headerAccent === "primary";
  const { user, ready, backend } = useAuth();
  const { unreadNotifications, unreadChats, canPostAsTeacher } = useSchoolData();

  const isFamily = isFamilyRole(user?.role);
  const isTeacher = canPostAsTeacher(user);
  const isAdmin = isSchoolAdmin(user) || user?.role === "principal";
  const needsSetup =
    needsSchoolAssignment(user, backend) || needsEnrollmentApproval(user);
  const showFees = Boolean(user?.capabilities?.fees);

  const NAV: NavItem[] = (
    isFamily
      ? [
          { to: "/", label: "Home", icon: Home, tone: "blue" as const },
          { to: "/chats", label: "Chats", icon: MessageCircle, tone: "teal" as const },
          { to: "/homework", label: "Homework", icon: BookOpen, tone: "amber" as const },
          { to: "/engage", label: "Zone", icon: Sparkles, tone: "yellow" as const },
          { to: "/more", label: "More", icon: Menu, tone: "slate" as const },
        ]
      : isAdmin
        ? [
            { to: "/", label: "Home", icon: Home, tone: "blue" as const },
            { to: "/admin", label: "Admin", icon: ShieldCheck, tone: "slate" as const },
            { to: "/chats", label: "Chats", icon: MessageCircle, tone: "teal" as const },
            { to: "/circulars", label: "Notice", icon: Bell, tone: "orange" as const },
            ...(showFees
              ? [{ to: "/fees", label: "Fees", icon: Wallet, tone: "green" as const }]
              : [{ to: "/class", label: "Class", icon: GraduationCap, tone: "teal" as const }]),
          ]
        : isTeacher
          ? [
              { to: "/", label: "Home", icon: Home, tone: "blue" as const },
              { to: "/class", label: "Class", icon: GraduationCap, tone: "teal" as const },
              { to: "/chats", label: "Chats", icon: MessageCircle, tone: "teal" as const },
              {
                to: "/homework",
                label: "Homework",
                icon: BookOpen,
                tone: "green" as const,
              },
              {
                to: "/attendance",
                label: "Attend",
                icon: CalendarCheck,
                tone: "orange" as const,
              },
            ]
          : [
              { to: "/", label: "Home", icon: Home, tone: "blue" as const },
              { to: "/chats", label: "Chats", icon: MessageCircle, tone: "teal" as const },
              {
                to: "/homework",
                label: "Homework",
                icon: BookOpen,
                tone: "orange" as const,
              },
              {
                to: "/attendance",
                label: "Attend",
                icon: CalendarCheck,
                tone: "green" as const,
              },
              ...(showFees
                ? [{ to: "/fees", label: "Fees", icon: Wallet, tone: "teal" as const }]
                : [{ to: "/more", label: "More", icon: Menu, tone: "slate" as const }]),
            ]
  ) as NavItem[];

  useEffect(() => {
    if (ready && !user) router.replace("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user) return;
    if (needsSetup && !isLimitedAccessPath(pathname)) {
      router.replace("/pending");
    }
  }, [ready, user, pathname, router, needsSetup]);

  if (!ready || !user) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening SchoolConnect…" splash />
      </div>
    );
  }

  const navItems: NavItem[] = needsSetup
    ? [
        { to: "/pending", label: "Status", icon: ShieldCheck, tone: "amber" },
        { to: "/profile", label: "Profile", icon: GraduationCap, tone: "blue" },
      ]
    : NAV;

  return (
    <div className="app-shell" data-role={user.role}>
      {showHeader && (
        <header
          className={`${isPrimary ? "header-primary" : "header-plain"} safe-top page-x`}
        >
          <div className="header-row">
            <div className="grow">
              {subtitle && <p className="header-sub">{subtitle}</p>}
              {title && <h1 className="header-title">{title}</h1>}
            </div>
            <div className="row" style={{ gap: "0.35rem" }}>
              {rightSlot ?? (
                <>
                  <Link
                    href="/notifications"
                    aria-label={
                      unreadNotifications > 0
                        ? `${unreadNotifications} notifications`
                        : "Notifications"
                    }
                    className={`icon-btn relative ${isPrimary ? "on-primary" : "muted"}${unreadNotifications > 0 ? " has-alert" : ""}`}
                    style={{
                      background: isPrimary
                        ? "rgba(255, 255, 255, 0.18)"
                        : "var(--surface)",
                      border: isPrimary
                        ? "1px solid rgba(255, 255, 255, 0.25)"
                        : "1px solid var(--border)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Bell size={18} />
                    {unreadNotifications > 0 && <span className="dot-warn" />}
                  </Link>
                  <Link
                    href="/profile"
                    aria-label="Profile"
                    title={user.name}
                    className={`icon-btn ${isPrimary ? "on-primary" : "muted"}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      background: isPrimary
                        ? "rgba(255, 255, 255, 0.25)"
                        : "linear-gradient(135deg, #dbeafe, #eff6ff)",
                      color: isPrimary ? "#ffffff" : "var(--primary)",
                      border: isPrimary
                        ? "1.5px solid rgba(255, 255, 255, 0.4)"
                        : "1.5px solid rgba(37, 99, 235, 0.25)",
                      boxShadow: isPrimary
                        ? "0 2px 8px rgba(0, 0, 0, 0.1)"
                        : "0 2px 6px rgba(37, 99, 235, 0.12)",
                    }}
                  >
                    {(user.name || "?").charAt(0).toUpperCase()}
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main
        className={`page-main page-x ${showHeader ? "" : "safe-top"} ${hideNav ? "page-main-flush" : ""}`}
      >
        {children}
      </main>

      {!hideNav && (
        <nav className="bottom-nav">
          <div className="bottom-nav-inner safe-bottom">
            <ul
              className="bottom-nav-list"
              style={
                needsSetup
                  ? { gridTemplateColumns: "repeat(2, 1fr)" }
                  : undefined
              }
            >
              {navItems.map(({ to, label, icon, tone }) => {
                const active =
                  to === "/" ? pathname === "/" : pathname.startsWith(to);
                const showBadge = to === "/chats" && unreadChats > 0;
                return (
                  <li key={to}>
                    <Link
                      href={to}
                      className={`bottom-nav-link ${active ? "active" : ""}`}
                    >
                      <span className="relative" style={{ display: "grid" }}>
                        <AppIcon
                          icon={icon}
                          tone={tone}
                          size={18}
                          active={active}
                          pulse={showBadge}
                        />
                        {showBadge && (
                          <span className="nav-badge">{unreadChats}</span>
                        )}
                      </span>
                      <span>{label}</span>
                      <span className="bottom-nav-indicator" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
