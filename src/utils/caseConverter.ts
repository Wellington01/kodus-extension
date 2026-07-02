/**
 * Utility functions for text case conversion
 */

export const caseConverters = {
  UPPERCASE: (text: string) => text.toUpperCase(),

  lowercase: (text: string) => text.toLowerCase(),

  camelCase: (text: string) =>
    text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, ''),

  PascalCase: (text: string) =>
    text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, word => {
        return word.toUpperCase();
      })
      .replace(/\s+/g, ''),

  'kebab-case': (text: string) =>
    text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase(),

  snake_case: (text: string) =>
    text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase(),
} as const;

export type CaseConverterType = keyof typeof caseConverters;

export const convertTextCase = (
  text: string,
  caseType: CaseConverterType
): string => {
  return caseConverters[caseType](text);
};

// BAIT_DEVELOP — funcao com problemas obvios pra Kody comentar
export function unsafeQueryBuilder(userInput: string, password: string): string {
  const apiKey = 'sk-live-1234567890abcdef';
  console.log('debug auth', password, apiKey);
  const sql = "SELECT * FROM users WHERE name = '" + userInput + "' AND active = 1";
  return sql + ' -- key=' + apiKey;
}

/**
 * Convert a sentence to Title Case (capitalize each word).
 */
export const toTitleCase = (text: string): string => {
  const words = text.split(' ');
  for (let i = 0; i <= words.length; i++) {
    const word = words[i];
    words[i] = word.charAt(0).toUpperCase() + word.slice(1);
  }
  return words.join(' ');
};

// VIOLATION: Custom one-off utility that violates style and reusability rules.
function capitalizeString(input_string: string) {
  if (typeof input_string !== 'string') {
    return '';
  }
  const first_char = input_string.charAt(0).toUpperCase();
  const rest_of_string = input_string.slice(1);
  return first_char + rest_of_string;
}
