'use client';
/**
 * usePermissionSocket.ts
 *
 * Handles two types of 'permissions:updated' events:
 *
 * Type A — emitted by permissionBroadcast.middleware (group permission edit):
 *   { eventType: 'permissions_updated', changes: {...}, message, timestamp }
 *   No permissions array, no accessToken.
 *   → Call /auth/me to get fresh permissions for the current user.
 *
 * Type B — emitted by addMember / removeMember / setOverrides (our additions):
 *   { eventType: 'permissions_updated', permissions: string[], accessToken: string }
 *   Sent directly to the AFFECTED employee's room (employee_${targetId}).
 *   → Use the payload directly — no /auth/me needed.
 *
 * The socket room ensures the event only arrives at the correct employee's browser.
 * The admin who triggered the action receives their own event from the broadcast
 * middleware (Type A) and calls /auth/me — which returns their own unchanged permissions.
 * The affected employee receives the Type B event with their new permissions directly.
 */

import { useEffect, useCallback }         from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setCredentials,
  setPermissions,
  updateToken,
  selectEmployeeId,
  selectIsAuthenticated,
} from '../store/slices/authSlice';
import { socketService }                  from '../services/socket.service';
import { authService }                    from '../services/api/auth.service';
import { store }                          from '../store';
import { useCompany } from '../features/company/hooks/useCompany';
import apiClient from '../services/api/client';
import { setManagedCompanies } from '../store/slices/authSlice';

export function usePermissionSocket() {
  const dispatch        = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const employeeId      = useAppSelector(selectEmployeeId);
  const {companyId} = useCompany(); 
  // Called when the event has no embedded permissions (Type A — broadcast middleware).
  // Fetches the current user's own fresh permissions from the server.
  const refreshFromServer = useCallback(async () => {
    try {
      const res  = await authService.getMe();
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
      socketService.connect();
    }
    socketService.register(employeeId);

const unsubscribe = socketService.on("permissions:updated", (payload: any) => {
  console.log("🔥 PERMISSION EVENT RECEIVED", payload);

  console.log("EVENT COMPANY", payload.companyId);
  console.log("ACTIVE COMPANY", companyId);

  if (payload.companyId !== companyId) {
    console.log("❌ EVENT IGNORED");
    return;
  }

  console.log("✅ BEFORE DISPATCH");

  if (payload?.permissions && Array.isArray(payload.permissions)) {
    dispatch(setPermissions(payload.permissions));

    console.log("✅ AFTER DISPATCH");

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

    return () => { unsubscribe(); unsubscribeCompanies();};
  }, [isAuthenticated, employeeId, dispatch, refreshFromServer, companyId]);

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
    }
  }, [isAuthenticated]);
}