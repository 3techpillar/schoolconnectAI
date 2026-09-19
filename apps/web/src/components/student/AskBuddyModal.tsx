"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface AskBuddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  onRewardXp?: (amount: number) => void;
  initialQuery?: string;
}

interface Message {
  id: string;
  sender: "buddy" | "student";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "🍕 Explain fractions with pizza slices",
  "⚡ Why does lightning strike before thunder?",
  "📝 Help me summarize English Chapter 2",
  "🎯 Give me a 3-question quick quiz!",
];

export function AskBuddyModal({
  isOpen,
  onClose,
  studentName = "Aarav",
  onRewardXp,
  initialQuery,
}: AskBuddyModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "buddy",
      text: `Hey ${studentName}! 🚀 I'm your AI Study Buddy! Ask me any homework doubt, math puzzle, or science question. You earn XP every time you learn something new!`,
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = useCallback(
    (userText?: string) => {
      const textToSend = userText || input;
      if (!textToSend.trim() || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        sender: "student",
        text: textToSend.trim(),
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, userMsg]);
      if (!userText) setInput("");
      setLoading(true);

      setTimeout(() => {
        const lower = textToSend.toLowerCase();
        let botReply = `Great curiosity, ${studentName || "student"}! 🌟 Learning about "${textToSend}" is a great adventure. Remember: break the problem into bite-sized steps!`;
        if (lower.includes("fraction") || lower.includes("pizza")) {
          botReply = "🍕 Imagine a whole pizza cut into 4 equal slices! If you eat 1 slice, you ate 1 out of 4, written as 1/4. The top number (numerator) is what you took, and the bottom (denominator) is the total slices!";
        } else if (lower.includes("lightning") || lower.includes("thunder")) {
          botReply = "⚡ Light travels WAY faster than sound (300,000 km/s vs 340 m/s)! That's why you see the flash instantly, but the thunder roar takes a few seconds!";
        } else if (lower.includes("quiz")) {
          botReply = "🎯 Here's a quick brain-teaser: If a triangle has angles of 90° and 45°, what is the 3rd angle? (Hint: All angles add to 180°!)";
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: "buddy",
            text: botReply,
            timestamp: "Just now",
          },
        ]);
        setLoading(false);
        if (onRewardXp) onRewardXp(10);
      }, 1000);
    },
    [input, loading, studentName, onRewardXp],
  );

  useEffect(() => {
    if (isOpen && initialQuery) {
      handleSend(initialQuery);
    }
  }, [isOpen, initialQuery, handleSend]);

  if (!isOpen) return null;

  return (
    <div className="buddy-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="buddy-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="buddy-modal-header">
          <div className="buddy-avatar-meta">
            <div className="buddy-header-img">
              <Image
                src="/assets/mascots/buddy_robot.jpg"
                alt="Buddy AI"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="online-indicator" />
            </div>
            <div>
              <h3 className="buddy-title">Buddy AI Study Helper</h3>
              <p className="buddy-subtitle">Always here to help you learn & level up</p>
            </div>
          </div>
          <button type="button" className="buddy-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="buddy-messages-scroll">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`buddy-msg-row ${m.sender === "student" ? "student" : "buddy"}`}
            >
              {m.sender === "buddy" && (
                <div className="buddy-msg-avatar">
                  <Image
                    src="/assets/mascots/buddy_robot.jpg"
                    alt="Buddy"
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                </div>
              )}
              <div className={`buddy-msg-bubble ${m.sender}`}>
                <p>{m.text}</p>
                <span className="msg-time">{m.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="buddy-msg-row buddy">
              <div className="buddy-typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="buddy-prompts-tray">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              className="quick-prompt-chip"
              onClick={() => handleSend(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          className="buddy-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            placeholder="Ask a question or topic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="buddy-input-field"
          />
          <button type="submit" className="buddy-send-btn" disabled={!input.trim() || loading}>
            Send 🚀
          </button>
        </form>
      </div>
    </div>
  );
}
