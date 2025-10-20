/**
 * Utility functions for text case conversion
 */

export const caseConverters = {
  UPPERCASE: (text: string) => text.toUpperCase(),
  
  lowercase: (text: string) => text.toLowerCase(),
  
  camelCase: (text: string) => 
    text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, ''),
  
  PascalCase: (text: string) => 
    text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
      return word.toUpperCase();
    }).replace(/\s+/g, ''),
  
  'kebab-case': (text: string) => 
    text.replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase(),
  
  'snake_case': (text: string) => 
    text.replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase(),
} as const;

export type CaseType = keyof typeof caseConverters;

export const convertTextCase = (text: string, caseType: CaseType): string => {
  return caseConverters[caseType](text);
};
