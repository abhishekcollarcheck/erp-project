import { useState, useCallback, useRef } from 'react';
import type { ResolvedField, FieldValue } from '../types/form.types';

// NEW: Add these imports
import type { VisibilityMap, DependencyRule } from '../types/dependency.types';
import { useDependencies } from './useDependencies';

export interface FormState {
  // Existing fields
  values: Record<string, FieldValue>;
  errors: Record<string, string>;
  dirtyFields: Set<string>;
  touchedFields: Set<string>;

  // NEW: Add visibility fields
  visibleFields: Set<string>;
  dependencyMap?: VisibilityMap;
  formDependencies?: DependencyRule[];

  // Existing fields continued
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
}

interface UseFormStateParams {
  formId: number;
  fields: ResolvedField[];
  initialValues?: Record<string, FieldValue>;  
  dependencies?: DependencyRule[];
  onValidate?: (errors: Record<string, string>) => void;
  onSubmit?: (values: Record<string, FieldValue>) => Promise<any>;
}

export function useFormState({
  formId,
  fields,
  initialValues = {},
  dependencies = [],  // NEW parameter
  onValidate,
  onSubmit,
  // ... other params
}: UseFormStateParams) {
  // ─── Existing state ───
  const [values, setValues] = useState<Record<string, FieldValue>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // ─── NEW: Dependency state ───
  const [visibleFields, setVisibleFields] = useState<Set<string>>(
    new Set(fields.map(f => f.field_key))
  );
  const [dependencyMap, setDependencyMap] = useState<VisibilityMap>({});

  // ─── NEW: Initialize dependency engine ───
  const {
    visibility,
    isFieldVisible,
    getFieldsToValidate,
    clearHiddenFieldValues,
    getFieldDependencies,
  } = useDependencies({
    fields,
    formValues: values,
    dependencies,
    autoClearHidden: true,
    onVisibilityChange: (newVisibility, changedFields) => {
      // Update visibility state when it changes
      setVisibleFields(
        new Set(
          Object.entries(newVisibility)
            .filter(([_, state]) => state.visible)
            .map(([key]) => key)
        )
      );
      setDependencyMap(newVisibility);

      // Clear errors for newly hidden fields
      const clearedErrors = { ...errors };
      for (const field of changedFields) {
        if (!newVisibility[field].visible) {
          delete clearedErrors[field];
        }
      }
      if (Object.keys(clearedErrors).length !== Object.keys(errors).length) {
        setErrors(clearedErrors);
      }
    },
    onFieldsClear: (fieldKeys) => {
      // Auto-clear values when fields are hidden
      setValues(prev => {
        const updated = { ...prev };
        for (const key of fieldKeys) {
          updated[key] = null;
        }
        return updated;
      });
    },
  });

  // ─── Existing methods ───
  const setFieldValue = useCallback(
    (fieldKey: string, value: FieldValue) => {
      setValues(prev => {
        const updated = { ...prev, [fieldKey]: value };
        // Validate only visible fields
        const toValidate = getFieldsToValidate();
        if (toValidate.has(fieldKey)) {
          validateField(fieldKey, value);
        }
        return updated;
      });
      setDirtyFields(prev => new Set(prev).add(fieldKey));
    },
    [getFieldsToValidate]
  );

  // ─── NEW: Visibility management methods ───
  const updateVisibility = useCallback(() => {
    // Visibility is automatically managed by useDependencies hook
    // This is here for explicit updates if needed
    // The dependency hook already handles this
  }, []);

  const getVisibleFieldsArray = useCallback((): ResolvedField[] => {
    return fields.filter(f => isFieldVisible(f.field_key));
  }, [fields, isFieldVisible]);

  const isFieldVisibleCheck = useCallback(
    (fieldKey: string): boolean => {
      return isFieldVisible(fieldKey);
    },
    [isFieldVisible]
  );

  // ─── UPDATED: Validate only visible fields ───
  const validateField = useCallback(
    (fieldKey: string, value?: FieldValue) => {
      // Skip validation for hidden fields
      if (!isFieldVisible(fieldKey)) {
        return;
      }

      // Existing validation logic
      const fieldToValidate = fields.find(f => f.field_key === fieldKey);
      if (!fieldToValidate) return;

      // ... existing validation code ...
      // (keep your existing validation logic here)
    },
    [fields, isFieldVisible]
  );

  // ─── UPDATED: Submit only visible fields ───
  const handleSubmit = useCallback(async () => {
    // Validate only visible fields
    const toValidate = getFieldsToValidate();
    const newErrors: Record<string, string> = {};

    // for (const fieldKey of toValidate) {
    //   const error = validateFieldValue(fieldKey, values[fieldKey]);
    //   if (error) {
    //     newErrors[fieldKey] = error;
    //   }
    // }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear hidden field values before submitting
    const cleanedValues = clearHiddenFieldValues();

    // Submit
    if (onSubmit) {
      try {
        await onSubmit(cleanedValues);
      } catch (error) {
        console.error('Submit error:', error);
      }
    }
  }, [values, getFieldsToValidate, clearHiddenFieldValues, onSubmit]);

  // ─── Return state ───
  return {
    // Existing
    values,
    errors,
    dirtyFields,
    touchedFields,
    isDirty: dirtyFields.size > 0,

    // NEW: Visibility state
    visibleFields,
    dependencyMap,
    visibility,

    // Existing methods
    setFieldValue,
    setFieldError: (fieldKey: string, error: string) => {
      setErrors(prev => ({ ...prev, [fieldKey]: error }));
    },
    setFieldTouched: (fieldKey: string) => {
      setTouchedFields(prev => new Set(prev).add(fieldKey));
    },
    reset: () => {
      setValues(initialValues);
      setErrors({});
      setDirtyFields(new Set());
      setTouchedFields(new Set());
    },

    // NEW: Visibility methods
    isFieldVisible: isFieldVisibleCheck,
    updateVisibility,
    getVisibleFieldsArray,
    getFieldDependencies,
    clearHiddenFieldValues,
    getFieldsToValidate,

    // Existing
    handleSubmit,
    validateField,
  };
}

export default useFormState;