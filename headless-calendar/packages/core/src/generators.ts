import { set, startOfDay } from 'date-fns';
import type { BaseCell, ViewGenerator } from './types.js';

export interface TimeSlotDayOptions {
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
}

export function createTimeSlotDayGenerator(
  options: TimeSlotDayOptions = {},
): ViewGenerator {
  const { startHour = 0, endHour = 24, slotMinutes = 60 } = options;

  return (cursor) => {
    const dayStart = set(startOfDay(cursor), { hours: startHour });
    const minutesEnd = endHour * 60;
    const slots: BaseCell[] = [];
    let current = dayStart;

    while (current.getHours() * 60 + current.getMinutes() < minutesEnd) {
      slots.push({ date: new Date(current) });
      current = new Date(current.getTime() + slotMinutes * 60 * 1000);
    }

    return [slots];
  };
}
