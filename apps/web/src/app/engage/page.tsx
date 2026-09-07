"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import {
  useStudentEngage,
  MOOD_OPTIONS,
} from "@/lib/providers/student-engage";
import { ArrowRight, BookOpen, MessageCircle, Sparkles, CheckCircle2 } from "@/components/shell/Icons";
import { LoadingBlock } from "@/components/shell/StatusUI";

export default function EngagePage() {
  const { user } = useAuth();
  const {
    ready,
    xp,
    level,
    streak,
    lastCheckInDay,
    mood,
    moodDay,
    focusMinutes,
    badges,
    missions,
    challenge,
    levelProgress,
    xpIntoLevel,
    xpForNextLevel,
    checkIn,
    setMood,
    completeMission,
    addFocusMinutes,
    celebrateUntil,
    clearCelebrate,
  } = useStudentEngage();

  const [focusLeft, setFocusLeft] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const checkedIn = lastCheckInDay === today;
  const moodSet = moodDay === today && mood;

  useEffect(() => {
    if (!focusLeft) return;
    const id = setInterval(() => {
      setFocusLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          addFocusMinutes(5);
          completeMission("mission-focus");
          setToast("Focus complete · +20 XP");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [focusLeft, addFocusMinutes, completeMission]);

  useEffect(() => {
    if (celebrateUntil > Date.now()) {
      const t = setTimeout(() => clearCelebrate(), celebrateUntil - Date.now());
      return () => clearTimeout(t);
    }
  }, [celebrateUntil, clearCelebrate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!ready || !user) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening Learning Zone…" splash />
      </div>
    );
  }

  const name = user.childName?.split(" ")[0] || user.name.split(" ")[0];
  const unlocked = badges.filter((b) => b.unlockedAt).length;

  return (
    <PhoneShell
      title="Learning Zone"
      subtitle={`${name}'s growth · Level ${level}`}
      headerAccent="primary"
    >
      {(celebrateUntil > Date.now() || toast) && (
        <div className="engage-toast" role="status">
          {toast || "Nice! XP unlocked"}
        </div>
      )}

      <section className="list-hero list-hero-yellow" style={{ marginBottom: "0.75rem" }}>
        <p className="list-hero-kicker">Learning Zone</p>
        <h2 className="list-hero-title">Grow with every school day</h2>
        <p className="list-hero-body">
          Check in, finish missions, and climb your class challenge.
        </p>
      </section>

      <section className="engage-hero">
        <div className="xp-ring" style={{ ["--p" as string]: String(levelProgress) }}>
          <div className="xp-ring-inner">
            <p className="xp-level">Lv {level}</p>
            <p className="xp-sub">
              {xpIntoLevel}/{xpForNextLevel}
            </p>
          </div>
        </div>
        <div className="grow">
          <p className="font-semibold text-15" style={{ margin: 0 }}>
            {xp} XP earned
          </p>
          <p className="text-xs muted mt-1" style={{ marginBottom: 0 }}>
            Keep learning · unlock badges · climb your class challenge
          </p>
          <div className="streak-pill mt-2">
            {streak}-day streak
          </div>
        </div>
      </section>

      <section className="card card-pad mt-4">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              Daily check-in
            </p>
            <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
              Build momentum every school day
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "auto", padding: "0.55rem 0.9rem" }}
            disabled={checkedIn}
            onClick={() => {
              void Promise.resolve(checkIn()).then((res) => {
                if (res.ok) {
                  // mission-checkin already marked on server checkIn
                  setToast(res.message);
                } else {
                  setToast(res.message);
                }
              });
            }}
          >
            {checkedIn ? "Done ✓" : "Check in +15"}
          </button>
        </div>
      </section>

      <h2 className="section-label">How are you feeling?</h2>
      <div className="mood-grid">
        {MOOD_OPTIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`mood-btn ${moodSet === m.id ? "active" : ""}`}
            onClick={() => setMood(m.id)}
          >
            <span className="mood-emoji">{m.emoji}</span>
            <span className="text-11 font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      <h2 className="section-label">Today&apos;s missions</h2>
      <ul className="mission-list">
        {missions.map((m) => (
          <li key={m.id} className={m.done ? "done" : ""}>
            <Link href={m.href} className="mission-row">
              <div className={`mission-check ${m.done ? "on" : ""}`}>
                {m.done ? <CheckCircle2 size={16} /> : null}
              </div>
              <div className="grow">
                <p className="font-medium text-sm" style={{ margin: 0 }}>
                  {m.title}
                </p>
                <p className="text-11 muted" style={{ margin: "2px 0 0" }}>
                  {m.hint}
                </p>
              </div>
              <span className="xp-chip">+{m.xp} XP</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="section-label">Focus timer</h2>
      <section className="card card-pad">
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <div>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              5-minute study burst
            </p>
            <p className="text-11 muted" style={{ margin: "4px 0 0" }}>
              Total focused: {focusMinutes} min
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "auto", padding: "0.55rem 0.9rem" }}
            disabled={focusLeft > 0}
            onClick={() => setFocusLeft(5 * 60)}
          >
            {focusLeft > 0
              ? `${Math.floor(focusLeft / 60)}:${String(focusLeft % 60).padStart(2, "0")}`
              : "Start"}
          </button>
        </div>
        {focusLeft > 0 && (
          <div className="focus-bar mt-3">
            <span style={{ width: `${((5 * 60 - focusLeft) / (5 * 60)) * 100}%` }} />
          </div>
        )}
      </section>

      <h2 className="section-label">Weekly challenge</h2>
      <section className="challenge-card">
        <p className="font-semibold text-15" style={{ margin: 0 }}>
          {challenge.title}
        </p>
        <p className="text-xs" style={{ margin: "6px 0 0", opacity: 0.9 }}>
          {challenge.description}
        </p>
        <div className="challenge-meter mt-3">
          <span
            style={{
              width: `${Math.min(100, (challenge.progress / challenge.goal) * 100)}%`,
            }}
          />
        </div>
        <div className="row mt-2" style={{ justifyContent: "space-between" }}>
          <span className="text-11">
            {challenge.progress}/{challenge.goal} actions
          </span>
          <span className="text-11">{challenge.endsIn} · +{challenge.rewardXp} XP</span>
        </div>
      </section>

      <h2 className="section-label">Badges · {unlocked}/{badges.length}</h2>
      <div className="badge-grid">
        {badges.map((b) => (
          <div key={b.id} className={`badge-tile ${b.unlockedAt ? "on" : "off"}`}>
            <span className="badge-emoji">{b.emoji}</span>
            <p className="font-semibold text-11" style={{ margin: "6px 0 0" }}>
              {b.title}
            </p>
            <p className="text-10 muted" style={{ margin: "2px 0 0" }}>
              {b.description}
            </p>
          </div>
        ))}
      </div>

      <div className="stats-grid mt-5">
        <Link href="/homework" className="stat-card">
          <div className="row" style={{ gap: 6 }}>
            <BookOpen size={16} className="tone-info" />
            <span className="text-xs muted">Homework</span>
          </div>
          <p className="stat-value">Go</p>
          <p className="text-11 muted mt-1">Earn XP by finishing tasks</p>
        </Link>
        <Link href="/chats" className="stat-card">
          <div className="row" style={{ gap: 6 }}>
            <MessageCircle size={16} className="tone-primary" />
            <span className="text-xs muted">Chats</span>
          </div>
          <p className="stat-value">Join</p>
          <p className="text-11 muted mt-1">React & stay in class loop</p>
        </Link>
      </div>

      <Link href="/ai" className="ai-banner mt-4">
        <div className="ai-banner-inner">
          <div className="ai-icon">
            <Sparkles size={20} />
          </div>
          <div className="grow">
            <p className="font-semibold text-15">Study buddy AI</p>
            <p className="text-xs" style={{ opacity: 0.85, marginTop: 2 }}>
              Ask for a quick revision tip
            </p>
          </div>
          <ArrowRight size={20} />
        </div>
      </Link>
    </PhoneShell>
  );
}
