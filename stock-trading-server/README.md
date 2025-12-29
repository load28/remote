# Stock Trading Server (모의 주식 거래 서버)

Rust로 구현된 엔터프라이즈급 모의 주식 거래 서버입니다.

## 기술 스택

- **웹 프레임워크**: Axum
- **데이터베이스**: SQLite (SQLx)
- **인증**: JWT (jsonwebtoken)
- **실시간 통신**: WebSocket
- **비밀번호 해싱**: Argon2

## 주요 기능

### 1. 사용자 관리
- 회원가입 / 로그인
- JWT 기반 인증
- 초기 모의 자금 1천만원 지급

### 2. 계좌 관리
- 잔액 조회
- 입금 / 출금
- 거래 내역 조회

### 3. 주식 시장
- 한국 주식 (KOSPI, KOSDAQ) - 15개 종목
- 미국 주식 (NYSE, NASDAQ) - 10개 종목
- 실시간 가격 시뮬레이션 (5초마다 변동)
- 종목 검색 / 시장별 조회

### 4. 주문 시스템
- 시장가 주문 (Market Order)
- 지정가 주문 (Limit Order)
- 매수 / 매도
- 주문 취소
- 주문 매칭 엔진

### 5. 포트폴리오
- 보유 주식 조회
- 수익률 계산
- 총 자산 현황

### 6. 실시간 데이터
- WebSocket을 통한 실시간 가격 업데이트
- 종목별 구독/해제

## 실행 방법

```bash
# 빌드
cargo build --release

# 실행
cargo run

# 또는 환경변수 설정 후 실행
DATABASE_URL=sqlite:stock_trading.db?mode=rwc \
JWT_SECRET=your-secret-key \
SERVER_PORT=8080 \
cargo run
```

## 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| DATABASE_URL | SQLite 데이터베이스 경로 | sqlite:stock_trading.db?mode=rwc |
| JWT_SECRET | JWT 서명 키 | super-secret-jwt-key-change-in-production |
| JWT_EXPIRATION_HOURS | 토큰 만료 시간(시) | 24 |
| SERVER_HOST | 서버 호스트 | 0.0.0.0 |
| SERVER_PORT | 서버 포트 | 8080 |
| INITIAL_BALANCE | 초기 지급 금액 | 10000000 |

## API 엔드포인트

### 인증 (Public)

```
POST /api/v1/auth/register    - 회원가입
POST /api/v1/auth/login       - 로그인
POST /api/v1/auth/me          - 내 정보 조회 (인증 필요)
```

### 시장 데이터 (Public)

```
GET /api/v1/market/stocks                  - 전체 종목 목록
GET /api/v1/market/stocks/search?q=삼성    - 종목 검색
GET /api/v1/market/stocks/:id              - 종목 상세
GET /api/v1/market/stocks/:id/history      - 가격 히스토리
GET /api/v1/market/stocks/symbol/:symbol   - 심볼로 조회
GET /api/v1/market/markets/:market         - 시장별 종목 (KOSPI, NASDAQ 등)
GET /api/v1/market/summary                 - 시장 요약 (상승/하락/거래량)
```

### 거래 (인증 필요)

```
GET  /api/v1/trading/orders           - 내 주문 목록
POST /api/v1/trading/orders           - 주문 생성
GET  /api/v1/trading/orders/:id       - 주문 상세
POST /api/v1/trading/orders/:id/cancel - 주문 취소
GET  /api/v1/trading/orderbook/:stock_id - 호가창
```

### 포트폴리오 (인증 필요)

```
GET  /api/v1/portfolio/portfolio      - 포트폴리오 요약
GET  /api/v1/portfolio/account        - 계좌 정보
POST /api/v1/portfolio/account/deposit  - 입금
POST /api/v1/portfolio/account/withdraw - 출금
GET  /api/v1/portfolio/holdings       - 보유 주식
GET  /api/v1/portfolio/transactions   - 거래 내역
```

### WebSocket

```
ws://localhost:8080/ws/prices - 실시간 가격 업데이트
```

## API 사용 예시

### 회원가입

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","username":"trader"}'
```

### 로그인

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### 종목 목록 조회

```bash
curl http://localhost:8080/api/v1/market/stocks
```

### 주문 생성 (시장가 매수)

```bash
curl -X POST http://localhost:8080/api/v1/trading/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stock_id": "STOCK_UUID",
    "order_type": "market",
    "order_side": "buy",
    "quantity": 10
  }'
```

### 주문 생성 (지정가 매도)

```bash
curl -X POST http://localhost:8080/api/v1/trading/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stock_id": "STOCK_UUID",
    "order_type": "limit",
    "order_side": "sell",
    "quantity": 5,
    "price": 75000
  }'
```

### 포트폴리오 조회

```bash
curl http://localhost:8080/api/v1/portfolio/portfolio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### WebSocket 연결 (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost:8080/ws/prices');

ws.onopen = () => {
  // 특정 종목 구독
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: { symbols: ['005930', 'AAPL'] }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'price_update') {
    console.log('Price update:', data.data);
  }
};
```

## 프로젝트 구조

```
stock-trading-server/
├── Cargo.toml
├── README.md
└── src/
    ├── main.rs           # 진입점
    ├── api/              # REST API 라우트
    │   ├── mod.rs
    │   ├── auth_routes.rs
    │   ├── market_routes.rs
    │   ├── portfolio_routes.rs
    │   └── trading_routes.rs
    ├── config/           # 설정
    │   └── mod.rs
    ├── db/               # 데이터베이스
    │   ├── mod.rs
    │   ├── models.rs
    │   └── repository.rs
    ├── error/            # 에러 처리
    │   └── mod.rs
    ├── middleware/       # 미들웨어
    │   ├── mod.rs
    │   └── auth.rs
    ├── services/         # 비즈니스 로직
    │   ├── mod.rs
    │   ├── auth_service.rs
    │   ├── market_service.rs
    │   ├── portfolio_service.rs
    │   └── trading_service.rs
    └── websocket/        # WebSocket
        └── mod.rs
```

## 데이터 모델

### 주요 테이블
- **users**: 사용자 정보
- **accounts**: 계좌 정보 (잔액)
- **stocks**: 주식 종목 정보
- **orders**: 주문 정보
- **holdings**: 보유 주식
- **transactions**: 거래 내역
- **price_history**: 가격 히스토리

## 라이선스

MIT
