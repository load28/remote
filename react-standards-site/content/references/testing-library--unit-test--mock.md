---
tags: [testing-library, unit-test, mock, spy, a11y]
rules: [T-01, T-08]
description: 사용자 관점 테스트 — Testing Library getByRole/getByText 패턴
---

```tsx
// {Feature}/components/ActionCard.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionCard } from './ActionCard';

describe('ActionCard', () => {
  const defaultProps: ActionCardProps = {
    title: 'Test Title',
    description: 'Test Description',
    isDisabled: false,
    onAction: vi.fn(),
    onDismiss: vi.fn(),
  };

  test('displays title and description', () => {
    render(<ActionCard {...defaultProps} />);
    // ✅ 사용자 관점 쿼리: 역할 + 텍스트 (T-08)
    expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('calls onAction when action button clicked', async () => {
    render(<ActionCard {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: '실행' }));
    expect(defaultProps.onAction).toHaveBeenCalledOnce();
  });

  test('disables action button when isDisabled', () => {
    render(<ActionCard {...defaultProps} isDisabled />);
    expect(screen.getByRole('button', { name: '실행' })).toBeDisabled();
  });

  test('calls onDismiss when dismiss button clicked', async () => {
    render(<ActionCard {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(defaultProps.onDismiss).toHaveBeenCalledOnce();
  });
});
```
