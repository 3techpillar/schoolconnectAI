/**
 * Seed demo school, class, and users into MongoDB.
 *
 * Usage:
 *   npm run seed
 *
 * Requires MONGODB_URI or MONGO_URI in .env / .env.local
 * Atlas: Network Access → add your current IP (or 0.0.0.0/0 for demo).
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

async function main() {
  const { connectMongo, mongoUri } = await import("../src/lib/db/mongodb");
  const { ClassModel } = await import("../src/lib/models/Class");
  const { School } = await import("../src/lib/models/School");
  const { TeacherInvite } = await import("../src/lib/models/TeacherInvite");
  const { User } = await import("../src/lib/models/User");
  const { ensureSchoolDemoData } = await import("../src/lib/server/seed-school");

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
  2. Add your current IP address
     (or temporarily Allow Access from Anywhere: 0.0.0.0/0 for local demo)
  3. Wait ~1 minute, then run: npm run seed
`);
    }
    process.exit(1);
  }
  console.log("Connected.");

  async function upsertUser(input: {
    identifier: string;
    identifierType: "email" | "phone";
    name: string;
    role: string;
    schoolId: unknown;
    schoolName: string;
    className?: string;
    classId?: unknown;
    enrollmentStatus?: string;
  }) {
    const existing = await User.findOne({ identifier: input.identifier });
    if (existing) {
      existing.name = input.name;
      existing.role = input.role as typeof existing.role;
      existing.schoolId = input.schoolId as never;
      existing.schoolName = input.schoolName;
      existing.className = input.className;
      existing.classId = input.classId as never;
      existing.enrollmentStatus = (input.enrollmentStatus ||
        "approved") as typeof existing.enrollmentStatus;
      await existing.save();
      return existing;
    }
    return User.create({
      identifier: input.identifier,
      identifierType: input.identifierType,
      name: input.name,
      role: input.role as
        | "parent"
        | "student"
        | "class_teacher"
        | "bus_attendant"
        | "principal"
        | "admin"
        | "super_admin",
      schoolId: input.schoolId as never,
      schoolName: input.schoolName,
      className: input.className,
      classId: input.classId as never,
      enrollmentStatus: (input.enrollmentStatus || "approved") as
        | "pending"
        | "approved"
        | "rejected",
      busRouteId: "route-12",
      homeStopId: "s3",
      busAlert10: true,
      busAlert5: true,
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

  let school = await School.findOne({ name: "Green Valley Public School" });
  if (!school) {
    school = await School.create({
      name: "Green Valley Public School",
      city: "Pune",
      status: "active",
    });
    console.log("Created school", school.name);
  } else {
    console.log("School exists", school.name);
  }

  let classDoc = await ClassModel.findOne({
    schoolId: school._id,
    className: "6-B",
  });
  if (!classDoc) {
    classDoc = await ClassModel.create({
      schoolId: school._id,
      grade: "6",
      section: "B",
      className: "6-B",
    });
    console.log("Created class 6-B");
  }

  const superAdmin = await upsertUser({
    identifier: "super@schoolconnect.demo",
    identifierType: "email",
    name: "Platform Super Admin",
    role: "super_admin",
    schoolId: school._id,
    schoolName: school.name,
  });
  console.log("Super admin:", superAdmin.identifier);

  const admin = await upsertUser({
    identifier: "admin@greenvalley.demo",
    identifierType: "email",
    name: "School Admin",
    role: "admin",
    schoolId: school._id,
    schoolName: school.name,
  });
  console.log("Admin:", admin.identifier);

  const teacher = await upsertUser({
    identifier: "teacher@greenvalley.demo",
    identifierType: "email",
    name: "Ms. Sharma",
    role: "class_teacher",
    schoolId: school._id,
    schoolName: school.name,
    className: "6-B",
    classId: classDoc._id,
  });
  classDoc.classTeacherId = teacher._id;
  await classDoc.save();
  console.log("Teacher:", teacher.identifier);

  const parent = await upsertUser({
    identifier: "parent@demo.com",
    identifierType: "email",
    name: "Rahul Parent",
    role: "parent",
    schoolId: school._id,
    schoolName: school.name,
    className: "6-B",
  });
  console.log("Parent:", parent.identifier);

  const student = await upsertUser({
    identifier: "student@demo.com",
    identifierType: "email",
    name: "Aarav Student",
    role: "student",
    schoolId: school._id,
    schoolName: school.name,
    className: "6-B",
    classId: classDoc._id,
    enrollmentStatus: "approved",
  });
  console.log("Student:", student.identifier);

  const { ensureParentStudentLink } = await import(
    "../src/lib/server/link-service"
  );
  parent.childName = student.name;
  await parent.save();
  await ensureParentStudentLink({
    schoolId: school._id,
    parentUserId: parent._id,
    studentUserId: student._id,
    relationship: "father",
    primary: true,
    note: "Demo seed link",
  });
  console.log("Linked parent ↔ student");

  let invite = await TeacherInvite.findOne({ code: "TCH-DEMO-6B" });
  if (!invite) {
    invite = await TeacherInvite.create({
      code: "TCH-DEMO-6B",
      name: "New Teacher Invite",
      identifier: "newteacher@greenvalley.demo",
      schoolId: school._id,
      schoolName: school.name,
      role: "class_teacher",
      className: "6-B",
      status: "pending",
      invitedById: admin._id,
      invitedByName: admin.name,
    });
    console.log("Invite code:", invite.code);
  } else {
    console.log("Invite exists:", invite.code);
  }

  await ensureSchoolDemoData(school._id);
  console.log("Seeded chats / homework / class desk / bus route / fees");

  console.log(
    "\nDemo OTP: use NEXT_PUBLIC_DEMO_OTP / OTP_DEMO_CODE (default 000000)",
  );
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
