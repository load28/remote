/**
 * AIDP 사용 예제
 *
 * 동일한 데이터를 다양한 UI로 변환하는 전체 흐름
 */

import { AIDPDocument, VisualizationSpec, VisualizationIntent } from '../core/protocol';
import { DefaultAIDPTransformer, RenderNode } from '../core/adapter';
import { ReactAdapter, createReactContext } from '../adapters/react-adapter';
import { VanillaAdapter, createVanillaContext } from '../adapters/vanilla-adapter';
import { salesAIDPDocument } from './sales-data';

// ============================================
// 1. 전체 사용 흐름
// ============================================

/**
 * AIDP 사용 흐름:
 *
 * [사용자 요청] "월별 매출 추이를 보여줘"
 *       ↓
 * [AI 해석] VisualizationIntent 생성
 *       ↓
 * [변환기] AIDP Document → RenderNode (UI 독립적)
 *       ↓
 * [어댑터] RenderNode → 특정 프레임워크 출력
 *       ↓
 * [렌더링] React Element / DOM Element / Vue VNode / ...
 */

// ============================================
// 2. AI 의도 해석 시뮬레이션
// ============================================

function parseUserIntent(query: string, document: AIDPDocument): VisualizationIntent {
  // 실제로는 LLM이 처리
  // 여기서는 간단한 키워드 매칭으로 시뮬레이션

  const intent: VisualizationIntent = {
    naturalLanguage: query,
    parsed: {
      action: 'show',
      dimensions: [],
      measures: [],
    },
  };

  const queryLower = query.toLowerCase();

  // 액션 파싱
  if (queryLower.includes('추이') || queryLower.includes('변화') || queryLower.includes('trend')) {
    intent.parsed!.action = 'trend';
  } else if (queryLower.includes('비교') || queryLower.includes('compare')) {
    intent.parsed!.action = 'compare';
  } else if (queryLower.includes('분포') || queryLower.includes('비율')) {
    intent.parsed!.action = 'distribute';
  }

  // 필드 파싱 (스키마 기반)
  for (const field of document.schema.fields) {
    if (queryLower.includes(field.label.toLowerCase())) {
      if (field.capabilities.includes('aggregatable')) {
        intent.parsed!.measures.push(field.name);
      } else if (field.capabilities.includes('groupable')) {
        intent.parsed!.dimensions.push(field.name);
      }
    }
  }

  // 기본값 설정
  if (intent.parsed!.measures.length === 0) {
    const measureField = document.schema.fields.find((f) =>
      f.capabilities.includes('aggregatable')
    );
    if (measureField) intent.parsed!.measures.push(measureField.name);
  }

  if (intent.parsed!.dimensions.length === 0) {
    const dimField = document.schema.fields.find((f) =>
      f.capabilities.includes('groupable')
    );
    if (dimField) intent.parsed!.dimensions.push(dimField.name);
  }

  return intent;
}

// ============================================
// 3. 의도 → 시각화 스펙 변환
// ============================================

function intentToVisualizationSpec(
  intent: VisualizationIntent,
  document: AIDPDocument
): VisualizationSpec {
  const { action, dimensions, measures } = intent.parsed!;

  // 액션에 따른 차트 타입 선택
  let chartType: VisualizationSpec['type'] = 'table';

  switch (action) {
    case 'trend':
      chartType = 'line-chart';
      break;
    case 'compare':
      chartType = 'bar-chart';
      break;
    case 'distribute':
      chartType = 'pie-chart';
      break;
    default:
      // 어포던스에서 가장 적합한 것 선택
      const bestAffordance = document.schema.affordances
        .sort((a, b) => b.fitness - a.fitness)[0];
      chartType = bestAffordance?.type || 'table';
  }

  return {
    type: chartType,
    bindings: {
      x: { field: dimensions[0] || 'date' },
      y: { field: measures[0] || 'totalAmount', aggregate: 'sum' },
    },
    layout: {
      aspectRatio: 16 / 9,
      density: 'normal',
      orientation: 'horizontal',
    },
    style: {
      colorScheme: 'categorical',
    },
    interactions: {
      hover: true,
      click: 'select',
    },
    rationale: `사용자가 "${intent.naturalLanguage}"를 요청하여 ${chartType} 선택`,
  };
}

