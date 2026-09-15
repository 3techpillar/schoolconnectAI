"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export type MascotType = "robot" | "owl" | "astronaut";

interface MascotCompanionProps {
  streak?: number;
  xp?: number;
  level?: number;
  studentName?: string;
  onOpenBuddyChat?: () => void;
  variant?: "card" | "floating" | "compact";
}

const MASCOTS: Record<
  MascotType,
  { name: string; title: string; image: string; emoji: string }
> = {
  robot: {
    name: "Buddy",
    title: "AI Learning Pal",
    image: "/assets/mascots/buddy_robot.jpg",
    emoji: "🤖",
  },
  owl: {
    name: "Professor Hoot",
    title: "Chief Scholar",
    image: "/assets/mascots/owl_graduate.jpg",
    emoji: "🦉",
  },
  astronaut: {
    name: "Nova",
    title: "Cosmic Explorer",
    image: "/assets/mascots/astronaut_kid.jpg",
    emoji: "🚀",
  },
};

const QUOTES = [
  "Ready for today's learning adventure? 🚀",
  "You're doing fantastic! Keep the streak alive! 🔥",
  "Did you know? Practice makes XP multiply! ⭐",
  "Ask me anything about your homework or quizzes! 💡",
  "Level up unlocked with just 2 more missions today! 🎯",
];

export function MascotCompanion({
  streak = 7,
  xp = 1250,
  level = 7,
  studentName = "Aarav",
  onOpenBuddyChat,
  variant = "card",
}: MascotCompanionProps) {
  const [currentMascot, setCurrentMascot] = useState<MascotType>("robot");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const mascot = MASCOTS[currentMascot];

  const handleMascotClick = () => {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 600);
    if (onOpenBuddyChat) {
      onOpenBuddyChat();
    }
  };

  const cycleMascot = (e: React.MouseEvent) => {
    e.stopPropagation();
    const order: MascotType[] = ["robot", "owl", "astronaut"];
    const next = order[(order.indexOf(currentMascot) + 1) % order.length];
    setCurrentMascot(next);
  };

  if (variant === "floating") {
    return (
      <div className="floating-buddy-bubble" onClick={handleMascotClick} role="button" tabIndex={0} title="Chat with Buddy AI">
        <div className={`buddy-avatar-ring ${bouncing ? "bounce-anim" : ""}`}>
          <Image
            src={mascot.image}
            alt={mascot.name}
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <span className="floating-ping" />
        </div>
        <div className="floating-label">
          <span>Ask {mascot.name}</span>
          <span className="floating-sparkle">✨</span>
        </div>
      </div>
    );
  }

  return (
    <section className="mascot-companion-card">
      <div className="mascot-card-header">
        <div className="mascot-role-pill">
          <span className="mascot-role-emoji">{mascot.emoji}</span>
          <span>{mascot.title}</span>
        </div>
        <button
          type="button"
          onClick={cycleMascot}
          className="mascot-cycle-btn"
          title="Switch Mascot character"
        >
          Change ⇄
        </button>
      </div>

      <div className="mascot-stage" onClick={handleMascotClick}>
        <div className={`mascot-image-wrapper ${bouncing ? "bounce-anim" : "float-gentle"}`}>
          <Image
            src={mascot.image}
            alt={mascot.name}
            width={140}
            height={140}
            priority
            className="mascot-img"
          />
          <div className="mascot-glow-backdrop" />
        </div>

        {/* Speech Bubble */}
        <div className="mascot-speech-bubble">
          <p className="mascot-speech-name">
            {mascot.name} says:
          </p>
          <p className="mascot-speech-text">
            &ldquo;{QUOTES[quoteIndex]}&rdquo;
          </p>
          <div className="speech-arrow" />
        </div>
      </div>

      <div className="mascot-quick-action">
        <button
          type="button"
          className="mascot-ask-btn"
          onClick={handleMascotClick}
        >
          <span>💬 Ask {mascot.name} AI</span>
          <span className="mascot-xp-badge">+5 XP</span>
        </button>
      </div>
    </section>
  );
}
