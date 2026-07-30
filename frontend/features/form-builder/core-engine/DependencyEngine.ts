import type {
  DependencyRule,
  DependencyCondition,
  DependencyOperator,
  VisibilityMap,
  FieldVisibilityState,
  DependencyGraph,
  RuleEvaluationResult,
  DependencyValidationError,
  DependencyEngineOptions,
} from '../types/dependency.types';

import type { ResolvedField } from '../types/form.types';
import { compareValues, getOperator } from '../constants/dependencyOperators';

export class DependencyEngine {
  private fields: Map<string, ResolvedField>;
  private rules: DependencyRule[];
  private options: DependencyEngineOptions;
  private dependencyGraph: DependencyGraph | null = null;
  private validationErrors: DependencyValidationError[] = [];
  private lastEvaluation: RuleEvaluationResult[] = [];
  private cache: Map<string, VisibilityMap> = new Map();

  constructor(
    fields: ResolvedField[],
    rules: DependencyRule[] = [],
    options: DependencyEngineOptions = {}
  ) {
    this.fields = new Map(
      fields.map(f => [f.field_key, f])
    );

    this.rules = this.sortRulesByPriority(rules);
    this.options = {
      autoClearHidden: true,
      allowCircularDependencies: false,
      cacheResults: true,
      validateRules: true,
      ...options,
    };

    if (this.options.validateRules) {
      this.validateRules();
    }

    this.buildDependencyGraph();
  }

