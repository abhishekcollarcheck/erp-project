"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../features/auth/hooks/useAuth";
import { useAppSelector } from "../store";
import { selectActiveCompanyId } from "../store/slices/authSlice";
import { pgApi } from "../features/setting/services/permissions.services";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
}: PermissionGuardProps) {
  const router = useRouter();
  const { hasPermission, isSuperAdmin } = usePermission();
  const companyId = useAppSelector(selectActiveCompanyId);

  // Module portion of the slug, e.g. "employees:view" -> "employees"
  const moduleKey = permission.split(":")[0];

  const { data: activeModules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["permission-guard-modules", companyId],
    queryFn: () => pgApi.companyEnabledModules(companyId!),
    enabled: !!companyId && !isSuperAdmin,
    staleTime: 60_000,
    select: (r: any): string[] =>
      ((r.data ?? []) as any[]).map((m) => m.permission_key ?? m.slug),
  });

  // Don't decide anything until we actually know the module state — avoids
  // a flash of content that then gets yanked away once the fetch resolves.
  const ready = isSuperAdmin || !modulesLoading;
  const hasModule = isSuperAdmin || activeModules.includes(moduleKey);
  const canView = isSuperAdmin || (hasPermission(permission) && hasModule);

  useEffect(() => {
    if (!ready) return;
    if (!canView) {
      router.replace("/dashboard");
    }
  }, [ready, canView, router]);

  if (!ready) return null;
  if (!canView) return null;

  return <>{children}</>;
}