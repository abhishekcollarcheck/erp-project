import type { DependencyOperator } from '../types/dependency.types';

type OperatorFn = (fieldValue: any, ruleValue: any) => boolean;

export const COMPARISON_OPERATORS: Record<string, OperatorFn> = {
  '=': (fieldValue: any, ruleValue: any): boolean => {
    return fieldValue === ruleValue;
  },

  '!=': (fieldValue: any, ruleValue: any): boolean => {
    return fieldValue !== ruleValue;
  },

  '>': (fieldValue: any, ruleValue: any): boolean => {
    // Handle null/undefined
    if (fieldValue === null || fieldValue === undefined) return false;
    return fieldValue > ruleValue;
  },

  '<': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) return false;
    return fieldValue < ruleValue;
  },

  '>=': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) return false;
    return fieldValue >= ruleValue;
  },

  '<=': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) return false;
    return fieldValue <= ruleValue;
  },
};

export const ARRAY_OPERATORS: Record<string, OperatorFn> = {

  'in': (fieldValue: any, ruleValue: any): boolean => {
    // Ensure ruleValue is an array
    if (!Array.isArray(ruleValue)) {
      return false;
    }
    
    if (Array.isArray(fieldValue)) {
      return fieldValue.some(v => ruleValue.includes(v));
    }
    
    return ruleValue.includes(fieldValue);
  },

  'not_in': (fieldValue: any, ruleValue: any): boolean => {
    if (!Array.isArray(ruleValue)) {
      return true;
    }
    
    if (Array.isArray(fieldValue)) {
      return !fieldValue.some(v => ruleValue.includes(v));
    }
    
    return !ruleValue.includes(fieldValue);
  },
};

export const STRING_OPERATORS: Record<string, OperatorFn> = {
  'contains': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    const strValue = String(fieldValue);
    const strRule = String(ruleValue);
    
    return strValue.includes(strRule);
  },

  'not_contains': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) {
      return true;
    }
    
    const strValue = String(fieldValue);
    const strRule = String(ruleValue);
    
    return !strValue.includes(strRule);
  },

  'startsWith': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    const strValue = String(fieldValue);
    const strRule = String(ruleValue);
    
    return strValue.startsWith(strRule);
  },

  'endsWith': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    const strValue = String(fieldValue);
    const strRule = String(ruleValue);
    
    return strValue.endsWith(strRule);
  },

  'matches': (fieldValue: any, ruleValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }
    
    try {
      const strValue = String(fieldValue);
      const regex = new RegExp(ruleValue);
      return regex.test(strValue);
    } catch (e) {
      // Invalid regex
      console.error('Invalid regex pattern:', ruleValue, e);
      return false;
    }
  },
};

export const EMPTY_OPERATORS: Record<string, OperatorFn> = {
  'isEmpty': (fieldValue: any): boolean => {
    if (fieldValue === null || fieldValue === undefined) {
      return true;
    }
    
    if (typeof fieldValue === 'string' && fieldValue === '') {
      return true;
    }
    
    if (Array.isArray(fieldValue) && fieldValue.length === 0) {
      return true;
    }
    
    if (
      typeof fieldValue === 'object' &&
      Object.keys(fieldValue).length === 0 &&
      !Array.isArray(fieldValue)
    ) {
      return true;
    }
    
    return false;
  },

//   'isNotEmpty': (fieldValue: any): boolean => {
//     return !EMPTY_OPERATORS['isEmpty'](fieldValue);
//   },


  'isNull': (fieldValue: any): boolean => {
    return fieldValue === null || fieldValue === undefined;
  },

  'isNotNull': (fieldValue: any): boolean => {
    return fieldValue !== null && fieldValue !== undefined;
  },
};

export const ALL_OPERATORS: Record<DependencyOperator, OperatorFn> = {
  ...COMPARISON_OPERATORS,
  ...ARRAY_OPERATORS,
  ...STRING_OPERATORS,
  ...EMPTY_OPERATORS,
} as Record<DependencyOperator, OperatorFn>;

export const OPERATOR_CATEGORIES = {
  comparison: {
    label: 'Comparison Operators',
    operators: ['=', '!=', '>', '<', '>=', '<='],
    description: 'Compare a field value against a single value',
    examples: [
      'department = "HR"',
      'age > 18',
      'score >= 80',
    ],
  },
  array: {
    label: 'Array Operators',
    operators: ['in', 'not_in'],
    description: 'Check if a field value is in a list of values',
    examples: [
      'status in ["Active", "Pending"]',
      'country not_in ["US", "CA"]',
    ],
  },
  string: {
    label: 'String Operators',
    operators: ['contains', 'not_contains', 'startsWith', 'endsWith', 'matches'],
    description: 'String pattern matching',
    examples: [
      'email contains "@example.com"',
      'code startsWith "EMP"',
      'phone matches "^\\d{10}$"',
    ],
  },
  empty: {
    label: 'Empty/Null Operators',
    operators: ['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'],
    description: 'Check if a field is empty or has no value',
    examples: [
      'notes isEmpty',
      'attachments isNotEmpty',
    ],
  },
};

export function getOperator(operator: DependencyOperator | string): OperatorFn | null {
  return ALL_OPERATORS[operator as DependencyOperator] || null;
}

export function isValidOperator(operator: any): operator is DependencyOperator {
  return operator in ALL_OPERATORS;
}

export function getAllOperators(): DependencyOperator[] {
  return Object.keys(ALL_OPERATORS) as DependencyOperator[];
}

export function getOperatorsByCategory(category: keyof typeof OPERATOR_CATEGORIES): string[] {
  return OPERATOR_CATEGORIES[category]?.operators || [];
}

export function compareValues(
  fieldValue: any,
  ruleValue: any,
  operator: DependencyOperator | string
): boolean {
  const operatorFn = getOperator(operator as DependencyOperator);
  
  if (!operatorFn) {
    console.error(`Unknown operator: ${operator}`);
    throw new Error(`Unknown operator: ${operator}`);
  }
  
  try {
    return operatorFn(fieldValue, ruleValue);
  } catch (error) {
    console.error(`Error comparing values with operator ${operator}:`, error);
    return false;
  }
}

export function getOperatorDescription(operator: DependencyOperator | string): string {
  const descriptions: Record<string, string> = {
    '=': 'equals',
    '!=': 'not equals',
    '>': 'greater than',
    '<': 'less than',
    '>=': 'greater than or equals',
    '<=': 'less than or equals',
    'in': 'is in list',
    'not_in': 'is not in list',
    'contains': 'contains text',
    'not_contains': 'does not contain text',
    'startsWith': 'starts with',
    'endsWith': 'ends with',
    'matches': 'matches pattern',
    'isEmpty': 'is empty',
    'isNotEmpty': 'is not empty',
    'isNull': 'is null',
    'isNotNull': 'is not null',
  };
  
  return descriptions[operator as string] || operator;
}

export type OperatorType = keyof typeof ALL_OPERATORS;

export default {
  COMPARISON_OPERATORS,
  ARRAY_OPERATORS,
  STRING_OPERATORS,
  EMPTY_OPERATORS,
  ALL_OPERATORS,
  OPERATOR_CATEGORIES,
  getOperator,
  isValidOperator,
  getAllOperators,
  getOperatorsByCategory,
  compareValues,
  getOperatorDescription,
} as const;