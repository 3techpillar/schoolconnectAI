/**
 * Seed demo schools, campuses, users, and sample branch transfer.
 *
 * Usage: npm run seed
 * Requires MONGODB_URI or MONGO_URI in .env / .env.local
 *
 * Demo OTP: 000000 (when demo mode is on)
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { Types } from "mongoose";

function loadEnvFile(name: string) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");
loadEnvFile("../../.env.local");
loadEnvFile("../../.env");

type Role =
  | "parent"
  | "student"
  | "class_teacher"
  | "bus_attendant"
  | "principal"
  | "admin"
  | "super_admin"
  | "accountant";

async function main() {
  const { connectMongo, mongoUri } = await import("../src/lib/db/mongodb");
  const { ClassModel } = await import("../src/lib/models/core/Class");
  const { School } = await import("../src/lib/models/core/School");
  const { TeacherInvite } = await import("../src/lib/models/core/TeacherInvite");
  const { User } = await import("../src/lib/models/core/User");
  const { StudentProfile } = await import("../src/lib/models/erp/StudentProfile");
  const { BranchTransfer } = await import("../src/lib/models/erp/BranchTransfer");
  const { ensureSchoolDemoData } = await import(
    "../src/lib/server/services/seed-school"
  );
  const { ensureParentStudentLink } = await import(
    "../src/lib/server/services/link-service"
  );
  const { syncClassDeskRosterFromProfile } = await import(
    "../src/lib/server/services/student-sync"
  );

  if (!mongoUri()) {
    throw new Error("Set MONGODB_URI or MONGO_URI in .env before running seed");
  }

  console.log("Connecting to MongoDB…");
  try {
    await connectMongo();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("\nMongo connection failed.");
    console.error(msg.split("\n")[0]);
    if (/whitelist|IP|ServerSelection/i.test(msg)) {
      console.error(`
Fix (MongoDB Atlas):
  1. Open Atlas → Network Access
  2. Add your current IP (or 0.0.0.0/0 for demo)
  3. Wait ~1 minute, then run: npm run seed
`);
    }
    process.exit(1);
  }
  console.log("Connected.\n");

  try {
    const { BusRoute } = await import("../src/lib/models/ops/BusRoute");
    await BusRoute.collection.dropIndex("routeId_1");
  } catch {
    /* already compound unique on schoolId+routeId */
  }

  async function upsertSchool(input: {
    name: string;
    code: string;
    city: string;
    board?: string;
    address?: string;
    phone?: string;
    email?: string;
    productMode: "connect" | "erp";
    branchName?: string;
    groupCode?: string;
    transferPolicy?: "group_only" | "open";
    settings?: Record<string, unknown>;
    subscriptionExpiresAt?: Date;
  }) {
    const { defaultSubscriptionExpiry } = await import(
      "@schoolconnect/shared"
    );
    let school = await School.findOne({ code: input.code.toUpperCase() });
    if (!school) {
      school = await School.findOne({ name: input.name });
    }
    const expiry =
      input.subscriptionExpiresAt || defaultSubscriptionExpiry(new Date());
    if (!school) {
      school = await School.create({
        name: input.name,
        code: input.code.toUpperCase(),
        city: input.city,
        board: input.board || "CBSE",
        address: input.address || "",
        phone: input.phone || "",
        email: input.email || "",
        academicYearCurrent: "2025-26",
        productMode: input.productMode,
        branchName: input.branchName || "",
        groupCode: (input.groupCode || "").toUpperCase(),
        transferPolicy: input.transferPolicy || "group_only",
        subscriptionPlan: "free",
        subscriptionStartsAt: new Date(),
        subscriptionExpiresAt: expiry,
        settings: input.settings || {},
        status: "active",
      });
      console.log("Created school:", school.name, `(${school.productMode})`);
    } else {
      school.name = input.name;
      school.code = input.code.toUpperCase();
      school.city = input.city;
      school.board = input.board || school.board || "CBSE";
      school.address = input.address || school.address || "";
      school.phone = input.phone || school.phone || "";
      school.email = input.email || school.email || "";
      school.productMode = input.productMode;
      school.branchName = input.branchName || "";
      school.groupCode = (input.groupCode || "").toUpperCase();
      school.transferPolicy = input.transferPolicy || school.transferPolicy || "group_only";
      school.subscriptionPlan = "free";
      if (!school.subscriptionExpiresAt) {
        school.subscriptionExpiresAt = expiry;
      }
      if (!school.subscriptionStartsAt) {
        school.subscriptionStartsAt = new Date();
      }
      if (input.settings) {
        school.settings = {
          ...(typeof school.settings === "object" && school.settings
            ? (school.settings as object)
            : {}),
          ...input.settings,
        };
      }
      school.status = "active";
      school.academicYearCurrent = school.academicYearCurrent || "2025-26";
      await school.save();
      console.log("Updated school:", school.name, `(${school.productMode})`);
    }
    return school;
  }

  async function upsertClass(
    schoolId: Types.ObjectId,
    className: string,
  ) {
    const [grade, section] = className.includes("-")
      ? className.split("-")
      : [className, "A"];
    let classDoc = await ClassModel.findOne({ schoolId, className });
    if (!classDoc) {
      classDoc = await ClassModel.create({
        schoolId,
        grade: grade || "6",
        section: section || "A",
        className,
      });
    }
    return classDoc;
  }

  async function upsertUser(input: {
    identifier: string;
    name: string;
    role: Role;
    schoolId: Types.ObjectId;
    schoolName: string;
    className?: string;
    classId?: Types.ObjectId;
    childName?: string;
  }) {
    const existing = await User.findOne({ identifier: input.identifier });
    const payload = {
      identifier: input.identifier,
      identifierType: "email" as const,
      name: input.name,
      role: input.role,
      schoolId: input.schoolId,
      schoolName: input.schoolName,
      className: input.className,
      classId: input.classId,
      childName: input.childName,
      enrollmentStatus: "approved" as const,
      busRouteId: "route-12",
      homeStopId: "s3",
      busAlert10: true,
      busAlert5: true,
    };
    if (existing) {
      Object.assign(existing, payload);
      if (input.className && !(existing.classHistory && existing.classHistory.length)) {
        existing.set("classHistory", [
          {
            sessionId: "ay-current",
            sessionLabel: "2025-26",
            className: input.className,
            result: "pending",
            at: Date.now(),
          },
        ]);
      }
      await existing.save();
      return existing;
    }
    return User.create({
      ...payload,
      classHistory: input.className
        ? [
            {
              sessionId: "ay-current",
              sessionLabel: "2025-26",
              className: input.className,
              result: "pending" as const,
              at: Date.now(),
            },
          ]
        : [],
    });
  }

  async function ensureStudentProfile(input: {
    schoolId: Types.ObjectId;
    userId: Types.ObjectId;
    name: string;
    className: string;
    classId: Types.ObjectId;
    admissionNo: string;
    branchId?: string;
  }) {
    let profile = await StudentProfile.findOne({
      userId: input.userId,
      schoolId: input.schoolId,
    });
    if (!profile) {
      profile = await StudentProfile.create({
        schoolId: input.schoolId,
        userId: input.userId,
        name: input.name,
        className: input.className,
        classSectionId: input.classId,
        admissionNo: input.admissionNo,
        studentId: input.admissionNo,
        status: "enrolled",
        academicYear: "2025-26",
        branchId: input.branchId || "",
      });
    } else {
      profile.name = input.name;
      profile.className = input.className;
      profile.classSectionId = input.classId;
      profile.admissionNo = input.admissionNo;
      profile.status = "enrolled";
      profile.branchId = input.branchId || profile.branchId || "";
      await profile.save();
    }
    await syncClassDeskRosterFromProfile(profile);
    return profile;
  }

  type CampusPeople = {
    adminEmail: string;
    adminName: string;
    principalEmail: string;
    principalName: string;
    teacherEmail: string;
    teacherName: string;
    accountsEmail?: string;
    accountsName?: string;
    busEmail: string;
    busName: string;
    parentEmail: string;
    parentName: string;
    studentEmail: string;
    studentName: string;
    student2Email?: string;
    student2Name?: string;
    inviteCode: string;
  };

  async function seedCampus(
    school: Awaited<ReturnType<typeof upsertSchool>>,
    people: CampusPeople,
    opts?: { withAccountant?: boolean },
  ) {
    const classDoc = await upsertClass(school._id, "6-B");
    const withAcc = opts?.withAccountant !== false && school.productMode === "erp";

    const admin = await upsertUser({
      identifier: people.adminEmail,
      name: people.adminName,
      role: "admin",
      schoolId: school._id,
      schoolName: school.name,
    });
    const principal = await upsertUser({
      identifier: people.principalEmail,
      name: people.principalName,
      role: "principal",
      schoolId: school._id,
      schoolName: school.name,
    });
    const teacher = await upsertUser({
      identifier: people.teacherEmail,
      name: people.teacherName,
      role: "class_teacher",
      schoolId: school._id,
      schoolName: school.name,
      className: "6-B",
      classId: classDoc._id,
    });
    classDoc.classTeacherId = teacher._id;
    await classDoc.save();

    if (withAcc && people.accountsEmail) {
      await upsertUser({
        identifier: people.accountsEmail,
        name: people.accountsName || "Accounts",
        role: "accountant",
        schoolId: school._id,
        schoolName: school.name,
      });
    }

    await upsertUser({
      identifier: people.busEmail,
      name: people.busName,
      role: "bus_attendant",
      schoolId: school._id,
      schoolName: school.name,
    });

    const student = await upsertUser({
      identifier: people.studentEmail,
      name: people.studentName,
      role: "student",
      schoolId: school._id,
      schoolName: school.name,
      className: "6-B",
      classId: classDoc._id,
    });
    await ensureStudentProfile({
      schoolId: school._id,
      userId: student._id,
      name: student.name,
      className: "6-B",
      classId: classDoc._id,
      admissionNo: `${school.code}-S1`,
      branchId: school.branchName || school.city,
    });

    let student2 = null as typeof student | null;
    if (people.student2Email && people.student2Name) {
      student2 = await upsertUser({
        identifier: people.student2Email,
        name: people.student2Name,
        role: "student",
        schoolId: school._id,
        schoolName: school.name,
        className: "6-B",
        classId: classDoc._id,
      });
      await ensureStudentProfile({
        schoolId: school._id,
        userId: student2._id,
        name: student2.name,
        className: "6-B",
        classId: classDoc._id,
        admissionNo: `${school.code}-S2`,
        branchId: school.branchName || school.city,
      });
    }

    const parent = await upsertUser({
      identifier: people.parentEmail,
      name: people.parentName,
      role: "parent",
      schoolId: school._id,
      schoolName: school.name,
      className: "6-B",
      childName: student.name,
    });
    await ensureParentStudentLink({
      schoolId: school._id,
      parentUserId: parent._id,
      studentUserId: student._id,
      relationship: "father",
      primary: true,
      note: "Demo seed link",
    });

    const invite = await TeacherInvite.findOne({ code: people.inviteCode });
    if (!invite) {
      await TeacherInvite.create({
        code: people.inviteCode,
        name: "New Teacher Invite",
        identifier: `newteacher@${people.inviteCode.toLowerCase()}.demo`,
        schoolId: school._id,
        schoolName: school.name,
        role: "class_teacher",
        className: "6-B",
        status: "pending",
        invitedById: admin._id,
        invitedByName: admin.name,
      });
    }

    await ensureSchoolDemoData(school._id);

    console.log(`  Staff seeded for ${school.name}`);
    return { admin, principal, teacher, parent, student, student2, classDoc };
  }

  // ─── Platform super admin (attached to International for home school) ───
  const international = await upsertSchool({
    name: "Radoms International School",
    code: "RIS",
    city: "Delhi",
    board: "CBSE",
    address: "Dwarka Sector 12, New Delhi",
    phone: "+91-11-40000000",
    email: "office@radoms.demo",
    productMode: "erp",
    branchName: "Main",
    // Accepts cross-group transfers from other schools
    transferPolicy: "open",
  });

  const superAdmin = await upsertUser({
    identifier: "super@schoolconnect.demo",
    name: "Platform Super Admin",
    role: "super_admin",
    schoolId: international._id,
    schoolName: international.name,
  });
  console.log("Super admin:", superAdmin.identifier);

  // ─── 1) Radmos Group — Noida (ERP) ───
  const noida = await upsertSchool({
    name: "Radmos Group of Schools — Noida",
    code: "RADMOS-NOIDA",
    city: "Noida",
    address: "Sector 62, Noida, UP",
    phone: "+91-120-4000001",
    email: "noida@radmos.demo",
    productMode: "erp",
    branchName: "Noida",
    groupCode: "RADMOS",
    transferPolicy: "group_only",
    // fees on (ERP default)
  });

  const noidaPeople = await seedCampus(noida, {
    adminEmail: "admin.noida@radmos.demo",
    adminName: "Noida School Admin",
    principalEmail: "principal.noida@radmos.demo",
    principalName: "Principal Noida",
    teacherEmail: "teacher.noida@radmos.demo",
    teacherName: "Ms. Kapoor (Noida)",
    accountsEmail: "accounts.noida@radmos.demo",
    accountsName: "Accounts Noida",
    busEmail: "bus.noida@radmos.demo",
    busName: "Bus Attendant Noida",
    parentEmail: "parent.noida@radmos.demo",
    parentName: "Parent Noida",
    studentEmail: "student.noida@radmos.demo",
    studentName: "Aarav Sharma",
    student2Email: "transfer.noida@radmos.demo",
    student2Name: "Diya Verma (Transfer candidate)",
    inviteCode: "TCH-NOIDA-6B",
  });

  // ─── 2) Radmos Group — Lucknow (ERP) ───
  const lucknow = await upsertSchool({
    name: "Radmos Group of Schools — Lucknow",
    code: "RADMOS-LKO",
    city: "Lucknow",
    address: "Gomti Nagar, Lucknow, UP",
    phone: "+91-522-4000002",
    email: "lucknow@radmos.demo",
    productMode: "erp",
    branchName: "Lucknow",
    groupCode: "RADMOS",
    transferPolicy: "group_only",
    // Branch-level override: fees module off at Lucknow only
    settings: { modules: { fees: false } },
  });

  await seedCampus(lucknow, {
    adminEmail: "admin.lucknow@radmos.demo",
    adminName: "Lucknow School Admin",
    principalEmail: "principal.lucknow@radmos.demo",
    principalName: "Principal Lucknow",
    teacherEmail: "teacher.lucknow@radmos.demo",
    teacherName: "Mr. Singh (Lucknow)",
    accountsEmail: "accounts.lucknow@radmos.demo",
    accountsName: "Accounts Lucknow",
    busEmail: "bus.lucknow@radmos.demo",
    busName: "Bus Attendant Lucknow",
    parentEmail: "parent.lucknow@radmos.demo",
    parentName: "Parent Lucknow",
    studentEmail: "student.lucknow@radmos.demo",
    studentName: "Kabir Ali",
    inviteCode: "TCH-LKO-6B",
  });

  // Sample pending transfer: Diya Verma Noida → Lucknow
  if (noidaPeople.student2) {
    const existingTx = await BranchTransfer.findOne({
      studentUserId: noidaPeople.student2._id,
      status: "pending",
    });
    if (!existingTx) {
      await BranchTransfer.create({
        studentUserId: noidaPeople.student2._id,
        studentName: noidaPeople.student2.name,
        fromSchoolId: noida._id,
        toSchoolId: lucknow._id,
        groupCode: "RADMOS",
        fromClassName: "6-B",
        toClassName: "6-B",
        reason: "Family relocated to Lucknow (demo pending transfer)",
        status: "pending",
        requestedById: noidaPeople.admin._id,
        requestedByName: noidaPeople.admin.name,
      });
      console.log(
        "Pending transfer: transfer.noida@radmos.demo → Lucknow (approve as admin.lucknow@radmos.demo)",
      );
    }
  }

  // ─── 3) Radoms International — single campus ERP ───
  await seedCampus(international, {
    adminEmail: "admin@radoms.demo",
    adminName: "RIS School Admin",
    principalEmail: "principal@radoms.demo",
    principalName: "RIS Principal",
    teacherEmail: "teacher@radoms.demo",
    teacherName: "Ms. Mehta (RIS)",
    accountsEmail: "accounts@radoms.demo",
    accountsName: "RIS Accounts",
    busEmail: "bus@radoms.demo",
    busName: "RIS Bus Attendant",
    parentEmail: "parent@radoms.demo",
    parentName: "RIS Parent",
    studentEmail: "student@radoms.demo",
    studentName: "Ishaan Gupta",
    inviteCode: "TCH-RIS-6B",
  });

  // ─── 4) Harmony Connect — single campus Connect ───
  const connectSchool = await upsertSchool({
    name: "Harmony Connect School",
    code: "HARMONY",
    city: "Jaipur",
    address: "Malviya Nagar, Jaipur",
    phone: "+91-141-4000003",
    email: "office@connect.demo",
    productMode: "connect",
    branchName: "Main",
    transferPolicy: "group_only",
  });

  const harmonyPeople = await seedCampus(
    connectSchool,
    {
      adminEmail: "admin@connect.demo",
      adminName: "Harmony Admin",
      principalEmail: "principal@connect.demo",
      principalName: "Harmony Principal",
      teacherEmail: "teacher@connect.demo",
      teacherName: "Ms. Rao (Harmony)",
      busEmail: "bus@connect.demo",
      busName: "Harmony Bus",
      parentEmail: "parent@connect.demo",
      parentName: "Harmony Parent",
      studentEmail: "student@connect.demo",
      studentName: "Anaya Jain",
      student2Email: "cross.harmony@connect.demo",
      student2Name: "Rohan Mehta (Cross-group → RIS)",
      inviteCode: "TCH-HARMONY-6B",
    },
    { withAccountant: false },
  );

  // Cross-group pending: Harmony → Radoms International (open intake)
  if (harmonyPeople.student2) {
    const existingCross = await BranchTransfer.findOne({
      studentUserId: harmonyPeople.student2._id,
      status: "pending",
    });
    if (!existingCross) {
      await BranchTransfer.create({
        studentUserId: harmonyPeople.student2._id,
        studentName: harmonyPeople.student2.name,
        fromSchoolId: connectSchool._id,
        toSchoolId: international._id,
        groupCode: "",
        fromClassName: "6-B",
        toClassName: "6-B",
        reason: "Cross-group demo → RIS (destination transferPolicy=open)",
        status: "pending",
        requestedById: harmonyPeople.admin._id,
        requestedByName: harmonyPeople.admin.name,
      });
      console.log(
        "Pending cross-group: cross.harmony@connect.demo → RIS (approve as admin@radoms.demo)",
      );
    }
  }

  // ─── 5) Sunrise Group Connect — multi-campus Connect-only ───
  const sunriseEast = await upsertSchool({
    name: "Sunrise Group Connect — East",
    code: "SUNRISE-EAST",
    city: "Indore",
    address: "Vijay Nagar, Indore",
    phone: "+91-731-4000004",
    email: "east@sunrise.demo",
    productMode: "connect",
    branchName: "East",
    groupCode: "SUNRISE",
    transferPolicy: "group_only",
    settings: { modules: { bus: true } },
  });

  const sunriseWest = await upsertSchool({
    name: "Sunrise Group Connect — West",
    code: "SUNRISE-WEST",
    city: "Indore",
    address: "Rajendra Nagar, Indore",
    phone: "+91-731-4000005",
    email: "west@sunrise.demo",
    productMode: "connect",
    branchName: "West",
    groupCode: "SUNRISE",
    transferPolicy: "group_only",
    // Branch override: bus off on West campus
    settings: { modules: { bus: false } },
  });

  const sunriseEastPeople = await seedCampus(
    sunriseEast,
    {
      adminEmail: "admin.east@sunrise.demo",
      adminName: "Sunrise East Admin",
      principalEmail: "principal.east@sunrise.demo",
      principalName: "Principal East",
      teacherEmail: "teacher.east@sunrise.demo",
      teacherName: "Ms. Das (East)",
      busEmail: "bus.east@sunrise.demo",
      busName: "Bus East",
      parentEmail: "parent.east@sunrise.demo",
      parentName: "Parent East",
      studentEmail: "student.east@sunrise.demo",
      studentName: "Vihaan Patel",
      student2Email: "transfer.east@sunrise.demo",
      student2Name: "Sara Khan (→ West)",
      inviteCode: "TCH-SUN-EAST",
    },
    { withAccountant: false },
  );

  await seedCampus(
    sunriseWest,
    {
      adminEmail: "admin.west@sunrise.demo",
      adminName: "Sunrise West Admin",
      principalEmail: "principal.west@sunrise.demo",
      principalName: "Principal West",
      teacherEmail: "teacher.west@sunrise.demo",
      teacherName: "Mr. Khan (West)",
      busEmail: "bus.west@sunrise.demo",
      busName: "Bus West",
      parentEmail: "parent.west@sunrise.demo",
      parentName: "Parent West",
      studentEmail: "student.west@sunrise.demo",
      studentName: "Myra Joshi",
      inviteCode: "TCH-SUN-WEST",
    },
    { withAccountant: false },
  );

  if (sunriseEastPeople.student2) {
    const existingSun = await BranchTransfer.findOne({
      studentUserId: sunriseEastPeople.student2._id,
      status: "pending",
    });
    if (!existingSun) {
      await BranchTransfer.create({
        studentUserId: sunriseEastPeople.student2._id,
        studentName: sunriseEastPeople.student2.name,
        fromSchoolId: sunriseEast._id,
        toSchoolId: sunriseWest._id,
        groupCode: "SUNRISE",
        fromClassName: "6-B",
        toClassName: "6-B",
        reason: "Group Connect demo transfer East → West",
        status: "pending",
        requestedById: sunriseEastPeople.admin._id,
        requestedByName: sunriseEastPeople.admin.name,
      });
      console.log(
        "Pending Connect group transfer: transfer.east@sunrise.demo → West (admin.west@sunrise.demo)",
      );
    }
  }

  // Legacy Green Valley aliases (optional backward-compatible logins)
  const gv = await upsertSchool({
    name: "Green Valley Public School",
    code: "GVPS",
    city: "Pune",
    address: "Baner Road, Pune",
    phone: "+91-20-00000000",
    email: "office@greenvalley.demo",
    productMode: "erp",
    branchName: "Main",
  });
  await seedCampus(gv, {
    adminEmail: "admin@greenvalley.demo",
    adminName: "Green Valley Admin",
    principalEmail: "principal@greenvalley.demo",
    principalName: "Green Valley Principal",
    teacherEmail: "teacher@greenvalley.demo",
    teacherName: "Ms. Sharma",
    accountsEmail: "accounts@greenvalley.demo",
    accountsName: "Accounts Desk",
    busEmail: "bus@greenvalley.demo",
    busName: "GV Bus",
    parentEmail: "parent@demo.com",
    parentName: "Rahul Parent",
    studentEmail: "student@demo.com",
    studentName: "Aarav Student",
    inviteCode: "TCH-DEMO-6B",
  });

  const keepCodes = [
    "RIS",
    "RADMOS-NOIDA",
    "RADMOS-LKO",
    "HARMONY",
    "SUNRISE-EAST",
    "SUNRISE-WEST",
    "GVPS",
  ];
  const extras = await School.find({
    $nor: [{ code: { $in: keepCodes } }],
  });
  if (extras.length) {
    const { Chat } = await import("../src/lib/models/comms/Chat");
    const { Homework } = await import("../src/lib/models/comms/Homework");
    const extraIds = extras.map((s) => s._id);
    await User.deleteMany({
      schoolId: { $in: extraIds },
      role: { $ne: "super_admin" },
    });
    await Chat.deleteMany({ schoolId: { $in: extraIds } });
    await Homework.deleteMany({ schoolId: { $in: extraIds } });
    await StudentProfile.deleteMany({ schoolId: { $in: extraIds } });
    await School.deleteMany({ _id: { $in: extraIds } });
    console.log(
      "Removed non-matrix schools:",
      extras.map((s) => s.name).join(", "),
    );
  }

  const { Chat } = await import("../src/lib/models/comms/Chat");
  const { Homework } = await import("../src/lib/models/comms/Homework");
  const { StaffProfile } = await import("../src/lib/models/erp/StaffProfile");
  const allSchools = await School.find().sort({ name: 1 });
  console.log("\nPer-school demo data:");
  for (const s of allSchools) {
    const [users, chats, hw, staff, students] = await Promise.all([
      User.countDocuments({ schoolId: s._id }),
      Chat.countDocuments({ schoolId: s._id }),
      Homework.countDocuments({ schoolId: s._id }),
      StaffProfile.countDocuments({ schoolId: s._id }),
      StudentProfile.countDocuments({ schoolId: s._id }),
    ]);
    console.log(
      `  ${String(s.code).padEnd(14)} users=${users} chats=${chats} hw=${hw} staff=${staff} students=${students}  ${s.name}`,
    );
  }

  console.log(`
════════════════════════════════════════════════════════════
 Demo OTP: 000000
 Free subscription: ~1 year from seed (editable per school)
════════════════════════════════════════════════════════════
 MATRIX
  Single + ERP:     Radoms International (admin@radoms.demo)  [open intake]
  Group  + ERP:     Radmos Noida/Lucknow (RADMOS)  [Lucknow fees OFF]
  Single + Connect: Harmony (admin@connect.demo)
  Group  + Connect: Sunrise East/West (SUNRISE)  [West bus OFF]

 TRANSFERS
  Group ERP:     transfer.noida@radmos.demo → approve admin.lucknow@radmos.demo
  Group Connect: transfer.east@sunrise.demo → approve admin.west@sunrise.demo  (/transfers)
  Cross-group:   cross.harmony@connect.demo → approve admin@radoms.demo

 Super: super@schoolconnect.demo
 Full tables: README → Demo accounts
════════════════════════════════════════════════════════════
`);
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
