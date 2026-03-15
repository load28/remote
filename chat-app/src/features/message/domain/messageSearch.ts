// A-05: 레이어 분리 — React import 없는 순수 함수
// N-08: 의미있는 이름 사용

import type { Message } from '../types';

// ✅ 순수 함수: 메시지 내용에서 검색어 필터링
export function filterMessagesByQuery(messages: Message[], query: string): Message[] {
  if (query.trim() === '') return messages;
  const lowerQuery = query.toLowerCase();
  return messages.filter((message) => message.content.toLowerCase().includes(lowerQuery));
}
