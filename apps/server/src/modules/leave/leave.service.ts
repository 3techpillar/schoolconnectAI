import { leaveRepository } from "@/modules/leave/leave.repository";
import {
  applyApprovedLeaveToAttendance,
  clearLeaveAttendanceMarks,
} from "@/lib/server/services/leave-attendance";
import { Leave } from "@/modules/leave/leave.model";
import mongoose from "mongoose";

export const leaveService = {
  async list(schoolId: string, status?: string | null) {
    const rows = await leaveRepository.listBySchool(schoolId, status);
    return rows.map((l) => leaveRepository.toClient(l));
  },

  async review(
    id: string,
    schoolId: string,
    input: { status: "approved" | "rejected"; note?: string; reviewerName: string },
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { error: "Invalid id" as const };
    }
    const leave = await Leave.findOne({ _id: id, schoolId });
    if (!leave) return { error: "Not found" as const, status: 404 };

    leave.status = input.status;
    leave.reviewedBy = input.reviewerName;
    leave.reviewedAt = Date.now();
    if (input.note?.trim()) leave.note = input.note.trim();
    await leave.save();

    const attendanceSync =
      input.status === "approved"
        ? await applyApprovedLeaveToAttendance(leave)
        : await clearLeaveAttendanceMarks(leave);

    return {
      leave: leaveRepository.toClient(leave),
      attendanceSync,
    };
  },
};
