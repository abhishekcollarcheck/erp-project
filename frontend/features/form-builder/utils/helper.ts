// ─── Condition Builder Types ──────────────────────────────────────

type ConditionOperator = 'equals' | 'not_equals' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty' | 'not_empty';

interface ConditionBuilderState {
  triggerField: string | null;      // Which field triggers this
  operator: ConditionOperator | null; // equals, in, checked, etc.
  value: string | string[] | null;   // The value(s) to compare
}

// Get operators available for a specific field type
function getOperatorsForFieldType(fieldType: string): Array<{ value: ConditionOperator; label: string }> {
  switch (fieldType) {
    case 'select':
    case 'radio':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'in', label: 'Equals One Of' },
        { value: 'empty', label: 'Is Empty' },
      ];
    case 'checkbox':
      return [
        { value: 'equals', label: 'Is Checked' },
        { value: 'not_equals', label: 'Is Unchecked' },
        { value: 'empty', label: 'Is Empty' },
      ];
    case 'number':
    case 'currency':
    case 'percentage':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'gt', label: 'Greater Than (>)' },
        { value: 'gte', label: 'Greater Than or Equal (≥)' },
        { value: 'lt', label: 'Less Than (<)' },
        { value: 'lte', label: 'Less Than or Equal (≤)' },
      ];
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'empty', label: 'Is Empty' },
      ];
    case 'date':
    case 'datetime':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'empty', label: 'Is Empty' },
      ];
    default:
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'empty', label: 'Is Empty' },
      ];
  }
}

// Convert condition builder state to JSON
function conditionBuilderToJSON(state: ConditionBuilderState): string | null {
  if (!state.triggerField || !state.operator) return null;
  
  const condition: any = {
    field_key: state.triggerField,
    operator: state.operator,
  };
  
  if (state.value !== null && state.value !== undefined && state.value !== '') {
    condition.value = state.value;
  }
  
  try {
    return JSON.stringify(condition);
  } catch (e) {
    console.error('Failed to convert condition', e);
    return null;
  }
}

// Parse JSON to condition builder state
function jsonToConditionBuilder(json: string | null): ConditionBuilderState {
  if (!json) return { triggerField: null, operator: null, value: null };
  
  try {
    const parsed = JSON.parse(json);
    return {
      triggerField: parsed.field_key || null,
      operator: parsed.operator || null,
      value: parsed.value || null,
    };
  } catch (e) {
    console.error('Failed to parse condition JSON', e);
    return { triggerField: null, operator: null, value: null };
  }
}