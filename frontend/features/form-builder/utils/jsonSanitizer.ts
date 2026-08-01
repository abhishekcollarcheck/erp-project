export const sanitizeJSON = (json: string): string => {
  if (!json || typeof json !== 'string') return '';
  
  return json.replace(/,(\s*[}\]])/g, '$1');
};

export const safeJSONParse = <T = any>(json: string | null): T | null => {
  if (!json) return null;
  
  try {
    // Try parsing as-is first
    return JSON.parse(json) as T;
  } catch (error) {
    try {
      // If that fails, try after removing trailing commas
      const sanitized = sanitizeJSON(json);
      return JSON.parse(sanitized) as T;
    } catch (err) {
      console.error('[safeJSONParse] Failed to parse JSON:', json);
      console.error('[safeJSONParse] Error:', err instanceof Error ? err.message : err);
      return null;
    }
  }
};

export const validateVisibilityConditionsJSON = (conditionsJson: string | null): string => {
  if (!conditionsJson) return '';
  
  try {
    JSON.parse(conditionsJson);
    return conditionsJson; 
  } catch {
    const sanitized = sanitizeJSON(conditionsJson);
    try {
      JSON.parse(sanitized);
      console.warn('[validateVisibilityConditionsJSON] JSON was malformed, automatically fixed');
      return sanitized; 
    } catch {
      console.error('[validateVisibilityConditionsJSON] JSON is invalid even after sanitization');
      return ''; 
    }
  }
};


export const JSONUtils = {
  sanitizeJSON,
  safeJSONParse,
  validateVisibilityConditionsJSON,
};
