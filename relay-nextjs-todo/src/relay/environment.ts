/**
 * =============================================================================
 * Relay Environment 설정
 * =============================================================================
 *
 * Relay Environment는 Relay가 GraphQL 서버와 통신하는 방법을 정의합니다.
 * 핵심 구성요소:
 *
 * 1. Network Layer (fetchRelay):
 *    - GraphQL 요청을 서버로 보내고 응답을 받는 역할
 *    - fetch API를 사용해 HTTP POST 요청
 *
 * 2. Store:
 *    - 정규화된(normalized) 캐시 저장소
 *    - 모든 GraphQL 데이터를 ID 기반으로 평탄화해서 저장
 *    - 같은 데이터를 참조하는 모든 컴포넌트가 자동으로 업데이트됨
 *
 * 3. RecordSource:
 *    - Store의 실제 데이터 저장소
 *    - { [dataID]: Record } 형태의 맵
 * =============================================================================
 */

import {
  Environment,
  Network,
  RecordSource,
  Store,
  FetchFunction,
} from 'relay-runtime';

const fetchRelay: FetchFunction = async (request, variables) => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: request.text,  // relay-compiler가 생성한 쿼리 텍스트
      variables,            // 쿼리에 전달할 변수들
    }),
  });

  return await response.json();
};

/**
 * Relay Environment 생성
 *
 * - Network.create(): 네트워크 레이어 생성
 * - Store: 정규화된 캐시 (gcReleaseBufferSize로 GC 버퍼 설정)
 *
 * 왜 싱글톤이 아닌가?
 * → SSR/RSC 환경에서는 요청마다 새 Environment가 필요
 * → 하지만 클라이언트에서는 하나만 사용 (아래 싱글톤 패턴)
 */
function createRelayEnvironment() {
  return new Environment({
    network: Network.create(fetchRelay),
    store: new Store(new RecordSource(), {
      gcReleaseBufferSize: 10, // GC 전에 유지할 쿼리 수
    }),
  });
}

// 클라이언트 사이드 싱글톤
let relayEnvironment: Environment | undefined;

export function getRelayEnvironment() {
  // 서버에서는 항상 새로 생성 (요청 간 데이터 공유 방지)
  if (typeof window === 'undefined') {
    return createRelayEnvironment();
  }

  // 클라이언트에서는 싱글톤 재사용
  if (!relayEnvironment) {
    relayEnvironment = createRelayEnvironment();
  }

  return relayEnvironment;
}
