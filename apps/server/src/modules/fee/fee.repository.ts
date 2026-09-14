import {
  FeeStructure,
  feeStructureToClient,
  FeeInvoice,
  feeInvoiceToClient,
  FeePayment,
  feePaymentToClient,
} from "@/modules/fee/fee.model";
import { withTenantFilter } from "@/shared/tenant/scope";

export const feeRepository = {
  async listStructures(schoolId: string) {
    return FeeStructure.find(withTenantFilter(schoolId))
      .sort({ createdAt: -1 })
      .limit(100);
  },
  async listInvoices(schoolId: string) {
    return FeeInvoice.find(withTenantFilter(schoolId))
      .sort({ createdAt: -1 })
      .limit(200);
  },
  async listPayments(schoolId: string) {
    return FeePayment.find(withTenantFilter(schoolId))
      .sort({ paidAt: -1 })
      .limit(200);
  },
  structureToClient: feeStructureToClient,
  invoiceToClient: feeInvoiceToClient,
  paymentToClient: feePaymentToClient,
};
