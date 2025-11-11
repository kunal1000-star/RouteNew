// Fixed UUID Generator for Database Compatibility
// ===============================================

/**
 * Generate a valid UUID v4 format
 */
export function generateValidUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Check if a string is a valid UUID v4 format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a UUID if the input is not valid
 */
export function ensureValidUUID(input: string | null | undefined): string {
  if (!input) {
    return generateValidUUID();
  }
  
  if (isValidUUID(input)) {
    return input;
  }
  
  // Generate a new UUID for invalid input
  return generateValidUUID();
}