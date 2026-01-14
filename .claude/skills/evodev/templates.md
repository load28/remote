# EvoDev 템플릿 모음

이 문서는 EvoDev 각 단계에서 사용할 수 있는 템플릿을 제공합니다.

## Phase 1 템플릿

### 비즈니스 분석 템플릿

```markdown
# 프로젝트 요구사항 문서

## 1. 프로젝트 개요
- **프로젝트명**:
- **목적**:
- **대상 사용자**:
- **프로젝트 범위**:

## 2. 핵심 요구사항

### REQ-001: [요구사항 제목]
- **우선순위**: 높음/중간/낮음
- **설명**:
- **사용자 스토리**: As a [역할], I want [기능] so that [가치]
- **수용 기준**:
  - [ ]
  - [ ]

### REQ-002: [요구사항 제목]
...

## 3. 비기능 요구사항

### 성능
-

### 보안
-

### 확장성
-

### 사용성
-

## 4. 제약 조건

### 기술적 제약
-

### 비즈니스 제약
-

## 5. 가정 사항
-

## 6. 용어 정의
| 용어 | 정의 |
|------|------|
|      |      |
```

### 아키텍처 설계 템플릿

```markdown
# 아키텍처 설계 문서

## 1. 기술 스택

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|----------|
| Frontend | | | |
| Backend | | | |
| Database | | | |
| 인프라 | | | |

## 2. 시스템 아키텍처

### 전체 구조도
```
[다이어그램]
```

### 컴포넌트 설명
| 컴포넌트 | 역할 |
|---------|------|
|         |      |

## 3. 데이터 모델

### 엔티티 정의

#### Entity: [엔티티명]
| 필드 | 타입 | 설명 | 제약조건 |
|------|------|------|---------|
|      |      |      |         |

### 엔티티 관계도
```
[ERD]
```

## 4. API 설계

### API 개요
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
|        |           |      |

### API 상세

#### [API명]
- **URL**:
- **Method**:
- **Request**:
- **Response**:

## 5. UI 구조

### 화면 목록
| 화면 | 경로 | 설명 |
|------|------|------|
|      |      |      |

### 화면 흐름도
```
[User Flow]
```

## 6. 디렉토리 구조
```
project/
├──
├──
└──
```
```

---

## Phase 2 템플릿

### 기능 정의 템플릿

```markdown
# Feature: [기능명]

## 기본 정보
- **ID**: F###
- **우선순위**: P0/P1/P2
- **예상 복잡도**: 낮음/중간/높음
- **의존성**: [선행 기능 ID 목록]

## 3계층 정보

### 비즈니스 계층
- **사용자 스토리**: As a [역할], I want [기능] so that [가치]
- **수용 기준**:
  - [ ]
  - [ ]

### 설계 계층
- **관련 UI 컴포넌트**:
- **관련 데이터 엔티티**:
- **관련 API**:

### 구현 계층
- **생성할 파일**:
- **수정할 파일**:
- **테스트 파일**:
```

### 기능 DAG 템플릿

```markdown
# 기능 의존성 그래프 (Feature DAG)

## 개발 순서

### Level 0 (의존성 없음)
- [ ] F001: [기능명]
- [ ] F002: [기능명]

### Level 1 (Level 0 의존)
- [ ] F003: [기능명] ← F001
- [ ] F004: [기능명] ← F001, F002

### Level 2 (Level 1 의존)
- [ ] F005: [기능명] ← F003

## 시각적 표현
```
F001 ──┬──> F003 ──> F005
       │
F002 ──┴──> F004
```

## 병렬 개발 가능 그룹
- 그룹 A: F001, F002 (동시 진행 가능)
- 그룹 B: F003, F004 (그룹 A 완료 후)
- 그룹 C: F005 (그룹 B 완료 후)
```

---

## Phase 3 템플릿

### 기능 구현 계획 템플릿

```markdown
# F###: [기능명] 구현 계획

## 변경 파일 목록

### 신규 생성
| 파일 경로 | 목적 |
|----------|------|
|          |      |

### 수정
| 파일 경로 | 변경 내용 |
|----------|----------|
|          |          |

## 구현 단계
1. [ ]
2. [ ]
3. [ ]

## 테스트 계획
- [ ] 단위 테스트:
- [ ] 통합 테스트:
- [ ] 수동 테스트:

## 완료 체크리스트
- [ ] 모든 수용 기준 충족
- [ ] 빌드 성공
- [ ] 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 기존 기능 영향 없음
```

