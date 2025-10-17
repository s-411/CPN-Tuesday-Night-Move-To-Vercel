/**
 * Validates that a name field contains only a single word (first name only)
 *
 * @param name - The name string to validate
 * @returns Object with validation result and optional error message
 */
export function validateSingleWordName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: 'Name is required' };
  }

  // Split by any whitespace (spaces, tabs, newlines, etc.)
  const words = trimmed.split(/\s+/);

  if (words.length > 1) {
    return { valid: false, error: 'Enter first name only' };
  }

  return { valid: true };
}
