import { getAttendanceSummary } from "@/lib/server/attendance-service";
import { ensureFeeAccount, feeAccountToClient } from "@/lib/server/fees-service";
import { buildHomeFeed, homeworkStats } from "@/lib/server/feed-service";
import { getPrimaryLinkedStudent } from "@/lib/server/link-service";
import type { User } from "@/lib/models/User";

type UserInstance = InstanceType<typeof User>;

export type AiChatReply = {
  reply: string;
  metrics?: Array<{ label: string; value: string; tone: string }>;
  suggestions?: string[];
};

function normalize(q: string) {
  return q.toLowerCase().trim();
}

/**
 * Rule-based school assistant (swap for LLM later).
 * Uses live attendance, fees, homework, and circulars when available.
 */
export async function answerSchoolQuestion(
  user: UserInstance,
  message: string,
): Promise<AiChatReply> {
  const q = normalize(message);
  const linked =
    user.role === "parent" ? await getPrimaryLinkedStudent(user) : null;
  const name =
    linked?.name?.split(" ")[0] ||
    (user.role === "parent" && user.childName
      ? user.childName.split(" ")[0]
      : user.name.split(" ")[0]);

  const [attendance, homework, feed, feesDoc] = await Promise.all([
    getAttendanceSummary(user),
    homeworkStats(user),
    buildHomeFeed(user, { limit: 3 }),
    user.schoolId ? ensureFeeAccount(user) : Promise.resolve(null),
  ]);

  const fees = feesDoc ? feeAccountToClient(feesDoc) : null;
  const pendingHw = homework.pending;
  const circular = feed.find((f) => f.kind === "circular");
  const pendingItem = feed.find(
    (f) => f.kind === "homework" && f.badge?.label === "Pending",
  );

  if (/fee|fees|payment|pay|due|outstanding/.test(q)) {
    return {
      reply: fees
        ? fees.outstandingPaise > 0
          ? `${name}'s fee status: ${fees.outstanding} outstanding (${fees.overdue ? "overdue" : "due"} ${fees.dueDateLabel}). Paid this year: ${fees.paidThisYear}.`
          : `Great news — no fees outstanding for ${name}. Paid this year: ${fees.paidThisYear}.`
        : "I could not load the fee ledger right now.",
      metrics: fees
        ? [
            {
              label: "Due",
              value: fees.outstanding,
              tone: fees.outstandingPaise > 0 ? "tone-warning" : "tone-success",
            },
            { label: "Paid YTD", value: fees.paidThisYear, tone: "tone-info" },
          ]
        : undefined,
      suggestions: ["Any pending homework?", "How is attendance?"],
    };
  }

  if (/attend|present|absent|percentage|%/.test(q)) {
    return {
      reply:
        attendance.percent == null
          ? `No attendance marks for this month yet for ${name}'s class.`
          : `${name}'s attendance this month is ${attendance.label} (${attendance.present}/${attendance.total} days counted).`,
      metrics: [
        {
          label: "Attend.",
          value: attendance.label,
          tone: "tone-success",
        },
        {
          label: "Days",
          value: String(attendance.total),
          tone: "tone-info",
        },
      ],
      suggestions: ["Any pending homework?", "Show fee status"],
    };
  }

  if (/homework|assignment|hw|pending work/.test(q)) {
    return {
      reply:
        pendingHw > 0
          ? `${name} has ${pendingHw} pending homework item${pendingHw === 1 ? "" : "s"} out of ${homework.total}. ${pendingItem ? `Next up: ${pendingItem.title}.` : ""}`
          : homework.total > 0
            ? `All ${homework.total} homework items look clear for ${name}. Nice work!`
            : "No homework posts found for this class yet.",
      metrics: [
        {
          label: "HW",
          value: `${homework.total - pendingHw}/${homework.total || 0}`,
          tone: "tone-info",
        },
        {
          label: "Pending",
          value: String(pendingHw),
          tone: pendingHw ? "tone-warning" : "tone-success",
        },
      ],
      suggestions: ["How is attendance?", "Any circulars?"],
    };
  }

  if (/ptm|meeting|circular|notice|event|sports|announce/.test(q)) {
    return {
      reply: circular
        ? `Latest notice: “${circular.title}”. ${circular.meta}. Open Circulars for full details.`
        : "No recent circulars in the feed. Check Circulars for school notices and PTM dates.",
      suggestions: ["Show fee status", "Any pending homework?"],
    };
  }

  if (/how.*(doing|week)|snapshot|summary|update/.test(q)) {
    return {
      reply: `Here's a quick snapshot for ${name}:`,
      metrics: [
        {
          label: "Attend.",
          value: attendance.label,
          tone: "tone-success",
        },
        {
          label: "HW done",
          value: `${Math.max(0, homework.total - pendingHw)}/${homework.total || 0}`,
          tone: "tone-info",
        },
        {
          label: "Fees",
          value: fees?.outstanding || "—",
          tone:
            fees && fees.outstandingPaise > 0 ? "tone-warning" : "tone-secondary",
        },
      ],
      suggestions: [
        "Any pending homework?",
        "Show fee status",
        "When is the next PTM?",
      ],
    };
  }

  return {
    reply: `I can help with attendance, homework, fees, and circulars for ${name}. Try one of the suggestions below.`,
    suggestions: [
      `How is ${name} doing this week?`,
      "Any pending homework?",
      "Show fee status",
      "Any circulars?",
    ],
  };
}