### 디버깅 로그 템플릿

```markdown
# 디버깅 로그: F###

## 에러 1
- **발생 시점**:
- **에러 메시지**:
- **원인 분석**:
- **해결 방법**:
- **결과**: 성공/실패

## 에러 2
...
```

---

## TodoWrite 패턴

### 프로젝트 시작 시

```json
[
  {"content": "[Phase1] 비즈니스 분석", "status": "in_progress", "activeForm": "비즈니스 요구사항 분석 중"},
  {"content": "[Phase1] 아키텍처 설계", "status": "pending", "activeForm": "아키텍처 설계 중"},
  {"content": "[Phase2] 기능 추출", "status": "pending", "activeForm": "기능 추출 중"},
  {"content": "[Phase2] 기능 DAG 생성", "status": "pending", "activeForm": "기능 DAG 생성 중"},
  {"content": "[Phase3] 기능 구현 시작", "status": "pending", "activeForm": "기능 구현 중"}
]
```

### Phase 3 진입 시 (예시)

```json
[
  {"content": "[Phase1] 비즈니스 분석", "status": "completed", "activeForm": "비즈니스 요구사항 분석 중"},
  {"content": "[Phase1] 아키텍처 설계", "status": "completed", "activeForm": "아키텍처 설계 중"},
  {"content": "[Phase2] 기능 추출", "status": "completed", "activeForm": "기능 추출 중"},
  {"content": "[Phase2] 기능 DAG 생성", "status": "completed", "activeForm": "기능 DAG 생성 중"},
  {"content": "[F001] 데이터 모델 설정", "status": "completed", "activeForm": "데이터 모델 구현 중"},
  {"content": "[F002] 목록 조회 기능", "status": "in_progress", "activeForm": "목록 조회 기능 구현 중"},
  {"content": "[F003] 항목 추가 기능", "status": "pending", "activeForm": "항목 추가 기능 구현 중"},
  {"content": "[F004] 항목 수정 기능", "status": "pending", "activeForm": "항목 수정 기능 구현 중"}
]
```

---

## Figma 연동 템플릿

### 디자인 시스템 연동 설정 템플릿

```markdown
# 디자인 시스템 연동 설정

## 1. Figma MCP 연동 상태
- **연동 여부**: 예/아니오
- **MCP 버전**:
- **연결 테스트**: 성공/실패

## 2. Figma 프로젝트 정보
- **파일 URL**:
- **파일 Key**:
- **주요 페이지**:
  - 페이지명: [설명]

## 3. 마이그레이션 전략 (사용자 선택)

### 컴포넌트 변환 방식
- [ ] 직접 변환: Figma → 프로젝트 컴포넌트 1:1
- [ ] 참조 변환: Figma 참고 + UI 라이브러리 활용
- [ ] 하이브리드: 핵심은 직접, 나머지는 라이브러리

### 스타일 추출 방식
- [ ] 디자인 토큰: CSS Variables / JSON 토큰
- [ ] CSS 직접 생성: SCSS / CSS Modules
- [ ] Tailwind: 커스텀 설정으로 매핑

### 레이아웃 구현 방식
- [ ] Flexbox/Grid 변환
- [ ] 반응형 우선 설계
- [ ] 절대 위치 (필요시)

### 에셋 관리 방식
- [ ] SVG 인라인 컴포넌트
- [ ] 이미지 파일 다운로드
- [ ] 아이콘 라이브러리 대체

## 4. 디자인 토큰 정의

### 색상 팔레트
| 토큰명 | Figma 스타일 | 값 | 용도 |
|-------|-------------|-----|------|
| --color-primary | Primary/500 | #3B82F6 | 주요 액션 |
| --color-secondary | Secondary/500 | #6B7280 | 보조 요소 |

### 타이포그래피
| 토큰명 | Figma 스타일 | 설정 |
|-------|-------------|------|
| --font-heading | Heading/H1 | 32px/1.2/Bold |
| --font-body | Body/Regular | 16px/1.5/Normal |

### 간격 시스템
| 토큰명 | 값 | 용도 |
|-------|-----|------|
| --spacing-xs | 4px | 요소 내부 |
| --spacing-sm | 8px | 관련 요소 간 |
| --spacing-md | 16px | 섹션 간 |

## 5. 컴포넌트 변환 규칙

| Figma 컴포넌트 | 프로젝트 컴포넌트 | 변환 방식 | 비고 |
|---------------|-----------------|----------|------|
| Button/Primary | Button | 직접 변환 | variants 포함 |
| Input/Default | TextField | 라이브러리 | MUI 기반 |
| Card/Basic | Card | 직접 변환 | |
```

