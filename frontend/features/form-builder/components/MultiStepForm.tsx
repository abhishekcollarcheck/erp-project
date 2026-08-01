'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../services/api/client';
import { evaluateCondition, parseVisibilityConditions } from '../utils/conditionEvaluator';
import { useDynamicOptions } from '../hooks/useDynamicOptions';
import { sanitizeJSON } from '../utils/jsonSanitizer';
import type { ResolvedField, MultiStepFormProps } from "../types/formbuilder.types"

// ─── Session ID Management (Phase 1) ──────────────────────────────────────────
function getOrCreateSessionId(): string {
  // Fallback for SSR
  if (typeof window === 'undefined') return 'ssr';

  const KEY = 'dynamic_form_session_id';
  let id = sessionStorage.getItem(KEY);

  if (!id) {
    // Create new session ID
    id = `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(KEY, id);
  }

  return id;
}

function validateDraftPayload(payload: any): boolean {
  return !!(
    payload.form_id &&
    payload.session_id &&
    typeof payload.step === 'number' &&
    typeof payload.form_data === 'object' &&
    payload.form_data !== null
  );
}


// ─── Single Field Renderer ────────────────────────────────────────────────────
function FieldRenderer({ field, value, onChange, readOnly }: {
  field: ResolvedField;
  value: any;
  onChange: (key: string, value: any) => void;
  readOnly: boolean;
}) {
  const { resolved, field_type, field_key } = field;
  const { data: options = [], isLoading } = useDynamicOptions({
    source: field.dynamic_source
  });

  if (!resolved.can_view) return null;

  const isDisabled = readOnly || field.is_readonly || !resolved.can_edit;
  const displayValue = resolved.is_masked && value
    ? '•'.repeat(String(value).length || 8)
    : value;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid var(--border2)',
    borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--font)',
    background: isDisabled ? 'var(--surface2)' : 'var(--surface)',
    color: resolved.is_masked ? 'var(--ink4)' : 'var(--ink)',
    outline: 'none',
  };

  // ✅ FIXED: Removed duplicate options declaration
  // The options from hook above is already correct and merged

  const handleChange = (v: any) => {
    if (!isDisabled) onChange(field_key, v);
  };

  const renderInput = () => {
    if (resolved.is_masked) {
      return <input type="password" value={displayValue || ''} disabled={true} style={inputStyle} />;
    }

    switch (field_type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={e => handleChange(e.target.value)}
            disabled={isDisabled}
            placeholder={field.placeholder || ''}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font)' }}
          />
        );

      case 'select':
      case 'multi_select':
        return (
          // ✅ FIXED: Use 'value' prop not 'values[field_key]'
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isLoading || !field.resolved.can_edit}
            style={inputStyle}
          >
            <option value="">{field.placeholder || `— Select ${field.label} —`}</option>
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
            {options.map(opt => (
              <label
                key={String(opt.value)}  // ✅ Convert to string
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: isDisabled ? 'default' : 'pointer' }}
              >
                <input
                  type="radio"
                  name={field_key}
                  value={String(opt.value)}  // ✅ Convert to string
                  checked={String(value) === String(opt.value)}  // ✅ Compare as strings
                  onChange={() => handleChange(opt.value)}
                  disabled={isDisabled}
                  style={{ accentColor: 'var(--blue)', width: 14, height: 14 }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        if (options.length > 0) {
          const checkedValues = Array.isArray(value) ? value.map(v => String(v)) : [];  // ✅ Convert to strings
          return (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
              {options.map(opt => {
                const optValueStr = String(opt.value);  // ✅ Convert once
                return (
                  <label
                    key={optValueStr}  // ✅ Use string key
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: isDisabled ? 'default' : 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      value={optValueStr}  // ✅ Use string value
                      checked={checkedValues.includes(optValueStr)}  // ✅ Compare strings
                      onChange={e => {
                        const next = e.target.checked
                          ? [...checkedValues, optValueStr]
                          : checkedValues.filter(v => v !== optValueStr);
                        handleChange(next);
                      }}
                      disabled={isDisabled}
                      style={{ accentColor: 'var(--blue)', width: 14, height: 14 }}
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          );
        }
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: isDisabled ? 'default' : 'pointer', marginTop: 4 }}>
            <input type="checkbox" checked={!!value} onChange={e => handleChange(e.target.checked)}
              disabled={isDisabled} style={{ accentColor: 'var(--blue)', width: 14, height: 14 }} />
            {field.label}
          </label>
        );

      case 'date':
      case 'datetime':
        return (
          <input type={field_type === 'datetime' ? 'datetime-local' : 'date'}
            value={value || ''}
            onChange={e => handleChange(e.target.value)}
            disabled={isDisabled}
            style={inputStyle}
          />
        );

      case 'file':
      case 'image':
        return (
          <input type="file"
            accept={field_type === 'image' ? 'image/*' : '*'}
            onChange={e => handleChange(e.target.files?.[0] || null)}
            disabled={isDisabled}
            style={{ ...inputStyle, padding: '6px 10px' }}
          />
        );

      case 'password':
        return <input type="password" value={value || ''} onChange={e => handleChange(e.target.value)} disabled={isDisabled} placeholder={field.placeholder || ''} style={inputStyle} />;

      case 'email':
        return <input type="email" value={value || ''} onChange={e => handleChange(e.target.value)} disabled={isDisabled} placeholder={field.placeholder || ''} style={inputStyle} />;

      case 'phone':
        return <input type="tel" value={value || ''} onChange={e => handleChange(e.target.value)} disabled={isDisabled} placeholder={field.placeholder || '+91 9999999999'} style={inputStyle} />;

      case 'url':
        return <input type="url" value={value || ''} onChange={e => handleChange(e.target.value)} disabled={isDisabled} placeholder={field.placeholder || 'https://'} style={inputStyle} />;

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <div style={{ position: 'relative' }}>
            {field_type === 'currency' && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink4)' }}>₹</span>}
            {field_type === 'percentage' && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--ink4)' }}>%</span>}
            <input type="number"
              value={value || ''}
              onChange={e => handleChange(e.target.value ? Number(e.target.value) : '')}
              disabled={isDisabled}
              placeholder={field.placeholder || '0'}
              style={{
                ...inputStyle,
                ...(field_type === 'currency' ? { paddingLeft: 24 } : {}),
                ...(field_type === 'percentage' ? { paddingRight: 24 } : {}),
              }}
            />
          </div>
        );

      case 'text':
      default:
        return <input type="text" value={value || ''} onChange={e => handleChange(e.target.value)} disabled={isDisabled} placeholder={field.placeholder || ''} style={inputStyle} />;
    }
  };

  return (
    <div
      style={{
        width: `${field.width}%`,
        padding: '0 6px',
        marginBottom: 14,
        minWidth: field.width < 50 ? 160 : 'auto',
      }}
    >
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink2)', display: 'flex', gap: 4, marginBottom: 6 }}>
        {field.label}
        {field.is_required && <span style={{ color: 'var(--red)' }}>*</span>}
        {field.help_text && <span style={{ fontWeight: 400, color: 'var(--ink4)' }}>({field.help_text})</span>}
      </label>
      {renderInput()}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  sections,
  currentStep,
  completedSet = new Set(),           // NEW: Phase 1
  errorSet = new Set(),               // NEW: Phase 1
  onStepClick,                        // NEW: Phase 3 (prep)
  draftSaving = false,                // NEW: Phase 2
  draftSavedAt = null as Date | null, // NEW: Phase 2
}: {
  sections: string[];
  currentStep: number;
  completedSet?: Set<number>;
  errorSet?: Set<number>;
  onStepClick?: (idx: number) => void;
  draftSaving?: boolean;
  draftSavedAt?: Date | null;
}) {
  if (sections.length <= 1) return null;
  return (
    <>
      <aside
        className="card"
        style={{
          padding: 0,
          position: 'sticky',
          top: 76,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            Employee Form
          </div>

          <div
            style={{
              height: 4,
              background: 'var(--surface3)',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((currentStep + 1) / sections.length) * 100}%`,
                background:
                  currentStep === sections.length - 1
                    ? 'var(--green)'
                    : 'var(--blue)',
                borderRadius: 4,
                transition: 'width .3s ease',
              }}
            />
          </div>

          <div
            style={{
              fontSize: 11,
              color: 'var(--ink4)',
            }}
          >
            {Math.round(((currentStep + 1) / sections.length) * 100)}% Complete
          </div>
        </div>

        {/* Steps */}
        <nav>
          {sections.map((sec, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;

            return (
              <div
                key={sec}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onStepClick?.(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  background: isActive
                    ? 'var(--blue-lt)'
                    : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--blue)' : 'transparent'
                    }`,
                  transition: 'all .2s',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,

                    background: isDone
                      ? 'var(--green-lt)'
                      : isActive
                        ? 'var(--blue-lt)'
                        : 'var(--surface2)',

                    color: isDone
                      ? 'var(--green)'
                      : isActive
                        ? 'var(--blue)'
                        : 'var(--ink4)',

                    border: `1.5px solid ${isDone
                      ? 'var(--green-bd)'
                      : isActive
                        ? 'var(--blue-md)'
                        : 'var(--border)'
                      }`,
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </div>

                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    lineHeight: 1.3,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? 'var(--blue)'
                      : isDone
                        ? 'var(--ink2)'
                        : 'var(--ink3)',
                  }}
                >
                  {sec}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '8px 18px',
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--ink4)',
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Phase 2 will populate these, Phase 1 shows default */}
          {draftSaving
            ? <>⟳ Saving draft…</>
            : draftSavedAt
              ? <>✓ Saved {draftSavedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</>
              : <>Auto-save enabled</>
          }
        </div>
      </aside>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MultiStepForm({
  formId, initialValues = {}, onSubmit, onCancel,
  submitLabel = 'Submit', isSubmitting = false, readOnly = false, recordId, mode = 'create', autoSaveEnabled = true, onSaveDraft
}: MultiStepFormProps) {

  const { data: resolvedFields = [], isLoading } = useQuery({
    queryKey: ['resolved-form', formId],
    queryFn: () => apiClient.get<any, any>(`/rbac/forms/${formId}/resolve`),
    select: (r: any) => (r.data as ResolvedField[]).filter(f => f.resolved.can_view),
    enabled: !!formId,
  });

  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());
  const [errorSet, setErrorSet] = useState<Set<number>>(new Set());
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [savedId, setSavedId] = useState<number | null>(recordId ?? null);
  const sessionIdRef = useRef(getOrCreateSessionId());
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [draftError, setDraftError] = useState<string | null>(null);

  // useAutoSave({
  //   values,
  //   step,
  //   formId,
  //   sessionId: sessionIdRef.current,
  //   recordId,
  //   enabled: autoSaveEnabled,
  //   debounceMs: 3000,
  //   onError: (error) => {
  //     // Set error state
  //     setDraftError(error.message);

  //     // Clear error after 5 seconds
  //     setTimeout(() => setDraftError(null), 5000);

  //     // Log for debugging
  //     console.error('Auto-save failed:', error);
  //   },
  // });

  useEffect(() => { setValues(v => ({ ...initialValues, ...v })); }, []);

  const sections = useMemo(() => {
    const map = new Map<string, ResolvedField[]>();
    const excludedFields: string[] = [];
    const parseErrors: Array<{ field: string; error: string }> = [];

    for (const f of resolvedFields) {
      try {
        // ✅ Check if field has visibility conditions
        if (f.visibility_conditions) {
          // ✅ Issue #8: Sanitize JSON before parsing
          const sanitized = sanitizeJSON(f.visibility_conditions);

          const condition = parseVisibilityConditions(sanitized, f.field_key);
          if (!condition) {
            console.warn(`[sections] Unable to parse visibility conditions for field: ${f.field_key}`);
          }
          else if (!evaluateCondition(condition, values)) {
            console.debug(`[sections] Field hidden by visibility condition: ${f.field_key}`);
            excludedFields.push(f.field_key);
            continue;
          }
          else {
            console.debug(`[sections] Field visible (condition passed): ${f.field_key}`);
          }
        }
        else {
          console.debug(`[sections] Field visible (no conditions): ${f.field_key}`);
        }

        const sec = f.section || 'General';
        if (!map.has(sec)) map.set(sec, []);
        map.get(sec)!.push(f);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[sections] Error processing field: ${f.field_key}`, errorMsg);
        parseErrors.push({
          field: f.field_key,
          error: errorMsg
        });

        const sec = f.section || 'General';
        if (!map.has(sec)) map.set(sec, []);
        map.get(sec)!.push(f);
      }
    }

    // if (excludedFields.length > 0) {
    //   console.warn(`  Fields excluded by conditions (${excludedFields.length}): ${excludedFields.join(', ')}`);
    // } else {
    //   console.log(`  ✅ All ${resolvedFields.length} fields are visible`);
    // }

    // if (parseErrors.length > 0) {
    //   console.error(`  Parse errors (${parseErrors.length}):`, parseErrors);
    // }

    return [...map.entries()];
  }, [resolvedFields, values]);


  const sectionNames = sections.map(([name]) => name);
  const isMultiStep = sectionNames.length > 1;
  const currentFields = sections[step]?.[1] || [];
  const isLastStep = step === sectionNames.length - 1;

  const handleChange = (key: string, val: any) => {
    setValues(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
    setIsDirty(true);
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
  };

  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      // Skip validation for review/last step
      if (stepIndex === sections.length - 1) {
        // Clear error if it was set
        setErrorSet(prev => {
          const next = new Set(prev);
          next.delete(stepIndex);
          return next;
        });
        return true;
      }

      // Get fields for this step
      const fields = sections[stepIndex]?.[1] || [];

      // Validate using existing logic
      const errs: Record<string, string> = {};
      for (const f of fields) {
        if (f.is_required && f.resolved.can_edit) {
          const v = values[f.field_key];
          if (
            v === undefined ||
            v === null ||
            v === '' ||
            (Array.isArray(v) && v.length === 0)
          ) {
            errs[f.field_key] = `${f.label} is required`;
          }
        }
      }

      // Set field errors (keep existing behavior)
      setErrors(errs);
      const isValid = Object.keys(errs).length === 0;

      // NEW: Track step errors in errorSet (Phase 1)
      if (isValid) {
        // Remove from error set
        setErrorSet(prev => {
          const next = new Set(prev);
          next.delete(stepIndex);
          return next;
        });
      } else {
        // Add to error set
        setErrorSet(prev => new Set([...prev, stepIndex]));
      }

      return isValid;
    },
    [sections, values]
  );

  const validate = (fields: ResolvedField[]): boolean => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (f.is_required && f.resolved.can_edit) {
        const v = values[f.field_key];
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
          errs[f.field_key] = `${f.label} is required`;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    // Validate using new validateStep function
    const stepIndex = step;
    const isValid = await validateStep(stepIndex);
    if (!isValid) return; // Stop if validation fails

    // NEW: Mark this step as completed (Phase 1)
    setCompletedSet(prev => new Set([...prev, stepIndex]));

    // NEW: Clear dirty state (Phase 2 will handle saving)
    setIsDirty(false);

    // Move to next step (keep existing logic)
    setStep(s => s + 1);

    // Scroll to top (keep existing logic)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    const stepIndex = step;
    const isValid = await validateStep(stepIndex);
    if (!isValid) return;

    if (draftSaving) {
      console.log('Waiting for auto-save to complete...');

      let attempts = 0;
      while (draftSaving && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    if (isDirty) {
      setIsDirty(false);
    }

    await onSubmit(values);
  };

  useEffect(() => {
    if (mode === 'edit' && sections.length > 0) {
      // Pre-mark all steps as completed
      const allSteps = new Set(sections.map((_, i) => i));
      setCompletedSet(allSteps);
    }
  }, [mode, sections.length]);

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink4)' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading form…</div>
      </div>
    );
  }

  if (resolvedFields.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink4)' }}>
        <div>No fields visible for your role.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gap: 20,
        alignItems: 'start',
      }}
    >
      {/* {draftError && (
  <div style={{
    background: 'var(--red-lt)',
    border: '1px solid var(--red-bd)',
    borderRadius: 'var(--r)',
    padding: '8px 12px',
    fontSize: 12,
    color: 'var(--red)',
    marginBottom: 16,
  }}>
    ⚠ Auto-save failed: {draftError}
  </div>
)} */}
      {/* Sidebar */}
      <StepIndicator
        sections={sectionNames}
        currentStep={step}

        // NEW: Phase 1 props for tracking
        completedSet={completedSet}
        errorSet={errorSet}
        onStepClick={(idx) => setStep(idx)}  // Click to jump (Phase 3 feature, prep now)
        draftSaving={draftSaving}           // Phase 2 will populate
        draftSavedAt={draftSavedAt}         // Phase 2 will populate
      />

      {/* Content */}
      <div
        className="card"
        style={{
          padding: 24,
        }}
      >
        {/* Header */}
        {isMultiStep && (
          <div
            style={{
              marginBottom: 22,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--blue-lt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--blue)',
                flexShrink: 0,
              }}
            >
              {step + 1}
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                {sectionNames[step]}
              </h2>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: 'var(--ink4)',
                }}
              >
                Step {step + 1} of {sectionNames.length}
              </div>
            </div>
          </div>
        )}

        {/* Fields */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            margin: '0 -6px',
          }}
        >
          {currentFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.field_key]}
              onChange={handleChange}
              readOnly={readOnly}
            />
          ))}
        </div>

        {/* Errors */}
        {Object.keys(errors).length > 0 && (
          <div
            style={{
              background: 'var(--red-lt)',
              border: '1px solid var(--red-bd)',
              borderRadius: 'var(--r)',
              padding: '10px 14px',
              fontSize: 12,
              color: 'var(--red)',
              marginTop: 18,
            }}
          >
            {Object.values(errors).map((e, i) => (
              <div key={i}>⚠ {e}</div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!readOnly && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid var(--border)',
            }}
          >
            <div>
              {step > 0 ? (
                <button
                  className="btn btn-sec"
                  onClick={handleBack}
                >
                  ← Back
                </button>
              ) : (
                onCancel && (
                  <button
                    className="btn btn-sec"
                    onClick={onCancel}
                  >
                    Cancel
                  </button>
                )
              )}
            </div>

            <div>
              {!isLastStep ? (
                <button
                  className="btn btn-pri"
                  onClick={handleNext}
                >
                  Next →
                </button>
              ) : (
                <button
                  className="btn btn-pri"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    background: 'var(--green)',
                    minWidth: 160,
                  }}
                >
                  {isSubmitting ? 'Saving…' : `✓ ${submitLabel}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}