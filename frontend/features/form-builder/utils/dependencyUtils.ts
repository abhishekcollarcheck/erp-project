import type {
  DependencyRule,
  DependencyCondition,
  VisibilityMap,
  DependencyValidationError,
} from '../types/dependency.types';

import { isValidOperator } from '../constants/dependencyOperators';

export function validateDependencyRule(rule: DependencyRule): DependencyValidationError[] {
  const errors: DependencyValidationError[] = [];

  if (!rule.if) {
    errors.push({
      message: 'Rule must have "if" property',
      type: 'invalid_condition',
    });
  }

  if (!rule.then) {
    errors.push({
      message: 'Rule must have "then" property',
      type: 'invalid_condition',
    });
  }

  if (!rule.then?.target_field) {
    errors.push({
      message: 'Rule "then" must have "target_field"',
      type: 'invalid_condition',
    });
  }

  if (!rule.then?.action) {
    errors.push({
      message: 'Rule "then" must have "action"',
      type: 'invalid_condition',
    });
  }

  if (rule.then?.action  
    // !isValidAction(rule.then.action)
  ) {
    errors.push({
      message: `Invalid action: ${rule.then.action}`,
      type: 'invalid_condition',
    });
  }

  const conditions = Array.isArray(rule.if) ? rule.if : [rule.if];
  if (conditions.length === 0) {
    errors.push({
      message: 'Rule must have at least one condition',
      type: 'invalid_condition',
    });
  }

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];

    if (!condition.field_key) {
      errors.push({
        message: `Condition ${i} missing "field_key"`,
        type: 'invalid_condition',
      });
    }

    if (!condition.operator) {
      errors.push({
        message: `Condition ${i} missing "operator"`,
        type: 'invalid_operator',
      });
    }

    if (condition.operator && !isValidOperator(condition.operator)) {
      errors.push({
        message: `Condition ${i} has invalid operator: ${condition.operator}`,
        type: 'invalid_operator',
      });
    }

    if (condition.value === undefined) {
      errors.push({
        message: `Condition ${i} missing "value"`,
        type: 'invalid_condition',
      });
    }
  }

  if (rule.type === 'compound' && !Array.isArray(rule.if)) {
    errors.push({
      message: 'Compound rule must have array of conditions',
      type: 'invalid_condition',
    });
  }

  if (rule.logic && rule.logic !== 'AND' && rule.logic !== 'OR') {
    errors.push({
      message: `Invalid logic: ${rule.logic} (must be AND or OR)`,
      type: 'invalid_condition',
    });
  }

  return errors;
}

export function normalizeDependencyRule(rule: DependencyRule): DependencyRule {
  const type = Array.isArray(rule.if) ? 'compound' : 'simple';

  return {
    ...rule,
    type,
    logic: rule.logic || 'AND',
    priority: rule.priority ?? 0,
    enabled: rule.enabled ?? true,
  };
}

export function getFieldDependencyGraph(
  rules: DependencyRule[]
): {
  dependencies: Map<string, Set<string>>;
  dependents: Map<string, Set<string>>;
} {
  const dependencies = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();

  for (const rule of rules) {
    if (rule.enabled === false) continue;

    const targetField = rule.then.target_field;
    const conditions = Array.isArray(rule.if) ? rule.if : [rule.if];

    for (const condition of conditions) {
      const sourceField = condition.field_key;

      if (!dependencies.has(targetField)) {
        dependencies.set(targetField, new Set());
      }
      if (!dependents.has(sourceField)) {
        dependents.set(sourceField, new Set());
      }

      dependencies.get(targetField)!.add(sourceField);
      dependents.get(sourceField)!.add(targetField);
    }
  }

  return { dependencies, dependents };
}

export function detectCircularDependencies(rules: DependencyRule[]): string[] {
  const { dependencies } = getFieldDependencyGraph(rules);
  const visited = new Set<string>();
  const recursive = new Set<string>();
  const circular: string[] = [];

  const visit = (field: string): boolean => {
    if (recursive.has(field)) {
      circular.push(field);
      return true;
    }

    if (visited.has(field)) {
      return false;
    }

    visited.add(field);
    recursive.add(field);

    const deps = dependencies.get(field) || new Set();
    for (const dep of deps) {
      if (visit(dep)) {
        return true;
      }
    }

    recursive.delete(field);
    return false;
  };

  for (const field of dependencies.keys()) {
    if (!visited.has(field)) {
      visit(field);
    }
  }

  return circular;
}

export function sortRulesByPriority(rules: DependencyRule[]): DependencyRule[] {
  return [...rules].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;
    return priorityB - priorityA; // Higher first
  });
}

