// A-06: httpClient 래퍼만 import

import { httpClient } from '@/shared/lib/httpClient';
import type { CustomEmoji, CreateCustomEmojiInput } from '../types';

export const emojiApi = {
  getCustomEmojis: (signal?: AbortSignal): Promise<CustomEmoji[]> =>
    httpClient.get('/api/emojis/custom', { signal }),

  createCustomEmoji: (input: CreateCustomEmojiInput & { createdBy: string }): Promise<CustomEmoji> =>
    httpClient.post('/api/emojis/custom', input),

  deleteCustomEmoji: (id: string): Promise<void> =>
    httpClient.delete(`/api/emojis/custom/${id}`),
};
