import { z } from "zod";

export const identifierSchema = z.object({
  identifier: z.string().trim().min(3, "identifier is required"),
});

export const otpVerifySchema = z.object({
  identifier: z.string().trim().min(3, "identifier is required"),
  otp: z.string().trim().min(4, "otp is required").max(12),
});

export const feesPaySchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, "message is required").max(500),
});

export const engageActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("checkIn") }),
  z.object({
    action: z.literal("setMood"),
    mood: z.enum(["great", "good", "okay", "tired"]),
  }),
  z.object({
    action: z.literal("completeMission"),
    missionId: z.string().trim().min(1),
  }),
  z.object({
    action: z.literal("addFocusMinutes"),
    minutes: z.number().int().min(1).max(180),
  }),
  z.object({
    action: z.literal("bumpChallenge"),
    by: z.number().int().min(1).max(5).optional(),
  }),
  z.object({
    action: z.literal("toggleReaction"),
    messageId: z.string().trim().min(1),
    emoji: z.string().trim().min(1).max(8),
  }),
  z.object({ action: z.literal("clearCelebrate") }),
]);

export type EngageAction = z.infer<typeof engageActionSchema>;

export const chatUpsertSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().max(200).optional(),
  kind: z.enum(["class", "teacher", "school", "bus"]),
  className: z.string().trim().max(40).optional(),
  avatar: z.string().trim().max(8).optional(),
});

export const chatPostMessageSchema = z.object({
  text: z.string().trim().min(1, "text is required").max(2000),
  kind: z
    .enum(["text", "daily_activity", "homework", "progress", "system"])
    .optional()
    .default("text"),
  meta: z
    .object({
      subject: z.string().trim().max(80).optional(),
      due: z.string().trim().max(40).optional(),
      status: z.string().trim().max(40).optional(),
      score: z.string().trim().max(80).optional(),
      activityDate: z.string().trim().max(40).optional(),
    })
    .optional(),
  syncHomework: z.boolean().optional(),
});
