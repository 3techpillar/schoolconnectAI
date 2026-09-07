import {
  FeeAccount,
  feeAccountToClient,
} from "@/lib/models/family/FeeAccount";
import { User } from "@/lib/models/core/User";
import { formatInrPaise } from "@/lib/shared/money";

type FeeInstance = InstanceType<typeof FeeAccount>;
type UserInstance = InstanceType<typeof User>;

const DEFAULT_HISTORY = [
  {
    title: "Term 1 fees",
    dateLabel: "12 Apr 2026",
    amountLabel: "₹15,200",
    amountPaise: 1520000,
  },
  {
    title: "Bus fee — Q1",
    dateLabel: "12 Apr 2026",
    amountLabel: "₹6,500",
    amountPaise: 650000,
  },
  {
    title: "Admission fee",
    dateLabel: "20 Mar 2026",
    amountLabel: "₹17,100",
    amountPaise: 1710000,
  },
];

export async function ensureFeeAccount(user: UserInstance) {
  if (!user.schoolId) return null;
  let doc = await FeeAccount.findOne({
    schoolId: user.schoolId,
    userId: user._id,
  });
  if (!doc) {
    doc = await FeeAccount.create({
      schoolId: user.schoolId,
      userId: user._id,
      termLabel: "Term 2 · 2025-26",
      outstandingPaise: 420000,
      basePaise: 400000,
      penaltyPaise: 20000,
      dueDate: "2026-06-28",
      dueDateLabel: "28 Jun 2026",
      overdue: true,
      paidYearPaise: 3880000,
      annualPaise: 4300000,
      history: DEFAULT_HISTORY,
    });
  }
  return doc;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Demo payment: clears outstanding and appends a history row.
 * Replace with gateway callback later.
 */
export async function recordFeePayment(
  doc: FeeInstance,
  opts?: { title?: string },
) {
  const amount = doc.outstandingPaise || 0;
  if (amount <= 0) {
    return { doc, alreadyPaid: true as const };
  }

  const paidAt = Date.now();
  const title = opts?.title || `${doc.termLabel || "Term"} payment`;
  const prev = Array.isArray(doc.history) ? [...doc.history] : [];
  doc.set("history", [
    {
      title,
      dateLabel: todayLabel(),
      amountLabel: formatInrPaise(amount),
      amountPaise: amount,
      paidAt,
    },
    ...prev,
  ]);
  doc.paidYearPaise = (doc.paidYearPaise || 0) + amount;
  doc.outstandingPaise = 0;
  doc.basePaise = 0;
  doc.penaltyPaise = 0;
  doc.overdue = false;
  await doc.save();
  return { doc, alreadyPaid: false as const };
}

export { feeAccountToClient };
