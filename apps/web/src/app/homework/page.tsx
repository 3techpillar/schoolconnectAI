"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import {
  useSchoolData,
  type HomeworkPriority,
  type HomeworkStatus,
} from "@/lib/providers/school-data";
import { useStudentEngage } from "@/lib/providers/student-engage";
import {
  Paperclip,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  BookOpen,
  Sparkles,
} from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { addDaysIso, formatDueLabel, isDueOverdue, toIsoDate } from "@/lib/shared/dates";
import { AskBuddyModal } from "@/components/student/AskBuddyModal";

const SUBJECT_ICON_MAP: Record<string, string> = {
  Math: "/assets/icons/icon_math_3d.jpg",
  Science: "/assets/icons/icon_science_3d.jpg",
  English: "/assets/icons/icon_english_3d.jpg",
  Hindi: "/assets/icons/icon_hindi_3d.jpg",
};

export default function HomeworkPage() {
  const { user } = useAuth();
  const {
    homework,
    addHomework,
    updateHomeworkStatus,
    canPostAsTeacher,
    ready,
  } = useSchoolData();
  const { completeMission, awardXp, streak, xp, level } = useStudentEngage();

  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("Math");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(addDaysIso(toIsoDate(), 2));
  const [priority, setPriority] = useState<HomeworkPriority>("medium");
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [buddyPrompt, setBuddyPrompt] = useState<string | undefined>(undefined);
  const [xpToast, setXpToast] = useState<string | null>(null);

  const teacher = canPostAsTeacher(user);
  const firstName = user?.childName?.split(" ")[0] || user?.name?.split(" ")[0] || "Student";

  const triggerToast = (msg: string) => {
    setXpToast(msg);
    setTimeout(() => setXpToast(null), 3200);
  };

  const filtered = useMemo(() => {
    if (filter === "All") return homework;
    return homework.filter((h) => h.subject === filter);
  }, [filter, homework]);

  const counts = useMemo(() => {
    return {
      pending: homework.filter((h) => h.status === "pending").length,
      progress: homework.filter((h) => h.status === "in-progress").length,
      done: homework.filter(
        (h) => h.status === "submitted" || h.status === "reviewed",
      ).length,
      overdue: homework.filter((h) => isDueOverdue(h.dueDate, h.status)).length,
    };
  }, [homework]);

  const totalQuests = homework.length;
  const completedPercent = totalQuests > 0 ? Math.round((counts.done / totalQuests) * 100) : 100;

  const subjects = [
    { label: "All", icon: "📚" },
    { label: "Math", icon: "/assets/icons/icon_math_3d.jpg" },
    { label: "Science", icon: "/assets/icons/icon_science_3d.jpg" },
    { label: "English", icon: "/assets/icons/icon_english_3d.jpg" },
    { label: "Hindi", icon: "/assets/icons/icon_hindi_3d.jpg" },
  ];

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !dueDate) return;
    addHomework(
      {
        subject,
        title: title.trim(),
        dueDate,
        due: formatDueLabel(dueDate),
        priority,
        attachments: 0,
        status: "pending",
        className: user.className || "6-B",
        postedBy: user.name,
      },
      user,
    );
    setTitle("");
    setDueDate(addDaysIso(toIsoDate(), 2));
    setShowForm(false);
  };

  const cycleStatus = (id: string, current: HomeworkStatus) => {
    if (!user) return;
    const order: HomeworkStatus[] = [
      "pending",
      "in-progress",
      "submitted",
      "reviewed",
    ];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateHomeworkStatus(id, next, user);
    if (next === "in-progress" || next === "submitted") {
      completeMission("mission-homework");
      const pts = next === "submitted" ? 20 : 10;
      awardXp(pts);
      triggerToast(`✨ +${pts} XP! Quest ${next === "submitted" ? "Submitted" : "Started"}`);
    }
  };

  const handleAskBuddy = (hwTitle: string, hwSubject: string) => {
    setBuddyPrompt(`Can you help me understand and solve my ${hwSubject} assignment: "${hwTitle}"?`);
    setIsBuddyOpen(true);
  };

  if (!ready) {
    return (
      <PhoneShell title="Homework" subtitle="Assignments">
        <LoadingBlock label="Loading homework quests…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      subtitle={`${counts.pending + counts.progress} active · ${counts.overdue} overdue`}
      title="Homework"
      headerAccent="plain"
    >
      {/* 3D Student Quest Hero Banner */}
      <section className="hw-student-hero mt-1">
        <div className="hw-student-banner-wrap">
          <Image
            src="/assets/homework/homework_quest_hero.jpg"
            alt="Homework Quest Study Room"
            width={720}
            height={405}
            priority
            className="hw-student-banner-img"
          />
          <div className="hw-student-banner-overlay">
            <span className="hw-hero-kicker">
              ✨ Daily Quests Hub
            </span>
            <h2 className="hw-hero-title">
              Ready for today&apos;s missions, {firstName}? 🚀
            </h2>
            <p className="hw-hero-desc">
              {counts.pending > 0
                ? `${counts.pending} quests waiting · Earn +20 XP per submitted task!`
                : "All assignments up to date! Great job keeping the streak alive!"}
            </p>
          </div>
        </div>
      </section>

      {/* Gamified Streak & Daily Quest Progress Dock */}
      <div className="hw-progress-dock">
        <div className="hw-progress-header">
          <span className="hw-progress-label">
            Today&apos;s Quest Progress 🎯
          </span>
          <span className="hw-progress-stat">
            {counts.done}/{totalQuests} Completed ({completedPercent}%)
          </span>
        </div>
        <div className="hw-progress-track">
          <div
            className="hw-progress-fill"
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <div className="pwa-game-stats-row mt-2" style={{ justifyContent: "space-between" }}>
          <div className="game-pill streak-pill-glow" style={{ padding: "0.35rem 0.75rem" }}>
            <span className="streak-flame">🔥</span>
            <span className="font-bold text-xs">{streak || 7}d Streak</span>
          </div>
          <div className="game-pill xp-pill-glow" style={{ padding: "0.35rem 0.75rem" }}>
            <span className="xp-star">⭐</span>
            <span className="font-bold text-xs">{(xp || 1250).toLocaleString()} XP</span>
          </div>
          <div className="game-pill level-pill-glow" style={{ padding: "0.35rem 0.75rem" }}>
            <span className="font-bold text-xs">Lv {level || 7}</span>
          </div>
        </div>
      </div>

      {/* 3D Subject Filter Tabs */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div className="hw-subject-scroll">
          {subjects.map((s) => {
            const isActive = filter === s.label;
            const isImageIcon = s.icon.startsWith("/");
            return (
              <button
                key={s.label}
                type="button"
                className={`hw-subject-pill-btn ${isActive ? "active" : ""}`}
                onClick={() => setFilter(s.label)}
              >
                <span className="hw-subject-icon-box">
                  {isImageIcon ? (
                    <Image
                      src={s.icon}
                      alt={s.label}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <span>{s.icon}</span>
                  )}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
        {teacher && (
          <button
            type="button"
            className="icon-btn"
            style={{
              background: showForm ? "var(--primary-soft)" : "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
              flexShrink: 0,
              marginBottom: 10,
            }}
            aria-label="Add homework"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Teacher Post Drawer */}
      {teacher && showForm && (
        <form className="card card-pad mb-3 space-y" onSubmit={onCreate} style={{ borderColor: "rgba(99, 102, 241, 0.4)", borderRadius: 18 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              Assign Class Homework
            </p>
            <span className="text-10 muted">Class {user?.className || "6-B"}</span>
          </div>
          <div className="wa-meta-row">
            <select
              className="wa-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {["Math", "Science", "English", "Hindi"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="wa-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as HomeworkPriority)}
            >
              <option value="high">🔥 Boss Quest (High)</option>
              <option value="medium">⚡ Daily Quest (Medium)</option>
              <option value="low">🌱 Practice (Low)</option>
            </select>
          </div>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment description / exercises"
            required
          />
          <label>
            <span className="text-xs font-medium muted">Submission deadline</span>
            <input
              type="date"
              className="input"
              value={dueDate}
              min={toIsoDate()}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn-primary">
            Post Homework Assignment
          </button>
        </form>
      )}

      {/* 3D Homework Quest Cards List */}
      <div>
        {filtered.map((it) => {
          const overdue = isDueOverdue(it.dueDate, it.status);
          const isDone = it.status === "submitted" || it.status === "reviewed";
          const isInProgress = it.status === "in-progress";
          const subjectIcon = SUBJECT_ICON_MAP[it.subject] || "/assets/icons/icon_homework_3d.jpg";

          return (
            <div
              key={it.id}
              className={`hw-quest-card-3d ${isDone ? "completed-quest" : ""} ${overdue ? "overdue-quest" : ""}`}
            >
              <div className="hw-quest-top-row">
                <div className="hw-quest-subject-badge">
                  <div className="hw-subject-icon-box" style={{ width: 20, height: 20 }}>
                    <Image
                      src={subjectIcon}
                      alt={it.subject}
                      width={20}
                      height={20}
                    />
                  </div>
                  <span>{it.subject}</span>
                </div>
                <div className="row" style={{ gap: 6, alignItems: "center" }}>
                  <span className={`hw-priority-pill hw-priority-${it.priority}`}>
                    {it.priority === "high" ? "🔥 Boss Quest" : it.priority === "medium" ? "⚡ Daily" : "🌱 Practice"}
                  </span>
                  <span className="hw-quest-xp-bounty">
                    ⭐ +20 XP
                  </span>
                </div>
              </div>

              <h3 className="hw-quest-title">
                {it.title}
              </h3>

              <div className="hw-quest-meta">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Clock size={13} style={{ color: overdue ? "#F43F5E" : "#64748B" }} />
                  <strong style={{ color: overdue ? "#F43F5E" : "inherit" }}>
                    {overdue ? "Overdue · " : "Due "} {it.due}
                  </strong>
                </span>
                <span>Class {it.className}</span>
                <span>Posted by {it.postedBy}</span>
                {it.attachments > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Paperclip size={12} /> {it.attachments}
                  </span>
                )}
              </div>

              <div className="hw-quest-actions-row">
                <button
                  type="button"
                  className="hw-solve-ai-btn"
                  onClick={() => handleAskBuddy(it.title, it.subject)}
                  title="Ask Buddy AI for hints"
                >
                  <Sparkles size={14} /> Ask Buddy AI
                </button>

                <div className="row" style={{ gap: 8, alignItems: "center" }}>
                  <StatusPill status={it.status} />
                  <button
                    type="button"
                    className={`hw-submit-quest-btn ${isDone ? "done" : isInProgress ? "in-progress" : "pending"}`}
                    onClick={() => cycleStatus(it.id, it.status)}
                  >
                    {it.status === "pending" && "Start Quest ⚔️"}
                    {it.status === "in-progress" && "Submit Quest 🚀"}
                    {isDone && "Done ✓"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* "All Quests Cleared" 3D Celebration State */}
      {filtered.length === 0 && counts.pending === 0 ? (
        <div className="hw-victory-card-3d">
          <div className="hw-victory-avatar-wrap">
            <Image
              src="/assets/homework/homework_all_done.jpg"
              alt="Homework Champion"
              width={140}
              height={140}
            />
          </div>
          <h3 className="hw-victory-title">All Quests Cleared! 🏆</h3>
          <p className="hw-victory-desc">
            Awesome job! You&apos;ve completed all homework missions for now. Relax and celebrate your XP gains!
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ display: "inline-flex", width: "auto", margin: "0 auto", padding: "0.5rem 1.25rem" }}
            onClick={() => setFilter("All")}
          >
            Review All Homework
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          tone="blue"
          title={`No ${filter} homework`}
          body="Try another subject filter or check back later."
        />
      ) : null}

      {/* Interactive AI Study Buddy Modal */}
      <AskBuddyModal
        isOpen={isBuddyOpen}
        onClose={() => {
          setIsBuddyOpen(false);
          setBuddyPrompt(undefined);
        }}
        studentName={firstName}
        initialQuery={buddyPrompt}
        onRewardXp={(amount) => {
          awardXp(amount);
          triggerToast(`✨ +${amount} XP for studying with Buddy!`);
        }}
      />

      {/* Floating XP Reward Toast */}
      {xpToast && (
        <div className="adventure-xp-toast" role="status">
          <span>{xpToast}</span>
        </div>
      )}
    </PhoneShell>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "submitted" || status === "reviewed") {
    return (
      <span className="row tone-success font-semibold text-xs" style={{ gap: 4 }}>
        <CheckCircle2 size={14} /> {status === "reviewed" ? "Reviewed" : "Submitted"}
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="row tone-info font-semibold text-xs" style={{ gap: 4 }}>
        <Clock size={14} /> In progress
      </span>
    );
  }
  return (
    <span className="row tone-warning font-semibold text-xs" style={{ gap: 4 }}>
      <AlertTriangle size={14} /> Pending
    </span>
  );
}
