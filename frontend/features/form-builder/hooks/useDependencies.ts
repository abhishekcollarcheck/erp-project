import { useMemo, useCallback, useRef, useEffect } from 'react';
import type { ResolvedField } from '../types/form.types';
import type {
  DependencyRule,
  VisibilityMap,
  DependencyEngineOptions,
} from '../types/dependency.types';
import DependencyEngine from '../core-engine/DependencyEngine';
import {
  getFieldsToClear,
  getFieldsToValidate,
  hasVisibilityChanged,
  getChangedFields,
} from '../utils/dependencyUtils';

export interface UseDependenciesParams {
  fields: ResolvedField[];
  formValues: Record<string, any>;
  dependencies?: DependencyRule[];
  engineOptions?: DependencyEngineOptions;
  onVisibilityChange?: (visibility: VisibilityMap, changed: string[]) => void;
  onFieldsClear?: (fieldKeys: Set<string>) => void;
  autoClearHidden?: boolean;
  trackChanges?: boolean;
}

export interface UseDependenciesReturn {
  visibleFields: Set<string>;
  hiddenFields: Set<string>;
  visibility: VisibilityMap;

  isFieldVisible: (fieldKey: string) => boolean;
  isFieldRequired: (fieldKey: string) => boolean;
  isFieldDisabled: (fieldKey: string) => boolean;

  getVisibleFieldsArray: () => ResolvedField[];
  getHiddenFieldsArray: () => ResolvedField[];
  getFieldsToValidate: () => Set<string>;

  getValuesToClear: () => Record<string, null>;
  clearHiddenFieldValues: () => Record<string, any>;

  getFieldDependencies: (fieldKey: string) => Set<string>;
  getFieldDependents: (fieldKey: string) => Set<string>;
  getAffectedFields: (fieldKey: string) => Set<string>;

  getEngine: () => DependencyEngine | null;
  getValidationErrors: () => any[];
}

export function useDependencies(params: UseDependenciesParams): UseDependenciesReturn {
  const {
    fields,
    formValues,
    dependencies = [],
    engineOptions = {},
    onVisibilityChange,
    onFieldsClear,
    autoClearHidden = true,
    trackChanges = false,
  } = params;

  const engineRef = useRef<DependencyEngine | null>(null);
  const previousVisibilityRef = useRef<VisibilityMap | null>(null);
  const previousValuesRef = useRef<Record<string, any>>({});

  const engine = useMemo(() => {
    try {
      const newEngine = new DependencyEngine(fields, dependencies, {
        autoClearHidden,
        ...engineOptions,
      });

      engineRef.current = newEngine;

      if (newEngine.hasErrors()) {
        console.warn('Dependency engine has validation errors:', newEngine.getValidationErrors());
      }

      return newEngine;
    } catch (error) {
      console.error('Error creating DependencyEngine:', error);
      return null;
    }
  }, [
    fields.length,
    fields.map(f => f.field_key).join(','),
    dependencies.length,
    dependencies.map(d => d.id || '').join(','),
    autoClearHidden,
  ]);

  const visibility = useMemo(() => {
    if (!engine) {
      const fallback: VisibilityMap = {};
      for (const field of fields) {
        fallback[field.field_key] = {
          visible: true,
          disabled: false,
          required: field.is_required,
        };
      }
      return fallback;
    }

    return engine.evaluateVisibility(formValues);
  }, [engine, formValues]);

  const visibleFields = useMemo(() => {
    return engine ? engine.getVisibleFields(formValues) : new Set(fields.map(f => f.field_key));
  }, [engine, formValues, fields]);

  const hiddenFields = useMemo(() => {
    return engine ? engine.getHiddenFields(formValues) : new Set('');
  }, [engine, formValues]);

  useEffect(() => {
    if (!previousVisibilityRef.current) {
      previousVisibilityRef.current = visibility;
      return;
    }

    if (hasVisibilityChanged(previousVisibilityRef.current, visibility)) {
      const changed: string[] = [];
      for (const [key, state] of Object.entries(visibility)) {
        const prevState = previousVisibilityRef.current[key];
        if (prevState && prevState.visible !== state.visible) {
          changed.push(key);
        }
      }

      if (onVisibilityChange && changed.length > 0) {
        onVisibilityChange(visibility, changed);
      }

      previousVisibilityRef.current = visibility;
    }
  }, [visibility, onVisibilityChange]);

  const fieldsToClear = useMemo(() => {
    return getFieldsToClear(visibility);
  }, [visibility]);

  useEffect(() => {
    if (fieldsToClear.size > 0 && onFieldsClear) {
      onFieldsClear(fieldsToClear);
    }
  }, [fieldsToClear, onFieldsClear]);

  const isFieldVisible = useCallback(
    (fieldKey: string): boolean => {
      return visibility[fieldKey]?.visible ?? false;
    },
    [visibility]
  );

  const isFieldRequired = useCallback(
    (fieldKey: string): boolean => {
      return visibility[fieldKey]?.required ?? false;
    },
    [visibility]
  );

  const isFieldDisabled = useCallback(
    (fieldKey: string): boolean => {
      return visibility[fieldKey]?.disabled ?? false;
    },
    [visibility]
  );

  const getVisibleFieldsArray = useCallback((): ResolvedField[] => {
    return fields.filter(f => visibleFields.has(f.field_key));
  }, [fields, visibleFields]);

  const getHiddenFieldsArray = useCallback((): ResolvedField[] => {
    return fields.filter(f => hiddenFields.has(f.field_key));
  }, [fields, hiddenFields]);

  const getFieldsToValidateArray = useCallback((): Set<string> => {
    return getFieldsToValidate(visibility);
  }, [visibility]);

  const getValuesToClear = useCallback((): Record<string, null> => {
    const toClear: Record<string, null> = {};
    for (const fieldKey of fieldsToClear) {
      toClear[fieldKey] = null;
    }
    return toClear;
  }, [fieldsToClear]);

  // Clear hidden field values and return new values object
  const clearHiddenFieldValues = useCallback((): Record<string, any> => {
    const cleared = { ...formValues };
    for (const fieldKey of fieldsToClear) {
      cleared[fieldKey] = null;
    }
    return cleared;
  }, [formValues, fieldsToClear]);

  const getFieldDependencies = useCallback(
    (fieldKey: string): Set<string> => {
      return engine ? engine.getFieldDependencies(fieldKey) : new Set();
    },
    [engine]
  );

  const getFieldDependents = useCallback(
    (fieldKey: string): Set<string> => {
      return engine ? engine.getFieldDependents(fieldKey) : new Set();
    },
    [engine]
  );

  const getAffectedFields = useCallback(
    (fieldKey: string): Set<string> => {
      return engine ? engine.getAffectedFields(fieldKey) : new Set();
    },
    [engine]
  );

  const getEngine = useCallback((): DependencyEngine | null => {
    return engine || null;
  }, [engine]);

  const getValidationErrors = useCallback((): any[] => {
    return engine ? engine.getValidationErrors() : [];
  }, [engine]);

  return {
    visibleFields,
    hiddenFields,
    visibility,

    isFieldVisible,
    isFieldRequired,
    isFieldDisabled,

    getVisibleFieldsArray,
    getHiddenFieldsArray,
    getFieldsToValidate: getFieldsToValidateArray,

    getValuesToClear,
    clearHiddenFieldValues,

    getFieldDependencies,
    getFieldDependents,
    getAffectedFields,

    getEngine,
    getValidationErrors,
  };
}

export default useDependencies;