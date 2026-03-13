// 레퍼런스: crud/hook--tanstack-query--abort.md
// S-04: TanStack Query 사용, N-05: use + 동사

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emojiApi } from '../api/emojiApi';
import type { CreateCustomEmojiInput } from '../types';

// ✅ P-03: 모듈 레벨 상수
const CUSTOM_EMOJI_QUERY_KEY = ['customEmojis'] as const;

export function useCustomEmojis() {
  return useQuery({
    queryKey: CUSTOM_EMOJI_QUERY_KEY,
    queryFn: ({ signal }) => emojiApi.getCustomEmojis(signal),
  });
}

export function useCreateCustomEmoji(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomEmojiInput) =>
      emojiApi.createCustomEmoji({ ...input, createdBy: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_EMOJI_QUERY_KEY });
    },
  });
}

export function useDeleteCustomEmoji() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => emojiApi.deleteCustomEmoji(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_EMOJI_QUERY_KEY });
    },
  });
}
