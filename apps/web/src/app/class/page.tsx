"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { useTeacherClass, type AttendMark } from "@/lib/providers/teacher-class";
import { EnrollmentDesk } from "@/components/admin/EnrollmentDesk";
import {
  BookOpen,
  CalendarCheck,
  MessageCircle,
  Megaphone,
  ArrowRight,
} from "@/components/shell/Icons";
import { AppIcon } from "@/components/shell/AppIcon";
import { LoadingBlock } from "@/components/shell/StatusUI";
import { useLeaves } from "@/lib/providers/leaves";

const MARKS: AttendMark[] = ["P", "A", "L", "H", "T"];

export default function ClassPage() {
  const router = useRouter();
  const { user, ready: authReady } = useAuth();
  const { canPostAsTeacher, sendMessage, homework } = useSchoolData();
  const {
    ready,
    roster,
    todayMarks,
    presentCount,
    markedCount,
    setMark,
    markAllPresent,
    ensureParentChat,
    todayKey,
  } = useTeacherClass();
  const { leaves } = useLeaves();

  const [activity, setActivity] = useState("");
  const [subject, setSubject] = useState("Math");
  const [posted, setPosted] = useState<string | null>(null);
  const [enrollFlash, setEnrollFlash] = useState<string | null>(null);
  const teacher = canPostAsTeacher(user);

  useEffect(() => {
    if (authReady && user && !teacher) router.replace("/");
  }, [authReady, user, teacher, router]);

  if (!authReady || !ready || !user || !teacher) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening class desk…" splash />
      </div>
    );
  }

  const pendingHw = homework.filter(
    (h) => h.status === "pending" || h.status === "in-progress",
  ).length;
  const unmarked = roster.length - markedCount;

  const postDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;
    sendMessage({
      chatId: "class-6b",
      text: activity.trim(),
      kind: "daily_activity",
      user,
      meta: { subject, activityDate: "Today" },
    });
    setActivity("");
    setPosted("Daily activity posted to Class 6-B chat");
    setTimeout(() => setPosted(null), 2500);
  };

  return (
    <PhoneShell
      title={`Class ${user.className || "6-B"}`}
      subtitle="Teacher desk · roster & updates"
      headerAccent="primary"
    >
      {posted && <div className="engage-toast">{posted}</div>}
      {enrollFlash && <div className="engage-toast">{enrollFlash}</div>}

      <section className="list-hero list-hero-blue">
        <p className="list-hero-kicker">Teacher desk</p>
        <h2 className="list-hero-title">Class operations</h2>
        <p className="list-hero-body">
          Attendance, homework, enrollments and parent updates in one place.
        </p>
      </section>

      <section className="teacher-stats">
        <div className="teacher-stat">
          <p className="teacher-stat-value">{roster.length}</p>
          <p className="text-10 muted">Students</p>
        </div>
        <div className="teacher-stat">
          <p className="teacher-stat-value tone-success">{presentCount}</p>
          <p className="text-10 muted">Present</p>
        </div>
        <div className="teacher-stat">
          <p className="teacher-stat-value tone-warning">{unmarked}</p>
          <p className="text-10 muted">Unmarked</p>
        </div>
        <div className="teacher-stat">
          <p className="teacher-stat-value tone-info">{pendingHw}</p>
          <p className="text-10 muted">HW open</p>
        </div>
      </section>

      <h2 className="section-label">Enroll students</h2>
      {user && (
        <EnrollmentDesk
          actor={user}
          onFlash={(msg) => {
            setEnrollFlash(msg);
            window.setTimeout(() => setEnrollFlash(null), 3500);
          }}
        />
      )}

      <div className="quick-grid mt-4">
        <Link href="/attendance" className="quick-btn">
          <AppIcon icon={CalendarCheck} tone="green" size={18} />
          <span className="text-11 font-medium">Attendance</span>
        </Link>
        <Link href="/homework" className="quick-btn">
          <AppIcon icon={BookOpen} tone="blue" size={18} />
          <span className="text-11 font-medium">Homework</span>
        </Link>
        <Link href="/chats/class-6b" className="quick-btn">
          <AppIcon icon={MessageCircle} tone="teal" size={18} />
          <span className="text-11 font-medium">Class chat</span>
        </Link>
        <Link href="/circulars" className="quick-btn">
          <AppIcon icon={Megaphone} tone="orange" size={18} />
          <span className="text-11 font-medium">Announce</span>
        </Link>
      </div>

      <h2 className="section-label">Post today’s activity</h2>
      <form className="card card-pad space-y" onSubmit={postDaily}>
        <div className="wa-meta-row">
          <select
            className="wa-select"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {["Math", "Science", "English", "Hindi", "Overall"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input className="wa-select" value={todayKey} readOnly />
        </div>
        <textarea
          className="input"
          style={{ minHeight: 88, resize: "vertical" }}
          placeholder="What did the class do today? Parents will get a notification."
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          Share to class chat
        </button>
      </form>

      <div className="row mt-5" style={{ justifyContent: "space-between" }}>
        <h2 className="section-label" style={{ margin: 0 }}>
          Class roster
        </h2>
        <button
          type="button"
          className="text-xs font-semibold tone-primary"
          onClick={() => markAllPresent()}
        >
          Mark all Present
        </button>
      </div>

      <ul className="roster-list mt-3">
        {roster.map((s) => {
          const mark = todayMarks[s.id];
          const onApprovedLeave = leaves.some(
            (l) =>
              l.status === "approved" &&
              l.studentName.toLowerCase() === s.name.toLowerCase() &&
              l.fromDate <= todayKey &&
              l.toDate >= todayKey,
          );
          return (
            <li key={s.id} className="roster-card">
              <div className="row" style={{ gap: 10 }}>
                <div className="roster-avatar">{s.avatar}</div>
                <div className="grow">
                  <p className="font-semibold text-sm" style={{ margin: 0 }}>
                    {s.rollNo}. {s.name}
                  </p>
                  <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                    {onApprovedLeave
                      ? "Approved leave today"
                      : `Parent · ${s.parentName}`}
                  </p>
                </div>
                <Link
                  href={`/chats/${s.parentChatId}`}
                  className="icon-btn muted"
                  aria-label={`Message ${s.parentName}`}
                  onClick={() => ensureParentChat(s)}
                >
                  <MessageCircle size={16} />
                </Link>
              </div>
              <div className="mark-row mt-2">
                {MARKS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`mark-btn mark-${m} ${
                      mark === m || (onApprovedLeave && m === "L" && !mark)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => setMark(s.id, m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      <Link href="/attendance" className="card card-pad mt-4 row" style={{ color: "inherit" }}>
        <div className="grow">
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Full attendance view
          </p>
          <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
            Calendar + today’s class sheet
          </p>
        </div>
        <ArrowRight size={16} className="muted" />
      </Link>
    </PhoneShell>
  );
}
