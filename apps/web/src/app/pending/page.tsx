"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { ROLE_LABEL, useAuth } from "@/lib/providers/auth";
import {
  hasFullAppAccess,
  needsSchoolAssignment,
  useEnrollment,
} from "@/lib/providers/enrollment";
import { AlertCircle, Clock, LogOut, School, ShieldCheck } from "@/components/shell/Icons";
import { LoadingBlock } from "@/components/shell/StatusUI";

export default function PendingAccessPage() {
  const { user, ready, backend, logout, refreshUser } = useAuth();
  const { ensureStudentEnrollment, enrollments, ready: enReady } =
    useEnrollment();
  const router = useRouter();

  const noSchool = needsSchoolAssignment(user, backend);

  useEffect(() => {
    if (!ready || !user) return;
    if (hasFullAppAccess(user, backend)) {
      router.replace("/");
      return;
    }
    if (!noSchool && user.role === "student" && enReady) {
      ensureStudentEnrollment(user);
    }
  }, [
    ready,
    user,
    backend,
    enReady,
    ensureStudentEnrollment,
    router,
    noSchool,
  ]);

  useEffect(() => {
    if (noSchool) return;
    const t = window.setInterval(() => refreshUser(), 4000);
    return () => window.clearInterval(t);
  }, [refreshUser, noSchool]);

  if (!ready || !user) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Checking access…" splash />
      </div>
    );
  }

  const mine = enrollments.find(
    (e) =>
      e.studentUserId === user.id ||
      (e.identifier && e.identifier === user.identifier),
  );

  const rejected = user.enrollmentStatus === "rejected";

  return (
    <PhoneShell
      title={noSchool ? "School required" : "Awaiting approval"}
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
      {noSchool ? (
        <section className="card card-pad pending-card pending-card-alert">
          <div className="pending-hero">
            <div className="pending-icon pending-icon-alert">
              <School size={32} />
            </div>
            <p className="pending-kicker">Action needed</p>
            <h2 className="pending-title">No school linked to your account</h2>
            <p className="pending-lead">
              SchoolConnect needs a school on your profile before home, chats,
              homework, fees, or bus can load. You are signed in safely — nothing
              is broken on your side.
            </p>
          </div>

          <div className="pending-meta mt-3">
            <p className="text-11 muted" style={{ margin: 0 }}>
              Signed in as
            </p>
            <p className="text-sm font-semibold" style={{ margin: 0 }}>
              {user.name}
            </p>
            <p className="text-11 muted" style={{ margin: "8px 0 0" }}>
              Role
            </p>
            <p className="text-sm font-semibold" style={{ margin: 0 }}>
              {ROLE_LABEL[user.role]}
            </p>
            <p className="text-11 muted" style={{ margin: "8px 0 0" }}>
              School
            </p>
            <p className="text-sm font-semibold" style={{ margin: 0 }}>
              <span className="pending-missing">Not assigned</span>
            </p>
          </div>

          <div className="pending-steps mt-3">
            <div className="pending-step">
              <AlertCircle size={16} />
              <span>
                Ask your school admin to link{" "}
                <strong>{user.identifier}</strong> to the correct school (and
                class, if you are a student).
              </span>
            </div>
            <div className="pending-step">
              <ShieldCheck size={16} />
              <span>
                After they assign a school, tap <strong>Check again</strong> —
                full access unlocks automatically.
              </span>
            </div>
          </div>

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
          <button
            type="button"
            className="btn-secondary grow mt-2"
            onClick={() => {
              logout();
              router.replace("/auth");
            }}
          >
            Sign out
          </button>
        </section>
      ) : (
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
              : "Your join request was sent to the school admin. Full features unlock after they approve you in Admin → Users (or when you register with a valid invite code)."}
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
              {user.school || "—"}
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
            {user.role === "student"
              ? "Ask your class teacher or school admin to open Admin → Enroll or Class desk and approve you."
              : "Ask school admin to open Admin → Users and tap Approve access."}{" "}
            This page refreshes automatically.
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
      )}
    </PhoneShell>
  );
}
