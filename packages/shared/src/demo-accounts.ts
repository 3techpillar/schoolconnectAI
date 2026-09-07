import type { Role } from "./roles";

export type DemoAccount = {
  identifier: string;
  role: Role;
  name: string;
  school: string;
  /** Family (parent/student) accounts are the mobile MVP surface. */
  family: boolean;
};

export type DemoSchoolGroup = {
  key: string;
  label: string;
  mode: "erp" | "connect" | "platform";
  accounts: DemoAccount[];
};

/** Canonical demo matrix — keep in sync with README Demo accounts. OTP: 000000 */
export const DEMO_SCHOOL_GROUPS: DemoSchoolGroup[] = [
  {
    key: "platform",
    label: "Platform",
    mode: "platform",
    accounts: [
      {
        identifier: "super@schoolconnect.demo",
        role: "super_admin",
        name: "Platform Super Admin",
        school: "All schools",
        family: false,
      },
    ],
  },
  {
    key: "radmos-noida",
    label: "Radmos Noida (ERP)",
    mode: "erp",
    accounts: [
      staff("admin.noida@radmos.demo", "admin", "Noida School Admin"),
      staff("principal.noida@radmos.demo", "principal", "Principal Noida"),
      staff("teacher.noida@radmos.demo", "class_teacher", "Ms. Kapoor (Noida)"),
      staff("accounts.noida@radmos.demo", "accountant", "Accounts Noida"),
      staff("bus.noida@radmos.demo", "bus_attendant", "Bus Attendant Noida"),
      family("parent.noida@radmos.demo", "parent", "Parent Noida"),
      family("student.noida@radmos.demo", "student", "Aarav Sharma"),
    ].map((a) => ({ ...a, school: "Radmos Group of Schools — Noida" })),
  },
  {
    key: "radmos-lucknow",
    label: "Radmos Lucknow (ERP)",
    mode: "erp",
    accounts: [
      staff("admin.lucknow@radmos.demo", "admin", "Lucknow School Admin"),
      staff("principal.lucknow@radmos.demo", "principal", "Principal Lucknow"),
      staff("teacher.lucknow@radmos.demo", "class_teacher", "Mr. Singh (Lucknow)"),
      staff("accounts.lucknow@radmos.demo", "accountant", "Accounts Lucknow"),
      staff("bus.lucknow@radmos.demo", "bus_attendant", "Bus Attendant Lucknow"),
      family("parent.lucknow@radmos.demo", "parent", "Parent Lucknow"),
      family("student.lucknow@radmos.demo", "student", "Kabir Ali"),
    ].map((a) => ({ ...a, school: "Radmos Group of Schools — Lucknow" })),
  },
  {
    key: "ris",
    label: "Radoms International (ERP)",
    mode: "erp",
    accounts: [
      staff("admin@radoms.demo", "admin", "RIS School Admin"),
      staff("principal@radoms.demo", "principal", "RIS Principal"),
      staff("teacher@radoms.demo", "class_teacher", "Ms. Mehta (RIS)"),
      staff("accounts@radoms.demo", "accountant", "RIS Accounts"),
      staff("bus@radoms.demo", "bus_attendant", "RIS Bus Attendant"),
      family("parent@radoms.demo", "parent", "RIS Parent"),
      family("student@radoms.demo", "student", "Ishaan Gupta"),
    ].map((a) => ({ ...a, school: "Radoms International School" })),
  },
  {
    key: "harmony",
    label: "Harmony Connect",
    mode: "connect",
    accounts: [
      staff("admin@connect.demo", "admin", "Harmony Admin"),
      staff("principal@connect.demo", "principal", "Harmony Principal"),
      staff("teacher@connect.demo", "class_teacher", "Ms. Rao (Harmony)"),
      staff("bus@connect.demo", "bus_attendant", "Harmony Bus"),
      family("parent@connect.demo", "parent", "Harmony Parent"),
      family("student@connect.demo", "student", "Anaya Jain"),
    ].map((a) => ({ ...a, school: "Harmony Connect School" })),
  },
  {
    key: "sunrise-east",
    label: "Sunrise East (Connect)",
    mode: "connect",
    accounts: [
      staff("admin.east@sunrise.demo", "admin", "Sunrise East Admin"),
      staff("principal.east@sunrise.demo", "principal", "Principal East"),
      staff("teacher.east@sunrise.demo", "class_teacher", "Ms. Das (East)"),
      staff("bus.east@sunrise.demo", "bus_attendant", "Bus East"),
      family("parent.east@sunrise.demo", "parent", "Parent East"),
      family("student.east@sunrise.demo", "student", "Vihaan Patel"),
    ].map((a) => ({ ...a, school: "Sunrise Group Connect — East" })),
  },
  {
    key: "sunrise-west",
    label: "Sunrise West (Connect)",
    mode: "connect",
    accounts: [
      staff("admin.west@sunrise.demo", "admin", "Sunrise West Admin"),
      staff("principal.west@sunrise.demo", "principal", "Principal West"),
      staff("teacher.west@sunrise.demo", "class_teacher", "Mr. Khan (West)"),
      staff("bus.west@sunrise.demo", "bus_attendant", "Bus West"),
      family("parent.west@sunrise.demo", "parent", "Parent West"),
      family("student.west@sunrise.demo", "student", "Myra Joshi"),
    ].map((a) => ({ ...a, school: "Sunrise Group Connect — West" })),
  },
  {
    key: "green-valley",
    label: "Green Valley (legacy ERP)",
    mode: "erp",
    accounts: [
      staff("admin@greenvalley.demo", "admin", "Green Valley Admin"),
      staff("principal@greenvalley.demo", "principal", "Green Valley Principal"),
      staff("teacher@greenvalley.demo", "class_teacher", "Ms. Sharma"),
      staff("accounts@greenvalley.demo", "accountant", "Accounts Desk"),
      staff("bus@greenvalley.demo", "bus_attendant", "GV Bus"),
      family("parent@demo.com", "parent", "Rahul Parent"),
      family("student@demo.com", "student", "Aarav Student"),
    ].map((a) => ({ ...a, school: "Green Valley Public School" })),
  },
];

function staff(
  identifier: string,
  role: Role,
  name: string,
): Omit<DemoAccount, "school"> {
  return { identifier, role, name, family: false };
}

function family(
  identifier: string,
  role: Extract<Role, "parent" | "student">,
  name: string,
): Omit<DemoAccount, "school"> {
  return { identifier, role, name, family: true };
}

export const DEMO_ACCOUNTS: DemoAccount[] = DEMO_SCHOOL_GROUPS.flatMap(
  (g) => g.accounts,
);

export const DEMO_FAMILY_ACCOUNTS = DEMO_ACCOUNTS.filter((a) => a.family);

export const DEMO_ADMIN_ACCOUNTS = DEMO_ACCOUNTS.filter(
  (a) => a.role === "admin" || a.role === "super_admin",
);
