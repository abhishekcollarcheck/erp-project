'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  countryService, stateService, cityService, siteService, payRegisterService,
  type BaseQueryParams, type StateQueryParams, type CityQueryParams, type SiteQueryParams, type PayRegisterQueryParams,
  type CreateCountryDto, type UpdateCountryDto,
  type CreateStateDto, type UpdateStateDto,
  type CreateCityDto, type UpdateCityDto,
  type CreateSiteDto, type UpdateSiteDto,
  type CreatePayRegisterDto, type UpdatePayRegisterDto,
} from '../../../services/api/location.service';
import { showToast } from '../../../utils/toast';

const KEYS = {
  countries: { all: ['countries'] as const, list: (p?: BaseQueryParams) => ['countries', 'list', p] as const, detail: (id: number) => ['countries', id] as const },
  states: { all: ['states'] as const, list: (p?: StateQueryParams) => ['states', 'list', p] as const, detail: (id: number) => ['states', id] as const },
  cities: { all: ['cities'] as const, list: (p?: CityQueryParams) => ['cities', 'list', p] as const, detail: (id: number) => ['cities', id] as const },
  sites: { all: ['sites'] as const, list: (p?: SiteQueryParams) => ['sites', 'list', p] as const, detail: (id: number) => ['sites', id] as const },
  payRegisters: { all: ['pay-registers'] as const, list: (p?: PayRegisterQueryParams) => ['pay-registers', 'list', p] as const, detail: (id: number) => ['pay-registers', id] as const },
};

// Helper factory to streamline mutation creation across location entities
function useLocationMutation<TDto, TRes>(
  mutationFn: (data: TDto) => Promise<any>,
  invalidKey: readonly unknown[],
  successMessage: (res: any) => string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: invalidKey });
      showToast(successMessage(res));
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Action failed');
    },
  });
}

// ─── 1. COUNTRY HOOKS ────────────────────────────────────────────────────────
export function useCountries(params?: BaseQueryParams) {
  return useQuery({ queryKey: KEYS.countries.list(params), queryFn: () => countryService.getAll(params), select: (res) => res.data });
}
export function useCreateCountry() {
  return useLocationMutation((data: CreateCountryDto) => countryService.create(data), KEYS.countries.all, (res) => `✓ Country "${res.data.name}" created`);
}
export function useUpdateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCountryDto }) => countryService.update(id, data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.countries.all });
      qc.setQueryData(KEYS.countries.detail(variables.id), res);
      showToast(`✓ Country "${res.data.name}" updated`);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed'),
  });
}
export function useDeleteCountry() {
  return useLocationMutation((id: number) => countryService.delete(id), KEYS.countries.all, () => 'Country deleted');
}

// ─── 2. STATE HOOKS ──────────────────────────────────────────────────────────
export function useStates(params?: StateQueryParams) {
  return useQuery({ queryKey: KEYS.states.list(params), queryFn: () => stateService.getAll(params), select: (res) => res.data });
}
export function useCreateState() {
  return useLocationMutation((data: CreateStateDto) => stateService.create(data), KEYS.states.all, (res) => `✓ State "${res.data.name}" created`);
}
export function useUpdateState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStateDto }) => stateService.update(id, data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.states.all });
      qc.setQueryData(KEYS.states.detail(variables.id), res);
      showToast(`✓ State "${res.data.name}" updated`);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed'),
  });
}
export function useDeleteState() {
  return useLocationMutation((id: number) => stateService.delete(id), KEYS.states.all, () => 'State deleted');
}

// ─── 3. CITY HOOKS ───────────────────────────────────────────────────────────
export function useCities(params?: CityQueryParams) {
  return useQuery({ queryKey: KEYS.cities.list(params), queryFn: () => cityService.getAll(params), select: (res) => res.data });
}
export function useCreateCity() {
  return useLocationMutation((data: CreateCityDto) => cityService.create(data), KEYS.cities.all, (res) => `✓ City "${res.data.name}" created`);
}
export function useUpdateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCityDto }) => cityService.update(id, data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.cities.all });
      qc.setQueryData(KEYS.cities.detail(variables.id), res);
      showToast(`✓ City "${res.data.name}" updated`);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed'),
  });
}
export function useDeleteCity() {
  return useLocationMutation((id: number) => cityService.delete(id), KEYS.cities.all, () => 'City deleted');
}

// ─── 4. SITE HOOKS ───────────────────────────────────────────────────────────
export function useSites(params?: SiteQueryParams) {
  return useQuery({ queryKey: KEYS.sites.list(params), queryFn: () => siteService.getAll(params), select: (res) => res.data });
}
export function useCreateSite() {
  return useLocationMutation((data: CreateSiteDto) => siteService.create(data), KEYS.sites.all, (res) => `✓ Site "${res.data.name}" created`);
}
export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSiteDto }) => siteService.update(id, data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.sites.all });
      qc.setQueryData(KEYS.sites.detail(variables.id), res);
      showToast(`✓ Site "${res.data.name}" updated`);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed'),
  });
}
export function useDeleteSite() {
  return useLocationMutation((id: number) => siteService.delete(id), KEYS.sites.all, () => 'Site deleted');
}

// ─── 5. PAY REGISTER HOOKS ───────────────────────────────────────────────────
export function usePayRegisters(params?: PayRegisterQueryParams) {
  return useQuery({ queryKey: KEYS.payRegisters.list(params), queryFn: () => payRegisterService.getAll(params), select: (res) => res.data });
}
export function useCreatePayRegister() {
  return useLocationMutation((data: CreatePayRegisterDto) => payRegisterService.create(data), KEYS.payRegisters.all, (res) => `✓ Pay Register "${res.data.name}" created`);
}
export function useUpdatePayRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePayRegisterDto }) => payRegisterService.update(id, data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: KEYS.payRegisters.all });
      qc.setQueryData(KEYS.payRegisters.detail(variables.id), res);
      showToast(`✓ Pay Register "${res.data.name}" updated`);
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'Update failed'),
  });
}
export function useDeletePayRegister() {
  return useLocationMutation((id: number) => payRegisterService.delete(id), KEYS.payRegisters.all, () => 'Pay Register deleted');
}