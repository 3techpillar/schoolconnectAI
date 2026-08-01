import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const BadgeSchema = new Schema(
  {
    id: String,
    title: String,
    description: String,
    emoji: String,
    unlockedAt: Number,
  },
  { _id: false },
);

const MissionSchema = new Schema(
  {
    id: String,
    title: String,
    hint: String,
    xp: Number,
    href: String,
    done: Boolean,
  },
  { _id: false },
);

const EngageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    xp: { type: Number, default: 40 },
    streak: { type: Number, default: 2 },
    lastCheckInDay: { type: String, default: null },
    mood: { type: String, default: null },
    moodDay: { type: String, default: null },
    focusMinutes: { type: Number, default: 0 },
    badges: { type: [BadgeSchema], default: [] },
    missions: { type: [MissionSchema], default: [] },
    challenge: {
      id: String,
      title: String,
      description: String,
      progress: Number,
      goal: Number,
      rewardXp: Number,
      endsIn: String,
    },
    reactions: { type: Schema.Types.Mixed, default: {} },
    celebrateUntil: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type EngageDoc = InferSchemaType<typeof EngageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StudentEngage: Model<EngageDoc> =
  mongoose.models.StudentEngage ||
  mongoose.model<EngageDoc>("StudentEngage", EngageSchema);
