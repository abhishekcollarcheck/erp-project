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

export function usePermissionSocket() {
  const dispatch        = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const employeeId      = useAppSelector(selectEmployeeId);

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

    const unsubscribe = socketService.on('permissions:updated', (payload: any) => {
            console.log(
        "🔥 PERMISSION EVENT RECEIVED",
        payload
      );
      if (payload?.permissions && Array.isArray(payload.permissions)) {
        console.log("NEW PERMISSIONS FROM SOCKET", payload.permissions);
        // Type B: fresh permissions embedded in the payload — use directly.
        // This event was sent specifically to this employee's room by addMember,
        // removeMember, or setOverrides. No network round-trip needed.
        dispatch(setPermissions(payload.permissions));
        if (payload.accessToken) {
          dispatch(updateToken(payload.accessToken));
        }
      } else {
        // Type A: no permissions in payload (broadcast middleware format).
        // Call /auth/me to get the current user's fresh state.
        refreshFromServer();
      }
    });

    return () => { unsubscribe(); };
  }, [isAuthenticated, employeeId, dispatch, refreshFromServer]);

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
    }
  }, [isAuthenticated]);
}