// 레퍼런스: testing-library--unit-test--mock.md
// T-07: 테스트 피라미드 — unit test (비즈니스 로직)
// T-03: 소스 옆 테스트 배치

import { calculatePasswordStrength } from './authRules';

describe('calculatePasswordStrength', () => {
  test('returns empty for empty string', () => {
    expect(calculatePasswordStrength('')).toEqual({ level: 'empty', score: 0 });
  });

  test('returns weak for short simple password', () => {
    const result = calculatePasswordStrength('abc');
    expect(result.level).toBe('weak');
  });

  test('returns medium for moderate password', () => {
    const result = calculatePasswordStrength('abcdef1A');
    expect(result.level).toBe('medium');
  });

  test('returns strong for complex password', () => {
    const result = calculatePasswordStrength('Str0ng!Pass');
    expect(result.level).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(4);
  });
});
