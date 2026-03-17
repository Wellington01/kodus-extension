import { caseConverters, convertTextCase } from '@utils/caseConverter';

describe('caseConverters', () => {
  describe('UPPERCASE', () => {
    it('converts text to uppercase', () => {
      expect(caseConverters.UPPERCASE('hello world')).toBe('HELLO WORLD');
    });

    it('handles already uppercase text', () => {
      expect(caseConverters.UPPERCASE('HELLO')).toBe('HELLO');
    });
  });

  describe('lowercase', () => {
    it('converts text to lowercase', () => {
      expect(caseConverters.lowercase('Hello World')).toBe('hello world');
    });
  });

  describe('camelCase', () => {
    it('converts space-separated words', () => {
      expect(caseConverters.camelCase('hello world')).toBe('helloWorld');
    });

    it('keeps first letter lowercase', () => {
      expect(caseConverters.camelCase('Hello World')).toBe('helloWorld');
    });

    it('handles single word', () => {
      expect(caseConverters.camelCase('hello')).toBe('hello');
    });
  });

  describe('PascalCase', () => {
    it('converts space-separated words', () => {
      expect(caseConverters.PascalCase('hello world')).toBe('HelloWorld');
    });

    it('capitalizes first letter', () => {
      expect(caseConverters.PascalCase('hello')).toBe('Hello');
    });
  });

  describe('kebab-case', () => {
    it('converts space-separated words', () => {
      expect(caseConverters['kebab-case']('Hello World')).toBe('hello-world');
    });

    it('converts camelCase to kebab-case', () => {
      expect(caseConverters['kebab-case']('helloWorld')).toBe('hello-world');
    });

    it('converts underscores to hyphens', () => {
      expect(caseConverters['kebab-case']('hello_world')).toBe('hello-world');
    });
  });

  describe('snake_case', () => {
    it('converts space-separated words', () => {
      expect(caseConverters.snake_case('Hello World')).toBe('hello_world');
    });

    it('converts camelCase to snake_case', () => {
      expect(caseConverters.snake_case('helloWorld')).toBe('hello_world');
    });

    it('converts hyphens to underscores', () => {
      expect(caseConverters.snake_case('hello-world')).toBe('hello_world');
    });
  });
});

describe('convertTextCase', () => {
  it('delegates to the correct converter', () => {
    expect(convertTextCase('hello world', 'PascalCase')).toBe('HelloWorld');
    expect(convertTextCase('Hello World', 'snake_case')).toBe('hello_world');
    expect(convertTextCase('hello world', 'UPPERCASE')).toBe('HELLO WORLD');
  });

  it('handles empty string', () => {
    expect(convertTextCase('', 'camelCase')).toBe('');
  });
});
