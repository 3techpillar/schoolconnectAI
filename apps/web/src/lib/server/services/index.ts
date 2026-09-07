/**
 * Domain services (business logic) for `/api` routes.
 * HTTP/auth plumbing stays in `../` (`http.ts`, `auth.ts`, `response.ts`, …).
 */
export * from "./ai-service";
export * from "./attendance-service";
export * from "./bus-service";
export * from "./chat-service";
export * from "./circular-service";
export * from "./csv";
export * from "./engage-service";
export * from "./enrollment-service";
export * from "./erp";
export * from "./feed-service";
export * from "./fees-service";
export * from "./leave-attendance";
export * from "./link-service";
export * from "./otp-service";
export * from "./school-group";
export * from "./seed-school";
export * from "./student-sync";
