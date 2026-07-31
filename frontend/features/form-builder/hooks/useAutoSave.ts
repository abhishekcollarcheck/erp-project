'use client';
import { useEffect, useRef, useCallback } from 'react';

/**
 * PHASE 2: useAutoSave Hook
 * 
 * Provides auto-save functionality with debouncing.
 * Automatically saves form state to backend after 3 seconds of inactivity.
 * 
 * Usage:
 * ```tsx
 * const { isDirty, draftSaving, draftSavedAt } = useAutoSave({
 *   values,
 *   step,
 *   formId,
 *   sessionId: sessionIdRef.current,
 *   recordId,
 *   enabled: autoSaveEnabled,
 * });
 * ```
 */

export interface UseAutoSaveConfig {
  values: Record<string, any>;           // Current form values
  step: number;                          // Current step/section
  formId: number;                        // Form ID to save under
  sessionId: string;                     // Unique session ID
  recordId?: number;                     // Optional: record ID for edit mode
  enabled?: boolean;                     // Enable/disable auto-save (default true)
  debounceMs?: number;                   // Debounce delay ms (default 3000)
  onSave?: (payload: DraftPayload) => Promise<void>;  // Custom save handler
  onError?: (error: Error) => void;      // Error callback
}

export interface DraftPayload {
  form_id: number;
  session_id: string;
  step: number;
  form_data: Record<string, any>;
  record_id?: number | null;
}

export interface UseAutoSaveReturn {
  isDirty: boolean;          // Whether form has unsaved changes
  draftSaving: boolean;      // Whether currently saving
  draftSavedAt: Date | null; // Last save timestamp
  triggerAutoSave: () => Promise<void>;  // Manually trigger save
  clearAutoSave: () => void; // Manually clear timer
}

export function useAutoSave({
  values,
  step,
  formId,
  sessionId,
  recordId,
  enabled = true,
  debounceMs = 3000,
  onSave,
  onError,
}: UseAutoSaveConfig): UseAutoSaveReturn {
  // Refs for managing timer and state
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedValuesRef = useRef<Record<string, any>>({});
  const isSavingRef = useRef(false);

  /**
   * Trigger auto-save immediately
   * Sends current form state to backend
   */
  const triggerAutoSave = useCallback(async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) {
      console.debug('Auto-save: Already saving, skipping');
      return;
    }

    // Don't save if auto-save disabled
    if (!enabled) {
      console.debug('Auto-save: Disabled, skipping');
      return;
    }

    // Don't save if values haven't changed since last save
    const valuesChanged =
      JSON.stringify(values) !== JSON.stringify(lastSavedValuesRef.current);
    if (!valuesChanged) {
      console.debug('Auto-save: No changes since last save');
      return;
    }

    try {
      isSavingRef.current = true;
      console.debug('Auto-save: Starting save...');

      // Build payload
      const payload: DraftPayload = {
        form_id: formId,
        session_id: sessionId,
        step,
        form_data: values,
        record_id: recordId ?? null,
      };

      // Validate payload
      if (!payload.form_id || !payload.session_id) {
        throw new Error('Missing required fields: formId or sessionId');
      }

      // Use custom save handler or default API
      if (onSave) {
        console.debug('Auto-save: Using custom save handler');
        await onSave(payload);
      } else {
        console.debug('Auto-save: Posting to /api/drafts/save', payload);

        const response = await fetch('/api/drafts/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(
            error.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();
        console.log('Auto-save: Draft saved successfully', result);
      }

      // Update last saved values to prevent duplicate saves
      lastSavedValuesRef.current = JSON.parse(JSON.stringify(values));
      console.debug('Auto-save: Saved at', new Date().toLocaleTimeString());
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Auto-save: Error occurred:', err);

      // Call error handler if provided
      if (onError) {
        onError(err);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [values, step, formId, sessionId, recordId, enabled, onSave, onError]);

  /**
   * Clear the debounce timer
   */
  const clearAutoSave = useCallback(() => {
    if (timerRef.current) {
      console.debug('Auto-save: Clearing timer');
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  /**
   * Set up debounced auto-save
   * Triggers save after 3 seconds of inactivity
   */
  useEffect(() => {
    // Don't set up auto-save if disabled
    if (!enabled) {
      return;
    }

    // Always clear previous timer (reset debounce)
    clearAutoSave();

    // Set new timer to trigger save after debounce period
    console.debug('Auto-save: Setting timer for', debounceMs, 'ms');
    timerRef.current = setTimeout(() => {
      console.debug('Auto-save: Timer fired, triggering save');
      triggerAutoSave();
    }, debounceMs);

    // Cleanup: clear timer if component unmounts or values change
    return () => {
      clearAutoSave();
    };
  }, [
    values,
    step,
    formId,
    sessionId,
    recordId,
    enabled,
    debounceMs,
    clearAutoSave,
    triggerAutoSave,
  ]);

  /**
   * Return state (managed by parent component)
   * This hook just handles timing and API calls
   * Parent component should manage isDirty, draftSaving, draftSavedAt state
   */
  return {
    isDirty: false,  // Managed in parent (MultiStepForm)
    draftSaving: isSavingRef.current,
    draftSavedAt: null,  // Managed in parent
    triggerAutoSave,  // Can call manually if needed
    clearAutoSave,    // Can call manually if needed
  };
}

export default useAutoSave;