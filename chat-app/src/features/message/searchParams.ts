// S-18: URL 상태는 nuqs로 관리
// 레퍼런스: nuqs--url-state--hook.md

import { parseAsString, type inferParserType } from 'nuqs';

// ✅ 라우트별 단일 정의 — useQueryState + createSerializer에서 재사용
export const messageSearchParams = {
  q: parseAsString.withDefault(''),
};

export type MessageSearchParams = inferParserType<typeof messageSearchParams>;
