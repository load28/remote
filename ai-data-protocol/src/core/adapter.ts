/**
 * AIDP Adapter Interface
 *
 * 프레임워크에 종속되지 않는 어댑터 인터페이스
 * AIDP 프로토콜 → 각 프레임워크/라이브러리로 변환
 */

import { AIDPDocument, VisualizationSpec, VisualizationType } from './protocol';

// ============================================
// 1. 중간 표현 (Intermediate Representation)
// ============================================

/**
 * UI 독립적인 렌더 트리
 * 이것이 각 프레임워크로 변환되는 중간 형태
 */
export interface RenderNode {
  /** 노드 타입 */
  type: RenderNodeType;

  /** 속성들 */
  props: Record<string, unknown>;

  /** 자식 노드들 */
  children?: RenderNode[];

  /** 이벤트 핸들러 (추상적) */
  events?: {
    [eventName: string]: EventHandler;
  };

  /** 스타일 (추상적, CSS가 아님) */
  style?: AbstractStyle;

  /** 데이터 바인딩 */
  bindings?: DataBinding[];
}

export type RenderNodeType =
  // 레이아웃
  | 'container'
  | 'row'
  | 'column'
  | 'grid'
  | 'stack'

  // 데이터 표시
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'image'

  // 입력
  | 'input'
  | 'select'
  | 'checkbox'
  | 'button'

  // 차트 (추상적)
  | 'chart'

  // 테이블
  | 'table'
  | 'table-header'
  | 'table-row'
  | 'table-cell'

  // 리스트
  | 'list'
  | 'list-item'

  // 카드
  | 'card'
  | 'card-header'
  | 'card-body'
  | 'card-footer';

export interface EventHandler {
  action: 'filter' | 'sort' | 'navigate' | 'select' | 'custom';
  payload?: Record<string, unknown>;
}

export interface AbstractStyle {
  // 크기
  width?: SizeValue;
  height?: SizeValue;
  minWidth?: SizeValue;
  maxWidth?: SizeValue;

  // 여백
  padding?: SpacingValue;
  margin?: SpacingValue;
  gap?: SpacingValue;

  // 정렬
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';

  // 색상 (시맨틱)
  background?: ColorValue;
  foreground?: ColorValue;
  border?: ColorValue;

  // 텍스트
  fontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'bold';

  // 기타
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  opacity?: number;
}

type SizeValue = number | 'auto' | 'full' | `${number}%`;
type SpacingValue = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ColorValue =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'background'
  | 'surface'
  | 'text'
  | 'muted';

export interface DataBinding {
  /** 바인딩할 속성 */
  prop: string;
  /** 데이터 경로 */
  path: string;
  /** 포맷터 */
  format?: string;
  /** 변환 함수 */
  transform?: (value: unknown) => unknown;
}

// ============================================
// 2. 어댑터 인터페이스
// ============================================

/**
 * 프레임워크별 어댑터가 구현해야 하는 인터페이스
 */
export interface AIDPAdapter<TOutput = unknown> {
  /** 어댑터 이름 */
  name: string;

  /** 지원하는 렌더 노드 타입들 */
  supportedNodeTypes: RenderNodeType[];

  /** 지원하는 차트 타입들 */
  supportedChartTypes: VisualizationType[];

  /**
   * RenderNode를 해당 프레임워크의 출력으로 변환
   */
  render(node: RenderNode, context: RenderContext): TOutput;

  /**
   * 차트 렌더링 (차트 라이브러리 연동)
   */
  renderChart(spec: VisualizationSpec, data: unknown[], context: RenderContext): TOutput;

  /**
   * 스타일 변환
   */
  transformStyle(style: AbstractStyle): unknown;

  /**
   * 이벤트 핸들러 변환
   */
  transformEvents(events: Record<string, EventHandler>): unknown;
}

export interface RenderContext {
  /** 테마 */
  theme: ThemeConfig;

  /** 로케일 */
  locale: string;

  /** 포맷터 */
  formatters: {
    currency: (value: number, code: string) => string;
    date: (value: string | Date, format: string) => string;
    number: (value: number, options?: Intl.NumberFormatOptions) => string;
  };

  /** 데이터 컨텍스트 */
  data?: Record<string, unknown>;

  /** 상태 관리 */
  state?: StateManager;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}

export interface StateManager {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  subscribe(key: string, callback: (value: unknown) => void): () => void;
}

// ============================================
// 3. 변환기 (Transformer)
// ============================================

/**
 * AIDP 문서 → RenderNode 변환기
 * 어댑터와 독립적으로 동작
 */
export interface AIDPTransformer {
  /**
   * AIDP 문서를 렌더 트리로 변환
   */
  transform(
    document: AIDPDocument,
    visualization: VisualizationSpec
  ): RenderNode;

  /**
   * 테이블 뷰 생성
   */
  toTable(document: AIDPDocument, options?: TableOptions): RenderNode;

  /**
   * 카드 그리드 생성
   */
  toCardGrid(document: AIDPDocument, options?: CardGridOptions): RenderNode;

