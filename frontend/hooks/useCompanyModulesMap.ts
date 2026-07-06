import { useQueries } from "@tanstack/react-query";
import apiClient from "../services/api/client";
import { ApiResponse } from "../types/api.types";
import { useMemo } from "react";

export function useCompanyModulesMap(assignedCompanies: { id: number; name: string; shortName: string }[]) {
    const moduleQueries = useQueries({
        queries: assignedCompanies.map((co) => ({
            queryKey: ['rp', 'company-modules', co.id],
            queryFn: () => apiClient.get<unknown, ApiResponse<{ module: string; label: string }[]>>(
                `/permission-groups/company-modules?company_id=${co.id}`
            ),
            staleTime: 5 * 60_000,   // company-module config kam badalta hai, isliye lambi staleTime
        })),
    });

    return useMemo(() => {
        const map: Record<string, { label: string; companies: { id: number; name: string; shortName: string }[] }> = {};

        assignedCompanies.forEach((co, idx) => {
            const modules = moduleQueries[idx]?.data?.data || [];
            for (const m of modules) {
                if (!map[m.module]) map[m.module] = { label: m.label, companies: [] };
                map[m.module].companies.push(co);
            }
        });
        return map;
    }, [assignedCompanies, moduleQueries]);
}