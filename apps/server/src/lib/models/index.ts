/**
 * Mongoose models grouped by domain.
 *
 * Prefer: `import { User } from "@/lib/models/core/User"`
 * Or barrels below for multi-imports.
 */
export * from "./core/School";
export * from "./core/User";
export * from "./core/Class";
export * from "./core/OtpChallenge";
export * from "./core/TeacherInvite";
export * from "./core/StudentEnrollment";
export * from "./core/AdminData";

export * from "./comms/Chat";
export * from "./comms/Message";
export * from "./comms/Homework";
export * from "./comms/Notification";

export * from "./ops/Leave";
export * from "./ops/ClassDesk";
export * from "./ops/BusRoute";
export * from "./ops/BusState";

export * from "./family/StudentEngage";
export * from "./family/ParentStudentLink";
export * from "./family/FeeAccount";

export * from "./erp/StudentProfile";
export * from "./erp/StaffProfile";
export * from "./erp/AdmissionApplication";
export * from "./erp/Subject";
export * from "./erp/Exam";
export * from "./erp/ExamMark";
export * from "./erp/FeeStructure";
export * from "./erp/FeeInvoice";
export * from "./erp/FeePayment";
export * from "./erp/AcademicSession";
export * from "./erp/BranchTransfer";
export * from "./erp/ErpAuditLog";
