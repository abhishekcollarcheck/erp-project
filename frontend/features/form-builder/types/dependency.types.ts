export type DependencyOperator =
  | '='          // equals
  | '!='         // not equals
  | '>'          // greater than
  | '<'          // less than
  | '>='         // greater than or equals
  | '<='         // less than or equals
  
  // Array operators
  | 'in'         // value is in array
  | 'not_in'     // value is not in array
  
  // String operators
  | 'contains'   // string contains substring
  | 'not_contains' // string does not contain
  
  // Empty/null operators
  | 'isEmpty'    // value is empty or null
  | 'isNotEmpty'; // value is not empty

export type DependencyAction =
  | 'show'           // Make field visible
  | 'hide'           // Hide field from user
  | 'require'        // Make field required
  | 'unrequire'      // Make field optional
  | 'enable'         // Enable field (if currently disabled)
  | 'disable'        // Disable field (make read-only)
  | 'clear_value';   // Clear the field's value

export type DependencyLogic = 'AND' | 'OR';

export interface DependencyCondition {
  field_key: string;
  operator: DependencyOperator;
  value: string | number | boolean | string[] | number[];
  negate?: boolean;
  errorMessage?: string;
}

export interface DependencyAction_Config {
  target_field: string;
  action: DependencyAction;
  clear_value_on_hide?: boolean;
  message?: string;
}

export interface DependencyRule {
  type: 'simple' | 'compound';
  if: DependencyCondition | DependencyCondition[];
  logic?: DependencyLogic; // AND (default) or OR
  then: DependencyAction_Config;
  priority?: number;
  enabled?: boolean;
  id?: string;
}

export interface FieldVisibilityState {
  visible: boolean;
  disabled?: boolean;
  required?: boolean;
  clearValue?: boolean;
  affectedByRules?: string[];
}

export type VisibilityMap = Record<string, FieldVisibilityState>;

export interface DependencyGraph {
  dependencies: Map<string, Set<string>>;
  dependents: Map<string, Set<string>>;
  rules: DependencyRule[];
}

export interface ConditionEvaluationResult {
  met: boolean;
  fieldKey: string;
  operator: DependencyOperator;
  fieldValue: any;
  expectedValue: any;
}

export interface RuleEvaluationResult {
  ruleId: string;
  met: boolean;
  conditions: ConditionEvaluationResult[];
  logic?: DependencyLogic;
  action: DependencyAction;
  targetField: string;
}

export interface DependencyValidationError {
  ruleId?: string;
  fieldKey?: string;
  message: string;
  type: 'circular_dependency' | 'invalid_condition' | 'missing_field' | 'invalid_operator';
}

export interface DependencyEngineOptions {
  autoClearHidden?: boolean;
  allowCircularDependencies?: boolean;
  cacheResults?: boolean;
  validateRules?: boolean;
}

export interface IDependencyRuleBuilder {
  if(
    fieldKey: string,
    operator: DependencyOperator,
    value: any
  ): IDependencyRuleBuilder;
  
  and(
    fieldKey: string,
    operator: DependencyOperator,
    value: any
  ): IDependencyRuleBuilder;
  
  or(
    fieldKey: string,
    operator: DependencyOperator,
    value: any
  ): IDependencyRuleBuilder;
  
  then(targetField: string, action: DependencyAction): IDependencyRuleBuilder;
  
  withPriority(priority: number): IDependencyRuleBuilder;
  
  build(): DependencyRule;
}

export type ExtractConditions<T extends DependencyRule> = T['if'];
export type ExtractAction<T extends DependencyRule> = T['then'];

export const VALID_OPERATORS: readonly DependencyOperator[] = [
  '=', '!=', '>', '<', '>=', '<=',
  'in', 'not_in',
  'contains', 'not_contains',
  'isEmpty', 'isNotEmpty'
] as const;

export const VALID_ACTIONS: readonly DependencyAction[] = [
  'show', 'hide',
  'require', 'unrequire',
  'enable', 'disable',
  'clear_value'
] as const;

export function isValidOperator(value: any): value is DependencyOperator {
  return VALID_OPERATORS.includes(value);
}

export function isValidAction(value: any): value is DependencyAction {
  return VALID_ACTIONS.includes(value);
}

export default {
  type: 'DependencyTypes',
  version: '1.0.0',
} as const;