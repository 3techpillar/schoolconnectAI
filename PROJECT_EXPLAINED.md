# SchoolConnect AI — Complete Project Guide & Explanation

> **Welcome!** This document explains the entire SchoolConnect AI project from A to Z in **simple, easy-to-understand English**. Whether you are a teacher, school owner, developer, parent, or student, this guide will help you understand every single concept, feature, and screen in the system without getting lost in complex technical jargon.

---

## Table of Contents

1. [What is SchoolConnect AI?](#1-what-is-schoolconnect-ai)
2. [The Big Idea: Why Does This Project Exist?](#2-the-big-idea-why-does-this-project-exist)
3. [How the Project is Built (The Big Picture)](#3-how-the-project-is-built-the-big-picture)
4. [The Two Product Modes: Connect vs Full ERP](#4-the-two-product-modes-connect-vs-full-erp)
5. [Multi-Campus Schools & Student Transfers](#5-multi-campus-schools--student-transfers)
6. [The 8 User Roles (Who Uses What?)](#6-the-8-user-roles-who-uses-what)
7. [Every Single Feature Explained (Step-by-Step)](#7-every-single-feature-explained-step-by-step)
   - 7.1. [Logging In and Creating an Account (Auth & OTP)](#71-logging-in-and-creating-an-account-auth--otp)
   - 7.2. [The "Pending Approval" Safety Gate](#72-the-pending-approval-safety-gate)
   - 7.3. [The User Dashboards (Home Screen)](#73-the-user-dashboards-home-screen)
   - 7.4. [WhatsApp-Style Chats & Messaging](#74-whatsapp-style-chats--messaging)
   - 7.5. [Homework Tracker](#75-homework-tracker)
   - 7.6. [School Circulars & Urgent Announcements](#76-school-circulars--urgent-announcements)
   - 7.7. [Teacher Class Desk & Daily Attendance](#77-teacher-class-desk--daily-attendance)
   - 7.8. [Leave Requests & Automatic Attendance Sync](#78-leave-requests--automatic-attendance-sync)
   - 7.9. [Live School Bus Tracking & ETA Alerts](#79-live-school-bus-tracking--eta-alerts)
   - 7.10. [School Fees & Online Payment Demo](#710-school-fees--online-payment-demo)
   - 7.11. [Learning Zone (Fun XP Points, Missions & Mood Tracker)](#711-learning-zone-fun-xp-points-missions--mood-tracker)
   - 7.12. [AI School Assistant](#712-ai-school-assistant)
   - 7.13. [Light School Admin Dashboard (`/admin`)](#713-light-school-admin-dashboard-admin)
   - 7.14. [Desktop School ERP Portal (`/erp`)](#714-desktop-school-erp-portal-erp)
   - 7.15. [Bulk Data Upload using Excel/CSV Spreadsheets](#715-bulk-data-upload-using-excelcsv-spreadsheets)
   - 7.16. [Parent-Student Linking](#716-parent-student-linking)
   - 7.17. [Mobile App for Android and iPhone](#717-mobile-app-for-android-and-iphone)
8. [Database & Data Organization (How Information is Saved)](#8-database--data-organization-how-information-is-saved)
9. [Free Subscription System](#9-free-subscription-system)
10. [How to Run and Test the Project (With Demo Logins)](#10-how-to-run-and-test-the-project-with-demo-logins)
11. [Summary & Quick Reference Table](#11-summary--quick-reference-table)

---

## 1. What is SchoolConnect AI?

**SchoolConnect AI** is an all-in-one digital platform for schools. It connects **parents, students, teachers, bus attendants, and school administrators** in one unified place.

Think of it as two things combined into one:
1. **A friendly mobile app that feels just like WhatsApp:** Parents, students, and teachers use this daily on their phones for chats, homework, attendance, bus tracking, notices, and leave applications.
2. **A powerful School Office computer system (ERP):** School accountants, principals, and admins use this on desktop computers to run admissions, manage student records, set up exam timetables, print report cards, generate ID cards, and collect fees.

Both parts share the **exact same database**. When an accountant generates a fee receipt or an admin admits a new student in the office, the parent immediately sees it on their phone app!

---

## 2. The Big Idea: Why Does This Project Exist?

In many traditional schools today, communication and management are messy:
- **WhatsApp groups get flooded with spam:** Important circulars get lost in endless "Good morning" or "Thank you" messages.
- **Attendance is recorded on paper:** If a student asks for leave, teachers often forget and mark the student "Absent" by mistake.
- **Parents stand in the rain waiting for the bus:** They have no idea if the school bus is 2 minutes away or 30 minutes late.
- **Schools use 3 or 4 separate softwares:** One for fee collection, one for exam report cards, another for messaging, and paper registers for everything else.

**SchoolConnect AI solves all of this:**
- Official notices and announcements are separated from general chat.
- When a parent's leave request is approved, the system **automatically** marks the student on "Leave" on the teacher's roll call so they aren't marked absent.
- Parents get automatic notification alerts **10 minutes** and **5 minutes** before the school bus arrives at their stop.
- Everything works together under one roof.

---

## 3. How the Project is Built (The Big Picture)

SchoolConnect is built as a modern **"Monorepo"** (one project folder containing everything).

```text
schoolconnectAI/
├── apps/
│   ├── web/        ← The Website, Web Phone App, Desktop ERP, and Backend Server
│   └── mobile/     ← The Native Mobile App (React Native) for Android & iOS
├── packages/
│   └── shared/     ← Common rules, roles, data types, and helpers shared by both
├── docs/           ← Technical documentation and developer guides
└── deploy/         ← Docker setup for putting the system on real servers
```

### The Technology Used:
- **Next.js 15 & React 19:** Powers both the web app and the backend API server.
- **MongoDB & Mongoose:** The database that stores all school records safely.
- **React Native 0.76:** Powers the mobile app for Android and iOS.
- **TypeScript:** Ensures code quality and prevents errors.
- **JWT (JSON Web Tokens):** Keeps user logins safe and secure.

---

## 4. The Two Product Modes: Connect vs Full ERP

Not every school needs a heavy computer system. Some smaller schools just want a clean chat and homework app. Other large schools need full office management. 

SchoolConnect solves this by offering **Two Product Modes** that can be turned on or off for any school:

| Feature | 📱 **Connect Mode** | 💻 **Full ERP Mode** |
| :--- | :--- | :--- |
| **Who is it for?** | Schools that only want communication and daily activities. | Schools that want full digital office management. |
| **User Interface** | Mobile phone interface (Phone shell on web + mobile app). | Mobile phone interface **plus** desktop computer office portal (`/erp`). |
| **Daily Chats & Homework** | Yes | Yes |
| **Attendance & Leave** | Yes | Yes |
| **Bus Tracking** | Yes | Yes |
| **School Circulars** | Yes | Yes |
| **Fees Module** | Hidden by default (kept simple) | Active by default (with invoices & ledgers) |
| **Student Information (SIS)** | Basic | Complete detailed profiles (medical, family, documents) |
| **Bulk CSV Import/Export** | No | Yes (upload 500 students/staff at once via Excel) |
| **Admissions & Exams** | No | Yes (application pipeline, marks entry, report cards) |
| **ID Card Printing** | No | Yes (instant printable ID cards) |

> **Upgrading is instant:** If a school starts in **Connect Mode** and later decides to upgrade to **Full ERP**, the Super Admin just clicks one button. **No data is lost**, and all existing chats, students, and attendance stay intact!

---

## 5. Multi-Campus Schools & Student Transfers

Many educational organizations own more than one school branch (e.g., a "Noida Campus" and a "Lucknow Campus"). SchoolConnect handles this effortlessly:

### 1. Campus Groups (`groupCode`)
Campuses that belong to the same group share a special code (like `RADMOS` or `SUNRISE`). 

### 2. Moving Students Between Branches (Student Transfers)
If a student's family moves to another city:
1. The principal or admin at School A creates a **Transfer Request** to School B.
2. The admin at School B gets a notification and reviews the request.
3. Once School B clicks **"Approve"**, the student (and their parents) are automatically moved to the new campus and enrolled in their new class!
4. If a school has an **"Open Intake"** policy (`transferPolicy: open`), it can even accept transfers from other partner school groups.

---

## 6. The 8 User Roles (Who Uses What?)

Every person who logs into SchoolConnect has a specific role. Here is what each role does:

```
               ┌───────────────────────┐
               │      Super Admin      │ (Platform Owner)
               └──────────┬────────────┘
                          │ manages
            ┌─────────────┴─────────────┐
            ▼                           ▼
   ┌─────────────────┐         ┌─────────────────┐
   │  School Admin   │         │    Principal    │
   └────────┬────────┘         └────────┬────────┘
            │                           │
     ┌──────┴───────────────┬───────────┴──────┐
     ▼                      ▼                  ▼
┌───────────┐         ┌───────────┐      ┌───────────┐
│ Accountant│         │Class Teach│      │Bus Attend.│
└───────────┘         └─────┬─────┘      └─────┬─────┘
                            │                  │
                            ▼                  ▼
                     ┌─────────────┐    ┌─────────────┐
                     │   Parent    │    │   Student   │
                     └─────────────┘    └─────────────┘
```

| Role | Name in System | What They Do in the System |
| :--- | :--- | :--- |
| 1. **Super Admin** | `super_admin` | The platform owner. Can create new schools, change school settings, set free trial dates, switch between Connect and ERP modes, and access every single school. |
| 2. **School Admin** | `admin` | The head administrator of a specific school. Approves new student registrations, creates teacher invite codes, oversees annual student promotions, and manages campus transfers. |
| 3. **Principal** | `principal` | Has high-level oversight over all classes, homework, attendance records, school-wide circulars, and the ERP system. |
| 4. **Class Teacher** | `class_teacher` | Takes morning attendance on their digital register, assigns homework, posts class announcements, approves student leave requests, and chats with parents. |
| 5. **Accountant** | `accountant` | Works in the ERP console. Sets up tuition fee structures, creates fee bills (invoices), and records cash or cheque payments. |
| 6. **Bus Attendant** | `bus_attendant` | Travels on the school bus. Uses their phone to tick off bus stops as the bus reaches them, automatically updating the bus ETA for waiting parents. |
| 7. **Parent** | `parent` | Sees their child's daily schedule, homework, attendance percentage, bus location, fee dues, and teacher chats. Can apply for student sick leave with one click. |
| 8. **Student** | `student` | Checks daily homework, reads class messages, views their attendance calendar, and plays in the **Learning Zone** to earn XP points and badges. |

---

## 7. Every Single Feature Explained (Step-by-Step)

Let us walk through every single feature and screen in SchoolConnect AI.

---

### 7.1. Logging In and Creating an Account (Auth & OTP)

SchoolConnect does not use complicated, forgettable passwords. It works like modern mobile apps:

```
[Enter Phone or Email] ──► [Receive 6-digit OTP Code] ──► [Verify] ──► [Instant Login!]
```

1. **Step 1:** The user enters their phone number or email address.
2. **Step 2:** An OTP (One-Time Password) code is generated. (In demo and testing mode, the code is always `000000`).
3. **Step 3:** If the user already exists, they are logged in immediately.
4. **Step 4 (New Users):** If it's a new user, a simple registration screen asks for their name, role, school, and class.
   - **Teachers** must enter a special **Teacher Invite Code** provided by the school admin so unauthorized people cannot pose as teachers.

---

### 7.2. The "Pending Approval" Safety Gate

To protect children and school privacy, a newly registered student or teacher cannot immediately see the school's chats or student lists.

- When a new student registers, their account is put into **"Pending"** status.
- They can only see a friendly screen that says: *"Your enrollment is waiting for approval by your school admin."*
- The school admin opens their admin dashboard, sees the new student, and clicks **"Approve"**.
- As soon as approved, the full app opens up with all classes and features!

---

### 7.3. The User Dashboards (Home Screen)

When users open the app, they see a personalized home screen tailored to their exact role:

- **For Parents:**
  - *"Welcome, Aarav's Day!"*
  - Quick widgets showing today's attendance status (e.g., "Present ✅"), bus live ETA (e.g., "Bus arrives in 12 mins 🚌"), pending homework, and fee status.
- **For Students:**
  - *"Hey Aarav!"*
  - Shows pending homework assignments, class messages, and a banner showing their **Learning Zone XP points and daily streaks**.
- **For Teachers:**
  - Shows quick buttons to **Take Today's Attendance**, **Create Homework**, and view unread messages from parents.
- **For Admins:**
  - Shows quick links to user approvals, student promotions, and the full ERP office desk.

---

### 7.4. WhatsApp-Style Chats & Messaging

Traditional messaging apps mix school messages with family chats and spam. SchoolConnect provides dedicated school chat channels:

- **Class Groups:** Teachers can post messages and learning materials to the entire section (e.g., Grade 6-B).
- **Direct 1-on-1 Chats:** Parents can directly message the class teacher with questions or concerns.
- **Rich Cards:** Teachers don't just send plain text; they can send formatted cards for homework, daily class activities, or student progress notes.
- **Unread Counters:** Little badges show how many unread messages are waiting.

---

### 7.5. Homework Tracker

No more lost diaries or forgotten assignments!

```
Teacher creates homework with Due Date ──► App sends notification ──► Student checks off completion
```

- **Teacher assigns work:** The teacher chooses the subject (e.g., Mathematics), writes instructions (e.g., "Complete Exercise 4.2, questions 1 to 10"), and sets a due date.
- **Family view:** Parents and students see a clear list of active homework.
- **Status indicators:** Assignments are clearly marked as **Pending**, **Completed**, or **Overdue** (in red) if the due date has passed.
- **Check-off:** Students can mark assignments as completed once their work is finished.

---

### 7.6. School Circulars & Urgent Announcements

When a school needs to announce a holiday, exam schedule, or urgent weather advisory:

- School staff or the principal publish a **Circular**.
- A high-priority **Notification** is immediately sent to all relevant parents, students, and staff.
- Users can view and search all past circulars anytime in their **Circulars** tab so important rules and notices are never forgotten.

---

### 7.7. Teacher Class Desk & Daily Attendance

Taking attendance in SchoolConnect takes less than 30 seconds:

```
[Teacher opens Class Desk] ──► [See student list] ──► [Tap P / A / L / H / T] ──► [Save]
```

- **Five clear status markers:**
  - **P:** Present (Green)
  - **A:** Absent (Red)
  - **L:** On Approved Leave (Yellow/Orange)
  - **H:** Half-day
  - **T:** Tardy / Late
- **"Mark All Present" button:** The teacher can tap one button to mark all students present, and then just tap the few who are absent.
- **Personal Calendar for Parents:** Parents can open their child's attendance calendar anytime to see their full monthly attendance record and percentage.

---

### 7.8. Leave Requests & Automatic Attendance Sync

This is one of the smartest features in SchoolConnect:

```
1. Parent submits leave request (e.g., Sick leave: Monday to Wednesday)
                          │
                          ▼
2. Class Teacher or Admin reviews and clicks "APPROVE"
                          │
                          ▼
3. The system AUTOMATICALLY marks "L" (Leave) on the attendance sheet 
   for those exact dates!
                          │
                          ▼
4. When the teacher takes attendance on Monday, the student is ALREADY 
   marked "L" — preventing accidental "Absent" calls to parents!
```

If a leave request is rejected or cancelled, the "L" marker is safely cleared.

---

### 7.9. Live School Bus Tracking & ETA Alerts

SchoolConnect makes bus pickup safe and stress-free:

```
[Bus Attendant ticks off stops] ──► [GPS / Stop ETA calculated] ──► [Parents get 10m & 5m alerts]
```

- **The Bus Attendant's Screen:** As the school bus moves along its route, the attendant clicks on each stop (e.g., "Departed Metro Station", "Departed Market Crossing").
- **Real-Time ETA:** The system calculates the estimated time of arrival for every remaining stop.
- **Automated Alerts:** 
  - **10-Minute Alert:** A notification arrives: *"School bus is approximately 10 minutes away from your stop."*
  - **5-Minute Alert:** A final alert arrives: *"Bus is arriving in 5 minutes. Please head to the stop."*
- Parents never have to stand outside in the rain or heat waiting for an unknown bus arrival.

---

### 7.10. School Fees & Online Payment Demo

For schools in ERP mode (or with the fees module enabled):

- **Fee Structure:** School accountants configure tuition fees, transport fees, lab charges, and sports fees.
- **Fee Invoices:** The system generates term invoices for each student.
- **Family Fee Portal:**
  - Parents can see their total fee due, due date, breakdown of items, and past payment history.
  - Parents can click **"Pay Now" (Demo)** to simulate an online payment.
  - The payment ledger updates instantly, reducing the outstanding balance and providing a confirmation.

---

### 7.11. Learning Zone (Fun XP Points, Missions & Mood Tracker)

To keep students motivated and engaged, SchoolConnect includes a gamified **Learning Zone** (`/engage`):

- **XP (Experience Points):** Students earn XP by completing homework on time, maintaining good attendance streaks, and reading circulars.
- **Daily Streaks:** Tracks how many consecutive days the student has logged in and completed their daily learning mission.
- **Challenges & Quests:** Daily mini-tasks (e.g., *"Review today's Science notes"*, *"Check your homework checklist"*).
- **Daily Mood Check-In:** Students can tap how they are feeling today (Happy, Focused, Tired, Excited). This helps teachers and parents understand student well-being.

---

### 7.12. AI School Assistant

SchoolConnect includes an in-app **AI Assistant** (`/ai`):
- Available to answer student and parent questions about school hours, uniform guidelines, term schedules, exam rules, and general help.
- Designed as a helpful school concierge available 24/7.

---

### 7.13. Light School Admin Dashboard (`/admin`)

For daily administrative tasks on the phone or web:
- **User Directory:** Browse all parents, students, and teachers in the school.
- **Invite Codes:** Generate secure invite codes to hand out to newly hired teachers.
- **Enrollment Approvals:** Review and approve newly registered students.
- **Annual Grade Promotions:** Move an entire class up to the next grade at the end of the academic year (e.g., Class 6-B moves to Class 7-B).
- **Session Rollovers:** Start a new school academic year with clean registers.

---

### 7.14. Desktop School ERP Portal (`/erp`)

When a school is set to **Full ERP Mode**, school leaders get access to a full desktop office suite with 18 specialized modules:

```text
/erp
├── Dashboard       → High-level graphs (total students, fee collection, attendance rates)
├── Schools         → Super Admin school setup, mode switching, trial extensions
├── Students (SIS)  → Complete Student Information System (Bio, parents, address, medical)
├── Staff & Teachers→ Teacher directory, qualifications, subjects taught, employee IDs
├── Classes         → Class and section management (Grade 1 to 12, sections A, B, C)
├── Subjects        → Master list of subjects (Maths, Science, English, etc.)
├── Timetable       → Weekly schedule planner for periods and teachers
├── Admissions      → New admission inquiry pipeline, document checklist & enrollment
├── Attendance      → School-wide attendance statistics and spreadsheet exports
├── Leaves          → Central queue to review and approve all staff & student leaves
├── Exams           → Schedule exams, maximum marks, and grading scales
├── Report Cards    → Automatically calculate marks, percentages, and generate printable PDF cards
├── Fees            → Set fee structures, generate invoices, record offline payments
├── ID Cards        → Design and batch-print photo ID cards for students and staff
├── Parent Links    → Connect a parent account to multiple siblings in different classes
├── Transfers       → Manage inter-campus student transfers between branches
├── Sessions        → Academic calendar management and year-end promotions
└── Audit Log       → Security trail showing who edited which record and when
```

---

### 7.15. Bulk Data Upload using Excel/CSV Spreadsheets

If a school has 1,000 students and 80 teachers, entering them one by one would take days. SchoolConnect solves this with **Bulk CSV Import/Export**:

1. Open `/erp/students` or `/erp/staff`.
2. Click **"Download Template"** to get a clean spreadsheet.
3. Fill in student names, roll numbers, admission numbers, class, and guardian details.
4. Drag and drop the CSV file back into SchoolConnect.
5. The system automatically creates or updates up to **500 records at a time** in seconds!
6. Imported students immediately appear in their teacher's class roster.

---

### 7.16. Parent-Student Linking

A parent might have two children studying in the same school (e.g., one child in Grade 2 and another in Grade 6):
- SchoolConnect uses a dedicated **Parent-Student Link** system.
- One parent account can be linked to multiple children.
- On the home screen, parents can switch between their children to view each child's individual attendance, homework, and fees without logging out and back in!

---

### 7.17. Mobile App for Android and iPhone

In addition to the web app, SchoolConnect includes a native mobile app inside `apps/mobile`:
- Built with **React Native**.
- Provides a native mobile experience for parents and students on both Google Android and Apple iOS devices.
- Uses the same secure API server as the web application.

---

## 8. Database & Data Organization (How Information is Saved)

SchoolConnect organizes all school data cleanly into 5 distinct logical groups inside MongoDB:

| Category | Database Collections | What is Saved Inside |
| :--- | :--- | :--- |
| **1. Core** | `User`, `School`, `Class`, `OtpChallenge`, `TeacherInvite`, `StudentEnrollment` | User login accounts, school details, class divisions, login OTP codes, teacher invites, and enrollment status. |
| **2. Communications** | `Chat`, `Message`, `Homework`, `Notification` | Chat rooms, sent messages, homework assignments, and system alerts. |
| **3. Operations** | `ClassDesk`, `Leave`, `BusRoute`, `BusState` | Daily attendance roll call sheets, leave applications, bus routes, stops, and live bus positions. |
| **4. Family** | `FeeAccount`, `ParentStudentLink`, `StudentEngage` | Student fee balances, links between parents and children, and Learning Zone XP scores/streaks. |
| **5. ERP** | `StudentProfile`, `StaffProfile`, `AdmissionApplication`, `FeeStructure`, `FeeInvoice`, `FeePayment`, `Exam`, `ExamMark`, `BranchTransfer`, `AcademicSession`, `Subject`, `ErpAuditLog` | Full student and teacher dossiers, admission inquiries, fee billing rules, invoices, exam marks, campus transfers, and audit logs. |

> **Strict School Isolation (Multi-Tenancy):** Every single record has a `schoolId` tag. Teachers and parents from "Green Valley School" can **never** see or access data belonging to "Harmony Public School".

---

## 9. Free Subscription System

SchoolConnect includes a built-in school subscription system:

- Every new school created is automatically granted a **1-Year Free Subscription** (365 days) from the day it is onboarded.
- The expiration date (`subscriptionExpiresAt`) is visible to the school admin.
- When a subscription is active, all features work smoothly.
- If a school's trial period ends, the Super Admin can easily extend the date by another year directly inside the `/erp/schools` panel.
- (There is no complicated credit card or payment gateway setup required — it is a clean, reliable date-based license system).

---

## 10. How to Run and Test the Project (With Demo Logins)

You can run the entire project on your local machine with just a couple of commands:

### Running the Project:
```bash
# 1. Install all dependencies
npm install

# 2. Populate the database with complete demo schools and accounts
npm run seed

# 3. Start the Web App and Backend Server
npm run dev:web
```
Now open your web browser and go to `http://localhost:3000`.

---

### Demo Accounts to Test:
Whenever you log in using any of the email addresses below, use the demo OTP code: **`000000`**.

#### 1. ERP Mode Demo Schools (With Full Office Console)
- **Radoms International (Single Campus - Full ERP):**
  - **School Admin:** `admin@radoms.demo` (Can open `/erp`)
  - **Class Teacher:** `teacher@radoms.demo`
  - **Parent:** `parent@radoms.demo`
  - **Student:** `student@radoms.demo`
- **Radmos Group Campuses (Multi-Campus with Transfers):**
  - **Noida Campus Admin:** `admin.noida@radmos.demo`
  - **Lucknow Campus Admin:** `admin.lucknow@radmos.demo`

#### 2. Connect Mode Demo Schools (Lightweight App Only)
- **Harmony School (Single Campus - Connect Mode):**
  - **School Admin:** `admin@connect.demo`
  - **Class Teacher:** `teacher@connect.demo`
  - **Parent:** `parent@connect.demo`
  - **Student:** `student@connect.demo`
- **Sunrise Group Campuses (Multi-Campus Connect Mode):**
  - **East Campus Admin:** `admin.east@sunrise.demo`
  - **West Campus Admin:** `admin.west@sunrise.demo`

#### 3. Platform Owner (Super Admin)
- **Email:** `super@schoolconnect.demo`
- Can open any school, add new schools, change modes, and extend subscriptions.

---

## 11. Summary & Quick Reference Table

| If you want to know about... | Here is the short answer: |
| :--- | :--- |
| **What is SchoolConnect?** | A complete school platform combining WhatsApp-style daily messaging with a full desktop school management office (ERP). |
| **How do people log in?** | Using their phone number or email with a fast 6-digit OTP code (Demo code: `000000`). |
| **Can anyone enter a school?** | No! Teachers need an admin invite code, and students must be approved by an admin before they can see class data. |
| **How does attendance work?** | Teachers tap Present, Absent, Half-day, or Late. If a student's leave was approved, the system automatically marks "Leave" so they aren't marked absent. |
| **How does bus tracking work?** | The bus attendant clicks off stops as they drive. The system calculates the arrival time and alerts parents 10 minutes and 5 minutes before arrival. |
| **How do fees work?** | The accountant sets fee structures in the ERP. Parents view their bill and can make a demo payment directly in their app. |
| **Can a student transfer schools?** | Yes! Admins can initiate inter-campus transfers between partner branches with one-click approval. |
| **How to add hundreds of students?** | Admins can download an Excel template, fill it in, and upload up to 500 students or staff at once via CSV import. |
| **Does it work on mobile phones?** | Yes, both as a responsive web app and as a native React Native app for Android and iOS. |

---

*This guide covers every concept, screen, and workflow in the SchoolConnect AI ecosystem. For screen-by-screen UI/UX breakdowns and layout references, see [docs/ROUTES_AND_UI_UX_GUIDE.md](docs/ROUTES_AND_UI_UX_GUIDE.md). For technical developer details, API routes, or deployment steps, refer to the [docs/README.md](docs/README.md) hub.*