  private sortRulesByPriority(rules: DependencyRule[]): DependencyRule[] {
    return [...rules].sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA; // Higher priority first
    });
  }

  private validateRules(): void {
    this.validationErrors = [];

    for (const rule of this.rules) {
      if (rule.enabled === false) continue;

      if (!this.fields.has(rule.then.target_field)) {
        this.validationErrors.push({
          ruleId: rule.id,
          fieldKey: rule.then.target_field,
          message: `Target field not found: ${rule.then.target_field}`,
          type: 'missing_field',
        });
      }

      const conditions = Array.isArray(rule.if) ? rule.if : [rule.if];
      for (const condition of conditions) {
        if (!this.fields.has(condition.field_key)) {
          this.validationErrors.push({
            ruleId: rule.id,
            fieldKey: condition.field_key,
            message: `Condition field not found: ${condition.field_key}`,
            type: 'missing_field',
          });
        }

        if (!getOperator(condition.operator)) {
          this.validationErrors.push({
            ruleId: rule.id,
            message: `Invalid operator: ${condition.operator}`,
            type: 'invalid_operator',
          });
        }
      }
    }

    if (!this.options.allowCircularDependencies) {
      const circularDeps = this.detectCircularDependencies();
      if (circularDeps.length > 0) {
        this.validationErrors.push({
          message: `Circular dependencies detected: ${circularDeps.join(', ')}`,
          type: 'circular_dependency',
        });
      }
    }
  }

  private buildDependencyGraph(): void {
    const dependencies = new Map<string, Set<string>>();
    const dependents = new Map<string, Set<string>>();

    for (const fieldKey of this.fields.keys()) {
      dependencies.set(fieldKey, new Set());
      dependents.set(fieldKey, new Set());
    }

    for (const rule of this.rules) {
      if (rule.enabled === false) continue;

      const targetField = rule.then.target_field;
      const conditions = Array.isArray(rule.if) ? rule.if : [rule.if];

      for (const condition of conditions) {
        const sourceField = condition.field_key;

        if (dependents.has(sourceField)) {
          dependents.get(sourceField)!.add(targetField);
        }
        if (dependencies.has(targetField)) {
          dependencies.get(targetField)!.add(sourceField);
        }
      }
    }

    this.dependencyGraph = {
      dependencies,
      dependents,
      rules: this.rules,
    };
  }

  private detectCircularDependencies(): string[] {
    if (!this.dependencyGraph) return [];

    const visited = new Set<string>();
    const recursive = new Set<string>();
    const circular: string[] = [];

    const visit = (field: string): boolean => {
      if (recursive.has(field)) {
        circular.push(field);
        return true; // Cycle found
      }

      if (visited.has(field)) {
        return false; // Already processed
      }

      visited.add(field);
      recursive.add(field);

      const deps = this.dependencyGraph!.dependencies.get(field) || new Set();
      for (const dep of deps) {
        if (visit(dep)) {
          return true;
        }
      }

      recursive.delete(field);
      return false;
    };

    for (const field of this.fields.keys()) {
      if (!visited.has(field)) {
        visit(field);
      }
    }

    return circular;
  }

  private evaluateCondition(
    condition: DependencyCondition,
    formValues: Record<string, any>
  ): boolean {
    const fieldValue = formValues[condition.field_key];

    try {
      let result = compareValues(fieldValue, condition.value, condition.operator);

      if (condition.negate) {
        result = !result;
      }

      return result;
    } catch (error) {
      console.error(
        `Error evaluating condition for field ${condition.field_key}:`,
        error
      );
      return false;
    }
  }

  private evaluateRule(
    rule: DependencyRule,
    formValues: Record<string, any>
  ): boolean {
    if (rule.enabled === false) {
      return false;
    }

    if (rule.type === 'simple') {
      const condition = rule.if as DependencyCondition;
      return this.evaluateCondition(condition, formValues);
    }

    if (rule.type === 'compound') {
      const conditions = rule.if as DependencyCondition[];
      const logic = rule.logic || 'AND';

      if (logic === 'AND') {
        return conditions.every(c => this.evaluateCondition(c, formValues));
      } else {
        return conditions.some(c => this.evaluateCondition(c, formValues));
      }
    }

    return false;
  }

  public evaluateVisibility(formValues: Record<string, any>): VisibilityMap {
    const cacheKey = this.getCacheKey(formValues);
    if (this.options.cacheResults && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const visibility: VisibilityMap = {};
    for (const [fieldKey] of this.fields) {
      visibility[fieldKey] = {
        visible: true,
        disabled: false,
        required: false,
      };
    }

    const affectedByRules: Record<string, string[]> = {};
    this.lastEvaluation = [];

    for (const rule of this.rules) {
      const met = this.evaluateRule(rule, formValues);

      const conditions = Array.isArray(rule.if) ? rule.if : [rule.if];
      const ruleResult: RuleEvaluationResult = {
        ruleId: rule.id || `rule-${this.rules.indexOf(rule)}`,
        met,
        conditions: conditions.map(c => ({
          met,
          fieldKey: c.field_key,
          operator: c.operator,
          fieldValue: formValues[c.field_key],
          expectedValue: c.value,
        })),
        logic: rule.type === 'compound' ? rule.logic : undefined,
        action: rule.then.action,
        targetField: rule.then.target_field,
      };
      this.lastEvaluation.push(ruleResult);

      if (met) {
        const targetField = rule.then.target_field;
        const action = rule.then.action;

        if (!affectedByRules[targetField]) {
          affectedByRules[targetField] = [];
        }
        affectedByRules[targetField].push(rule.id || `rule-${this.rules.indexOf(rule)}`);

        switch (action) {
          case 'show':
            visibility[targetField].visible = true;
            break;

          case 'hide':
            visibility[targetField].visible = false;
            if (rule.then.clear_value_on_hide) {
              visibility[targetField].clearValue = true;
            }
            break;

          case 'require':
            visibility[targetField].required = true;
            break;

          case 'unrequire':
            visibility[targetField].required = false;
            break;

          case 'enable':
            visibility[targetField].disabled = false;
            break;

          case 'disable':
            visibility[targetField].disabled = true;
            break;

          case 'clear_value':
            visibility[targetField].clearValue = true;
            break;
        }
      }
    }

    for (const [fieldKey, ruleIds] of Object.entries(affectedByRules)) {
      if (visibility[fieldKey]) {
        visibility[fieldKey].affectedByRules = ruleIds;
      }
    }

    if (this.options.cacheResults) {
      this.cache.set(cacheKey, visibility);
    }

    return visibility;
  }

  public getVisibleFields(formValues: Record<string, any>): Set<string> {
    const visibility = this.evaluateVisibility(formValues);
    return new Set(
      Object.entries(visibility)
        .filter(([_, state]) => state.visible)
        .map(([key]) => key)
    );
  }

  public getHiddenFields(formValues: Record<string, any>): Set<string> {
    const visibility = this.evaluateVisibility(formValues);
    return new Set(
      Object.entries(visibility)
        .filter(([_, state]) => !state.visible)
        .map(([key]) => key)
    );
  }

  public isFieldVisible(fieldKey: string, formValues: Record<string, any>): boolean {
    const visibility = this.evaluateVisibility(formValues);
    return visibility[fieldKey]?.visible ?? false;
  }

  public getFieldDependents(fieldKey: string): Set<string> {
    if (!this.dependencyGraph) return new Set();
    return this.dependencyGraph.dependents.get(fieldKey) || new Set();
  }

  public getFieldDependencies(fieldKey: string): Set<string> {
    if (!this.dependencyGraph) return new Set();
    return this.dependencyGraph.dependencies.get(fieldKey) || new Set();
  }

  public getAffectedFields(fieldKey: string): Set<string> {
    const affected = new Set<string>();
    const queue = [fieldKey];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const dependents = this.getFieldDependents(current);
      for (const dependent of dependents) {
        affected.add(dependent);
        queue.push(dependent);
      }
    }

    return affected;
  }

  public getValidationErrors(): DependencyValidationError[] {
    return [...this.validationErrors];
  }

  public getLastEvaluation(): RuleEvaluationResult[] {
    return [...this.lastEvaluation];
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public reset(): void {
    this.clearCache();
    this.buildDependencyGraph();
    this.validationErrors = [];
    this.lastEvaluation = [];
  }

  private getCacheKey(formValues: Record<string, any>): string {
    return JSON.stringify(formValues);
  }

  public getDependencyGraph(): DependencyGraph | null {
    return this.dependencyGraph;
  }

  public hasErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  public getSummary(): string {
    return `
      DependencyEngine Summary:
      - Fields: ${this.fields.size}
      - Rules: ${this.rules.length}
      - Validation Errors: ${this.validationErrors.length}
      - Cache enabled: ${this.options.cacheResults}
      - Cache size: ${this.cache.size}
    `;
  }
}

export default DependencyEngine;