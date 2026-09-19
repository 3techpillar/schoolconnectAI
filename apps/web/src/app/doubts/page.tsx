"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { useStudentEngage } from "@/lib/providers/student-engage";
import { apiFetch } from "@/lib/shared/api-client";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { AskBuddyModal } from "@/components/student/AskBuddyModal";
import {
  MessageCircle,
  Sparkles,
  CheckCircle2,
  Plus,
} from "@/components/shell/Icons";

interface DoubtAnswer {
  answerId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  text: string;
  isAccepted: boolean;
  upvotes: number;
  createdAt: number;
}

interface DoubtItem {
  id: string;
  className: string;
  subject: string;
  studentId: string;
  studentName: string;
  title: string;
  body: string;
  tags: string[];
  isResolved: boolean;
  createdAt: number;
  answers: DoubtAnswer[];
}

export default function DoubtsForumPage() {
  const { user, ready, backend } = useAuth();
  const { awardXp } = useStudentEngage();

  const [doubts, setDoubts] = useState<DoubtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [showAskModal, setShowAskModal] = useState(false);
  const [activeDoubt, setActiveDoubt] = useState<DoubtItem | null>(null);
  const [answerText, setAnswerText] = useState("");

  // Ask doubt form
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [subject, setSubject] = useState("Math");

  // AI Buddy modal
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [buddyPrompt, setBuddyPrompt] = useState<string | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        if (backend) {
          const res = await apiFetch<{ doubts: DoubtItem[] }>("/api/doubts");
          if (!cancelled && res.doubts) {
            setDoubts(res.doubts);
            return;
          }
        }
      } catch (err) {
        console.warn("Doubts fetch failed, falling back to demo data.", err);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Offline Demo Fallback Doubts
      if (!cancelled) {
        setDoubts([
          {
            id: "d1",
            className: user?.className || "Class 6-B",
            subject: "Math",
            studentId: "s101",
            studentName: "Aarav Sharma",
            title: "How to find x in 3x + 12 = 45?",
            body: "I am confused about moving +12 across the equals sign. Do I subtract 12 first or divide by 3 first?",
            tags: ["algebra", "equations"],
            isResolved: true,
            createdAt: Date.now() - 3600000 * 3,
            answers: [
              {
                answerId: "a1",
                authorId: "t1",
                authorName: "Ms. Anjali Kapoor",
                authorRole: "class_teacher",
                text: "Always undo addition/subtraction first! Subtract 12 from both sides to get 3x = 33, then divide by 3 to get x = 11.",
                isAccepted: true,
                upvotes: 5,
                createdAt: Date.now() - 3600000 * 2,
              },
            ],
          },
          {
            id: "d2",
            className: user?.className || "Class 6-B",
            subject: "Science",
            studentId: "s102",
            studentName: "Rohan Patel",
            title: "Difference between Photosynthesis and Respiration?",
            body: "Which process releases oxygen and which one takes in oxygen?",
            tags: ["biology", "plants"],
            isResolved: false,
            createdAt: Date.now() - 3600000 * 8,
            answers: [],
          },
        ]);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user, backend]);

  const handlePostDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim() || !user) return;

    const newDoubt: DoubtItem = {
      id: `d_${Date.now()}`,
      className: user.className || "Class 6-B",
      subject,
      studentId: String(user.id || user.name),
      studentName: user.name,
      title: title.trim(),
      body: bodyText.trim(),
      tags: [subject.toLowerCase()],
      isResolved: false,
      createdAt: Date.now(),
      answers: [],
    };

    if (backend) {
      await apiFetch("/api/doubts", {
        method: "POST",
        body: JSON.stringify(newDoubt),
      }).catch(() => null);
    }

    setDoubts((prev) => [newDoubt, ...prev]);
    setTitle("");
    setBodyText("");
    setShowAskModal(false);
    awardXp(10);
    triggerToast("✨ +10 XP! Doubt posted to community & teachers!");
  };

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoubt || !answerText.trim() || !user) return;

    const newAns: DoubtAnswer = {
      answerId: `ans_${Date.now()}`,
      authorId: String(user.id || user.name),
      authorName: user.name,
      authorRole: user.role,
      text: answerText.trim(),
      isAccepted: false,
      upvotes: 0,
      createdAt: Date.now(),
    };

    if (backend) {
      await apiFetch(`/api/doubts/${activeDoubt.id}`, {
        method: "POST",
        body: JSON.stringify({ answerText: answerText.trim() }),
      }).catch(() => null);
    }

    const updatedDoubts = doubts.map((d) => {
      if (d.id === activeDoubt.id) {
        return {
          ...d,
          answers: [...d.answers, newAns],
        };
      }
      return d;
    });

    setDoubts(updatedDoubts);
    setActiveDoubt((prev) => (prev ? { ...prev, answers: [...prev.answers, newAns] } : null));
    setAnswerText("");
    awardXp(15);
    triggerToast("✨ +15 XP! Helpful answer shared!");
  };

  const handleAskAIBuddy = (d: DoubtItem) => {
    setBuddyPrompt(`Can you explain and solve this student doubt for ${d.subject}: "${d.title}" — ${d.body}`);
    setIsBuddyOpen(true);
  };

  const filtered = doubts.filter((d) => selectedSubject === "All" || d.subject === selectedSubject);

  if (!ready || loading) {
    return (
      <PhoneShell title="Doubts Forum" subtitle="Discussion & AI Helper">
        <LoadingBlock label="Loading discussion threads…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      title="Doubts Forum"
      subtitle={`${user?.className || "Class 6-B"} · Ask Teachers & AI`}
      headerAccent="plain"
    >
      {/* XP Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "0.65rem 1.2rem",
            borderRadius: "999px",
            fontWeight: 800,
            fontSize: "0.85rem",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Hero Banner */}
      <section className="hw-student-hero mt-1">
        <div className="hw-student-banner-wrap">
          <Image
            src="/assets/learning/doubts_ai_hero.jpg"
            alt="Doubts AI Discussion Forum"
            width={720}
            height={405}
            priority
            className="hw-student-banner-img"
          />
          <div className="hw-student-banner-overlay">
            <span className="hw-hero-kicker">🤖 24/7 AI Buddy & Peer Forum</span>
            <h2 className="hw-hero-title">Stuck on a Concept? 💡</h2>
            <p className="hw-hero-desc">
              Ask questions, get answers from your subject teachers, or get instant AI solutions!
            </p>
          </div>
        </div>
      </section>

      {/* Action Row & Subject Filters */}
      <div style={{ marginTop: 14, marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              flex: 1,
              borderRadius: "12px",
              padding: "0.65rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)",
            }}
            onClick={() => setShowAskModal(true)}
          >
            <Plus size={18} />
            <span>Ask a Doubt (+10 XP)</span>
          </button>
        </div>

        {/* Subject Filters */}
        <div className="hw-subject-scroll">
          {["All", "Math", "Science", "English", "Hindi", "Social Studies"].map((sub) => (
            <button
              key={sub}
              type="button"
              className={`hw-subject-pill-btn ${selectedSubject === sub ? "active" : ""}`}
              onClick={() => setSelectedSubject(sub)}
            >
              <span>{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Doubts Feed */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No doubts posted yet"
          body="Be the first student to ask a question and earn +10 XP!"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((d) => (
            <div
              key={d.id}
              className="card"
              style={{
                borderRadius: "16px",
                padding: "1rem",
                border: d.isResolved ? "1px solid #10B981" : "1px solid var(--border)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                  }}
                >
                  {d.subject} · {d.studentName}
                </span>

                {d.isResolved ? (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#10B981",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={14} /> Resolved
                  </span>
                ) : (
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    {d.answers.length} {d.answers.length === 1 ? "answer" : "answers"}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                {d.title}
              </h3>
              <p style={{ fontSize: "0.83rem", color: "var(--muted)", margin: 0, lineHeight: 1.4 }}>
                {d.body}
              </p>

              {/* Answers list if active */}
              {d.answers.length > 0 && (
                <div
                  style={{
                    background: "var(--surface-soft)",
                    borderRadius: "12px",
                    padding: "0.75rem",
                    marginTop: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--muted)" }}>
                    Top Answer:
                  </span>
                  {d.answers.map((ans) => (
                    <div key={ans.answerId} style={{ fontSize: "0.82rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: 2 }}>
                        {ans.authorName} ({ans.authorRole}):
                      </div>
                      <div style={{ lineHeight: 1.4 }}>{ans.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Toolbar */}
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    borderRadius: "10px",
                    padding: "0.45rem 0.75rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flex: 1,
                  }}
                  onClick={() => setActiveDoubt(d)}
                >
                  <MessageCircle size={14} />
                  <span>Reply / Answer</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    borderRadius: "10px",
                    padding: "0.45rem 0.75rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
                  }}
                  onClick={() => handleAskAIBuddy(d)}
                >
                  <Sparkles size={14} />
                  <span>Ask AI Buddy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Doubt Modal */}
      {showAskModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 12 }}>
              Ask a Doubt ❓ (+10 XP)
            </h3>
            <form onSubmit={handlePostDoubt} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="text-xs font-bold mb-1 block">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="search-input"
                  style={{ width: "100%", padding: "0.6rem" }}
                >
                  <option value="Math">Math</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Social Studies">Social Studies</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block">Question Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to solve quadratic equations?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="search-input"
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block">Detailed Question / Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe where you got stuck or what formula you are using…"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="search-input"
                  style={{ width: "100%", padding: "0.6rem", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Answer Modal */}
      {activeDoubt && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 4 }}>
              Answer Question 💬
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 12 }}>
              &quot;{activeDoubt.title}&quot;
            </p>
            <form onSubmit={handlePostAnswer} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea
                required
                rows={4}
                placeholder="Type your explanation or answer step-by-step…"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="search-input"
                style={{ width: "100%", padding: "0.6rem", resize: "none" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveDoubt(null)}
                >
                  Close
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Answer (+15 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ask Buddy AI Modal */}
      <AskBuddyModal
        isOpen={isBuddyOpen}
        onClose={() => setIsBuddyOpen(false)}
        initialQuery={buddyPrompt}
      />
    </PhoneShell>
  );
}
