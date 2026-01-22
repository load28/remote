/**
 * AIDP - AI Data Protocol
 *
 * UI에 독립적이면서 AI가 이해하고 변환할 수 있는 데이터 프로토콜
 */

// Core Protocol
export {
  // 타입 시스템
  type SemanticType,
  type FieldSchema,
  type FieldCapability,

  // 시각화
  type VisualizationAffordance,
  type VisualizationType,
  type VisualizationSpec,
  type VisualizationIntent,

  // 상호작용
  type InteractionSchema,
  type FilterDefinition,
  type SortDefinition,
  type SearchDefinition,
  type PaginationDefinition,
  type ActionDefinition,

  // 엔티티
  type EntitySchema,
  type RelationSchema,

  // 문서
  type AIDPDocument,
} from './core/protocol';

// Adapter System
export {
  // 렌더 노드
  type RenderNode,
  type RenderNodeType,
  type AbstractStyle,
  type DataBinding,
  type EventHandler,

  // 어댑터 인터페이스
  type AIDPAdapter,
  type RenderContext,
  type ThemeConfig,
  type StateManager,

  // 변환기
  type AIDPTransformer,
  type TableOptions,
  type CardGridOptions,
  DefaultAIDPTransformer,
} from './core/adapter';

// Adapters
export { ReactAdapter, createReactContext } from './adapters/react-adapter';
export { VanillaAdapter, createVanillaContext } from './adapters/vanilla-adapter';

// Examples
export { salesAIDPDocument, exampleVisualizationSpec } from './examples/sales-data';
export { runExample, AIDP_BENEFITS } from './examples/usage';
