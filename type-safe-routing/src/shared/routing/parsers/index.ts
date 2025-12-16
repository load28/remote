/**
 * 커스텀 파서 모음
 * nuqs의 기본 파서 외에 추가적인 타입을 지원합니다.
 */

import type { ParserBuilder } from "nuqs/server";

/**
 * 커스텀 파서: JSON 객체 파싱
 * URL에서 JSON 문자열을 파싱하여 타입 세이프한 객체로 변환
 */
export function parseAsJson<T>() {
  return {
    parse: (value: string) => {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    },
    serialize: (value: T) => JSON.stringify(value),
  } as ParserBuilder<T>;
}

/**
 * 커스텀 파서: ISO 날짜 문자열 파싱
 */
export const parseAsDate = {
  parse: (value: string) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },
  serialize: (value: Date) => value.toISOString().split("T")[0],
} as ParserBuilder<Date>;

/**
 * 커스텀 파서: 숫자 범위 파싱 (예: "100-500")
 */
export interface NumberRange {
  min: number;
  max: number;
}

export const parseAsNumberRange = {
  parse: (value: string): NumberRange | null => {
    const [min, max] = value.split("-").map(Number);
    if (isNaN(min) || isNaN(max)) return null;
    return { min, max };
  },
  serialize: (value: NumberRange) => `${value.min}-${value.max}`,
} as ParserBuilder<NumberRange>;
