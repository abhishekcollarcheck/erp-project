'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCredentials,
  setPermissions,
  updateToken,
  selectEmployeeId,
  selectIsAuthenticated,
  selectManagedCompanies
} from '../store/slices/authSlice';
import { socketService } from '../services/socket.service';
import { authService } from '../services/api/auth.service';
import { store } from '../store';
import { useCompany } from '../features/company/hooks/useCompany';
import apiClient from '../services/api/client';
import { setManagedCompanies } from '../store/slices/authSlice';
import { useQueryClient } from '@tanstack/react-query';
import { EMP_KEYS } from '../features/employees/hooks/useEmployees';

export function usePermissionSocket() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient()
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const employeeId = useAppSelector(selectEmployeeId);
  const { companyId } = useCompany();
  const managedCompanies = useAppSelector(selectManagedCompanies)
  const refreshFromServer = useCallback(async () => {
    try {
      const res = await authService.getMe();
      const user = (res as any)?.data ?? res;
      if (!user) return;
      const currentToken = store.getState().auth.accessToken ?? '';
      dispatch(setCredentials({ user, accessToken: currentToken }));
    } catch (err) {
      console.warn('[usePermissionSocket] getMe failed:', err);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !employeeId) return;
    console.log(
      "INIT SOCKET",
      {
        employeeId,
        connected: socketService.isConnected()
      }
    );
    if (!socketService.isConnected()) {
      socketService.connect(managedCompanies.map((c: any) => c.id));
    }else{
      socketService.joinCompanyRooms(managedCompanies.map((c: any) => c.id));
    }
    socketService.register(employeeId);

const unsubscribe = socketService.on("permissions:updated", (payload: any) => {
  console.log("🔥 PERMISSION EVENT RECEIVED", payload);  
  if (Number(payload.companyId) !== Number(companyId)) {
    console.log("❌ EVENT IGNORED", { eventCompany: payload.companyId, activeCompany: companyId });
    return;
  }

  queryClient.invalidateQueries({ queryKey: EMP_KEYS.fieldPerms });

  if (payload?.permissions && Array.isArray(payload.permissions)) {
    dispatch(setPermissions(payload.permissions));
    if (payload.accessToken) {
      dispatch(updateToken(payload.accessToken));
    }
  } else {
    refreshFromServer();
  }
});
    const unsubscribeCompanies = socketService.on("companies:updated", async () => {
      try {
        const res = await apiClient.get("/companies/mine");

        dispatch(setManagedCompanies(res.data));

      } catch (err) {
        console.error("Failed to refresh companies", err);
      }
    });

    return () => { unsubscribe(); unsubscribeCompanies(); };
  }, [isAuthenticated, employeeId, dispatch, refreshFromServer, companyId, managedCompanies]);

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: EMP_KEYS.fieldPerms });
  }, [companyId, queryClient]);
}