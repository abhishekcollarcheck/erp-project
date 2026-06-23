'use client';
import { useCallback, useEffect }   from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  switchCompany    as switchCompanyAction,
  selectActiveCompanyId,
  selectActiveCompany,
  selectManagedCompanies,
  selectIsSuperAdmin,
} from '../../../store/slices/authSlice';
import { ManagedCompany } from '../../../types/auth.types';
import { useQuery }      from '@tanstack/react-query';
import apiClient         from '../../../services/api/client';

export function useCompany() {
  const dispatch          = useAppDispatch();
  const activeCompanyId   = useAppSelector(selectActiveCompanyId);
  const activeCompany     = useAppSelector(selectActiveCompany);
  const managedCompanies  = useAppSelector(selectManagedCompanies);
  const isSuperAdmin      = useAppSelector(selectIsSuperAdmin);

  const switchCompany = useCallback((companyId: number) => {
    dispatch(switchCompanyAction(companyId));
  }, [dispatch]);

useEffect(() => {
  console.log("ACTIVE COMPANY", activeCompany);
}, [activeCompany]);

console.log("managedCompanies", managedCompanies);

  // For super admins managing many companies, also load from API
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['my-companies'],
    queryFn:  () => apiClient.get<any,any>('/companies/mine'),
    enabled:  isSuperAdmin || managedCompanies.length > 1,
    select:   (r: any) => r.data as ManagedCompany[],
    staleTime: 5 * 60_000,
  });

  // Use managedCompanies from JWT first, fall back to API data for super admins
  const companies = isSuperAdmin && allCompanies.length > 0
    ? allCompanies
    : managedCompanies;

  const isMultiCompany    = companies.length > 1 || isSuperAdmin;
  const canSwitchCompany  = isMultiCompany;

  return {
    companyId:       activeCompanyId!,   // use this as company_id in all API calls
    company:         activeCompany,
    companies,
    isMultiCompany,
    canSwitchCompany,
    switchCompany,
    isSuperAdmin,
  };
}
