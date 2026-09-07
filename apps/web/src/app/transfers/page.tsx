"use client";

import { PhoneShell } from "@/components/shell/PhoneShell";
import { TransferDesk } from "@/components/erp/TransferDesk";
import { useAuth, isSchoolAdmin, isSuperAdmin } from "@/lib/providers/auth";
import { LoadingBlock } from "@/components/shell/StatusUI";

/** Connect (and all) admins — transfers without ERP MDM. */
export default function TransfersPage() {
  const { user, ready } = useAuth();

  if (!ready || !user) {
    return (
      <PhoneShell title="Transfers" subtitle="Campus moves">
        <LoadingBlock label="Loading…" />
      </PhoneShell>
    );
  }

  if (!isSchoolAdmin(user) && !isSuperAdmin(user) && user.role !== "principal") {
    return (
      <PhoneShell title="Transfers" subtitle="Campus moves">
        <p className="text-sm muted">
          Only school admin / principal can manage transfers.
        </p>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell title="Transfers" subtitle="Group or open destination">
      <TransferDesk embedded />
    </PhoneShell>
  );
}
