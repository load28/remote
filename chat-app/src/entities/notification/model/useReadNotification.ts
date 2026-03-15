// S-04: TanStack Query useMutation 사용, S-17: onSuccess 내장 금지
// N-05: use + 동사

import { useMutation } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';

// S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useReadNotification() {
  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
  });
}
