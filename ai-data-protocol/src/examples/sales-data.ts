/**
 * 예제: 판매 데이터를 AIDP 프로토콜로 표현
 *
 * 이 예제는 동일한 데이터가 어떻게:
 * 1. AI가 이해할 수 있는 형태로 구조화되고
 * 2. 다양한 시각화로 변환될 수 있는지 보여줍니다
 */

import { AIDPDocument, EntitySchema, FieldSchema } from '../core/protocol';

// ============================================
// 1. 데이터 타입 정의
// ============================================

interface SalesRecord {
  id: string;
  date: string;
  product: string;
  category: string;
  region: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  salesPerson: string;
  customerId: string;
}

// ============================================
// 2. 필드 스키마 정의 (AI가 이해할 수 있는 형태)
// ============================================

const salesFields: FieldSchema[] = [
  {
    name: 'id',
    type: { kind: 'identifier' },
    label: '판매 ID',
    description: '각 판매 거래의 고유 식별자',
    capabilities: ['filterable'],
    required: true,
  },
  {
    name: 'date',
    type: { kind: 'date' },
    label: '판매일',
    description: '거래가 발생한 날짜',
    capabilities: ['sortable', 'filterable', 'groupable', 'rangeable'],
    required: true,
  },
  {
    name: 'product',
    type: { kind: 'name', of: 'product' },
    label: '상품명',
    description: '판매된 상품의 이름',
    capabilities: ['filterable', 'groupable', 'searchable'],
    required: true,
  },
  {
    name: 'category',
    type: {
      kind: 'category',
      values: ['전자기기', '의류', '식품', '가구', '도서'],
    },
    label: '카테고리',
    description: '상품 분류',
    capabilities: ['filterable', 'groupable'],
    required: true,
  },
  {
    name: 'region',
    type: { kind: 'geo', format: 'country' },
    label: '판매 지역',
    description: '판매가 이루어진 지역',
    capabilities: ['filterable', 'groupable'],
    required: true,
  },
  {
    name: 'quantity',
    type: { kind: 'quantity', unit: '개' },
    label: '수량',
    description: '판매된 상품 수량',
    capabilities: ['sortable', 'filterable', 'aggregatable', 'comparable'],
    required: true,
  },
  {
    name: 'unitPrice',
    type: { kind: 'currency', code: 'KRW' },
    label: '단가',
    description: '상품 1개당 가격',
    capabilities: ['sortable', 'filterable', 'aggregatable', 'comparable'],
    required: true,
  },
  {
    name: 'totalAmount',
    type: { kind: 'currency', code: 'KRW' },
    label: '총 금액',
    description: '이 거래의 총 판매 금액 (수량 × 단가)',
    capabilities: ['sortable', 'filterable', 'aggregatable', 'comparable', 'rangeable'],
    required: true,
  },
  {
    name: 'salesPerson',
    type: { kind: 'name', of: 'person' },
    label: '담당자',
    description: '판매를 담당한 직원',
    capabilities: ['filterable', 'groupable', 'searchable'],
    required: true,
  },
  {
    name: 'customerId',
    type: { kind: 'reference', to: 'Customer' },
    label: '고객',
    description: '구매 고객 참조',
    capabilities: ['filterable'],
    required: true,
  },
];

// ============================================
// 3. 엔티티 스키마 (전체 구조)
// ============================================

const salesSchema: EntitySchema = {
  name: 'Sales',
  displayName: '판매 데이터',
  description:
    '회사의 상품 판매 기록. 각 레코드는 하나의 판매 거래를 나타내며, 상품, 수량, 금액, 지역, 담당자 정보를 포함합니다.',
  domain: 'e-commerce',

  fields: salesFields,
  primaryKey: 'id',
  displayField: 'product',

  relations: [
    {
      name: 'customer',
      target: 'Customer',
      type: 'one-to-many',
      foreignKey: 'customerId',
      description: '이 판매의 구매 고객',
    },
  ],

  // AI가 적절한 시각화를 선택하는 데 도움이 되는 어포던스
  affordances: [
    {
      type: 'line-chart',
      fitness: 0.95,
      suggestedMapping: {
        x: ['date'],
        y: ['totalAmount', 'quantity'],
        color: ['category', 'region'],
      },
      rationale:
        '시간에 따른 판매 추이를 보여주기에 적합. date 필드가 있고 totalAmount가 집계 가능.',
    },
    {
      type: 'bar-chart',
      fitness: 0.9,
      suggestedMapping: {
        x: ['category', 'region', 'salesPerson'],
        y: ['totalAmount', 'quantity'],
        color: ['category'],
      },
      rationale: '카테고리/지역/담당자별 비교에 적합.',
    },
    {
      type: 'pie-chart',
      fitness: 0.75,
      suggestedMapping: {
        segment: ['category', 'region'],
        value: ['totalAmount'],
      },
      rationale: '전체 대비 비율 표시에 적합. 카테고리가 5개 이하로 적절.',
    },
    {
      type: 'table',
      fitness: 0.85,
      suggestedMapping: {
        columns: ['date', 'product', 'category', 'quantity', 'totalAmount', 'salesPerson'],
      },
      rationale: '상세 데이터 조회 및 검색에 적합.',
    },
    {
      type: 'metric-card',
      fitness: 0.8,
      suggestedMapping: {
        value: ['totalAmount', 'quantity'],
        label: [],
      },
      rationale: '총 매출, 총 판매량 등 핵심 지표 표시에 적합.',
    },
    {
      type: 'map',
      fitness: 0.7,
      suggestedMapping: {
        location: ['region'],
        value: ['totalAmount'],
        color: ['totalAmount'],
      },
      rationale: 'region 필드가 지리 정보를 담고 있어 지도 시각화 가능.',
    },
  ],

  // 상호작용 정의
  interactions: {
    filters: [
      { field: 'date', operators: ['between', 'gte', 'lte'] },
      { field: 'category', operators: ['eq', 'in'] },
      { field: 'region', operators: ['eq', 'in'] },
      { field: 'totalAmount', operators: ['gte', 'lte', 'between'] },
      { field: 'salesPerson', operators: ['eq'] },
    ],
    sorts: [
      { field: 'date', directions: ['asc', 'desc'], default: true },
      { field: 'totalAmount', directions: ['asc', 'desc'] },
      { field: 'quantity', directions: ['asc', 'desc'] },
    ],
    search: {
      fields: ['product', 'salesPerson'],
      mode: 'fuzzy',
    },
    pagination: {
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
    },
    actions: [
      {
        id: 'export',
        label: '내보내기',
        description: '선택한 데이터를 CSV/Excel로 내보내기',
        type: 'custom',
        scope: 'bulk',
      },
    ],
  },
};

