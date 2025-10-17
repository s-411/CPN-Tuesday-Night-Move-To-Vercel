import { describe, it, expect } from 'vitest';
import { validateSingleWordName } from './nameValidation';

describe('validateSingleWordName', () => {
  describe('Happy Path - Valid Single Word Names', () => {
    it('should accept a simple single word name', () => {
      const result = validateSingleWordName('John');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a single word with capital letters', () => {
      const result = validateSingleWordName('SARAH');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a single word with mixed case', () => {
      const result = validateSingleWordName('MiChAeL');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a name with numbers', () => {
      const result = validateSingleWordName('User123');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a name with special characters', () => {
      const result = validateSingleWordName("O'Brien");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a single character name', () => {
      const result = validateSingleWordName('A');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should trim and accept a name with leading spaces', () => {
      const result = validateSingleWordName('  John');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should trim and accept a name with trailing spaces', () => {
      const result = validateSingleWordName('John  ');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should trim and accept a name with both leading and trailing spaces', () => {
      const result = validateSingleWordName('  John  ');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Edge Cases - Invalid Multiple Word Names', () => {
    it('should reject a name with two words separated by space', () => {
      const result = validateSingleWordName('John Doe');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });

    it('should reject a name with three words', () => {
      const result = validateSingleWordName('John Paul Smith');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });

    it('should reject a name with multiple spaces between words', () => {
      const result = validateSingleWordName('John    Doe');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });

    it('should reject a name with tab character between words', () => {
      const result = validateSingleWordName('John\tDoe');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });

    it('should reject a name with newline character', () => {
      const result = validateSingleWordName('John\nDoe');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });

    it('should reject a name with various whitespace types', () => {
      const result = validateSingleWordName('John \t\n Doe');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });
  });

  describe('Edge Cases - Empty and Whitespace-Only Input', () => {
    it('should reject an empty string', () => {
      const result = validateSingleWordName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject a string with only spaces', () => {
      const result = validateSingleWordName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject a string with only tabs', () => {
      const result = validateSingleWordName('\t\t\t');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject a string with only newlines', () => {
      const result = validateSingleWordName('\n\n');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject a string with mixed whitespace characters', () => {
      const result = validateSingleWordName(' \t\n ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Name is required');
    });
  });

  describe('Edge Cases - Unicode and Special Characters', () => {
    it('should accept a name with unicode characters', () => {
      const result = validateSingleWordName('José');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a name with Chinese characters', () => {
      const result = validateSingleWordName('李明');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a name with Arabic characters', () => {
      const result = validateSingleWordName('محمد');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept a name with Cyrillic characters', () => {
      const result = validateSingleWordName('Иван');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept emojis as a single word', () => {
      const result = validateSingleWordName('😀');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject multiple words with unicode characters', () => {
      const result = validateSingleWordName('José María');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });
  });

  describe('Edge Cases - Very Long Names', () => {
    it('should accept a very long single word name', () => {
      const longName = 'A'.repeat(1000);
      const result = validateSingleWordName(longName);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject a very long multi-word name', () => {
      const longName = 'A'.repeat(500) + ' ' + 'B'.repeat(500);
      const result = validateSingleWordName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Enter first name only');
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle name with hyphen as single word', () => {
      const result = validateSingleWordName('Jean-Claude');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle name with apostrophe as single word', () => {
      const result = validateSingleWordName("D'Angelo");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle name with period as single word', () => {
      const result = validateSingleWordName('J.R.');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle name with underscore as single word', () => {
      const result = validateSingleWordName('User_Name');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});