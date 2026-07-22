"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import {
  Home,
  BookOpen,
  CalendarCheck,
  Wallet,
  Megaphone,
  Bell,
  Sparkles,
  LogOut,
} from "@/components/Icons";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/homework", label: "Homework", icon: BookOpen },
  { to: "/attendance", label: "Attend", icon: CalendarCheck },
  { to: "/fees", label: "Fees", icon: Wallet },
  { to: "/circulars", label: "Circulars", icon: Megaphone },
] as const;

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  headerAccent?: "primary" | "plain";
  rightSlot?: ReactNode;
}

export function PhoneShell({
  children,
  title,
  subtitle,
  showHeader = true,
  headerAccent = "primary",
  rightSlot,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isPrimary = headerAccent === "primary";
  const { user, ready, logout } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace("/auth");
  }, [ready, user, router]);

  if (!ready || !user) return <div className="app-shell" />;

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
            <div className="row" style={{ gap: "0.5rem" }}>
              {rightSlot ?? (
                <>
                  <Link
                    href="/ai"
                    aria-label="AI Assistant"
                    className={`icon-btn ${isPrimary ? "on-primary" : "muted"}`}
                  >
                    <Sparkles size={18} />
                  </Link>
                  <button
                    aria-label="Notifications"
                    className={`icon-btn relative ${isPrimary ? "on-primary" : "muted"}`}
                  >
                    <Bell size={18} />
                    <span className="dot-warn" />
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      router.replace("/auth");
                    }}
                    aria-label="Sign out"
                    title={`Sign out (${user.name})`}
                    className={`icon-btn ${isPrimary ? "on-primary" : "muted"}`}
                  >
                    <LogOut size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main
        className={`page-main page-x ${showHeader ? "" : "safe-top"}`}
      >
        {children}
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav-inner safe-bottom">
          <ul className="bottom-nav-list">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active =
                to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    href={to}
                    className={`bottom-nav-link ${active ? "active" : ""}`}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                    <span className="bottom-nav-indicator" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
