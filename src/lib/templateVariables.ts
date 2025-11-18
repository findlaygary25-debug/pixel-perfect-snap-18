export interface TemplateVariable {
  key: string;
  type: 'string' | 'number' | 'date' | 'url' | 'boolean';
  required: boolean;
  description: string;
  default?: any;
  format?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export const SYSTEM_VARIABLES: TemplateVariable[] = [
  { key: 'app_name', type: 'string', required: false, description: 'Application name', default: 'uTubChat' },
  { key: 'support_email', type: 'string', required: false, description: 'Support email address', default: 'support@utubchat.com' },
  { key: 'current_date', type: 'date', required: false, description: 'Current date', format: 'MMM DD, YYYY' },
  { key: 'current_year', type: 'number', required: false, description: 'Current year' },
];

export const USER_VARIABLES: TemplateVariable[] = [
  { key: 'user_name', type: 'string', required: true, description: 'User\'s display name', default: 'User' },
  { key: 'user_email', type: 'string', required: true, description: 'User\'s email address' },
  { key: 'user_id', type: 'string', required: true, description: 'User\'s unique ID' },
];

export const SALE_VARIABLES: TemplateVariable[] = [
  { key: 'discount_percentage', type: 'number', required: true, description: 'Discount percentage', validation: { min: 0, max: 100 } },
  { key: 'sale_end_time', type: 'date', required: true, description: 'Sale end date/time', format: 'h:mm A' },
  { key: 'item_count', type: 'number', required: false, description: 'Number of items on sale' },
  { key: 'banner_title', type: 'string', required: false, description: 'Sale banner title' },
  { key: 'action_url', type: 'url', required: false, description: 'Call-to-action URL' },
];

export const ORDER_VARIABLES: TemplateVariable[] = [
  { key: 'order_id', type: 'string', required: true, description: 'Order ID' },
  { key: 'order_total', type: 'number', required: true, description: 'Order total amount' },
  { key: 'tracking_url', type: 'url', required: false, description: 'Package tracking URL' },
  { key: 'tracking_number', type: 'string', required: false, description: 'Package tracking number' },
];

export function parseTemplate(content: string, data: Record<string, any>): string {
  let result = content;
  
  // Handle conditional blocks {{#if condition}}content{{/if}}
  const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (match, condition, content) => {
    try {
      // Simple evaluation - in production, use a safer parser
      const isTrue = evaluateCondition(condition, data);
      return isTrue ? content : '';
    } catch {
      return '';
    }
  });
  
  // Replace variables {{variable_name}}
  const variableRegex = /\{\{([^}]+)\}\}/g;
  result = result.replace(variableRegex, (match, key) => {
    const trimmedKey = key.trim();
    const value = data[trimmedKey];
    
    if (value === undefined || value === null) {
      return match; // Keep placeholder if no value
    }
    
    return String(value);
  });
  
  return result;
}

function evaluateCondition(condition: string, data: Record<string, any>): boolean {
  // Simple condition evaluation - supports ===, !==, >, <, >=, <=
  const operators = ['===', '!==', '>=', '<=', '>', '<'];
  
  for (const op of operators) {
    if (condition.includes(op)) {
      const [left, right] = condition.split(op).map(s => s.trim());
      const leftValue = data[left] !== undefined ? data[left] : left.replace(/['"]/g, '');
      const rightValue = right.replace(/['"]/g, '');
      
      switch (op) {
        case '===': return leftValue === rightValue;
        case '!==': return leftValue !== rightValue;
        case '>': return Number(leftValue) > Number(rightValue);
        case '<': return Number(leftValue) < Number(rightValue);
        case '>=': return Number(leftValue) >= Number(rightValue);
        case '<=': return Number(leftValue) <= Number(rightValue);
      }
    }
  }
  
  // Simple truthy check
  return Boolean(data[condition.trim()]);
}

export function validateVariables(
  variables: TemplateVariable[],
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const variable of variables) {
    if (variable.required && !data[variable.key]) {
      errors.push(`Missing required variable: ${variable.key}`);
      continue;
    }
    
    const value = data[variable.key];
    if (value === undefined) continue;
    
    // Type validation
    if (variable.type === 'number' && typeof value !== 'number') {
      errors.push(`${variable.key} must be a number`);
    }
    
    if (variable.type === 'url' && !isValidUrl(value)) {
      errors.push(`${variable.key} must be a valid URL`);
    }
    
    // Range validation
    if (variable.validation) {
      if (variable.validation.min !== undefined && value < variable.validation.min) {
        errors.push(`${variable.key} must be at least ${variable.validation.min}`);
      }
      if (variable.validation.max !== undefined && value > variable.validation.max) {
        errors.push(`${variable.key} must be at most ${variable.validation.max}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export function extractVariables(content: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = content.matchAll(variableRegex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    const key = match[1].trim();
    // Exclude conditional keywords
    if (!key.startsWith('#') && !key.startsWith('/')) {
      variables.add(key);
    }
  }
  
  return Array.from(variables);
}

export function formatVariable(value: any, variable: TemplateVariable): string {
  if (variable.type === 'date' && variable.format) {
    // Simple date formatting - in production, use date-fns
    const date = new Date(value);
    return date.toLocaleDateString();
  }
  
  if (variable.type === 'number' && typeof value === 'number') {
    return value.toLocaleString();
  }
  
  return String(value);
}
