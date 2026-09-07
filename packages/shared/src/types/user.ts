import type { Role } from "../roles";

export interface ClassHistoryEntry {
  sessionId: string;
  sessionLabel: string;
  className: string;
  result: "pass" | "fail" | "pending";
  promotedTo?: string;
  at: number;
}

export interface UserProfile {
  id: string;
  identifier: string;
  identifierType: "email" | "phone";
  name: string;
  role: Role;
  school: string;
  schoolId?: string;
  className?: string;
  classId?: string;
  childName?: string;
  /** Parents: guardian (trust dashboard) or student (same app as child). */
  parentAccess?: "guardian" | "student";
  academicYear?: string;
  classHistory?: ClassHistoryEntry[];
  busRouteId?: string;
  homeStopId?: string;
  busAlert10?: boolean;
  busAlert5?: boolean;
  enrollmentStatus?: "pending" | "approved" | "rejected";
  inviteCode?: string;
  /** School product mode + module flags (from /api/me). */
  productMode?: "connect" | "erp";
  capabilities?: Partial<
    Record<
      | "chats"
      | "homework"
      | "circulars"
      | "notifications"
      | "bus"
      | "leaves"
      | "attendance"
      | "admin"
      | "fees"
      | "exams"
      | "erp",
      boolean
    >
  >;
  transferPolicy?: "group_only" | "open";
  subscriptionPlan?: "free" | "paid";
  subscriptionExpiresAt?: number;
  subscriptionActive?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export type StudentStatus =
  | "prospect"
  | "enrolled"
  | "alumni"
  | "left"
  | "inactive";
export type GuardianRelationship = "father" | "mother" | "guardian" | "other";

export interface StudentGuardian {
  name: string;
  relationship: GuardianRelationship;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  userId?: string;
}

export interface StudentMedical {
  allergies?: string;
  conditions?: string;
  emergencyNotes?: string;
  doctorContact?: string;
}

export interface StudentProfileDto {
  id: string;
  schoolId: string;
  branchId?: string;
  studentId?: string;
  admissionNo?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  dob?: string;
  gender?: "male" | "female" | "other" | "unspecified";
  photoUrl?: string;
  bloodGroup?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  mobile?: string;
  email?: string;
  guardians: StudentGuardian[];
  medical?: StudentMedical;
  admissionDate?: string;
  previousSchool?: string;
  classSectionId?: string;
  className?: string;
  rollNo?: string;
  status: StudentStatus;
  userId?: string;
  academicYear?: string;
  note?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface SchoolDto {
  id: string;
  name: string;
  code?: string;
  city?: string;
  board?: string;
  address?: string;
  phone?: string;
  email?: string;
  academicYearCurrent?: string;
  parentSchoolId?: string;
  branchName?: string;
  logoUrl?: string;
  groupCode?: string;
  productMode: "connect" | "erp";
  transferPolicy?: "group_only" | "open";
  subscriptionPlan?: "free" | "paid";
  subscriptionStartsAt?: number;
  subscriptionExpiresAt?: number;
  subscriptionActive?: boolean;
  status: "active" | "paused";
  settings?: Record<string, unknown>;
  capabilities?: Record<string, boolean>;
  createdAt: number;
  updatedAt?: number;
}

export interface ClassSectionDto {
  id: string;
  schoolId: string;
  grade: string;
  section: string;
  className: string;
  classTeacherId?: string;
  capacity?: number;
  periods?: Array<{
    day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
    period: number;
    subject?: string;
    teacherName?: string;
    startTime?: string;
    endTime?: string;
  }>;
  createdAt: number;
}

export interface AdmissionApplicationDto {
  id: string;
  schoolId: string;
  studentName: string;
  identifier?: string;
  applyingClassName: string;
  section?: string;
  status: string;
  documents?: Array<{
    key: string;
    label: string;
    status: "pending" | "received" | "waived";
    url?: string;
  }>;
  enrollmentId?: string;
  studentProfileId?: string;
  note?: string;
  createdAt: number;
}

export interface StaffProfileDto {
  id: string;
  schoolId: string;
  employeeId?: string;
  name: string;
  userId?: string;
  designation?: string;
  subjects: string[];
  classSectionIds: string[];
  phone?: string;
  email?: string;
  status: "active" | "inactive";
  createdAt: number;
}

export interface FeeStructureDto {
  id: string;
  schoolId: string;
  name: string;
  academicYear: string;
  className?: string;
  termLabel?: string;
  heads: Array<{ key: string; label: string; amountPaise: number }>;
  totalPaise: number;
  active: boolean;
  createdAt: number;
}

export interface FeeInvoiceDto {
  id: string;
  schoolId: string;
  studentProfileId: string;
  userId?: string;
  feeStructureId?: string;
  termLabel?: string;
  lines: Array<{ key: string; label: string; amountPaise: number }>;
  concessionPaise: number;
  totalPaise: number;
  paidPaise: number;
  dueDate?: string;
  status: "draft" | "issued" | "partial" | "paid" | "void";
  createdAt: number;
}

export type { HomeworkPriority, HomeworkStatus, MessageKind } from "./school";