// ============================================
// 4. 메인 실행 예제
// ============================================

export function runExample() {
  console.log('=== AIDP 사용 예제 ===\n');

  // 1. AIDP 문서 (데이터 + 스키마)
  const document = salesAIDPDocument;
  console.log('1. AIDP 문서 로드:', document.schema.displayName);
  console.log('   - 필드 수:', document.schema.fields.length);
  console.log('   - 데이터 수:', document.data.length);
  console.log('   - 가능한 시각화:', document.schema.affordances.map((a) => a.type).join(', '));
  console.log();

  // 2. 사용자 요청 해석
  const queries = [
    '월별 매출 추이를 보여줘',
    '카테고리별 판매량 비교',
    '지역별 매출 분포',
    '전체 데이터를 테이블로',
  ];

  const transformer = new DefaultAIDPTransformer();
  const reactAdapter = new ReactAdapter();
  const vanillaAdapter = new VanillaAdapter();

  for (const query of queries) {
    console.log(`\n--- 쿼리: "${query}" ---`);

    // 3. AI 의도 파싱
    const intent = parseUserIntent(query, document);
    console.log('2. 파싱된 의도:', intent.parsed);

    // 4. 시각화 스펙 생성
    const vizSpec = intentToVisualizationSpec(intent, document);
    console.log('3. 시각화 스펙:', {
      type: vizSpec.type,
      bindings: vizSpec.bindings,
    });

    // 5. RenderNode 생성 (UI 독립적)
    const renderNode = transformer.transform(document, vizSpec);
    console.log('4. RenderNode 타입:', renderNode.type);

    // 6-a. React로 변환
    const reactContext = createReactContext({ data: document.data });
    const reactElement = reactAdapter.render(renderNode, reactContext);
    console.log('5a. React Element:', reactElement.type);

    // 6-b. Vanilla JS로 변환 (HTML 문자열)
    const vanillaContext = createVanillaContext({ data: document.data });
    const htmlString = vanillaAdapter.renderToString(renderNode, vanillaContext);
    console.log('5b. HTML (첫 100자):', htmlString.slice(0, 100) + '...');
  }

  console.log('\n=== 예제 완료 ===');
}

// ============================================
// 5. 핵심 포인트 정리
// ============================================

/**
 * AIDP의 핵심 가치:
 *
 * 1. UI 독립성
 *    - 데이터 스키마가 React/Vue/Angular에 종속되지 않음
 *    - 어댑터만 교체하면 어떤 프레임워크에서든 사용 가능
 *
 * 2. AI 친화적
 *    - 시맨틱 타입으로 필드의 "의미" 표현
 *    - 어포던스로 가능한 시각화 힌트 제공
 *    - AI가 사용자 의도를 해석하고 적절한 UI 생성
 *
 * 3. 런타임/빌드타임 모두 지원
 *    - 런타임: 사용자 요청에 따라 동적 UI 생성
 *    - 빌드타임: SSR, 정적 페이지 생성
 *
 * 4. 확장성
 *    - 새로운 시각화 타입 추가 용이
 *    - 새로운 프레임워크 어댑터 추가 용이
 *    - 커스텀 테마/스타일 적용 가능
 */

export const AIDP_BENEFITS = {
  uiIndependence: '프레임워크 종속 없음',
  aiOptimized: 'AI가 이해하고 변환 가능',
  flexibleRendering: '런타임/빌드타임 모두 지원',
  extensible: '새로운 시각화/어댑터 확장 용이',
};
