// S-04: TanStack Query 사용, S-17: mutation 훅 onSuccess 내장 금지
// N-05: use + 동사

import { useQuery, useMutation } from '@tanstack/react-query';
import { emojiApi } from '../api/emojiApi';
import type { CreateCustomEmojiInput } from '../model/types';

// P-03: 모듈 레벨 상수
export const CUSTOM_EMOJI_QUERY_KEY = ['customEmojis'] as const;

export function useCustomEmojis() {
  return useQuery({
    queryKey: CUSTOM_EMOJI_QUERY_KEY,
    queryFn: ({ signal }) => emojiApi.getCustomEmojis(signal),
  });
}

// S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useCreateCustomEmoji(userId: string) {
  return useMutation({
    mutationFn: (input: CreateCustomEmojiInput) =>
      emojiApi.createCustomEmoji({ ...input, createdBy: userId }),
  });
}

// S-17: mutationFn만 정의, onSuccess는 사용처에서
export function useDeleteCustomEmoji() {
  return useMutation({
    mutationFn: (id: string) => emojiApi.deleteCustomEmoji(id),
  });
}
