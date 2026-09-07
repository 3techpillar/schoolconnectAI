"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/providers/auth";
import { canAccessErpConsole } from "@schoolconnect/shared";
import { LoadingBlock } from "@/components/shell/StatusUI";

const NAV = [
  { href: "/erp", label: "Dashboard", exact: true },
  { href: "/erp/schools", label: "Schools" },
  { href: "/erp/students", label: "Students" },
  { href: "/erp/classes", label: "Classes" },
  { href: "/erp/subjects", label: "Subjects" },
  { href: "/erp/timetable", label: "Timetable" },
  { href: "/erp/admissions", label: "Admissions" },
  { href: "/erp/attendance", label: "Attendance" },
  { href: "/erp/leaves", label: "Leaves" },
  { href: "/erp/exams", label: "Exams" },
  { href: "/erp/report-cards", label: "Report cards" },
  { href: "/erp/fees", label: "Fees" },
  { href: "/erp/staff", label: "Staff" },
  { href: "/erp/id-cards", label: "ID cards" },
  { href: "/erp/links", label: "Parent links" },
  { href: "/erp/transfers", label: "Transfers" },
  { href: "/erp/sessions", label: "Sessions" },
  { href: "/erp/overview", label: "Circulars / HW" },
  { href: "/erp/audit", label: "Audit" },
];

export function ErpShell({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
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
          <p className="erp-brand-kicker">SchoolConnect</p>
          <h1 className="erp-brand-title">ERP</h1>
          <p className="erp-brand-sub">{user.school || "Platform"}</p>
          {user.productMode ? (
            <p className="text-11 muted" style={{ margin: "0.25rem 0 0" }}>
              Mode: {user.productMode}
            </p>
          ) : null}
        </div>
        <nav className="erp-nav">
          {NAV.map((item) => {
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
        </nav>
        <div className="erp-sidebar-foot">
          <p className="text-11 muted" style={{ margin: 0 }}>
            {user.name} · {user.role}
          </p>
          <Link href="/" className="erp-nav-link">
            Family app
          </Link>
          <Link href="/admin" className="erp-nav-link">
            Mobile admin
          </Link>
        </div>
      </aside>
      <main className="erp-main">{children}</main>
    </div>
  );
}