export function mergeVisibilityMaps(
  map1: VisibilityMap,
  map2: VisibilityMap
): VisibilityMap {
  const merged: VisibilityMap = { ...map1 };

  for (const [key, state] of Object.entries(map2)) {
    if (merged[key]) {
      merged[key] = {
        visible: merged[key].visible && state.visible,
        disabled: merged[key].disabled || state.disabled,
        required: merged[key].required || state.required,
        clearValue: merged[key].clearValue || state.clearValue,
      };
    } else {
      merged[key] = state;
    }
  }

  return merged;
}

export function getChangedFields(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): Set<string> {
  const changed = new Set<string>();

  for (const [key, newValue] of Object.entries(newValues)) {
    const oldValue = oldValues[key];

    if (oldValue !== newValue) {
      changed.add(key);
    }
  }

  for (const key of Object.keys(oldValues)) {
    if (!(key in newValues)) {
      changed.add(key);
    }
  }

  return changed;
}

export function compareVisibilityMaps(
  oldVisibility: VisibilityMap,
  newVisibility: VisibilityMap
): Record<string, { oldVisible: boolean; newVisible: boolean }> {
  const changes: Record<string, { oldVisible: boolean; newVisible: boolean }> = {};

  for (const [key, newState] of Object.entries(newVisibility)) {
    const oldState = oldVisibility[key];

    if (oldState && oldState.visible !== newState.visible) {
      changes[key] = {
        oldVisible: oldState.visible,
        newVisible: newState.visible,
      };
    }
  }

  return changes;
}

export function getFieldsToClear(visibility: VisibilityMap): Set<string> {
  const toClear = new Set<string>();

  for (const [key, state] of Object.entries(visibility)) {
    if (state.clearValue) {
      toClear.add(key);
    }
  }

  return toClear;
}

export function getReferencedFields(rules: DependencyRule[]): Set<string> {
  const fields = new Set<string>();

  for (const rule of rules) {
    fields.add(rule.then.target_field);

    const conditions = Array.isArray(rule.if) ? rule.if : [rule.if];
    for (const condition of conditions) {
      fields.add(condition.field_key);
    }
  }

  return fields;
}

export function createSimpleRule(
  condition: DependencyCondition,
  targetField: string,
  action: any
): DependencyRule {
  return {
    type: 'simple',
    if: condition,
    then: {
      target_field: targetField,
      action,
    },
    priority: 0,
    enabled: true,
  };
}

export function createCompoundRule(
  conditions: DependencyCondition[],
  logic: 'AND' | 'OR',
  targetField: string,
  action: any
): DependencyRule {
  return {
    type: 'compound',
    if: conditions,
    logic,
    then: {
      target_field: targetField,
      action,
    },
    priority: 0,
    enabled: true,
  };
}

export function hasVisibilityChanged(
  oldVisibility: VisibilityMap,
  newVisibility: VisibilityMap
): boolean {
  const changes = compareVisibilityMaps(oldVisibility, newVisibility);
  return Object.keys(changes).length > 0;
}

export function cloneVisibilityMap(visibility: VisibilityMap): VisibilityMap {
  const cloned: VisibilityMap = {};

  for (const [key, state] of Object.entries(visibility)) {
    cloned[key] = {
      ...state,
      affectedByRules: state.affectedByRules ? [...state.affectedByRules] : undefined,
    };
  }

  return cloned;
}

export function getFieldsToValidate(visibility: VisibilityMap): Set<string> {
  const toValidate = new Set<string>();

  for (const [key, state] of Object.entries(visibility)) {
    if (state.visible) {
      toValidate.add(key);
    }
  }

  return toValidate;
}

export function visibilityToString(visibility: VisibilityMap): string {
  const summary: Record<string, string> = {};

  for (const [key, state] of Object.entries(visibility)) {
    const parts = [];
    if (!state.visible) parts.push('hidden');
    if (state.disabled) parts.push('disabled');
    if (state.required) parts.push('required');
    if (state.clearValue) parts.push('clearValue');

    summary[key] = parts.length > 0 ? parts.join('+') : 'visible';
  }

  return JSON.stringify(summary, null, 2);
}

export default {
  validateDependencyRule,
  normalizeDependencyRule,
  getFieldDependencyGraph,
  detectCircularDependencies,
  sortRulesByPriority,
  mergeVisibilityMaps,
  getChangedFields,
  compareVisibilityMaps,
  getFieldsToClear,
  getReferencedFields,
  createSimpleRule,
  createCompoundRule,
  hasVisibilityChanged,
  cloneVisibilityMap,
  getFieldsToValidate,
  visibilityToString,
} as const;