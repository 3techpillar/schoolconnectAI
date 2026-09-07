import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const OtpSchema = new Schema(
  {
    identifier: { type: String, required: true, lowercase: true, index: true },
    /** HMAC-SHA256 of identifier:code (plain `code` kept optional for legacy rows). */
    codeHash: { type: String },
    code: { type: String },
    kind: {
      type: String,
      enum: ["otp", "verified"],
      default: "otp",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpDoc = InferSchemaType<typeof OtpSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OtpChallenge: Model<OtpDoc> =
  mongoose.models.OtpChallenge ||
  mongoose.model<OtpDoc>("OtpChallenge", OtpSchema);
