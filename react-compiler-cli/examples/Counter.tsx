import { useState } from 'react';

/**
 * 간단한 Counter 컴포넌트.
 * React Compiler가 count 의존성을 추적하고
 * JSX와 이벤트 핸들러를 별도 reactive scope로 분리하는지 확인하기 위한 예제.
 */
export function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  const label = count > 0 ? 'positive' : count < 0 ? 'negative' : 'zero';

  return (
    <div>
      <h1>Count: {count}</h1>
      <p>Status: {label}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
