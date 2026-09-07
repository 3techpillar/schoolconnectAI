import { Chat } from "@/lib/models/comms/Chat";
import { ClassDesk } from "@/lib/models/ops/ClassDesk";
import { Homework } from "@/lib/models/comms/Homework";
import { Message } from "@/lib/models/comms/Message";
import { Notification } from "@/lib/models/comms/Notification";
import { BusRoute } from "@/lib/models/ops/BusRoute";
import { FeeAccount } from "@/lib/models/family/FeeAccount";
import { User } from "@/lib/models/core/User";
import {
  DEFAULT_BUS_STOPS,
  DEFAULT_ROUTE_PATH,
} from "@/lib/shared/bus-defaults";
import type { Types } from "mongoose";
import { addDaysIso, formatDueLabel, toIsoDate } from "@/lib/shared/dates";

/** One in-flight seed per school — concurrent GET /chats+/notifications share it. */
const ensureInflight = new Map<string, Promise<void>>();

/** Idempotent demo seed for a school so empty DB is usable. */
export async function ensureSchoolDemoData(schoolId: Types.ObjectId) {
  const key = String(schoolId);
  const existing = ensureInflight.get(key);
  if (existing) return existing;

  const run = ensureSchoolDemoDataInner(schoolId).finally(() => {
    ensureInflight.delete(key);
  });
  ensureInflight.set(key, run);
  return run;
}

