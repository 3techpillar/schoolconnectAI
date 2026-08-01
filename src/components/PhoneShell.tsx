"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth, isSchoolAdmin } from "@/lib/providers/auth";
import { needsEnrollmentApproval } from "@/lib/providers/enrollment";
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
} from "@/components/Icons";
import { LoadingBlock } from "@/components/StatusUI";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerAccent?: "primary" | "plain";
  rightSlot?: ReactNode;
  hideNav?: boolean;
}

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
  const { user, ready } = useAuth();
  const { unreadNotifications, unreadChats, canPostAsTeacher } = useSchoolData();

  const isFamily = isFamilyRole(user?.role);
  const isTeacher = canPostAsTeacher(user);
  const isAdmin = isSchoolAdmin(user);

  const NAV = isFamily
    ? ([
        { to: "/", label: "Home", icon: Home },
        { to: "/chats", label: "Chats", icon: MessageCircle },
        { to: "/homework", label: "Homework", icon: BookOpen },
        { to: "/engage", label: "Zone", icon: Sparkles },
        { to: "/fees", label: "Fees", icon: Wallet },
      ] as const)
    : isAdmin
      ? ([
          { to: "/", label: "Home", icon: Home },
          { to: "/admin", label: "Admin", icon: ShieldCheck },
          { to: "/chats", label: "Chats", icon: MessageCircle },
          { to: "/circulars", label: "Notice", icon: Bell },
          { to: "/fees", label: "Fees", icon: Wallet },
        ] as const)
    : isTeacher
      ? ([
          { to: "/", label: "Home", icon: Home },
          { to: "/class", label: "Class", icon: GraduationCap },
          { to: "/chats", label: "Chats", icon: MessageCircle },
          { to: "/homework", label: "Homework", icon: BookOpen },
          { to: "/attendance", label: "Attend", icon: CalendarCheck },
        ] as const)
      : ([
          { to: "/", label: "Home", icon: Home },
          { to: "/chats", label: "Chats", icon: MessageCircle },
          { to: "/homework", label: "Homework", icon: BookOpen },
          { to: "/attendance", label: "Attend", icon: CalendarCheck },
          { to: "/fees", label: "Fees", icon: Wallet },
        ] as const);

  useEffect(() => {
    if (ready && !user) router.replace("/auth");
  }, [ready, user, router]);

  useEffect(() => {
    if (!ready || !user) return;
    const allowedWhilePending = ["/pending", "/profile", "/auth"];
    if (
      needsEnrollmentApproval(user) &&
      !allowedWhilePending.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      )
    ) {
      router.replace("/pending");
    }
  }, [ready, user, pathname, router]);

  if (!ready || !user) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening…" />
      </div>
    );
  }

  const pending = needsEnrollmentApproval(user);
  const navItems = pending
    ? ([
        { to: "/pending", label: "Status", icon: ShieldCheck },
        { to: "/profile", label: "Profile", icon: GraduationCap },
      ] as const)
    : NAV;

  return (
    <div className="app-shell">
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
                    className={`icon-btn relative ${isPrimary ? "on-primary" : "muted"}`}
                  >
                    <Bell size={18} />
                    {unreadNotifications > 0 && <span className="dot-warn" />}
                  </Link>
                  <Link
                    href="/profile"
                    aria-label="Profile"
                    title={user.name}
                    className={`icon-btn ${isPrimary ? "on-primary" : "muted"}`}
                    style={{ fontSize: 12, fontWeight: 800 }}
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
                pending
                  ? { gridTemplateColumns: "repeat(2, 1fr)" }
                  : undefined
              }
            >
              {navItems.map(({ to, label, icon: Icon }) => {
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
                        <Icon size={20} />
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
