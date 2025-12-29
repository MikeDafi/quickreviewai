/**
 * Shared validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  error: string;
}

/**
 * Validates a URL for safe usage (prevents XSS and invalid protocols)
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) return { valid: true, error: '' };
  
  const trimmed = url.trim();
  
  // Check for valid protocol
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }
  
  // Block dangerous patterns (XSS prevention)
  if (/javascript:|data:|vbscript:|file:/i.test(trimmed)) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Check for script injection attempts
  if (/<script|onclick|onerror|onload/i.test(trimmed)) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Basic URL format validation
  try {
    new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  return { valid: true, error: '' };
}

/**
 * Validates a store name
 */
export function validateStoreName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Store name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Store name must be at least 2 characters' };
  }
  
  if (name.trim().length > 100) {
    return { valid: false, error: 'Store name must be less than 100 characters' };
  }
  
  return { valid: true, error: '' };
}

