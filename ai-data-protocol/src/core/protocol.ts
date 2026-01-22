/**
 * AIDP - AI Data Protocol
 *
 * UI에 독립적이면서 AI가 이해하고 변환할 수 있는 데이터 프로토콜
 *
 * 핵심 원칙:
 * 1. UI 프레임워크에 종속되지 않음
 * 2. AI가 시맨틱하게 이해할 수 있음
 * 3. 어떤 형태의 UI로든 변환 가능
 * 4. 런타임/빌드타임 모두 지원
 */

// ============================================
// 1. 데이터 타입 시스템 (Semantic Types)
// ============================================

/**
 * 시맨틱 타입 - AI가 데이터의 "의미"를 이해하기 위한 타입
 * 단순히 string/number가 아니라 "이게 뭘 의미하는지" 표현
 */
export type SemanticType =
  // 수치 계열
  | { kind: 'quantity'; unit?: string; precision?: number }      // 수량 (개수, 용량 등)
  | { kind: 'currency'; code: string }                            // 금액
  | { kind: 'percentage'; }                                       // 비율
  | { kind: 'score'; min: number; max: number }                   // 점수/평점

  // 시간 계열
  | { kind: 'timestamp'; }                                        // 특정 시점
  | { kind: 'duration'; unit: 'ms' | 's' | 'm' | 'h' | 'd' }     // 기간
  | { kind: 'date'; }                                             // 날짜
  | { kind: 'time'; }                                             // 시간

  // 식별 계열
  | { kind: 'identifier'; }                                       // 고유 ID
  | { kind: 'name'; of: string }                                  // 이름 (of: 'person' | 'product' | 'place' 등)
  | { kind: 'category'; values?: string[] }                       // 카테고리/열거형
  | { kind: 'tag'; }                                              // 태그 (복수 가능)

  // 위치 계열
  | { kind: 'geo'; format: 'latlng' | 'address' | 'country' }    // 지리 정보

  // 컨텐츠 계열
  | { kind: 'text'; format?: 'plain' | 'markdown' | 'html' }     // 텍스트
  | { kind: 'url'; type?: 'image' | 'video' | 'link' }           // URL
  | { kind: 'boolean'; trueLabel?: string; falseLabel?: string } // 참/거짓

  // 관계 계열
  | { kind: 'reference'; to: string }                             // 다른 엔티티 참조
  | { kind: 'array'; of: SemanticType };                          // 배열

// ============================================
// 2. 필드 정의 (Field Schema)
// ============================================

export interface FieldSchema {
  /** 필드 이름 */
  name: string;

  /** 시맨틱 타입 - AI가 의미를 이해하기 위함 */
  type: SemanticType;

  /** 사람이 읽을 수 있는 라벨 */
  label: string;

  /** AI를 위한 상세 설명 */
  description?: string;

  /** 이 필드로 가능한 연산들 */
  capabilities: FieldCapability[];

  /** 필수 여부 */
  required?: boolean;

  /** 기본값 */
  defaultValue?: unknown;
}

export type FieldCapability =
  | 'sortable'      // 정렬 가능
  | 'filterable'    // 필터 가능
  | 'groupable'     // 그룹핑 가능
  | 'aggregatable'  // 집계 가능 (sum, avg, count 등)
  | 'searchable'    // 검색 가능
  | 'comparable'    // 비교 가능 (>, <, = 등)
  | 'rangeable';    // 범위 지정 가능

// ============================================
// 3. 시각화 어포던스 (Visualization Affordances)
// ============================================

/**
 * 이 데이터로 가능한 시각화 힌트
 * AI가 적절한 시각화를 선택하는 데 도움
 */
export interface VisualizationAffordance {
  /** 시각화 종류 */
  type: VisualizationType;

  /** 이 시각화의 적합도 (0-1) */
  fitness: number;

  /** 권장 필드 매핑 */
  suggestedMapping: {
    [role: string]: string[];  // role: 'x' | 'y' | 'color' | 'size' | 'label' 등
  };

  /** 이 시각화가 적합한 이유 (AI 설명용) */
  rationale: string;
}

export type VisualizationType =
  // 비교
  | 'bar-chart'
  | 'column-chart'
  | 'radar-chart'

  // 추이/트렌드
  | 'line-chart'
  | 'area-chart'
  | 'sparkline'

  // 분포
  | 'pie-chart'
  | 'donut-chart'
  | 'treemap'
  | 'histogram'

  // 관계
  | 'scatter-plot'
  | 'bubble-chart'
  | 'network-graph'

  // 지리
  | 'map'
  | 'heatmap'

  // 표/목록
  | 'table'
  | 'list'
  | 'card-grid'

  // 단일 값
  | 'metric-card'
  | 'gauge'
  | 'progress-bar'

  // 계층
  | 'tree'
  | 'org-chart'

  // 시간
  | 'timeline'
  | 'calendar'
  | 'gantt';

