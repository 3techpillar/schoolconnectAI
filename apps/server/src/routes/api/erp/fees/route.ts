import {
  FeeStructure,
  feeStructureToClient,
} from "@/lib/models/erp/FeeStructure";
import {
  FeeInvoice,
  feeInvoiceToClient,
} from "@/lib/models/erp/FeeInvoice";
import { StudentProfile } from "@/lib/models/erp/StudentProfile";
import { FeeAccount } from "@/lib/models/family/FeeAccount";
import { jsonError, jsonOk } from "@/lib/server/auth";
import {
  requireErpUser,
  resolveErpSchoolId,
  writeErpAudit,
} from "@/lib/server/services/erp";
import { withApiHandler } from "@/lib/server/http";
import { erpFeeStructureSchema } from "@schoolconnect/shared";
import mongoose from "mongoose";

export const GET = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const url = new URL(req.url);
  const scope = resolveErpSchoolId(user, url.searchParams.get("schoolId"));
  if (scope.error) return scope.error;
  if (!scope.schoolId) return jsonError("schoolId required", 400);

  const [structures, invoices] = await Promise.all([
    FeeStructure.find({ schoolId: scope.schoolId }).sort({ createdAt: -1 }).limit(100),
    FeeInvoice.find({ schoolId: scope.schoolId }).sort({ createdAt: -1 }).limit(200),
  ]);

  return jsonOk({
    structures: structures.map(feeStructureToClient),
    invoices: invoices.map(feeInvoiceToClient),
  });
});

export const POST = withApiHandler(async (req: Request) => {
  const { error, user } = await requireErpUser();
  if (error || !user) return error!;

  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action || "createStructure");

  if (action === "createStructure") {
    const parsed = erpFeeStructureSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid body");
    }
    const scope = resolveErpSchoolId(user, parsed.data.schoolId);
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);

    const doc = await FeeStructure.create({
      schoolId: scope.schoolId,
      name: parsed.data.name,
      academicYear: parsed.data.academicYear,
      className: parsed.data.className || "",
      termLabel: parsed.data.termLabel || "",
      heads: parsed.data.heads,
      active: parsed.data.active ?? true,
    });

    await writeErpAudit({
      user,
      schoolId: scope.schoolId,
      action: "create",
      entityType: "FeeStructure",
      entityId: String(doc._id),
    });

    return jsonOk({ structure: feeStructureToClient(doc) }, 201);
  }

  if (action === "generateInvoices") {
    const structureId = String(body.feeStructureId || "");
    const className = String(body.className || "");
    if (!mongoose.Types.ObjectId.isValid(structureId)) {
      return jsonError("feeStructureId required");
    }
    const structure = await FeeStructure.findById(structureId);
    if (!structure) return jsonError("Fee structure not found", 404);

    const scope = resolveErpSchoolId(user, String(structure.schoolId));
    if (scope.error) return scope.error;

    const targetClass = className || structure.className;
    const students = await StudentProfile.find({
      schoolId: structure.schoolId,
      status: "enrolled",
      ...(targetClass ? { className: targetClass } : {}),
    }).limit(500);

    const totalPaise = (structure.heads || []).reduce(
      (s, h) => s + (h.amountPaise || 0),
      0,
    );
    const created = [];
    for (const student of students) {
      const inv = await FeeInvoice.create({
        schoolId: structure.schoolId,
        studentProfileId: student._id,
        userId: student.userId,
        feeStructureId: structure._id,
        termLabel: structure.termLabel || structure.name,
        lines: structure.heads,
        concessionPaise: 0,
        totalPaise,
        paidPaise: 0,
        dueDate: String(body.dueDate || ""),
        status: "issued",
      });
      created.push(feeInvoiceToClient(inv));

      if (student.userId) {
        await FeeAccount.findOneAndUpdate(
          { schoolId: structure.schoolId, userId: student.userId },
          {
            $set: {
              termLabel: structure.termLabel || structure.name,
              outstandingPaise: totalPaise,
              basePaise: totalPaise,
              penaltyPaise: 0,
              dueDate: String(body.dueDate || ""),
              overdue: false,
            },
            $setOnInsert: {
              schoolId: structure.schoolId,
              userId: student.userId,
              paidYearPaise: 0,
              annualPaise: totalPaise * 2,
              history: [],
            },
          },
          { upsert: true },
        );
      }
    }

    await writeErpAudit({
      user,
      schoolId: structure.schoolId,
      action: "generateInvoices",
      entityType: "FeeInvoice",
      meta: { count: created.length, feeStructureId: structureId },
    });

    return jsonOk({ invoices: created, count: created.length }, 201);
  }

  if (action === "markPaid") {
    const invoiceId = String(body.invoiceId || "");
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return jsonError("invoiceId required");
    }
    const inv = await FeeInvoice.findById(invoiceId);
    if (!inv) return jsonError("Invoice not found", 404);
    const scope = resolveErpSchoolId(user, String(inv.schoolId));
    if (scope.error) return scope.error;

    inv.paidPaise = inv.totalPaise;
    inv.status = "paid";
    await inv.save();

    const { FeePayment } = await import("@/lib/models/erp/FeePayment");
    await FeePayment.create({
      schoolId: inv.schoolId,
      studentProfileId: inv.studentProfileId,
      userId: inv.userId,
      invoiceId: inv._id,
      amountPaise: inv.totalPaise,
      method: "demo",
      gateway: "erp-mark-paid",
      transactionId: `ERP-${String(inv._id).slice(-8)}-${Date.now()}`,
      status: "success",
      paidAt: Date.now(),
    });

    if (inv.userId) {
      await FeeAccount.findOneAndUpdate(
        { schoolId: inv.schoolId, userId: inv.userId },
        {
          $set: { outstandingPaise: 0, overdue: false },
          $inc: { paidYearPaise: inv.totalPaise },
          $push: {
            history: {
              title: inv.termLabel || "Fee payment",
              dateLabel: new Date().toLocaleDateString("en-IN"),
              amountLabel: `₹${Math.round(inv.totalPaise / 100).toLocaleString("en-IN")}`,
              amountPaise: inv.totalPaise,
              paidAt: Date.now(),
            },
          },
        },
      );
    }

    await writeErpAudit({
      user,
      schoolId: inv.schoolId,
      action: "markPaid",
      entityType: "FeeInvoice",
      entityId: String(inv._id),
    });

    return jsonOk({ invoice: feeInvoiceToClient(inv) });
  }

  return jsonError("Unknown action");
});
