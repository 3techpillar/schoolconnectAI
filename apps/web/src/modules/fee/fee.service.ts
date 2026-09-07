import { feeRepository } from "@/modules/fee/fee.repository";

export const feeService = {
  async overview(schoolId: string) {
    const [structures, invoices, payments] = await Promise.all([
      feeRepository.listStructures(schoolId),
      feeRepository.listInvoices(schoolId),
      feeRepository.listPayments(schoolId),
    ]);
    return {
      structures: structures.map(feeRepository.structureToClient),
      invoices: invoices.map(feeRepository.invoiceToClient),
      payments: payments.map(feeRepository.paymentToClient),
    };
  },
};
