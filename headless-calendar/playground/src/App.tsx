import { useMemo } from 'react';
import {
  useCalendarStore,
  useViewBuilder,
  createViewBuilder,
  createTimeSlotDayGenerator,
  withToday,
  withOutsideFlag,
  withSelection,
  withWeekend,
  withEvents,
} from '@calendar/react';
import { format } from 'date-fns';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const DEMO_EVENTS = [
  { title: '팀 회의',     start: new Date(2026, 3, 11, 10, 0), color: '#4f46e5' },
  { title: '런치',         start: new Date(2026, 3, 11, 12, 0), color: '#16a34a' },
  { title: '디자인 리뷰',  start: new Date(2026, 3, 11, 14, 0), color: '#ea580c' },
  { title: '1:1',          start: new Date(2026, 3, 11, 16, 0), color: '#0891b2' },
  { title: '배포',         start: new Date(2026, 3, 22, 16, 0), color: '#dc2626' },
  { title: '회고',         start: new Date(2026, 3, 30, 17, 0), color: '#0891b2' },
];

export function App() {
  const {
    state,
    store,
    next,
    prev,
    today,
    select,
  } = useCalendarStore({
    defaultDate: new Date(2026, 3, 11),
    defaultView: 'month',
    defaultEvents: DEMO_EVENTS,
  });

  // Month용 빌더: fixedWeeks 옵션으로 6줄 고정 (generator 레벨에서 패딩)
  const monthBuilder = useMemo(
    () =>
      createViewBuilder({ weekStartsOn: 0, fixedWeeks: 6 })
        .pipe(withToday())
        .pipe(withOutsideFlag())
        .pipe(withWeekend())
        .pipe(withSelection(store))
        .pipe(withEvents(store)),
    [store],
  );

  // Day용 빌더: 옵트인 타임슬롯 제너레이터 등록
  const dayBuilder = useMemo(
    () =>
      createViewBuilder().register(
        'day',
        createTimeSlotDayGenerator({
          startHour: 9,
          endHour: 18,
          slotMinutes: 60,
        }),
      ),
    [],
  );

  const monthGrid = useViewBuilder(monthBuilder, state);

  const dayAnchor = state.selected[0] ?? state.cursor;
  const daySlots = useMemo(
    () => dayBuilder.build(dayAnchor, 'day')[0],
    [dayBuilder, dayAnchor],
  );

  // 타임슬롯별 이벤트 매칭 (슬롯 시작 ~ 다음 슬롯)
  const slotEvents = useMemo(() => {
    const slotMs = 60 * 60 * 1000;
    return daySlots.map((slot) => {
      const slotStart = slot.date.getTime();
      const slotEnd = slotStart + slotMs;
      return state.events.filter((ev) => {
        const t = ev.start.getTime();
        return t >= slotStart && t < slotEnd;
      });
    });
  }, [daySlots, state.events]);

  const monthLabel = format(state.cursor, 'yyyy년 M월');
  const dayLabel = format(dayAnchor, 'M월 d일 (EEEE)');

  return (
    <div className="app">
      <header className="header">
        <h1>Headless Calendar Playground</h1>
        <p className="subtitle">@calendar/core + @calendar/react · pipe-based grid</p>
      </header>

      <section className="calendar" data-testid="calendar">
        <div className="toolbar">
          <button onClick={prev} aria-label="이전 달">‹</button>
          <button onClick={today}>오늘</button>
          <button onClick={next} aria-label="다음 달">›</button>
          <h2 className="month-label" data-testid="month-label">{monthLabel}</h2>
        </div>

        <div className="weekdays">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`weekday ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid">
          {monthGrid.map((row, rowIndex) => (
            <div className="row" key={rowIndex}>
              {row.map((cell) => {
                const cls = [
                  'cell',
                  cell.today && 'today',
                  cell.outside && 'outside',
                  cell.weekend && 'weekend',
                  cell.selected && 'selected',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <button
                    type="button"
                    key={cell.date.toISOString()}
                    className={cls}
                    onClick={() => select(cell.date)}
                  >
                    <span className="date">{cell.date.getDate()}</span>
                    <ul className="events">
                      {cell.events.map((ev) => (
                        <li
                          key={ev.id}
                          style={{ backgroundColor: ev.color ?? '#64748b' }}
                          title={ev.title}
                        >
                          {ev.title}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="schedule" data-testid="day-schedule">
        <div className="schedule-head">
          <h3 className="schedule-title">
            Day schedule <span className="schedule-date">· {dayLabel}</span>
          </h3>
          <code className="schedule-hint">
            createTimeSlotDayGenerator({'{'} startHour: 9, endHour: 18, slotMinutes: 60 {'}'})
          </code>
        </div>

        <ol className="slots">
          {daySlots.map((slot, i) => (
            <li key={slot.date.toISOString()} className="slot">
              <span className="slot-time">{format(slot.date, 'HH:mm')}</span>
              <div className="slot-events">
                {slotEvents[i].length === 0 ? (
                  <span className="slot-empty">—</span>
                ) : (
                  slotEvents[i].map((ev) => (
                    <span
                      key={ev.id}
                      className="slot-event"
                      style={{ backgroundColor: ev.color ?? '#64748b' }}
                    >
                      {ev.title}
                    </span>
                  ))
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="footer">
        <code>cursor: {format(state.cursor, 'yyyy-MM-dd')}</code>
        {' · '}
        <code>view: {state.view}</code>
        {' · '}
        <code>events: {state.events.length}</code>
      </footer>
    </div>
  );
}
