import { useQueries } from "@tanstack/react-query";
import { pgApi } from "../features/setting/services/permissions.services";
import { useMemo } from "react";

// Which companies actually have each module enabled — sourced from the
// HrModule/ModuleCompany catalog (pgApi.companyEnabledModules), NOT the old
// CompanyModule/company_modules table. Keyed by `permission_key ?? slug` to
// match ModuleDef.key exactly, since that's what ModuleMatrix looks this map
// up by (moduleCompanyMap[m.key]) — keeping this shape identical means
// page.tsx needs zero changes.
export function useCompanyModulesMap(assignedCompanies: { id: number; name: string; shortName: string }[]) {
    const moduleQueries = useQueries({
        queries: assignedCompanies.map((co) => ({
            queryKey: ['rp', 'company-modules', co.id],
            queryFn: () => pgApi.companyEnabledModules(co.id),
            staleTime: 5 * 60_000,   // company-module config kam badalta hai, isliye lambi staleTime
        })),
    });

    return useMemo(() => {
        const map: Record<string, { label: string; companies: { id: number; name: string; shortName: string }[] }> = {};

        assignedCompanies.forEach((co, idx) => {
            const modules = moduleQueries[idx]?.data?.data || [];
            for (const m of modules as any[]) {
                const key = m.permission_key ?? m.slug;
                if (!key) continue;
                if (!map[key]) map[key] = { label: m.name, companies: [] };
                map[key].companies.push(co);
            }
        });
        return map;
    }, [assignedCompanies, moduleQueries]);
}