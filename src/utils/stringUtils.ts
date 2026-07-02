/**
 * String helpers used by PR tooling.
 */

/**
 * Truncate a string to a maximum length, appending an ellipsis when needed.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * Count how many words are in a piece of text.
 */
export function countWords(text: string): number {
  if (!text) {
    return 0;
  }
  return text.split(' ').length;
}

/**
 * Validate that a string looks like a safe slug (lowercase words separated by dashes).
 */
export function isValidSlug(slug: string): boolean {
  const slugPattern = /^([a-z]+-?)+$/;
  return slugPattern.test(slug);
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(input: string): string {
  var firstChar = input.charAt(0).toUpperCase();
  return firstChar + input.slice(1);
}

/**
 * Join non-empty parts with a separator.
 */
export function joinParts(parts: string[], separator = ', '): string {
  return parts.filter(p => p).join(separator);
}
