"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { useStudentEngage } from "@/lib/providers/student-engage";
import { apiFetch } from "@/lib/shared/api-client";
import {
  CalendarCheck,
  FileText,
  Sparkles,
  BookOpen,
} from "@/components/shell/Icons";
import { AppIcon } from "@/components/shell/AppIcon";
import { LoadingBlock } from "@/components/shell/StatusUI";

export default function FamilyReportPage() {
  const { user } = useAuth();
  const { homework } = useSchoolData();
  const engage = useStudentEngage();
  const [attendanceLabel, setAttendanceLabel] = useState<string>("—");
  const [attLoading, setAttLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setAttLoading(true);
    void apiFetch<{
      attendance?: { label?: string; hint?: string };
    }>("/api/attendance/summary")
      .then((res) => {
        if (cancelled) return;
        setAttendanceLabel(res.attendance?.label || "—");
      })
      .catch(() => {
        if (!cancelled) setAttendanceLabel("—");
      })
      .finally(() => {
        if (!cancelled) setAttLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (!user) return null;

  const subject =
    user.role === "parent" ? user.childName || "Your child" : user.name;
  const latest = user.classHistory?.[0];
  const pendingHw = homework.filter(
    (h) => h.status === "pending" || h.status === "in-progress",
  ).length;

  return (
    <PhoneShell
      title="Report"
      subtitle={`${subject} · ${user.className || "Class"}`}
    >
      <section className="card card-pad">
        <p className="text-11 muted" style={{ margin: 0 }}>
          Academic snapshot
        </p>
        <h2 className="font-semibold text-15" style={{ margin: "4px 0 0" }}>
          {subject}
        </h2>
        <p className="text-xs muted" style={{ margin: "6px 0 0" }}>
          {[
            user.school,
            user.className && `Class ${user.className}`,
            user.academicYear,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {user.role === "parent" && !user.childName ? (
          <p className="text-11 muted mt-2" style={{ marginBottom: 0 }}>
            Link a child on{" "}
            <Link href="/profile" className="tone-primary font-semibold">
              Profile
            </Link>{" "}
            for a named report.
          </p>
        ) : null}
      </section>

      <section className="stats-grid mt-3">
        <Link href="/attendance" className="stat-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={CalendarCheck} tone="green" size={16} />
            <p className="text-xs muted">Attendance</p>
          </div>
          {attLoading ? (
            <LoadingBlock label="…" />
          ) : (
            <p className="stat-value">{attendanceLabel}</p>
          )}
          <p className="text-11 muted mt-1">This month · calendar</p>
        </Link>
        <Link href="/engage" className="stat-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={Sparkles} tone="yellow" size={16} />
            <p className="text-xs muted">Progress</p>
          </div>
          <p className="stat-value">Lv {engage.level}</p>
          <p className="text-11 muted mt-1">
            {engage.xp} XP · {engage.streak}-day streak
          </p>
        </Link>
        <Link href="/homework" className="stat-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={BookOpen} tone="blue" size={16} />
            <p className="text-xs muted">Homework</p>
          </div>
          <p className="stat-value">{pendingHw}</p>
          <p className="text-11 muted mt-1">Active assignments</p>
        </Link>
        <div className="stat-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={FileText} tone="teal" size={16} />
            <p className="text-xs muted">Term result</p>
          </div>
          <p className="stat-value" style={{ textTransform: "capitalize" }}>
            {latest?.result || "Pending"}
          </p>
          <p className="text-11 muted mt-1">
            {latest?.sessionLabel || "Current session"}
            {latest?.className ? ` · ${latest.className}` : ""}
          </p>
        </div>
      </section>

      {(user.classHistory || []).length > 0 ? (
        <section className="card card-pad mt-3">
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Class history
          </p>
          <ul className="mt-2" style={{ margin: 0, paddingLeft: 18 }}>
            {user.classHistory!.map((row, i) => (
              <li
                key={`${row.sessionId}-${i}`}
                className="text-xs muted"
                style={{ marginTop: 6 }}
              >
                {row.sessionLabel} · {row.className} · {row.result}
                {row.promotedTo ? ` → ${row.promotedTo}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card card-pad mt-3">
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Class history
          </p>
          <p className="text-11 muted mt-2" style={{ marginBottom: 0 }}>
            History appears after promotions or ERP session updates.
          </p>
        </section>
      )}
    </PhoneShell>
  );
}
