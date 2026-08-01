export interface SimpleCondition {
  field_key: string;
  operator: 'equals' | 'not_equals' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty' | 'not_empty';
  value?: any;
}

export interface ComplexCondition {
  operator: 'AND' | 'OR';
  conditions: (SimpleCondition | ComplexCondition)[];
}

export type VisibilityCondition = SimpleCondition | ComplexCondition;

export function evaluateCondition(
  condition: VisibilityCondition | null | undefined,
  values: Record<string, any>
): boolean {
  if (!condition) return true;
  console.log("condition", condition)
  console.log('field_key' in condition)
  if ('field_key' in condition) {
    const fieldValue = values[condition.field_key];
    switch (condition.operator) {
      case 'equals': {
        if (fieldValue === undefined) {
          return false;
        }
        const result = fieldValue === condition.value;
        return result;
      }

      case 'not_equals': {
        if (fieldValue === undefined) {
          return false;
        }
        const result = fieldValue !== condition.value;
        return result;
      }

      case 'in':
        return Array.isArray(condition.value)
          ? condition.value.includes(fieldValue)
          : false;

      case 'gt': {

        if (fieldValue === undefined || fieldValue === null) {
          return false;
        }

        // ✅ Convert to numbers
        const num1 = Number(fieldValue);
        const num2 = Number(condition.value);

        // ✅ Check if numbers are valid (not NaN)
        if (isNaN(num1) || isNaN(num2)) {
          console.warn(`[evaluateCondition] gt operator requires numeric values, got: ${fieldValue} and ${condition.value}`);
          return false;
        }

        // ✅ Do the comparison
        const result = num1 > num2;
        console.debug(`[evaluateCondition] gt result: ${result} (${num1} > ${num2})`);
        return result;
      }

      case 'gte': {
        console.debug(`[evaluateCondition] gte: ${condition.field_key} >= ${condition.value}`, `(current: ${fieldValue})`);

        // ✅ Handle undefined: return false if not filled
        if (fieldValue === undefined || fieldValue === null) {
          console.debug(`[evaluateCondition] Field not filled, returning false`);
          return false;
        }

        // ✅ Convert to numbers
        const num1 = Number(fieldValue);
        const num2 = Number(condition.value);

        // ✅ Check if numbers are valid (not NaN)
        if (isNaN(num1) || isNaN(num2)) {
          console.warn(`[evaluateCondition] gte operator requires numeric values, got: ${fieldValue} and ${condition.value}`);
          return false;
        }

        // ✅ Do the comparison
        const result = num1 >= num2;
        console.debug(`[evaluateCondition] gte result: ${result} (${num1} >= ${num2})`);
        return result;
      }

      case 'lt': {
        console.debug(`[evaluateCondition] lt: ${condition.field_key} < ${condition.value}`, `(current: ${fieldValue})`);

        // ✅ Handle undefined: return false if not filled
        if (fieldValue === undefined || fieldValue === null) {
          console.debug(`[evaluateCondition] Field not filled, returning false`);
          return false;
        }

        // ✅ Convert to numbers
        const num1 = Number(fieldValue);
        const num2 = Number(condition.value);

        // ✅ Check if numbers are valid (not NaN)
        if (isNaN(num1) || isNaN(num2)) {
          console.warn(`[evaluateCondition] lt operator requires numeric values, got: ${fieldValue} and ${condition.value}`);
          return false;
        }

        // ✅ Do the comparison
        const result = num1 < num2;
        console.debug(`[evaluateCondition] lt result: ${result} (${num1} < ${num2})`);
        return result;
      }

      case 'lte': {
        console.debug(`[evaluateCondition] lte: ${condition.field_key} <= ${condition.value}`, `(current: ${fieldValue})`);

        // ✅ Handle undefined: return false if not filled
        if (fieldValue === undefined || fieldValue === null) {
          console.debug(`[evaluateCondition] Field not filled, returning false`);
          return false;
        }

        // ✅ Convert to numbers
        const num1 = Number(fieldValue);
        const num2 = Number(condition.value);

        // ✅ Check if numbers are valid (not NaN)
        if (isNaN(num1) || isNaN(num2)) {
          console.warn(`[evaluateCondition] lte operator requires numeric values, got: ${fieldValue} and ${condition.value}`);
          return false;
        }

        // ✅ Do the comparison
        const result = num1 <= num2;
        console.debug(`[evaluateCondition] lte result: ${result} (${num1} <= ${num2})`);
        return result;
      }

      case 'contains': {
        console.debug(`[evaluateCondition] contains: ${condition.field_key} contains ${condition.value}`, `(current: ${fieldValue})`);

        // ✅ Handle undefined/null: return false if field not filled
        if (fieldValue === undefined || fieldValue === null) {
          console.debug(`[evaluateCondition] Field not filled, returning false`);
          return false;
        }

        // ✅ Convert to strings and check
        const fieldStr = String(fieldValue);
        const valueStr = String(condition.value);

        // ✅ Do the comparison
        const result = fieldStr.includes(valueStr);
        console.debug(`[evaluateCondition] contains result: ${result} ("${fieldStr}" includes "${valueStr}")`);
        return result;
      }

      case 'empty':
        return !fieldValue
          || fieldValue === ''
          || (Array.isArray(fieldValue) && fieldValue.length === 0);

      case 'not_empty':
        return !!fieldValue
          && fieldValue !== ''
          && (!Array.isArray(fieldValue) || fieldValue.length > 0);

      default:
        return true;
    }
  }

  // Complex condition with AND/OR
  if ('operator' in condition && 'conditions' in condition) {
    if (condition.operator === 'AND') {
      return condition.conditions.every((c) => evaluateCondition(c, values));
    }
    if (condition.operator === 'OR') {
      return condition.conditions.some((c) => evaluateCondition(c, values));
    }
  }

  return true;
}


function sanitizeJSON(json: string): string {
  if (!json || typeof json !== 'string') return json;
  return json.replace(/,(\s*[}\]])/g, '$1');
}

export function parseVisibilityConditions(
  conditionsJson: string | null | undefined,
  fieldKey?: string
): VisibilityCondition | null {
  if (!conditionsJson) return null;
  try {
    console.debug(`[parseVisibilityConditions] Parsing conditions for field: ${fieldKey || 'unknown'}`);  
    const sanitized = sanitizeJSON(conditionsJson);   
    if (sanitized !== conditionsJson) {
      console.warn(`[parseVisibilityConditions] JSON had to be sanitized for field: ${fieldKey || 'unknown'}`);
      console.debug(`[parseVisibilityConditions] Original: ${conditionsJson}`);
      console.debug(`[parseVisibilityConditions] Sanitized: ${sanitized}`);
    }

    const parsed = JSON.parse(sanitized);
    console.debug(`[parseVisibilityConditions] Successfully parsed conditions`);
    return parsed;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[parseVisibilityConditions] Failed to parse visibility_conditions for field: ${fieldKey || 'unknown'}`,
      {
        error: errorMessage,
        conditionsJson: conditionsJson?.substring(0, 100), // First 100 chars
        fullJson: conditionsJson // Full JSON for debugging
      }
    );
    return null;
  }
}