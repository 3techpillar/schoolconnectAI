"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
import { ROLE_LABEL, useAuth } from "@/lib/auth";
import {
  formatLeaveRange,
  useLeaves,
  type LeaveStatus,
} from "@/lib/leaves";
import { toIsoDate } from "@/lib/dates";
import { CalendarCheck, ShieldCheck } from "@/components/Icons";

export default function ProfilePage() {
  const { user } = useAuth();
  const { ready, applyLeave, myLeaves, leaves } = useLeaves();
  const [fromDate, setFromDate] = useState(toIsoDate());
  const [toDate, setToDate] = useState(toIsoDate());
  const [reason, setReason] = useState("");
  const [studentName, setStudentName] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const history = useMemo(() => {
    if (!user) return [];
    const mine = myLeaves(user.id);
    if (mine.length) return mine;
    // Demo seed visible for parents until they apply their own
    if (user.role === "parent" || user.role === "student") {
      return leaves.filter(
        (l) =>
          l.applicantId === "seed-parent" ||
          (user.childName &&
            l.studentName.toLowerCase() === user.childName.toLowerCase()) ||
          l.studentName.toLowerCase() === user.name.toLowerCase(),
      );
    }
    return mine;
  }, [user, myLeaves, leaves]);

  if (!user || !ready) return <div className="app-shell" />;

  const canApply =
    user.role === "parent" ||
    user.role === "student" ||
    user.role === "class_teacher";

  const onApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !fromDate || !toDate) return;
    const name =
      studentName.trim() ||
      user.childName ||
      (user.role === "student" ? user.name : user.name);
    applyLeave({
      user,
      studentName: name,
      fromDate,
      toDate: toDate < fromDate ? fromDate : toDate,
      reason,
    });
    setReason("");
    setFlash("Leave submitted — waiting for teacher / admin approval.");
  };

  return (
    <PhoneShell subtitle={ROLE_LABEL[user.role]} title="Profile">
      <section className="card card-pad row">
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="grow">
          <p className="font-semibold text-15" style={{ margin: 0 }}>
            {user.name}
          </p>
          <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
            {user.identifier} · {user.school}
          </p>
          {(user.className || user.childName) && (
            <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
              {user.childName ? `Child: ${user.childName}` : ""}
              {user.childName && user.className ? " · " : ""}
              {user.className ? `Class ${user.className}` : ""}
            </p>
          )}
        </div>
      </section>

      <div className="row mt-3" style={{ gap: 8 }}>
        <Link href="/attendance" className="btn-secondary grow">
          Attendance & leaves
        </Link>
      </div>

      {canApply && (
        <form className="card card-pad mt-4 space-y" onSubmit={onApply}>
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Apply for leave
          </p>
          <p className="text-11 muted" style={{ margin: 0 }}>
            Approved leave marks those days as Leave (L) on the attendance
            calendar.
          </p>
          {(user.role === "parent" || user.role === "class_teacher") && (
            <label>
              <span className="text-xs font-medium muted">Student name</span>
              <input
                className="input"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={user.childName || "Aarav Sharma"}
              />
            </label>
          )}
          <div className="wa-meta-row">
            <label className="grow">
              <span className="text-xs font-medium muted">From</span>
              <input
                type="date"
                className="input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </label>
            <label className="grow">
              <span className="text-xs font-medium muted">To</span>
              <input
                type="date"
                className="input"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            <span className="text-xs font-medium muted">Reason</span>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Medical / family / travel"
              required
            />
          </label>
          {flash && (
            <p className="text-11 tone-success row" style={{ gap: 6, margin: 0 }}>
              <ShieldCheck size={14} /> {flash}
            </p>
          )}
          <button type="submit" className="btn-primary">
            Submit leave request
          </button>
        </form>
      )}

      <h2 className="section-label">Leave history</h2>
      <ul className="leave-list">
        {history.length === 0 && (
          <li className="card card-pad text-sm muted">No leave requests yet.</li>
        )}
        {history.map((l) => (
          <li key={l.id} className="card card-pad">
            <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
              <div className="grow">
                <p className="font-semibold text-sm" style={{ margin: 0 }}>
                  {l.studentName}
                </p>
                <p className="text-11 muted row" style={{ margin: "4px 0 0", gap: 4 }}>
                  <CalendarCheck size={12} />
                  {formatLeaveRange(l.fromDate, l.toDate)}
                </p>
              </div>
              <LeaveBadge status={l.status} />
            </div>
            <p className="text-xs" style={{ margin: "8px 0 0" }}>
              {l.reason}
            </p>
            <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
              Applied {new Date(l.appliedAt).toLocaleDateString()}
              {l.reviewedBy ? ` · ${l.status} by ${l.reviewedBy}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}

function LeaveBadge({ status }: { status: LeaveStatus }) {
  return <span className={`leave-badge leave-${status}`}>{status}</span>;
}
