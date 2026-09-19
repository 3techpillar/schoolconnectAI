import { Homework, homeworkToClient } from "@/lib/models/comms/Homework";
import { jsonError, jsonOk } from "@/lib/server/auth";
import { requireUser } from "@/lib/server/http";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireUser();
  if (error || !user) return error!;

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Invalid homework id");
  }

  const body = (await req.json()) as {
    status?: "pending" | "in-progress" | "submitted" | "reviewed";
    submission?: {
      content?: string;
      attachmentUrl?: string;
    };
    grading?: {
      studentId: string;
      grade?: string;
      feedback?: string;
      status?: "reviewed" | "resubmit";
    };
  };

  const hw = await Homework.findById(id);
  if (!hw) return jsonError("Not found", 404);
  if (
    user.schoolId &&
    String(hw.schoolId) !== String(user.schoolId) &&
    user.role !== "super_admin"
  ) {
    return jsonError("Forbidden", 403);
  }

  if (body.submission) {
    const studentId = String(user._id);
    const existingIdx = (hw.submissions || []).findIndex(
      (s) => s.studentId === studentId,
    );
    const subData = {
      studentId,
      studentName: user.name,
      submittedAtMs: Date.now(),
      content: body.submission.content || "",
      attachmentUrl: body.submission.attachmentUrl || "",
      status: "submitted" as const,
    };

    if (existingIdx >= 0 && hw.submissions) {
      hw.submissions[existingIdx] = {
        ...hw.submissions[existingIdx],
        ...subData,
      };
    } else {
      hw.submissions.push(subData as never);
    }
    hw.status = "submitted";
  } else if (body.grading && body.grading.studentId) {
    const existingIdx = (hw.submissions || []).findIndex(
      (s) => s.studentId === body.grading?.studentId,
    );
    if (existingIdx >= 0 && hw.submissions) {
      if (body.grading.grade !== undefined) {
        hw.submissions[existingIdx].grade = body.grading.grade;
      }
      if (body.grading.feedback !== undefined) {
        hw.submissions[existingIdx].feedback = body.grading.feedback;
      }
      if (body.grading.status) {
        hw.submissions[existingIdx].status = body.grading.status;
      }
    }
    hw.status = "reviewed";
  } else if (body.status) {
    hw.status = body.status;
  }

  await hw.save();
  return jsonOk({ homework: homeworkToClient(hw) });
}
