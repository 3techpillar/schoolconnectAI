import { StudentEngage } from "@/lib/models/family/StudentEngage";
import type { EngageAction } from "@/lib/server/schemas";
import {
  DEFAULT_BADGES,
  defaultChallenge,
  defaultMissions,
  levelFromXp,
  todayKey,
  yesterdayKey,
  type EngageBadge,
  type EngageMission,
} from "@/lib/shared/engage-defaults";

type EngageDoc = InstanceType<typeof StudentEngage>;

function toClient(doc: EngageDoc) {
  return {
    xp: doc.xp,
    streak: doc.streak,
    lastCheckInDay: doc.lastCheckInDay,
    mood: doc.mood,
    moodDay: doc.moodDay,
    focusMinutes: doc.focusMinutes,
    badges: doc.badges?.length ? [...doc.badges] : DEFAULT_BADGES,
    missions: doc.missions?.length ? [...doc.missions] : defaultMissions(),
    challenge: doc.challenge?.id ? { ...doc.challenge } : defaultChallenge(),
    reactions: { ...((doc.reactions || {}) as Record<string, string[]>) },
    celebrateUntil: doc.celebrateUntil || 0,
  };
}

function readBadges(doc: EngageDoc): EngageBadge[] {
  return (doc.badges?.length ? [...doc.badges] : DEFAULT_BADGES).map((b) => ({
    id: b.id || "",
    title: b.title || "",
    description: b.description || "",
    emoji: b.emoji || "",
    unlockedAt: b.unlockedAt ?? undefined,
  }));
}

function readMissions(doc: EngageDoc): EngageMission[] {
  return (doc.missions?.length ? [...doc.missions] : defaultMissions()).map(
    (m) => ({
      id: m.id || "",
      title: m.title || "",
      hint: m.hint || "",
      xp: m.xp || 0,
      href: m.href || "",
      done: Boolean(m.done),
    }),
  );
}

function unlockBadge(badges: EngageBadge[], id: string): EngageBadge[] {
  return badges.map((b) =>
    b.id === id && !b.unlockedAt ? { ...b, unlockedAt: Date.now() } : b,
  );
}

export async function ensureEngageDoc(userId: string) {
  let doc = await StudentEngage.findOne({ userId });
  if (!doc) {
    doc = await StudentEngage.create({
      userId,
      xp: 40,
      streak: 2,
      lastCheckInDay: yesterdayKey(),
      badges: DEFAULT_BADGES,
      missions: defaultMissions(),
      challenge: defaultChallenge(),
      reactions: {},
    });
  }
  if (!doc.missions?.length) doc.set("missions", defaultMissions());
  if (!doc.badges?.length) doc.set("badges", DEFAULT_BADGES);
  if (!doc.challenge?.id) doc.set("challenge", defaultChallenge());
  return doc;
}

function awardXp(doc: EngageDoc, amount: number) {
  doc.xp = (doc.xp || 0) + amount;
  doc.celebrateUntil = Date.now() + 2200;
  let badges = readBadges(doc);
  if (levelFromXp(doc.xp) >= 3) badges = unlockBadge(badges, "level-3");
  doc.set("badges", badges);
}

function bumpChallenge(doc: EngageDoc, by = 1) {
  const ch = doc.challenge?.id
    ? {
        id: doc.challenge.id,
        title: doc.challenge.title || "",
        description: doc.challenge.description || "",
        progress: doc.challenge.progress || 0,
        goal: doc.challenge.goal || 5,
        rewardXp: doc.challenge.rewardXp || 50,
        endsIn: doc.challenge.endsIn || "",
      }
    : defaultChallenge();
  doc.set("challenge", {
    ...ch,
    progress: Math.min(ch.goal, ch.progress + by),
  });
}

/**
 * Apply a trusted server-side engage mutation. Never trust client XP totals.
 */
export async function applyEngageAction(userId: string, action: EngageAction) {
  const doc = await ensureEngageDoc(userId);
  let message: string | undefined;
  let xpGained = 0;
  let ok = true;

  switch (action.action) {
    case "checkIn": {
      const day = todayKey();
      if (doc.lastCheckInDay === day) {
        ok = false;
        message = "Already checked in today";
        break;
      }
      const continued = doc.lastCheckInDay === yesterdayKey();
      doc.streak = continued ? (doc.streak || 0) + 1 : 1;
      doc.lastCheckInDay = day;
      doc.set(
        "missions",
        readMissions(doc).map((m) =>
          m.id === "mission-checkin" ? { ...m, done: true } : m,
        ),
      );
      awardXp(doc, 15);
      xpGained = 15;
      let badges = unlockBadge(readBadges(doc), "first-checkin");
      if ((doc.streak || 0) >= 3) badges = unlockBadge(badges, "streak-3");
      doc.set("badges", badges);
      bumpChallenge(doc, 1);
      message = `Streak ${doc.streak} · +15 XP`;
      break;
    }
    case "setMood": {
      doc.mood = action.mood;
      doc.moodDay = todayKey();
      message = "Mood saved";
      break;
    }
    case "completeMission": {
      const missions = readMissions(doc);
      const mission = missions.find((m) => m.id === action.missionId);
      if (!mission || mission.done) {
        ok = false;
        message = "Mission unavailable";
        break;
      }
      doc.set(
        "missions",
        missions.map((m) =>
          m.id === action.missionId ? { ...m, done: true } : m,
        ),
      );
      awardXp(doc, mission.xp);
      xpGained = mission.xp;
      bumpChallenge(doc, 1);
      let badges = readBadges(doc);
      if (action.missionId === "mission-homework") {
        badges = unlockBadge(badges, "hw-hero");
      }
      if (action.missionId === "mission-chat") {
        badges = unlockBadge(badges, "chatty");
      }
      if (action.missionId === "mission-focus") {
        badges = unlockBadge(badges, "focus-15");
      }
      doc.set("badges", badges);
      message = `+${mission.xp} XP`;
      break;
    }
    case "addFocusMinutes": {
      doc.focusMinutes = (doc.focusMinutes || 0) + action.minutes;
      if (action.minutes >= 5) {
        doc.set(
          "missions",
          readMissions(doc).map((m) =>
            m.id === "mission-focus" ? { ...m, done: true } : m,
          ),
        );
        awardXp(doc, 20);
        xpGained = 20;
        bumpChallenge(doc, 1);
      }
      if ((doc.focusMinutes || 0) >= 15) {
        doc.set("badges", unlockBadge(readBadges(doc), "focus-15"));
      }
      message = "Focus logged";
      break;
    }
    case "bumpChallenge": {
      bumpChallenge(doc, action.by ?? 1);
      message = "Challenge updated";
      break;
    }
    case "toggleReaction": {
      const reactions = {
        ...((doc.reactions || {}) as Record<string, string[]>),
      };
      const list = reactions[action.messageId] || [];
      reactions[action.messageId] = list.includes(action.emoji)
        ? list.filter((e) => e !== action.emoji)
        : [...list, action.emoji];
      doc.set("reactions", reactions);
      message = "Reaction saved";
      break;
    }
    case "clearCelebrate": {
      doc.celebrateUntil = 0;
      break;
    }
    default:
      ok = false;
      message = "Unknown action";
  }

  await doc.save();
  return { ok, message, xpGained, engage: toClient(doc) };
}

export { toClient as engageToClient };
