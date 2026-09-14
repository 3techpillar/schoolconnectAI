"use client";

import { useAuth } from "@/lib/providers/auth";
import { useStudentEngage } from "@/lib/providers/student-engage";
import { LoadingBlock } from "@/components/shell/StatusUI";
import { AdventureWorldView } from "@/components/student/AdventureWorldView";

export default function EngagePage() {
  const { user } = useAuth();
  const { ready, xp, level, streak } = useStudentEngage();

  if (!ready || !user) {
    return (
      <div className="app-shell">
        <LoadingBlock label="Opening Learning Zone…" splash />
      </div>
    );
  }

  const name = user.childName?.split(" ")[0] || user.name.split(" ")[0];

  return (
    <AdventureWorldView
      studentName={name}
      className={user.className || "Class 6-B"}
      initialXp={xp || 1250}
      initialStreak={streak || 7}
      initialLevel={level || 7}
    />
  );
}