// ============================================
// 4. 상호작용 정의 (Interactions)
// ============================================

export interface InteractionSchema {
  /** 필터 가능한 필드들 */
  filters?: FilterDefinition[];

  /** 정렬 옵션 */
  sorts?: SortDefinition[];

  /** 검색 설정 */
  search?: SearchDefinition;

  /** 페이지네이션 */
  pagination?: PaginationDefinition;

  /** 사용자 액션 */
  actions?: ActionDefinition[];
}

export interface FilterDefinition {
  field: string;
  operators: ('eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between')[];
  defaultValue?: unknown;
}

export interface SortDefinition {
  field: string;
  directions: ('asc' | 'desc')[];
  default?: boolean;
}

export interface SearchDefinition {
  fields: string[];
  mode: 'exact' | 'fuzzy' | 'fulltext';
}

export interface PaginationDefinition {
  defaultPageSize: number;
  pageSizeOptions: number[];
}

export interface ActionDefinition {
  id: string;
  label: string;
  description: string;
  type: 'create' | 'update' | 'delete' | 'custom';
  scope: 'single' | 'bulk' | 'global';
}

// ============================================
// 5. 엔티티 스키마 (Entity Schema)
// ============================================

export interface EntitySchema {
  /** 엔티티 이름 */
  name: string;

  /** 사람이 읽을 수 있는 이름 */
  displayName: string;

  /** AI를 위한 설명 */
  description: string;

  /** 도메인 컨텍스트 */
  domain: string;

  /** 필드 정의 */
  fields: FieldSchema[];

  /** 기본 식별자 필드 */
  primaryKey: string;

  /** 표시용 대표 필드 */
  displayField: string;

  /** 다른 엔티티와의 관계 */
  relations?: RelationSchema[];

  /** 가능한 시각화들 */
  affordances: VisualizationAffordance[];

  /** 상호작용 스키마 */
  interactions: InteractionSchema;
}

export interface RelationSchema {
  name: string;
  target: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
  description: string;
}

// ============================================
// 6. AIDP 문서 (최종 프로토콜 형태)
// ============================================

export interface AIDPDocument<T = unknown> {
  /** 프로토콜 버전 */
  version: '1.0';

  /** 문서 메타데이터 */
  meta: {
    /** 고유 식별자 */
    id: string;
    /** 생성 시간 */
    created: string;
    /** 데이터 출처 */
    source?: string;
    /** 언어 */
    locale: string;
  };

  /** 스키마 정의 */
  schema: EntitySchema;

  /** 실제 데이터 */
  data: T[];

  /** 집계/통계 (선택) */
  aggregations?: {
    [key: string]: {
      type: 'count' | 'sum' | 'avg' | 'min' | 'max';
      field?: string;
      value: number;
    };
  };
}

// ============================================
// 7. AI 명령 인터페이스
// ============================================

/**
 * 사용자가 AI에게 내리는 시각화 명령
 */
export interface VisualizationIntent {
  /** 자연어 명령 */
  naturalLanguage: string;

  /** 파싱된 의도 (AI가 채움) */
  parsed?: {
    action: 'show' | 'compare' | 'trend' | 'distribute' | 'relate' | 'locate';
    dimensions: string[];
    measures: string[];
    filters?: { field: string; operator: string; value: unknown }[];
    groupBy?: string[];
    orderBy?: { field: string; direction: 'asc' | 'desc' }[];
    limit?: number;
  };
}

/**
 * AI가 생성하는 시각화 스펙 (UI 독립적)
 */
export interface VisualizationSpec {
  /** 선택된 시각화 타입 */
  type: VisualizationType;

  /** 데이터 바인딩 */
  bindings: {
    [role: string]: {
      field: string;
      aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
      format?: string;
    };
  };

  /** 레이아웃 힌트 (구체적 px 값이 아닌 추상적 힌트) */
  layout: {
    aspectRatio?: number;
    density?: 'compact' | 'normal' | 'spacious';
    orientation?: 'horizontal' | 'vertical';
  };

  /** 스타일 힌트 */
  style: {
    colorScheme?: 'categorical' | 'sequential' | 'diverging';
    emphasis?: string[];  // 강조할 데이터 포인트
  };

  /** 상호작용 */
  interactions: {
    hover?: boolean;
    click?: 'select' | 'drill-down' | 'navigate';
    zoom?: boolean;
    pan?: boolean;
  };

  /** AI의 선택 이유 */
  rationale: string;
}
