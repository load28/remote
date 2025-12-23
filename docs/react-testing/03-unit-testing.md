# 3. 단위 테스트

## 단위 테스트란?

개별 함수, 컴포넌트, 훅을 **격리된 환경**에서 테스트합니다. 외부 의존성(API, 라우터 등)은 모킹합니다.

## 컴포넌트 테스트

### 기본 컴포넌트 테스트

```tsx
// src/shared/ui/Button/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

```tsx
// src/shared/ui/Button/Button.test.tsx
import { render, screen } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('텍스트를 렌더링한다', () => {
    render(<Button>클릭</Button>);

    expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument();
  });

  it('클릭 시 onClick을 호출한다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>클릭</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서는 클릭이 불가능하다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick} disabled>클릭</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('variant에 따라 스타일이 변경된다', () => {
    render(<Button variant="secondary">보조</Button>);

    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});
```

### 조건부 렌더링 테스트

```tsx
// src/entities/Card/ui/CardItem.tsx
interface CardItemProps {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

export function CardItem({ title, description, priority }: CardItemProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {priority && (
        <span className={`priority priority-${priority}`}>
          {priority}
        </span>
      )}
    </div>
  );
}
```

```tsx
// src/entities/Card/ui/CardItem.test.tsx
import { render, screen } from '@/shared/test-utils';
import { CardItem } from './CardItem';

describe('CardItem', () => {
  it('제목을 렌더링한다', () => {
    render(<CardItem title="테스트 카드" />);

    expect(screen.getByRole('heading', { name: '테스트 카드' })).toBeInTheDocument();
  });

  it('설명이 있으면 표시한다', () => {
    render(<CardItem title="카드" description="설명 내용" />);

    expect(screen.getByText('설명 내용')).toBeInTheDocument();
  });

  it('설명이 없으면 표시하지 않는다', () => {
    render(<CardItem title="카드" />);

    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('우선순위가 있으면 뱃지를 표시한다', () => {
    render(<CardItem title="카드" priority="high" />);

    expect(screen.getByText('high')).toHaveClass('priority-high');
  });
});
```

## 폼 컴포넌트 테스트

```tsx
// src/features/create-card/ui/CreateCardForm.tsx
interface CreateCardFormProps {
  onSubmit: (data: { title: string; description: string }) => void;
  onCancel: () => void;
}

export function CreateCardForm({ onSubmit, onCancel }: CreateCardFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({ title: title.trim(), description: description.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="title">제목</label>
      <input
        id="title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label htmlFor="description">설명</label>
      <textarea
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button type="submit" disabled={!title.trim()}>
        생성
      </button>
      <button type="button" onClick={onCancel}>
        취소
      </button>
    </form>
  );
}
```

```tsx
// src/features/create-card/ui/CreateCardForm.test.tsx
import { render, screen } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { CreateCardForm } from './CreateCardForm';

describe('CreateCardForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('폼 필드를 렌더링한다', () => {
    render(<CreateCardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText('제목')).toBeInTheDocument();
    expect(screen.getByLabelText('설명')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '생성' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('제목이 비어있으면 제출 버튼이 비활성화된다', () => {
    render(<CreateCardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
  });

  it('제목 입력 시 제출 버튼이 활성화된다', async () => {
    const user = userEvent.setup();
    render(<CreateCardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText('제목'), '새 카드');

    expect(screen.getByRole('button', { name: '생성' })).toBeEnabled();
  });

  it('폼 제출 시 onSubmit을 호출한다', async () => {
    const user = userEvent.setup();
    render(<CreateCardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText('제목'), '새 카드');
    await user.type(screen.getByLabelText('설명'), '카드 설명');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: '새 카드',
      description: '카드 설명',
    });
  });

  it('취소 버튼 클릭 시 onCancel을 호출한다', async () => {
    const user = userEvent.setup();
    render(<CreateCardForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
```

## 커스텀 훅 테스트

```tsx
// src/shared/lib/hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

```tsx
// src/shared/lib/hooks/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('초기값을 반환한다', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    expect(result.current[0]).toBe('initial');
  });

  it('localStorage에 저장된 값이 있으면 사용한다', () => {
    window.localStorage.setItem('key', JSON.stringify('stored'));

    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    expect(result.current[0]).toBe('stored');
  });

  it('setValue로 값을 업데이트한다', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(window.localStorage.getItem('key')!)).toBe('updated');
  });

  it('함수형 업데이트를 지원한다', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });
});
```

## 유틸리티 함수 테스트

```tsx
// src/shared/lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
```

```tsx
// src/shared/lib/utils/cn.test.ts
import { cn } from './cn';

describe('cn', () => {
  it('문자열 클래스를 결합한다', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('조건부 클래스를 처리한다', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('falsy 값을 필터링한다', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
  });

  it('배열을 평탄화한다', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});
```

## 쿼리 우선순위

Testing Library는 접근성을 기반으로 쿼리 우선순위를 권장합니다:

| 우선순위 | 쿼리 | 사용 시점 |
|---------|------|----------|
| 1 | `getByRole` | 버튼, 링크, 폼 요소 등 |
| 2 | `getByLabelText` | 폼 필드 |
| 3 | `getByPlaceholderText` | placeholder가 있는 입력 필드 |
| 4 | `getByText` | 일반 텍스트 |
| 5 | `getByDisplayValue` | 현재 값이 있는 입력 필드 |
| 6 | `getByAltText` | 이미지 |
| 7 | `getByTitle` | title 속성 |
| 8 | `getByTestId` | 최후의 수단 |

### 올바른 쿼리 사용 예시

```tsx
// ❌ 잘못된 예시
screen.getByTestId('submit-button');
screen.getByClassName('btn-primary');  // 존재하지 않음

// ✅ 올바른 예시
screen.getByRole('button', { name: '제출' });
screen.getByRole('button', { name: /제출/i });  // 대소문자 무시
```

## 비동기 테스트

```tsx
// 비동기 상태 변화 테스트
import { render, screen, waitFor } from '@/shared/test-utils';
import userEvent from '@testing-library/user-event';
import { AsyncComponent } from './AsyncComponent';

it('로딩 후 데이터를 표시한다', async () => {
  render(<AsyncComponent />);

  // 로딩 상태 확인
  expect(screen.getByRole('progressbar')).toBeInTheDocument();

  // 데이터 로드 대기
  await waitFor(() => {
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  // 데이터 표시 확인
  expect(screen.getByText('로드된 데이터')).toBeInTheDocument();
});
```

## 스냅샷 테스트

UI 회귀를 감지하는 데 유용하지만, 남용하지 않습니다:

```tsx
// 스냅샷 테스트 (제한적으로 사용)
it('렌더링 결과가 스냅샷과 일치한다', () => {
  const { container } = render(<CardItem title="카드" priority="high" />);

  expect(container).toMatchSnapshot();
});
```

**주의:** 스냅샷 테스트는 의미 있는 테스트를 대체하지 않습니다. 구체적인 단언문을 우선 사용하세요.

## 다음 단계

- [통합 테스트](./04-integration-testing.md) - MSW를 활용한 API 통합 테스트
- [테스트 패턴](./05-testing-patterns.md) - FSD 아키텍처 기반 테스트 패턴