async function ensureSchoolDemoDataInner(schoolId: Types.ObjectId) {
  const chatCount = await Chat.countDocuments({ schoolId });
  if (chatCount === 0) {
    const now = Date.now();
    await Chat.insertMany([
      {
        slug: "class-6b",
        schoolId,
        title: "Class 6-B",
        subtitle: "Ms. Kapoor · Daily updates",
        kind: "class",
        className: "6-B",
        avatar: "6B",
        pinned: true,
        lastMessageAt: now - 1000 * 60 * 12,
      },
      {
        slug: "teacher-kapoor",
        schoolId,
        title: "Ms. Kapoor",
        subtitle: "Class teacher",
        kind: "teacher",
        className: "6-B",
        avatar: "MK",
        lastMessageAt: now - 1000 * 60 * 55,
      },
      {
        slug: "school-office",
        schoolId,
        title: "School Office",
        subtitle: "Circulars & announcements",
        kind: "school",
        avatar: "SO",
        lastMessageAt: now - 1000 * 60 * 60 * 5,
      },
      {
        slug: "bus-route-12",
        schoolId,
        title: "Bus Route 12",
        subtitle: "Transport updates",
        kind: "bus",
        avatar: "B12",
        lastMessageAt: now - 1000 * 60 * 60 * 26,
      },
    ]);

    await Message.insertMany([
      {
        chatSlug: "class-6b",
        schoolId,
        kind: "daily_activity",
        text: "Today we completed fractions revision and a short quiz. Most students did well. Please revise exercise 4.1 at home.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAtMs: now - 1000 * 60 * 60 * 6,
        meta: { activityDate: "Today", subject: "Math" },
        readBy: ["teacher-1"],
      },
      {
        chatSlug: "class-6b",
        schoolId,
        kind: "homework",
        text: "Homework posted: Exercise 4.2 — Fractions. Due tomorrow.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAtMs: now - 1000 * 60 * 60 * 5,
        meta: { subject: "Math", due: "Tomorrow", status: "pending" },
        readBy: ["teacher-1"],
      },
      {
        chatSlug: "school-office",
        schoolId,
        kind: "text",
        text: "Welcome to SchoolConnect. Circulars and fee reminders will appear here.",
        senderId: "school",
        senderName: "School Office",
        senderRole: "school",
        createdAtMs: now - 1000 * 60 * 60 * 48,
        readBy: ["school"],
      },
      {
        chatSlug: "bus-route-12",
        schoolId,
        kind: "text",
        text: "Route 12 morning pickup starts at 7:30 AM from Monday.",
        senderId: "bus-1",
        senderName: "Transport Desk",
        senderRole: "bus_attendant",
        createdAtMs: now - 1000 * 60 * 60 * 26,
        readBy: ["bus-1"],
      },
    ]);

    // Seed unread for parents/students so list badges work on first login.
    const recipients = await User.find({
      schoolId,
      role: { $in: ["parent", "student"] },
    })
      .select("_id")
      .lean();
    const recipientIds = recipients.map((u) => String(u._id));
    if (recipientIds.length > 0) {
      const counts = Object.fromEntries(recipientIds.map((id) => [id, 2]));
      await Chat.updateMany(
        { schoolId, slug: { $in: ["class-6b", "school-office"] } },
        { $set: { unreadBy: recipientIds, unreadCounts: counts } },
      );
    }
  }

  const hwCount = await Homework.countDocuments({ schoolId });
  if (hwCount === 0) {
    const now = Date.now();
    const today = toIsoDate();
    const items = [
      {
        subject: "Math",
        title: "Exercise 4.2 — Fractions",
        dueDate: addDaysIso(today, 1),
        priority: "high" as const,
        status: "pending" as const,
      },
      {
        subject: "Science",
        title: "Plant cell diagram",
        dueDate: addDaysIso(today, 4),
        priority: "medium" as const,
        status: "in-progress" as const,
      },
      {
        subject: "English",
        title: "Read Chapter 7 & answer Qs",
        dueDate: addDaysIso(today, 7),
        priority: "low" as const,
        status: "pending" as const,
      },
    ];
    await Homework.insertMany(
      items.map((h) => ({
        schoolId,
        subject: h.subject,
        title: h.title,
        dueDate: h.dueDate,
        due: formatDueLabel(h.dueDate),
        priority: h.priority,
        status: h.status,
        attachments: 0,
        className: "6-B",
        postedBy: "Ms. Kapoor",
        createdAtMs: now,
      })),
    );
  }

  const notifCount = await Notification.countDocuments({ schoolId });
  if (notifCount === 0) {
    const now = Date.now();
    await Notification.insertMany([
      {
        schoolId,
        title: "Event · Annual Sports Day on 5 July",
        body: "Dear parents, the annual sports day will be held on 5 July.",
        type: "circular",
        href: "/circulars",
        createdAtMs: now - 1000 * 60 * 12,
        readBy: [],
      },
      {
        schoolId,
        title: "New homework · Math",
        body: "Exercise 4.2 — Fractions due tomorrow",
        type: "homework",
        href: "/homework",
        createdAtMs: now - 1000 * 60 * 20,
        readBy: [],
      },
      {
        schoolId,
        title: "Daily activity · Class 6-B",
        body: "Ms. Kapoor posted today’s class update",
        type: "activity",
        href: "/chats/class-6b",
        createdAtMs: now - 1000 * 60 * 45,
        readBy: [],
      },
      {
        schoolId,
        title: "Fee reminder",
        body: "Term 2 fees are due this week. Pay from the Fees tab.",
        type: "fees",
        href: "/fees",
        createdAtMs: now - 1000 * 60 * 60 * 6,
        readBy: [],
      },
    ]);
  }

  const desk = await ClassDesk.findOne({ schoolId, className: "6-B" });
  const recipients = await User.find({
    schoolId,
    role: { $in: ["parent", "student"] },
  })
    .select("_id")
    .lean();
  const unreadBy = recipients.map((u) => String(u._id));

  if (!desk) {
    const day = new Date().toISOString().slice(0, 10);
    const roster = [
      ["st-aarav", "Aarav Sharma", "01", "Priya Sharma", "AS"],
      ["st-ananya", "Ananya Iyer", "02", "Meera Iyer", "AI"],
      ["st-kabir", "Kabir Khan", "03", "Imran Khan", "KK"],
      ["st-diya", "Diya Patel", "04", "Neha Patel", "DP"],
      ["st-vivaan", "Vivaan Reddy", "05", "Sneha Reddy", "VR"],
      ["st-isha", "Isha Gupta", "06", "Ritu Gupta", "IG"],
    ].map(([key, name, rollNo, parentName, avatar]) => ({
      key,
      name,
      rollNo,
      parentName,
      avatar,
      parentChatId: `parent-${key}`,
      className: "6-B",
    }));
    const marks: Record<string, string> = {};
    roster.forEach((s, i) => {
      marks[s.key] = i === 2 ? "A" : i === 4 ? "L" : "P";
    });

    await ClassDesk.create({
      schoolId,
      className: "6-B",
      roster,
      attendanceByDay: { [day]: marks },
      circulars: [
        {
          key: "c1",
          title: "Annual Sports Day on 5 July",
          body: "Dear parents, the annual sports day will be held on 5 July.",
          tag: "Event",
          createdAt: Date.now() - 1000 * 60 * 12,
          unreadBy,
          postedBy: "School Office",
          className: "6-B",
        },
        {
          key: "c2",
          title: "Parent-Teacher meeting — Grade 6",
          body: "Scheduled this Saturday, 10 AM to 1 PM.",
          tag: "PTM",
          createdAt: Date.now() - 1000 * 60 * 120,
          unreadBy,
          postedBy: "School Office",
          className: "6-B",
        },
      ],
    });
  } else if (unreadBy.length > 0) {
    // Backfill unread flags for older demos that seeded empty unreadBy.
    const circulars = (desk.circulars || []).map((c) => ({
      key: c.key,
      title: c.title,
      body: c.body,
      tag: c.tag,
      createdAt: c.createdAt,
      unreadBy: (c.unreadBy || []).length ? c.unreadBy : unreadBy,
      postedBy: c.postedBy,
      className: c.className || "6-B",
    }));
    const needsBackfill = (desk.circulars || []).some(
      (c) => !(c.unreadBy || []).length,
    );
    if (needsBackfill) {
      await ClassDesk.updateOne(
        { _id: desk._id },
        { $set: { circulars } },
      );
    }
  }

  const circularNotifCount = await Notification.countDocuments({
    schoolId,
    type: "circular",
  });
  if (circularNotifCount === 0) {
    await Notification.create({
      schoolId,
      title: "Event · Annual Sports Day on 5 July",
      body: "Dear parents, the annual sports day will be held on 5 July.",
      type: "circular",
      href: "/circulars",
      createdAtMs: Date.now() - 1000 * 60 * 12,
      readBy: [],
    });
  }

  const { School } = await import("@/lib/models/core/School");
  const school = await School.findById(schoolId);
  const schoolCode = String(school?.code || "SCH")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "SCH";

  try {
    await BusRoute.collection.dropIndex("routeId_1");
  } catch {
    /* unique-per-routeId dropped in favor of schoolId+routeId */
  }

  let route = await BusRoute.findOne({ schoolId, routeId: "route-12" });
  if (!route) {
    route = await BusRoute.create({
      routeId: "route-12",
      schoolId,
      name: "Route 12",
      pathSvg: DEFAULT_ROUTE_PATH,
      stops: DEFAULT_BUS_STOPS,
    });
  } else if (!route.stops?.length) {
    route.stops = DEFAULT_BUS_STOPS as typeof route.stops;
    route.pathSvg = route.pathSvg || DEFAULT_ROUTE_PATH;
    await route.save();
  }

  const feeUsers = await User.find({
    schoolId,
    role: { $in: ["parent", "student"] },
  }).limit(10);
  for (const u of feeUsers) {
    const existing = await FeeAccount.findOne({
      schoolId,
      userId: u._id,
    });
    if (existing) continue;
    await FeeAccount.create({
      schoolId,
      userId: u._id,
      termLabel: "Term 2 · 2025-26",
      outstandingPaise: 420000,
      basePaise: 400000,
      penaltyPaise: 20000,
      dueDate: "2026-06-28",
      dueDateLabel: "28 Jun 2026",
      overdue: true,
      paidYearPaise: 3880000,
      annualPaise: 4300000,
      history: [
        {
          title: "Term 1 fees",
          dateLabel: "12 Apr 2026",
          amountLabel: "₹15,200",
          amountPaise: 1520000,
        },
        {
          title: "Bus fee — Q1",
          dateLabel: "12 Apr 2026",
          amountLabel: "₹6,500",
          amountPaise: 650000,
        },
        {
          title: "Admission fee",
          dateLabel: "20 Mar 2026",
          amountLabel: "₹17,100",
          amountPaise: 1710000,
        },
      ],
    });
  }

  // ERP StudentProfile MDM + ClassDesk roster linkage (once per school)
  const { StudentProfile } = await import("@/lib/models/erp/StudentProfile");
  const { ClassModel } = await import("@/lib/models/core/Class");
  const classDoc = await ClassModel.findOne({ schoolId, className: "6-B" });
  const teacher = await User.findOne({
    schoolId,
    role: "class_teacher",
  });
  const profileCount = await StudentProfile.countDocuments({ schoolId });
  if (profileCount === 0) {
    const { upsertStudentProfileAndSyncRoster } = await import(
      "@/lib/server/services/student-sync"
    );
    const campusStudent = await User.findOne({
      schoolId,
      role: "student",
      identifier: { $not: /transfer|cross\./i },
    });
    const campusParent = await User.findOne({ schoolId, role: "parent" });
    const rosterSeed = [
      [
        campusStudent?.name || "Aarav Sharma",
        "01",
        campusParent?.name || "Priya Sharma",
        `${schoolCode}-6B-01`,
      ],
      ["Ananya Iyer", "02", "Meera Iyer", `${schoolCode}-6B-02`],
      ["Kabir Khan", "03", "Imran Khan", `${schoolCode}-6B-03`],
      ["Diya Patel", "04", "Neha Patel", `${schoolCode}-6B-04`],
      ["Vivaan Reddy", "05", "Sneha Reddy", `${schoolCode}-6B-05`],
      ["Isha Gupta", "06", "Ritu Gupta", `${schoolCode}-6B-06`],
    ] as const;
    for (const [name, rollNo, parentName, admissionNo] of rosterSeed) {
      await upsertStudentProfileAndSyncRoster({
        schoolId,
        name,
        className: "6-B",
        classSectionId: classDoc?._id,
        rollNo,
        admissionNo,
        userId:
          campusStudent && name === campusStudent.name
            ? campusStudent._id
            : undefined,
        guardians: [
          {
            name: parentName,
            relationship: "guardian",
            isPrimary: true,
            userId:
              campusParent && parentName === campusParent.name
                ? campusParent._id
                : undefined,
          },
        ],
        status: "enrolled",
        academicYear: "2025-26",
      });
    }
  }

  const { AcademicSession } = await import("@/lib/models/erp/AcademicSession");
  const sessionExists = await AcademicSession.findOne({
    schoolId,
    label: "2025-26",
  });
  if (!sessionExists) {
    await AcademicSession.create({
      schoolId,
      label: "2025-26",
      status: "active",
      startDate: "2025-04-01",
      endDate: "2026-03-31",
    });
  }

  const { StaffProfile } = await import("@/lib/models/erp/StaffProfile");
  const staffRoleLabel: Record<string, { designation: string; subjects: string[] }> = {
    admin: { designation: "School Admin", subjects: [] },
    principal: { designation: "Principal", subjects: [] },
    class_teacher: { designation: "Class Teacher", subjects: ["Math", "Science"] },
    accountant: { designation: "Accountant", subjects: [] },
    bus_attendant: { designation: "Bus Attendant", subjects: [] },
  };
  const staffUsers = await User.find({
    schoolId,
    role: {
      $in: ["admin", "principal", "class_teacher", "accountant", "bus_attendant"],
    },
  });
  let emp = 1;
  for (const u of staffUsers) {
    const meta = staffRoleLabel[u.role] || {
      designation: u.role,
      subjects: [] as string[],
    };
    const staffExists = await StaffProfile.findOne({
      schoolId,
      userId: u._id,
    });
    if (!staffExists) {
      await StaffProfile.create({
        schoolId,
        name: u.name,
        userId: u._id,
        employeeId: `EMP-${schoolCode}-${String(emp).padStart(3, "0")}`,
        designation: meta.designation,
        subjects: meta.subjects,
        classSectionIds:
          u.role === "class_teacher" && classDoc?._id ? [classDoc._id] : [],
        email: u.identifier,
        status: "active",
      });
    }
    emp += 1;
  }

  if (classDoc && !(classDoc.periods || []).length) {
    const days = ["mon", "tue", "wed", "thu", "fri"] as const;
    classDoc.periods = days.flatMap((day, di) =>
      [1, 2, 3, 4].map((period) => ({
        day,
        period,
        subject: ["Math", "Science", "English", "SST"][(period + di) % 4],
        teacherName: teacher?.name || "Class Teacher",
        startTime: `${7 + period}:30`,
        endTime: `${8 + period}:10`,
      })),
    ) as typeof classDoc.periods;
    await classDoc.save();
  }

  const { FeeStructure } = await import("@/lib/models/erp/FeeStructure");
  const feeStruct = await FeeStructure.findOne({
    schoolId,
    name: "Term 2 tuition",
  });
  if (!feeStruct) {
    await FeeStructure.create({
      schoolId,
      name: "Term 2 tuition",
      academicYear: "2025-26",
      className: "6-B",
      termLabel: "Term 2 · 2025-26",
      heads: [
        { key: "tuition", label: "Tuition", amountPaise: 400000 },
        { key: "activity", label: "Activity", amountPaise: 20000 },
      ],
      active: true,
    });
  }

  const { Subject } = await import("@/lib/models/erp/Subject");
  const subjectSeed = [
    ["MATH", "Mathematics"],
    ["SCI", "Science"],
    ["ENG", "English"],
    ["SST", "Social Studies"],
  ] as const;
  for (const [code, name] of subjectSeed) {
    const exists = await Subject.findOne({
      schoolId,
      code,
      className: "6-B",
    });
    if (!exists) {
      await Subject.create({
        schoolId,
        code,
        name,
        className: "6-B",
        teacherName: teacher?.name || "Ms. Sharma",
        teacherUserId: teacher?._id,
        mandatory: true,
        active: true,
      });
    }
  }
}
