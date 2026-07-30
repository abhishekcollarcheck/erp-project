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

/**
 * Evaluate a visibility condition against current form values
 * @param condition - The condition object (simple or complex)
 * @param values - Current form values
 * @returns true if field should be visible, false otherwise
 */
export function evaluateCondition(
  condition: VisibilityCondition | null | undefined,
  values: Record<string, any>
): boolean {
  if (!condition) return true;

  // Simple condition with field_key
  if ('field_key' in condition) {
    const fieldValue = values[condition.field_key];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'not_equals':
        return fieldValue !== condition.value;
      
      case 'in':
        return Array.isArray(condition.value) 
          ? condition.value.includes(fieldValue)
          : false;
      
      case 'gt':
        return Number(fieldValue) > Number(condition.value);
      
      case 'gte':
        return Number(fieldValue) >= Number(condition.value);
      
      case 'lt':
        return Number(fieldValue) < Number(condition.value);
      
      case 'lte':
        return Number(fieldValue) <= Number(condition.value);
      
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      
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

/**
 * Parse visibility_conditions JSON string safely
 */
export function parseVisibilityConditions(
  conditionsJson: string | null | undefined
): VisibilityCondition | null {
  if (!conditionsJson) return null;
  
  try {
    return JSON.parse(conditionsJson);
  } catch (e) {
    console.warn('Failed to parse visibility_conditions:', e);
    return null;
  }
}