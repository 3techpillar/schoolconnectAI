"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  hasPermission,
  type Action,
  type Resource,
  type Scope,
  type Role,
} from "@schoolconnect/shared";
import { useAuth } from "@/lib/providers/auth";

interface RBACContextValue {
  role: Role | null;
  can: (resource: Resource, action: Action, scope?: Scope) => boolean;
  canAccess: (resource: Resource) => boolean;
}

const RBACContext = createContext<RBACContextValue>({
  role: null,
  can: () => false,
  canAccess: () => false,
});

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = (user?.role as Role) ?? null;

  const value = useMemo<RBACContextValue>(() => {
    return {
      role,
      can: (resource: Resource, action: Action, scope?: Scope) =>
        hasPermission(role, resource, action, scope),
      canAccess: (resource: Resource) =>
        hasPermission(role, resource, "view"),
    };
  }, [role]);

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function usePermission() {
  return useContext(RBACContext);
}
