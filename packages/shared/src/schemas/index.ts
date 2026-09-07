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

export const erpSchoolUpsertSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().max(32).optional(),
  city: z.string().trim().max(80).optional(),
  board: z.string().trim().max(80).optional(),
  address: z.string().trim().max(400).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  academicYearCurrent: z.string().trim().max(20).optional(),
  productMode: z.enum(["connect", "erp"]).optional(),
  branchName: z.string().trim().max(80).optional(),
  groupCode: z.string().trim().max(32).optional(),
  parentSchoolId: z.string().trim().max(40).optional(),
  transferPolicy: z.enum(["group_only", "open"]).optional(),
  subscriptionPlan: z.enum(["free", "paid"]).optional(),
  /** ISO date or epoch ms — free trial end / plan expiry */
  subscriptionExpiresAt: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["active", "paused"]).optional(),
  settings: z
    .object({
      modules: z.record(z.string(), z.boolean()).optional(),
    })
    .passthrough()
    .optional(),
});

export const erpTransferCreateSchema = z.object({
  studentUserId: z.string().trim().min(1),
  toSchoolId: z.string().trim().min(1),
  toClassName: z.string().trim().max(40).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const erpTransferReviewSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["approved", "rejected"]),
  toClassName: z.string().trim().max(40).optional(),
  note: z.string().trim().max(500).optional(),
});

export const erpStudentUpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  admissionNo: z.string().trim().max(40).optional(),
  dob: z.string().trim().max(20).optional(),
  gender: z.enum(["male", "female", "other", "unspecified"]).optional(),
  bloodGroup: z.string().trim().max(8).optional(),
  address: z.string().trim().max(400).optional(),
  className: z.string().trim().max(40).optional(),
  classSectionId: z.string().trim().optional(),
  rollNo: z.string().trim().max(12).optional(),
  status: z
    .enum(["prospect", "enrolled", "alumni", "left", "inactive"])
    .optional(),
  userId: z.string().trim().optional(),
  academicYear: z.string().trim().max(20).optional(),
  note: z.string().trim().max(500).optional(),
  guardians: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        relationship: z
          .enum(["father", "mother", "guardian", "other"])
          .optional(),
        phone: z.string().trim().max(40).optional(),
        email: z.string().trim().max(120).optional(),
        isPrimary: z.boolean().optional(),
        userId: z.string().trim().optional(),
      }),
    )
    .optional(),
  schoolId: z.string().trim().optional(),
});

export const erpClassUpsertSchema = z.object({
  grade: z.string().trim().min(1).max(20),
  section: z.string().trim().min(1).max(8),
  className: z.string().trim().min(1).max(40).optional(),
  classTeacherId: z.string().trim().optional().nullable(),
  capacity: z.number().int().min(1).max(200).optional(),
  schoolId: z.string().trim().optional(),
  periods: z
    .array(
      z.object({
        day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat"]),
        period: z.number().int().min(1).max(12),
        subject: z.string().trim().max(80).optional(),
        teacherName: z.string().trim().max(120).optional(),
        startTime: z.string().trim().max(10).optional(),
        endTime: z.string().trim().max(10).optional(),
      }),
    )
    .optional(),
});

export const erpAdmissionPatchSchema = z.object({
  status: z
    .enum([
      "enquiry",
      "submitted",
      "under_review",
      "documents_pending",
      "interview_scheduled",
      "approved",
      "offered",
      "enrolled",
      "rejected",
      "withdrawn",
    ])
    .optional(),
  note: z.string().trim().max(500).optional(),
  interviewAt: z.string().trim().max(40).optional(),
  interviewNotes: z.string().trim().max(500).optional(),
  admissionFeePaise: z.number().int().min(0).optional(),
  admissionFeePaid: z.boolean().optional(),
  documents: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        status: z.enum(["pending", "received", "waived"]),
        url: z.string().optional(),
      }),
    )
    .optional(),
});

export const erpSubjectUpsertSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(80),
  className: z.string().trim().max(40).optional(),
  teacherUserId: z.string().trim().optional(),
  teacherName: z.string().trim().max(120).optional(),
  mandatory: z.boolean().optional(),
  active: z.boolean().optional(),
  schoolId: z.string().trim().optional(),
});

export const erpExamUpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z
    .enum([
      "unit_test",
      "mid_term",
      "final",
      "monthly",
      "practical",
      "custom",
    ])
    .optional(),
  academicYear: z.string().trim().max(20).optional(),
  className: z.string().trim().max(40).optional(),
  startDate: z.string().trim().max(20).optional(),
  endDate: z.string().trim().max(20).optional(),
  status: z
    .enum(["draft", "scheduled", "ongoing", "completed", "cancelled"])
    .optional(),
  papers: z
    .array(
      z.object({
        subjectId: z.string().optional(),
        subjectCode: z.string().optional(),
        subjectName: z.string().min(1),
        maxMarks: z.number().int().min(1).max(1000).optional(),
        examDate: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        room: z.string().optional(),
      }),
    )
    .optional(),
  schoolId: z.string().trim().optional(),
});

export const erpExamMarkUpsertSchema = z.object({
  examId: z.string().trim().min(1),
  studentProfileId: z.string().trim().min(1),
  subjectName: z.string().trim().min(1),
  subjectCode: z.string().trim().optional(),
  maxMarks: z.number().int().min(1).optional(),
  marksObtained: z.number().min(0),
  remarks: z.string().trim().max(400).optional(),
  schoolId: z.string().trim().optional(),
});

export const erpFeeStructureSchema = z.object({
  name: z.string().trim().min(2).max(120),
  academicYear: z.string().trim().min(4).max(20),
  className: z.string().trim().max(40).optional(),
  termLabel: z.string().trim().max(80).optional(),
  active: z.boolean().optional(),
  heads: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(40),
        label: z.string().trim().min(1).max(80),
        amountPaise: z.number().int().min(0),
      }),
    )
    .min(1),
  schoolId: z.string().trim().optional(),
});

export const erpStaffUpsertSchema = z.object({
  name: z.string().trim().min(2).max(120),
  employeeId: z.string().trim().max(40).optional(),
  designation: z.string().trim().max(80).optional(),
  subjects: z.array(z.string().trim().max(40)).optional(),
  classSectionIds: z.array(z.string().trim()).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(120).optional(),
  userId: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  schoolId: z.string().trim().optional(),
});