### Figma 노드 매핑 템플릿

```markdown
# Feature [F###]: Figma 노드 매핑

## 기본 정보
- **기능 ID**: F###
- **기능명**: [기능명]
- **UI 요구사항**: [화면 설명]

## Figma 노드 매핑

### 메인 화면
| UI 요소 | Figma 노드 ID | Figma 경로 | 타입 | 비고 |
|--------|--------------|-----------|------|------|
| 전체 레이아웃 | 123:456 | Screens/Home | Frame | |
| 헤더 | 123:457 | Screens/Home/Header | Frame | 고정 높이 |
| 메인 콘텐츠 | 123:458 | Screens/Home/Content | Frame | Auto Layout |
| 버튼 | 123:459 | Screens/Home/CTA | Instance | Button/Primary |

### 컴포넌트 상태
| 컴포넌트 | 상태 | Figma 노드 ID | 비고 |
|---------|------|--------------|------|
| Button | default | 123:460 | |
| Button | hover | 123:461 | |
| Button | active | 123:462 | |
| Button | disabled | 123:463 | |

## 재사용 컴포넌트 분석

### 기존 컴포넌트 활용
- [ ] Button (F001에서 생성됨)
- [ ] Card (F002에서 생성됨)

### 신규 생성 필요
- [ ] Modal - 이 기능에서 생성
- [ ] Tooltip - 이 기능에서 생성

## 사용자 확인 체크리스트
- [ ] 매핑된 Figma 노드가 정확함
- [ ] 누락된 화면/컴포넌트 없음
- [ ] 상태(hover, disabled 등) 확인 완료
- [ ] 재사용 컴포넌트 분석 완료
```

### UI 구현 확인 템플릿

```markdown
# [F###] UI 구현 방향 확인

## Figma 디자인 분석

### 대상 노드
- **노드 ID**: [node-id]
- **노드 경로**: [Page/Frame/Component]
- **컴포넌트명**: [구현할 컴포넌트]

### 레이아웃 분석
- **타입**: Frame / Auto Layout / Group
- **방향**: Horizontal / Vertical
- **정렬**: [주축 정렬] / [교차축 정렬]
- **간격**: [itemSpacing]
- **패딩**: [padding 값]

### 스타일 분석
- **배경**: [fills 정보]
- **테두리**: [strokes 정보]
- **그림자**: [effects 정보]
- **모서리**: [cornerRadius]

### 자식 요소
| 요소 | 타입 | 주요 스타일 |
|-----|------|-----------|
| [요소1] | Text | fontSize, color |
| [요소2] | Instance | 참조 컴포넌트 |

## 구현 계획

### Phase 1 전략에 따른 구현
- **컴포넌트 방식**: [직접/참조/하이브리드]
- **스타일 방식**: [토큰/CSS/Tailwind]
- **레이아웃 방식**: [Flexbox/Grid/반응형]

### 생성할 파일
```
src/components/[ComponentName]/
├── [ComponentName].tsx
├── [ComponentName].styles.ts (또는 .css/.module.css)
└── index.ts
```

### 구현 코드 개요
```tsx
// 예상 구조
interface [ComponentName]Props {
  // Figma variants 기반 props
}

