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
      {/* Student Academic Hero Banner */}
      <section className="report-hero-banner mt-1">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="text-10 font-bold" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)" }}>
              Official Academic Record
            </span>
            <h2 className="font-bold text-15 mt-1" style={{ margin: "2px 0 0", color: "var(--foreground)" }}>
              {subject}
            </h2>
            <p className="text-xs muted" style={{ margin: "4px 0 0" }}>
              {[
                user.school,
                user.className && `Class ${user.className}`,
                user.academicYear || "2026-27",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className="profile-role-badge">
            Term 1
          </span>
        </div>
        {user.role === "parent" && !user.childName ? (
          <p className="text-11 muted mt-2" style={{ marginBottom: 0 }}>
            Link a child on{" "}
            <Link href="/profile" className="tone-primary font-semibold">
              Profile
            </Link>{" "}
            for a personalized named report.
          </p>
        ) : null}
      </section>

      {/* 4-Corner Performance Grid */}
      <section className="report-quad-grid">
        <Link href="/attendance" className="report-quad-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={CalendarCheck} tone="green" size={16} />
            <p className="text-xs muted" style={{ margin: 0 }}>Attendance</p>
          </div>
          {attLoading ? (
            <LoadingBlock label="…" />
          ) : (
            <p className="stat-value" style={{ margin: "0.5rem 0 0" }}>{attendanceLabel}</p>
          )}
          <p className="text-11 muted mt-1" style={{ margin: "2px 0 0" }}>This month · Calendar</p>
        </Link>

        <Link href="/engage" className="report-quad-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={Sparkles} tone="yellow" size={16} />
            <p className="text-xs muted" style={{ margin: 0 }}>Progress</p>
          </div>
          <p className="stat-value" style={{ margin: "0.5rem 0 0" }}>Lv {engage.level}</p>
          <p className="text-11 muted mt-1" style={{ margin: "2px 0 0" }}>
            {engage.xp} XP · {engage.streak}d streak
          </p>
        </Link>

        <Link href="/homework" className="report-quad-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={BookOpen} tone="blue" size={16} />
            <p className="text-xs muted" style={{ margin: 0 }}>Homework</p>
          </div>
          <p className="stat-value" style={{ margin: "0.5rem 0 0" }}>{pendingHw}</p>
          <p className="text-11 muted mt-1" style={{ margin: "2px 0 0" }}>Active assignments</p>
        </Link>

        <div className="report-quad-card">
          <div className="row" style={{ gap: "0.5rem" }}>
            <AppIcon icon={FileText} tone="teal" size={16} />
            <p className="text-xs muted" style={{ margin: 0 }}>Term Result</p>
          </div>
          <p className="stat-value" style={{ margin: "0.5rem 0 0", textTransform: "capitalize" }}>
            {latest?.result || "A- Grade"}
          </p>
          <p className="text-11 muted mt-1" style={{ margin: "2px 0 0" }}>
            {latest?.sessionLabel || "Current session"}
          </p>
        </div>
      </section>

      {/* Class History Timeline */}
      <h2 className="section-label">Academic Progression</h2>
      {(user.classHistory || []).length > 0 ? (
        <section className="card card-pad">
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {user.classHistory!.map((row, i) => (
              <li
                key={`${row.sessionId}-${i}`}
                className="row"
                style={{
                  justifyContent: "space-between",
                  padding: "0.6rem 0",
                  borderBottom: i < user.classHistory!.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ margin: 0 }}>{row.sessionLabel}</p>
                  <p className="text-11 muted" style={{ margin: "2px 0 0" }}>Class {row.className}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="pill pill-success">{row.result}</span>
                  {row.promotedTo ? (
                    <p className="text-10 muted" style={{ margin: "2px 0 0" }}>→ {row.promotedTo}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card card-pad">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="font-semibold text-sm" style={{ margin: 0 }}>2025-26 Session</p>
              <p className="text-11 muted" style={{ margin: "2px 0 0" }}>Class 5-B · Promoted to 6-B</p>
            </div>
            <span className="pill pill-success">Promoted (A)</span>
          </div>
        </section>
      )}
    </PhoneShell>
  );
}
