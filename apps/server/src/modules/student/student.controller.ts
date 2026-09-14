import { jsonError, jsonOk } from "@/shared";
import { assertPermission, tenantSchoolId } from "@/shared/tenant/scope";
import { studentService } from "@/modules/student/student.service";
import { writeErpAudit } from "@/lib/server/services/erp";
import type { UserDoc } from "@/lib/models/core/User";
import mongoose from "mongoose";

export const studentController = {
  async list(req: Request, user: UserDoc) {
    const denied = assertPermission(user, "student:read");
    if (denied) return denied;

    const url = new URL(req.url);
    const scope = tenantSchoolId(user, url.searchParams.get("schoolId"));
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);

    const students = await studentService.list({
      schoolId: scope.schoolId,
      q: url.searchParams.get("q") || undefined,
      status: url.searchParams.get("status") || undefined,
      className: url.searchParams.get("className") || undefined,
    });
    return jsonOk({ students });
  },

  async get(req: Request, user: UserDoc, id: string) {
    const denied = assertPermission(user, "student:read");
    if (denied) return denied;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid id");
    }

    const url = new URL(req.url);
    const scope = tenantSchoolId(user, url.searchParams.get("schoolId"));
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);

    const student = await studentService.get(id, scope.schoolId);
    if (!student) return jsonError("Not found", 404);
    return jsonOk({ student });
  },

  async create(req: Request, user: UserDoc) {
    const denied = assertPermission(user, "student:write");
    if (denied) return denied;

    const body = await req.json();
    const scope = tenantSchoolId(user, body.schoolId);
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);

    const result = await studentService.create(scope.schoolId, body);
    if ("error" in result && result.error) {
      return jsonError(result.error);
    }
    await writeErpAudit({
      user,
      schoolId: scope.schoolId,
      action: "create",
      entityType: "StudentProfile",
      entityId: result.student!.id,
    });
    return jsonOk({ student: result.student }, 201);
  },

  async update(req: Request, user: UserDoc, id: string) {
    const denied = assertPermission(user, "student:write");
    if (denied) return denied;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid id");
    }

    const body = await req.json();
    const scope = tenantSchoolId(user, body.schoolId);
    if (scope.error) return scope.error;
    if (!scope.schoolId) return jsonError("schoolId required", 400);

    const result = await studentService.update(id, scope.schoolId, body);
    if ("error" in result && result.error) {
      return jsonError(result.error, "status" in result ? result.status : 400);
    }
    await writeErpAudit({
      user,
      schoolId: scope.schoolId,
      action: "update",
      entityType: "StudentProfile",
      entityId: id,
    });
    return jsonOk({ student: result.student });
  },
};