// ============================================
// 4. 샘플 데이터
// ============================================

const sampleData: SalesRecord[] = [
  {
    id: 'S001',
    date: '2024-01-15',
    product: '무선 이어폰',
    category: '전자기기',
    region: '서울',
    quantity: 50,
    unitPrice: 89000,
    totalAmount: 4450000,
    salesPerson: '김영희',
    customerId: 'C001',
  },
  {
    id: 'S002',
    date: '2024-01-15',
    product: '캐시미어 코트',
    category: '의류',
    region: '부산',
    quantity: 12,
    unitPrice: 350000,
    totalAmount: 4200000,
    salesPerson: '이철수',
    customerId: 'C002',
  },
  {
    id: 'S003',
    date: '2024-01-16',
    product: '유기농 사과',
    category: '식품',
    region: '서울',
    quantity: 200,
    unitPrice: 3000,
    totalAmount: 600000,
    salesPerson: '박민수',
    customerId: 'C003',
  },
  {
    id: 'S004',
    date: '2024-01-16',
    product: '원목 책상',
    category: '가구',
    region: '대전',
    quantity: 5,
    unitPrice: 450000,
    totalAmount: 2250000,
    salesPerson: '김영희',
    customerId: 'C004',
  },
  {
    id: 'S005',
    date: '2024-01-17',
    product: 'TypeScript 완벽 가이드',
    category: '도서',
    region: '서울',
    quantity: 30,
    unitPrice: 42000,
    totalAmount: 1260000,
    salesPerson: '최지은',
    customerId: 'C005',
  },
];

// ============================================
// 5. 최종 AIDP 문서
// ============================================

export const salesAIDPDocument: AIDPDocument<SalesRecord> = {
  version: '1.0',
  meta: {
    id: 'sales-2024-01',
    created: '2024-01-20T09:00:00Z',
    source: 'company-erp',
    locale: 'ko-KR',
  },
  schema: salesSchema,
  data: sampleData,
  aggregations: {
    totalRevenue: {
      type: 'sum',
      field: 'totalAmount',
      value: 12760000,
    },
    totalQuantity: {
      type: 'sum',
      field: 'quantity',
      value: 297,
    },
    averageOrderValue: {
      type: 'avg',
      field: 'totalAmount',
      value: 2552000,
    },
    transactionCount: {
      type: 'count',
      value: 5,
    },
  },
};

// ============================================
// 6. 사용 예시: AI가 의도를 해석하고 시각화 스펙 생성
// ============================================

/**
 * 예시: 사용자가 "월별 매출 추이를 보여줘"라고 요청
 *
 * AI는 AIDP 문서를 분석하여:
 * 1. date 필드가 있음을 확인 (시간 축으로 사용 가능)
 * 2. totalAmount가 currency 타입이고 aggregatable임을 확인
 * 3. affordances에서 line-chart가 fitness 0.95로 가장 적합함을 확인
 * 4. 아래와 같은 시각화 스펙을 생성
 */

export const exampleVisualizationSpec = {
  type: 'line-chart' as const,
  bindings: {
    x: { field: 'date', format: 'YYYY-MM' },
    y: { field: 'totalAmount', aggregate: 'sum' as const, format: '₩#,###' },
  },
  layout: {
    aspectRatio: 16 / 9,
    density: 'normal' as const,
    orientation: 'horizontal' as const,
  },
  style: {
    colorScheme: 'sequential' as const,
  },
  interactions: {
    hover: true,
    click: 'drill-down' as const,
    zoom: true,
    pan: true,
  },
  rationale:
    '사용자가 "추이"를 요청했으므로 시간 기반 시각화인 line-chart를 선택. date를 x축으로, totalAmount의 합계를 y축으로 매핑.',
};
