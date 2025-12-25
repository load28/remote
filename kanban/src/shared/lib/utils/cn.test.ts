import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('combines string classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('filters falsy values', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
  });

  it('flattens arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles complex conditions', () => {
    const isActive = true;
    const isDisabled = false;
    const variant = 'primary';

    expect(
      cn(
        'button',
        isActive && 'active',
        isDisabled && 'disabled',
        variant === 'primary' && 'button-primary'
      )
    ).toBe('button active button-primary');
  });
});
