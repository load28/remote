import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isDueDateOverdue,
  isDueDateSoon,
  formatDueDate,
  CARD_PRIORITY_LABELS,
  CARD_PRIORITY_COLORS,
} from './types';

describe('Card model utilities', () => {
  describe('isDueDateOverdue', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true when due date is in the past', () => {
      expect(isDueDateOverdue('2024-03-14T12:00:00')).toBe(true);
    });

    it('returns false when due date is in the future', () => {
      expect(isDueDateOverdue('2024-03-16T12:00:00')).toBe(false);
    });

    it('returns false when due date is undefined', () => {
      expect(isDueDateOverdue(undefined)).toBe(false);
    });

    it('returns false when completed even if overdue', () => {
      expect(isDueDateOverdue('2024-03-14T12:00:00', true)).toBe(false);
    });
  });

  describe('isDueDateSoon', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true when due date is within 24 hours', () => {
      expect(isDueDateSoon('2024-03-16T00:00:00')).toBe(true);
    });

    it('returns false when due date is more than 24 hours away', () => {
      expect(isDueDateSoon('2024-03-17T12:00:00')).toBe(false);
    });

    it('returns false when due date is in the past', () => {
      expect(isDueDateSoon('2024-03-14T12:00:00')).toBe(false);
    });

    it('returns false when due date is undefined', () => {
      expect(isDueDateSoon(undefined)).toBe(false);
    });

    it('returns false when completed', () => {
      expect(isDueDateSoon('2024-03-16T00:00:00', true)).toBe(false);
    });
  });

  describe('formatDueDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('formats date without year for current year', () => {
      const formatted = formatDueDate('2024-06-20T00:00:00');
      expect(formatted).toBe('Jun 20');
    });

    it('formats date with year for different year', () => {
      const formatted = formatDueDate('2025-06-20T00:00:00');
      expect(formatted).toBe('Jun 20, 2025');
    });
  });

  describe('CARD_PRIORITY constants', () => {
    it('has labels for all priority levels', () => {
      expect(CARD_PRIORITY_LABELS.urgent).toBe('Urgent');
      expect(CARD_PRIORITY_LABELS.high).toBe('High');
      expect(CARD_PRIORITY_LABELS.medium).toBe('Medium');
      expect(CARD_PRIORITY_LABELS.low).toBe('Low');
      expect(CARD_PRIORITY_LABELS.none).toBe('None');
    });

    it('has colors for all priority levels', () => {
      expect(CARD_PRIORITY_COLORS.urgent).toBe('#DC2626');
      expect(CARD_PRIORITY_COLORS.high).toBe('#F97316');
      expect(CARD_PRIORITY_COLORS.medium).toBe('#EAB308');
      expect(CARD_PRIORITY_COLORS.low).toBe('#22C55E');
      expect(CARD_PRIORITY_COLORS.none).toBe('#9CA3AF');
    });
  });
});
