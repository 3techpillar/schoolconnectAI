import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, CalendarCheck, Wallet, Megaphone, Bell, Sparkles, LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";


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

export function PhoneShell({ children, title, subtitle, showHeader = true, headerAccent = "primary", rightSlot }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPrimary = headerAccent === "primary";
  const navigate = useNavigate();
  const { user, ready, logout } = useAuth();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user]);

  if (!ready || !user) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {showHeader && (
        <header
          className={
            isPrimary
              ? "bg-primary text-primary-foreground safe-top page-x header-bottom rounded-b-[28px] shadow-sm"
              : "bg-background safe-top page-x header-bottom border-b border-border"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {subtitle && (
                <p className={`text-[11px] font-medium ${isPrimary ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {subtitle}
                </p>
              )}
              {title && (
                <h1 className={`mt-0.5 text-[22px] font-semibold tracking-tight truncate ${isPrimary ? "text-primary-foreground" : "text-foreground"}`}>
                  {title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {rightSlot ?? (
                <>
                  <Link
                    to="/ai"
                    aria-label="AI Assistant"
                    className={`grid place-items-center h-10 w-10 rounded-full transition ${
                      isPrimary ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25" : "bg-muted text-foreground hover:bg-accent"
                    }`}
                  >
                    <Sparkles className="h-[18px] w-[18px]" />
                  </Link>
                  <button
                    aria-label="Notifications"
                    className={`relative grid place-items-center h-10 w-10 rounded-full transition ${
                      isPrimary ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25" : "bg-muted text-foreground hover:bg-accent"
                    }`}
                  >
                    <Bell className="h-[18px] w-[18px]" />
                    <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-warning" />
                  </button>
                  <button
                    onClick={() => logout()}
                    aria-label="Sign out"
                    title={`Sign out (${user.name})`}
                    className={`grid place-items-center h-10 w-10 rounded-full transition ${
                      isPrimary ? "bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25" : "bg-muted text-foreground hover:bg-accent"
                    }`}
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 page-x page-top ${showHeader ? "" : "safe-top"} safe-bottom-main`}>{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-md">
        <div className="mx-3 mb-3 rounded-2xl bg-surface/95 backdrop-blur border border-border shadow-soft safe-bottom">
          <ul className="grid grid-cols-5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "stroke-[2.25]" : ""}`} />
                    <span className="leading-none">{label}</span>
                    <span className={`h-0.5 w-4 rounded-full mt-0.5 ${active ? "bg-primary" : "bg-transparent"}`} />
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