export const [ComponentName] = (props) => {
  // Figma 레이아웃 → Flexbox/Grid
  // Figma 스타일 → CSS/Tailwind
};
```

## 확인 질문

1. **구현 방향 확인**
   - 위 분석이 정확한가요?
   - 다른 해석이 필요한 부분이 있나요?

2. **추가 상태 필요 여부**
   - hover, focus, disabled 등 추가 상태가 필요한가요?
   - Figma에 없는 상태를 추가해야 하나요?

3. **반응형 고려**
   - 모바일/태블릿 대응이 필요한가요?
   - Figma에 반응형 디자인이 있나요?

4. **진행 승인**
   - 이 방향으로 구현해도 될까요?
```

### UI 구현 결과 확인 템플릿

```markdown
# [F###] UI 구현 결과 확인

## 구현 완료 항목

### 생성된 파일
| 파일 경로 | 설명 |
|----------|------|
| `src/components/[Name]/[Name].tsx` | 메인 컴포넌트 |
| `src/components/[Name]/[Name].styles.ts` | 스타일 정의 |
| `src/components/[Name]/index.ts` | 내보내기 |

### Figma 대비 구현 결과

| 항목 | Figma 원본 | 구현 결과 | 일치 여부 | 비고 |
|-----|-----------|----------|----------|------|
| 레이아웃 | Auto Layout Vertical | Flexbox column | ✅ | |
| 배경색 | #FFFFFF | var(--color-bg) | ✅ | 토큰화 |
| 간격 | 16px | 1rem | ✅ | |
| 폰트 크기 | 14px | 0.875rem | ✅ | |
| 모서리 | 8px | 0.5rem | ✅ | |

### 의도적 변경사항
| 항목 | Figma 원본 | 변경 내용 | 사유 |
|-----|-----------|----------|------|
| [항목] | [원본] | [변경] | [이유] |

## 테스트 결과

### 빌드 상태
- [ ] TypeScript 컴파일 성공
- [ ] 린트 오류 없음
- [ ] 빌드 성공

### 브라우저 테스트
- [ ] Chrome 확인
- [ ] Firefox 확인 (필요시)
- [ ] Safari 확인 (필요시)

### 상태별 동작
- [ ] default 상태 정상
- [ ] hover 상태 정상
- [ ] focus 상태 정상
- [ ] disabled 상태 정상

## 스크린샷 비교

### Figma 디자인
[Figma 스크린샷 또는 링크]

### 구현 결과
[구현 결과 스크린샷 또는 확인 방법]

## 확인 질문

1. 구현 결과가 Figma 디자인과 일치하나요?
2. 수정이 필요한 부분이 있나요?
3. 추가 상태나 변형이 필요한가요?
4. 다음 기능으로 진행해도 될까요?
```

### TodoWrite 패턴 (Figma 연동 시)

```json
[
  {"content": "[Phase1] 비즈니스 분석", "status": "completed", "activeForm": "비즈니스 요구사항 분석 중"},
  {"content": "[Phase1] 아키텍처 설계", "status": "completed", "activeForm": "아키텍처 설계 중"},
  {"content": "[Phase1] Figma 연동 설정", "status": "completed", "activeForm": "Figma MCP 연동 설정 중"},
  {"content": "[Phase1] 마이그레이션 전략 수립", "status": "completed", "activeForm": "마이그레이션 전략 협의 중"},
  {"content": "[Phase2] 기능 추출", "status": "completed", "activeForm": "기능 추출 중"},
  {"content": "[Phase2] 기능 DAG 생성", "status": "completed", "activeForm": "기능 DAG 생성 중"},
  {"content": "[Phase2] Figma 노드 매핑", "status": "completed", "activeForm": "Figma 노드 매핑 중"},
  {"content": "[F001] 디자인 토큰 설정", "status": "completed", "activeForm": "디자인 토큰 구현 중"},
  {"content": "[F002] 공통 컴포넌트 - Figma 확인", "status": "in_progress", "activeForm": "Figma 디자인 확인 중"},
  {"content": "[F002] 공통 컴포넌트 - 구현", "status": "pending", "activeForm": "공통 컴포넌트 구현 중"},
  {"content": "[F002] 공통 컴포넌트 - 결과 검토", "status": "pending", "activeForm": "구현 결과 검토 중"},
  {"content": "[F003] 메인 화면 - Figma 확인", "status": "pending", "activeForm": "Figma 디자인 확인 중"},
  {"content": "[F003] 메인 화면 - 구현", "status": "pending", "activeForm": "메인 화면 구현 중"}
]
```
