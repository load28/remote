# Enterprise Push Server

엔터프라이즈급 푸시 알림 서버입니다. 수평 확장이 가능하며, 고가용성과 높은 처리량을 지원합니다.

## 아키텍처

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client 1   │     │   Client 2   │     │   Client N   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │    WebSocket       │    WebSocket       │
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Gateway 1   │     │  Gateway 2   │     │  Gateway N   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                           │
                    ┌──────▼──────┐
                    │    NATS     │  (메시지 버스)
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Message    │   │  Presence    │   │    Push      │
│   Service    │   │   Service    │   │   Service    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   ScyllaDB   │   │    Redis     │   │  FCM/APNs    │
│  (메시지)     │   │  (세션/상태)  │   │  (푸시 알림)  │
└──────────────┘   └──────────────┘   └──────────────┘
```

## 주요 컴포넌트

| 컴포넌트 | 역할 |
|---------|------|
| Gateway | WebSocket 연결 관리, 클라이언트 통신 |
| Message Service | 메시지 라우팅, 그룹 팬아웃, DB 저장 |
| Presence Service | 온라인/오프라인 상태, 타이핑 표시 |
| Push Service | FCM/APNs 푸시 알림 발송 |
| NATS | 서비스 간 비동기 메시지 전달 |
| Redis | 세션, 상태, 캐시 관리 |
| ScyllaDB | 메시지 영구 저장 |

## 빠른 시작

### Docker Compose 사용

```bash
# 기본 서비스 시작
docker-compose up -d

# 모니터링 포함 시작
docker-compose --profile monitoring up -d
```

### 로컬 개발

```bash
# 의존성 설치 (Redis, NATS 필요)
docker-compose up -d redis nats

# 환경 변수 설정
cp .env.example .env

# 빌드 및 실행
cargo run
```

## API 엔드포인트

### WebSocket
- `GET /ws?token={user_token}&device_id={device_id}` - WebSocket 연결

### REST API
- `GET /health` - 헬스 체크
- `GET /stats` - 서버 통계
- `POST /device/register` - 푸시 토큰 등록

## WebSocket 메시지 형식

### 클라이언트 → 서버

```json
{
  "type": "send_message",
  "recipient_id": "uuid",
  "content": "Hello!"
}
```

### 서버 → 클라이언트

```json
{
  "type": "new_message",
  "id": "uuid",
  "sender_id": "uuid",
  "content": "Hello!",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|-----|------|-------|
| `SERVER_HOST` | 서버 호스트 | `0.0.0.0` |
| `SERVER_PORT` | 서버 포트 | `8080` |
| `GATEWAY_ID` | 게이트웨이 식별자 | 자동 생성 |
| `REDIS_URL` | Redis 연결 URL | `redis://localhost:6379` |
| `NATS_URL` | NATS 연결 URL | `nats://localhost:4222` |
| `SCYLLA_NODES` | ScyllaDB 노드 목록 | `localhost:9042` |
| `FCM_API_KEY` | Firebase 서버 키 | - |
| `APNS_KEY_PATH` | APNs 키 파일 경로 | - |

## 확장 전략

### 소규모 (동시 접속 1만 이하)
- 단일 서버로 모든 서비스 운영

### 중규모 (동시 접속 10만)
```
Gateway × 3
Message Service × 2
Push Service × 2
Redis Cluster (3노드)
ScyllaDB (3노드)
```

### 대규모 (동시 접속 100만+)
```
Gateway × 20+
Message Service × 10+
Push Service × 5+
Redis Cluster (6노드+)
ScyllaDB (9노드+)
```

## 라이선스

MIT License
