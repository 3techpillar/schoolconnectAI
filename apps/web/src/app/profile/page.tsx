"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { ROLE_LABEL, useAuth } from "@/lib/providers/auth";
import {
  formatLeaveRange,
  useLeaves,
  type LeaveStatus,
} from "@/lib/providers/leaves";
import { useBusTrack } from "@/lib/providers/bus-track";
import { toIsoDate } from "@/lib/shared/dates";
import { Bus, CalendarCheck, FileText, LogOut, ShieldCheck } from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { ParentLinksPanel } from "@/components/ParentLinksPanel";

export default function ProfilePage() {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const router = useRouter();
  const { ready, applyLeave, myLeaves, leaves } = useLeaves();
  const bus = useBusTrack();
  const [fromDate, setFromDate] = useState(toIsoDate());
  const [toDate, setToDate] = useState(toIsoDate());
  const [reason, setReason] = useState("");
  const [studentName, setStudentName] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [accountFlash, setAccountFlash] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState("");
  const [childName, setChildName] = useState("");
  const [homeStopId, setHomeStopId] = useState("s3");
  const [alert10, setAlert10] = useState(true);
  const [alert5, setAlert5] = useState(true);
  const [parentAccess, setParentAccess] = useState<"guardian" | "student">("guardian");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setSchool(user.school);
    setClassName(user.className || "");
    setChildName(user.childName || "");
    setHomeStopId(user.homeStopId || "s3");
    setAlert10(user.busAlert10 !== false);
    setAlert5(user.busAlert5 !== false);
    setParentAccess(user.parentAccess === "student" ? "student" : "guardian");
  }, [user]);

  const history = useMemo(() => {
    if (!user) return [];
    const mine = myLeaves(user.id);
    if (mine.length) return mine;
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

  if (!user || !ready) {
    return (
      <PhoneShell title="Profile" subtitle="Account">
        <LoadingBlock label="Loading profile…" />
      </PhoneShell>
    );
  }

  const canApply =
    user.role === "parent" ||
    user.role === "student" ||
    user.role === "class_teacher";

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !school.trim()) {
      setAccountFlash("Name and school are required.");
      return;
    }
    const saved = await updateUser(user.id, {
      name: name.trim(),
      school: school.trim(),
      className: className.trim() || undefined,
      childName: childName.trim() || undefined,
      homeStopId,
      busRouteId: "route-12",
      busAlert10: alert10,
      busAlert5: alert5,
      parentAccess: user.role === "parent" ? parentAccess : undefined,
    });
    bus.setHomeStopId(homeStopId);
    if (!saved) {
      setAccountFlash("Could not save account. Try again.");
      return;
    }
    await refreshUser();
    setAccountFlash("Account saved. Same login will restore these details.");
  };

  const onApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !fromDate || !toDate) return;
    const who =
      studentName.trim() ||
      user.childName ||
      (user.role === "student" ? user.name : user.name);
    applyLeave({
      user,
      studentName: who,
      fromDate,
      toDate: toDate < fromDate ? fromDate : toDate,
      reason,
    });
    setReason("");
    setFlash("Leave submitted — waiting for teacher / admin approval.");
  };

  return (
    <PhoneShell subtitle={ROLE_LABEL[user.role]} title="Profile">
      {/* Profile Hero */}
      <div className="profile-hero mt-2">
        <div className="profile-avatar-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-name">{user.name}</div>
        <div className="profile-role-pill">
          {ROLE_LABEL[user.role]} {user.className ? `· Class ${user.className}` : ""}
        </div>
        <p className="text-11 muted" style={{ margin: "6px 0 0" }}>
          {user.identifier} · {user.school}
        </p>

        {/* Quick Portal Shortcuts */}
        <div className="profile-quick-actions" style={{ marginTop: "1rem", width: "100%" }}>
          <Link href="/bus" className="profile-quick-btn">
            <Bus size={18} className="tone-primary" />
            <span>Live Bus</span>
          </Link>
          <Link href="/attendance" className="profile-quick-btn">
            <CalendarCheck size={18} className="tone-success" />
            <span>Attendance</span>
          </Link>
          <Link href="/report" className="profile-quick-btn">
            <FileText size={18} className="tone-info" />
            <span>Report</span>
          </Link>
        </div>
      </div>

      {/* Account Details Form */}
      <form className="card card-pad mt-3 space-y" onSubmit={saveAccount}>
        <div>
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Account & Preferences
          </p>
          <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
            Profile details are saved to your account and persist across logins.
          </p>
        </div>

        <label>
          <span className="text-xs font-medium muted">Full name</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          <span className="text-xs font-medium muted">School</span>
          <input
            className="input"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
          />
        </label>
        <label>
          <span className="text-xs font-medium muted">Class</span>
          <input
            className="input"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="6-B"
          />
        </label>
        {user.role === "parent" && (
          <label>
            <span className="text-xs font-medium muted">Child&apos;s name</span>
            <input
              className="input"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Aarav Sharma"
            />
          </label>
        )}

        {user.role === "parent" && (
          <div style={{ marginTop: "1rem" }}>
            <span className="text-xs font-medium muted" style={{ display: "block", marginBottom: 8 }}>
              Navigation experience
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                className={`access-radio-card ${parentAccess === "guardian" ? "active" : ""}`}
                onClick={() => setParentAccess("guardian")}
              >
                <input
                  type="radio"
                  name="parentAccess"
                  checked={parentAccess === "guardian"}
                  onChange={() => setParentAccess("guardian")}
                  style={{ marginTop: 2 }}
                />
                <div className="grow">
                  <strong className="text-xs" style={{ display: "block" }}>
                    Guardian View (Recommended)
                  </strong>
                  <span className="text-11 muted">
                    Attendance overview, report card and live bus on top. Same chats and Learning Zone as your child.
                  </span>
                </div>
              </div>

              <div
                className={`access-radio-card ${parentAccess === "student" ? "active" : ""}`}
                onClick={() => setParentAccess("student")}
              >
                <input
                  type="radio"
                  name="parentAccess"
                  checked={parentAccess === "student"}
                  onChange={() => setParentAccess("student")}
                  style={{ marginTop: 2 }}
                />
                <div className="grow">
                  <strong className="text-xs" style={{ display: "block" }}>
                    Student View
                  </strong>
                  <span className="text-11 muted">
                    Learning Zone, quests and daily XP prioritized on the home screen.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bus-pref-box">
          <p className="font-semibold text-sm row" style={{ margin: 0, gap: 6 }}>
            <Bus size={16} className="tone-primary" /> Bus pickup & alerts
          </p>
          <label className="mt-2" style={{ display: "block" }}>
            <span className="text-xs font-medium muted">Your stop (Route 12)</span>
            <select
              className="input"
              value={homeStopId}
              onChange={(e) => setHomeStopId(e.target.value)}
            >
              {bus.allStops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="row mt-2" style={{ gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={alert10}
              onChange={(e) => setAlert10(e.target.checked)}
            />
            <span className="text-xs">Alert when bus is ~10 min away</span>
          </label>
          <label className="row mt-1" style={{ gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={alert5}
              onChange={(e) => setAlert5(e.target.checked)}
            />
            <span className="text-xs">Alert again at ~5 min</span>
          </label>
          <p className="text-11 muted" style={{ margin: "8px 0 0" }}>
            Live ETA now: <strong>{bus.etaToHome} min</strong> ·{" "}
            {bus.stopsBetween} stop{bus.stopsBetween === 1 ? "" : "s"} between
          </p>
        </div>

        {accountFlash && (
          <p className="text-11 tone-success row" style={{ gap: 6, margin: 0 }}>
            <ShieldCheck size={14} /> {accountFlash}
          </p>
        )}
        <button type="submit" className="btn-primary">
          Save account
        </button>
      </form>

      {user.role === "parent" && (
        <ParentLinksPanel
          user={user}
          onLinked={(studentName) => {
            setChildName(studentName);
            void refreshUser();
          }}
        />
      )}

      {canApply && (
        <form className="card card-pad mt-4 space-y" onSubmit={onApply}>
          <div>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              Apply for leave
            </p>
            <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
              Approved leave automatically marks those dates as Leave (L) on the attendance record.
            </p>
          </div>
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
              <span className="text-xs font-medium muted">From date</span>
              <input
                type="date"
                className="input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </label>
            <label className="grow">
              <span className="text-xs font-medium muted">To date</span>
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
            <span className="text-xs font-medium muted">Reason for leave</span>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Medical illness / family function / travel"
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
      {history.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          tone="teal"
          title="No leave requests yet"
          body="Submit a leave above and it will appear in this list."
        />
      ) : (
        <ul className="leave-list">
          {history.map((l) => (
            <li key={l.id} className="card card-pad">
              <div
                className="row"
                style={{ justifyContent: "space-between", gap: 8 }}
              >
                <div className="grow">
                  <p className="font-semibold text-sm" style={{ margin: 0 }}>
                    {l.studentName}
                  </p>
                  <p
                    className="text-11 muted row"
                    style={{ margin: "4px 0 0", gap: 4 }}
                  >
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
      )}

      <div
        className="menu-row danger mt-4"
        style={{ cursor: "pointer" }}
        onClick={() => {
          logout();
          router.replace("/auth");
        }}
      >
        <div className="menu-icon" style={{ background: "var(--danger-soft)" }}>
          <LogOut size={18} style={{ color: "var(--danger)" }} />
        </div>
        <div className="grow">
          <div className="menu-label">Sign out</div>
          <div className="menu-sub">Disconnect this device</div>
        </div>
        <div className="chevron">›</div>
      </div>
    </PhoneShell>
  );
}

function LeaveBadge({ status }: { status: LeaveStatus }) {
  return <span className={`leave-badge leave-${status}`}>{status}</span>;
}