  /**
   * 메트릭 카드 생성
   */
  toMetricCard(document: AIDPDocument, metric: string): RenderNode;

  /**
   * 차트 노드 생성
   */
  toChart(document: AIDPDocument, spec: VisualizationSpec): RenderNode;
}

export interface TableOptions {
  columns?: string[];
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export interface CardGridOptions {
  columns?: number;
  titleField?: string;
  descriptionField?: string;
  imageField?: string;
}

// ============================================
// 4. 기본 변환기 구현
// ============================================

export class DefaultAIDPTransformer implements AIDPTransformer {
  transform(
    document: AIDPDocument,
    visualization: VisualizationSpec
  ): RenderNode {
    switch (visualization.type) {
      case 'table':
        return this.toTable(document);
      case 'card-grid':
        return this.toCardGrid(document);
      case 'metric-card':
        return this.toMetricCard(document, Object.keys(document.aggregations || {})[0] || '');
      default:
        return this.toChart(document, visualization);
    }
  }

  toTable(document: AIDPDocument, options?: TableOptions): RenderNode {
    const { schema, data } = document;
    const columns = options?.columns || schema.fields.map((f) => f.name);
    const fields = schema.fields.filter((f) => columns.includes(f.name));

    return {
      type: 'table',
      props: {
        sortable: options?.sortable ?? true,
        filterable: options?.filterable ?? true,
      },
      style: { width: 'full' },
      children: [
        // 헤더
        {
          type: 'table-header',
          props: {},
          children: fields.map((field) => ({
            type: 'table-cell',
            props: { isHeader: true },
            children: [
              {
                type: 'text',
                props: { value: field.label },
                style: { fontWeight: 'bold' },
              },
            ],
          })),
        },
        // 데이터 행들
        ...(data as Record<string, unknown>[]).map((row, index) => ({
          type: 'table-row' as const,
          props: { index },
          children: fields.map((field) => ({
            type: 'table-cell' as const,
            props: {},
            children: [this.createValueNode(row[field.name], field)],
          })),
        })),
      ],
    };
  }

  toCardGrid(document: AIDPDocument, options?: CardGridOptions): RenderNode {
    const { schema, data } = document;
    const titleField = options?.titleField || schema.displayField;

    return {
      type: 'grid',
      props: { columns: options?.columns || 3 },
      style: { gap: 'md' },
      children: (data as Record<string, unknown>[]).map((item) => ({
        type: 'card',
        props: {},
        style: { padding: 'md', rounded: 'md', shadow: 'sm' },
        children: [
          {
            type: 'card-header',
            props: {},
            children: [
              {
                type: 'text',
                props: { value: item[titleField] },
                style: { fontSize: 'lg', fontWeight: 'bold' },
              },
            ],
          },
          {
            type: 'card-body',
            props: {},
            children: schema.fields
              .filter((f) => f.name !== titleField)
              .slice(0, 4)
              .map((field) => ({
                type: 'row' as const,
                props: {},
                style: { justify: 'between', padding: 'xs' },
                children: [
                  {
                    type: 'text' as const,
                    props: { value: field.label },
                    style: { foreground: 'muted' },
                  },
                  this.createValueNode(item[field.name], field),
                ],
              })),
          },
        ],
      })),
    };
  }

  toMetricCard(document: AIDPDocument, metric: string): RenderNode {
    const aggregation = document.aggregations?.[metric];
    if (!aggregation) {
      return {
        type: 'card',
        props: {},
        children: [{ type: 'text', props: { value: 'No data' } }],
      };
    }

    return {
      type: 'card',
      props: {},
      style: { padding: 'lg', rounded: 'lg', shadow: 'md', align: 'center' },
      children: [
        {
          type: 'text',
          props: { value: metric },
          style: { fontSize: 'sm', foreground: 'muted' },
        },
        {
          type: aggregation.type === 'sum' || aggregation.type === 'avg' ? 'currency' : 'number',
          props: {
            value: aggregation.value,
            currencyCode: 'KRW',
          },
          style: { fontSize: '2xl', fontWeight: 'bold' },
        },
      ],
    };
  }

  toChart(document: AIDPDocument, spec: VisualizationSpec): RenderNode {
    return {
      type: 'chart',
      props: {
        chartType: spec.type,
        bindings: spec.bindings,
        layout: spec.layout,
        style: spec.style,
        interactions: spec.interactions,
      },
      bindings: [
        {
          prop: 'data',
          path: 'data',
        },
      ],
    };
  }

  private createValueNode(
    value: unknown,
    field: { type: { kind: string; code?: string } }
  ): RenderNode {
    switch (field.type.kind) {
      case 'currency':
        return {
          type: 'currency',
          props: { value, code: field.type.code || 'KRW' },
        };
      case 'date':
      case 'timestamp':
        return {
          type: 'date',
          props: { value, format: 'YYYY-MM-DD' },
        };
      case 'quantity':
      case 'percentage':
      case 'score':
        return {
          type: 'number',
          props: { value },
        };
      default:
        return {
          type: 'text',
          props: { value: String(value) },
        };
    }
  }
}
