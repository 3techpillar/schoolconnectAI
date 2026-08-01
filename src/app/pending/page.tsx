"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/PhoneShell";
import { ROLE_LABEL, useAuth } from "@/lib/providers/auth";
import {
  hasFullAppAccess,
  useEnrollment,
} from "@/lib/providers/enrollment";
import { Clock, LogOut, ShieldCheck } from "@/components/Icons";

export default function PendingAccessPage() {
  const { user, ready, logout, refreshUser } = useAuth();
  const { ensureStudentEnrollment, enrollments, ready: enReady } =
    useEnrollment();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !user) return;
    if (hasFullAppAccess(user)) {
      router.replace("/");
      return;
    }
    if (user.role === "student" && enReady) {
      ensureStudentEnrollment(user);
    }
  }, [ready, user, enReady, ensureStudentEnrollment, router]);

  useEffect(() => {
    const t = window.setInterval(() => refreshUser(), 4000);
    return () => window.clearInterval(t);
  }, [refreshUser]);

  if (!ready || !user) return <div className="app-shell" />;

  const mine = enrollments.find(
    (e) =>
      e.studentUserId === user.id ||
      (e.identifier && e.identifier === user.identifier),
  );

  const rejected = user.enrollmentStatus === "rejected";

  return (
    <PhoneShell
      title="Awaiting approval"
      subtitle={ROLE_LABEL[user.role]}
      hideNav
      rightSlot={
        <button
          type="button"
          className="icon-btn on-primary"
          aria-label="Sign out"
          onClick={() => {
            logout();
            router.replace("/auth");
          }}
        >
          <LogOut size={18} />
        </button>
      }
    >
      <section className="card card-pad pending-card">
        <div className="pending-icon">
          {rejected ? <ShieldCheck size={28} /> : <Clock size={28} />}
        </div>
        <h2 className="font-semibold text-15" style={{ margin: "0.75rem 0 0" }}>
          {rejected
            ? "Enrollment was not approved"
            : "Registration received — access limited"}
        </h2>
        <p className="text-sm muted" style={{ margin: "0.5rem 0 0" }}>
          {user.role === "student"
            ? "You can sign in, but full SchoolConnect features unlock only after your class teacher or school admin approves your class & section enrollment."
            : "Your staff account is waiting for school admin approval (or complete signup with a valid invite code)."}
        </p>

        <div className="pending-meta mt-3">
          <p className="text-11 muted" style={{ margin: 0 }}>
            Name
          </p>
          <p className="text-sm font-semibold" style={{ margin: 0 }}>
            {user.name}
          </p>
          <p className="text-11 muted" style={{ margin: "8px 0 0" }}>
            School · Class
          </p>
          <p className="text-sm font-semibold" style={{ margin: 0 }}>
            {user.school}
            {user.className ? ` · ${user.className}` : ""}
          </p>
          {mine && (
            <>
              <p className="text-11 muted" style={{ margin: "8px 0 0" }}>
                Enrollment
              </p>
              <p className="text-sm font-semibold" style={{ margin: 0 }}>
                {mine.className} · Section {mine.section} ·{" "}
                <span className={`leave-badge leave-${mine.status}`}>
                  {mine.status}
                </span>
              </p>
            </>
          )}
        </div>

        <p className="text-11 muted mt-3" style={{ marginBottom: 0 }}>
          Ask your class teacher or school admin to open{" "}
          <strong>Admin → Enroll</strong> or <strong>Class desk</strong> and
          approve you. This page refreshes automatically.
        </p>

        <div className="row mt-3" style={{ gap: 8 }}>
          <Link href="/profile" className="btn-secondary grow">
            Profile
          </Link>
          <button
            type="button"
            className="btn-primary grow"
            onClick={() => refreshUser()}
          >
            Check again
          </button>
        </div>
      </section>
    </PhoneShell>
  );
}
