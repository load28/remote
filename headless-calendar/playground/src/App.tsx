import { useEffect, useMemo, useRef } from 'react';
import {
  useCalendarStore,
  useViewBuilder,
  createViewBuilder,
  withFixedWeeks,
  withToday,
  withOutsideFlag,
  withSelection,
  withWeekend,
  withEvents,
} from '@calendar/react';
import { format } from 'date-fns';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

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
  });

  // 데모 이벤트 한 번만 등록 (StrictMode 더블 호출에도 안전)
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    store.addEvent({ title: '팀 회의', start: new Date(2026, 3, 11), color: '#4f46e5' });
    store.addEvent({ title: '런치', start: new Date(2026, 3, 11), color: '#16a34a' });
    store.addEvent({ title: '디자인 리뷰', start: new Date(2026, 3, 15), color: '#ea580c' });
    store.addEvent({ title: '배포', start: new Date(2026, 3, 22), color: '#dc2626' });
    store.addEvent({ title: '회고', start: new Date(2026, 3, 30), color: '#0891b2' });
  }, [store]);

  const builder = useMemo(
    () =>
      createViewBuilder({ weekStartsOn: 0 })
        .pipe(withFixedWeeks(6))
        .pipe(withToday())
        .pipe(withOutsideFlag())
        .pipe(withWeekend())
        .pipe(withSelection(store))
        .pipe(withEvents(store)),
    [store],
  );

  const grid = useViewBuilder(builder, state);
  const monthLabel = format(state.cursor, 'yyyy년 M월');

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
          {grid.map((row, rowIndex) => (
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
