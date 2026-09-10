"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/providers/auth";
import { canAccessErpConsole } from "@schoolconnect/shared";
import { LoadingBlock } from "@/components/shell/StatusUI";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { href: "/erp", label: "Dashboard", exact: true },
      { href: "/erp/schools", label: "Schools & Licensing" },
      { href: "/erp/overview", label: "Circulars & Homework" },
      { href: "/erp/audit", label: "Audit Log" },
    ],
  },
  {
    title: "Students & Staff",
    items: [
      { href: "/erp/admissions", label: "Admissions Pipeline" },
      { href: "/erp/students", label: "Student SIS" },
      { href: "/erp/staff", label: "Staff Directory" },
      { href: "/erp/links", label: "Parent-Student Links" },
      { href: "/erp/transfers", label: "Branch Transfers" },
    ],
  },
  {
    title: "Academics",
    items: [
      { href: "/erp/classes", label: "Classes & Sections" },
      { href: "/erp/subjects", label: "Subjects Catalog" },
      { href: "/erp/timetable", label: "Timetable Schedule" },
      { href: "/erp/exams", label: "Exams & Marks" },
      { href: "/erp/report-cards", label: "Report Cards" },
      { href: "/erp/sessions", label: "Academic Sessions" },
    ],
  },
  {
    title: "Operations & Finance",
    items: [
      { href: "/erp/attendance", label: "Attendance Analytics" },
      { href: "/erp/leaves", label: "Leave Requests" },
      { href: "/erp/fees", label: "Fee Management" },
      { href: "/erp/id-cards", label: "ID Card Studio" },
    ],
  },
];

export function ErpShell({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed =
    !!user &&
    canAccessErpConsole(user.role, { productMode: user.productMode });

  useEffect(() => {
    if (ready && !user) {
      router.replace("/auth");
      return;
    }
    if (ready && user && !allowed) {
      router.replace("/admin");
    }
  }, [ready, user, allowed, router]);

  if (!ready || !user) {
    return (
      <div className="erp-boot">
        <LoadingBlock label="Loading ERP…" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="erp-boot">
        <p className="text-sm muted">
          ERP is not enabled for this school (Connect mode). Ask Super Admin to
          upgrade product mode, or use mobile Admin.
        </p>
        <Link href="/admin" className="tone-primary font-semibold">
          Back to Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="erp-shell">
      <aside className="erp-sidebar">
        <div className="erp-brand">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <p className="erp-brand-kicker">SchoolConnect</p>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(16, 185, 129, 0.2)",
                color: "#6ee7b7",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              ERP Active
            </span>
          </div>
          <h1 className="erp-brand-title">Management</h1>
          <p className="erp-brand-sub" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            {user.school || "Platform Office"}
          </p>
        </div>

        <nav className="erp-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="erp-nav-group" style={{ marginBottom: "0.85rem" }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255, 255, 255, 0.5)",
                  margin: "0 0 0.4rem 0.5rem",
                }}
              >
                {group.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`erp-nav-link ${active ? "active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="erp-sidebar-foot">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.18)",
                border: "1.5px solid rgba(255, 255, 255, 0.35)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255, 255, 255, 0.65)", textTransform: "capitalize" }}>
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <Link
              href="/"
              className="erp-nav-link"
              style={{ flex: 1, textAlign: "center", fontSize: 11, padding: "6px 8px", background: "rgba(255, 255, 255, 0.08)" }}
            >
              Family app
            </Link>
            <Link
              href="/admin"
              className="erp-nav-link"
              style={{ flex: 1, textAlign: "center", fontSize: 11, padding: "6px 8px", background: "rgba(255, 255, 255, 0.08)" }}
            >
              Admin desk
            </Link>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="erp-nav-link"
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#fca5a5",
              marginTop: 2,
              padding: "5px 8px",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="erp-main">{children}</main>
    </div>
  );
}
