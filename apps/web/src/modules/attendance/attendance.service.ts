import { attendanceRepository } from "@/modules/attendance/attendance.repository";

export const attendanceService = {
  async todaySummary(schoolId: string, dateKey?: string) {
    const day = dateKey || new Date().toISOString().slice(0, 10);
    const desks = await attendanceRepository.desksBySchool(schoolId);
    const classes = desks.map((d) => {
      const marks = (d.attendanceByDay || {})[day] || {};
      const values = Object.values(marks);
      return {
        className: d.className,
        rosterCount: (d.roster || []).length,
        marked: values.length,
        present: values.filter((m) => m === "P").length,
        leave: values.filter((m) => m === "L").length,
        absent: values.filter((m) => m === "A").length,
        late: values.filter((m) => m === "T").length,
        halfDay: values.filter((m) => m === "H").length,
      };
    });
    return { date: day, classes };
  },
};
