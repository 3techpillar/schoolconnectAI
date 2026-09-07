# Student & teacher data — import / export guidelines

Bulk load school master data via **CSV** in the ERP console (`productMode: erp`).

| Data | UI | API |
|------|----|-----|
| **Students** | `/erp/students` | `GET/POST /api/erp/students/csv` |
| **Teachers / staff** | `/erp/staff` | `GET/POST /api/erp/staff/csv` |

Related: [ERP.md](./ERP.md) · [PRODUCT-MODES.md](./PRODUCT-MODES.md) · Demo logins in [README](../README.md#demo-accounts)

---

## Common rules

1. **UTF-8 CSV**, first row = header (exact column names from the template).
2. Use **Download template** on the ERP page before first import.
3. Max **500 rows** per request.
4. Fields containing commas must be wrapped in double quotes (`"Sharma, Rahul"`).
5. Import updates **MDM profiles only** — it does **not** create login users (OTP accounts). Teachers still need invite / register; parents link separately.
6. Prefer **Export → edit → Import** for updates (`admissionNo` / `employeeId` upsert keys).
7. Only users with ERP access for that school can import/export.

---

## Students

### Columns

| Column | Required | Notes |
|--------|----------|--------|
| `name` | **Yes** | Full name |
| `admissionNo` | Recommended | Upsert key if present |
| `className` | Recommended | e.g. `6-B` — syncs ClassDesk roster |
| `rollNo` | Optional | |
| `status` | Export only | Import forces `enrolled` |
| `dob` | Optional | `YYYY-MM-DD` |
| `gender` | Optional | `male` \| `female` \| `other` |
| `guardianName` | Optional | Primary guardian |
| `guardianPhone` | Optional | |

### Template

```csv
admissionNo,name,className,rollNo,status,dob,gender,guardianName,guardianPhone
ADM-001,Aarav Sharma,6-B,12,enrolled,2014-05-12,male,Rahul Sharma,9876543210
ADM-002,Diya Verma,6-B,13,enrolled,2014-08-03,female,Neha Verma,9876543211
```

### Steps

1. Open `/erp/students` as school admin (ERP school).
2. **Download template** (or Export existing).
3. Fill rows in Sheets/Excel → Save as CSV.
4. **Choose CSV file** or paste → **Import CSV**.
5. Confirm roster on Class desk / attendance.

---

## Teachers / staff

### Columns

| Column | Required | Notes |
|--------|----------|--------|
| `name` | **Yes** | |
| `employeeId` | Recommended | Upsert key if present |
| `designation` | Recommended | e.g. Class Teacher, Subject Teacher |
| `subjects` | Optional | Use **`\|`** separator: `Math\|Science` (not commas) |
| `phone` | Optional | |
| `email` | Optional | |
| `status` | Optional | `active` \| `inactive` |

### Template

```csv
employeeId,name,designation,subjects,phone,email,status
EMP-101,Ms. Kapoor,Class Teacher,Math|Science,9876500001,kapoor@school.demo,active
EMP-102,Mr. Singh,Subject Teacher,English|Hindi,9876500002,singh@school.demo,active
```

### Steps

1. Open `/erp/staff`.
2. Download template → fill → Import.
3. Create **invite codes** / users so teachers can log into the app (CSV does not create logins).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 0 rows imported | Check header spelling; ensure `name` column filled |
| Wrong subjects split | Use `\|` not commas in `subjects` |
| Duplicate students | Re-import with same `admissionNo` to update |
| 403 ERP not enabled | School must be `productMode: erp` with active subscription |
| Excel garbled text | Save as **CSV UTF-8** |

---

## Out of scope (for now)

- Parent bulk CSV / auto user creation  
- Photo / document binary import  
- Connect-only schools (no `/erp`) — use light admin enroll flows instead  
