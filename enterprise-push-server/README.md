# Enterprise Push Server

엔터프라이즈급 푸시 알림 서버입니다. Docker Swarm을 통한 수평 확장, OAuth 인증, 마이크로서비스 아키텍처를 지원합니다.

## 아키텍처

```
                         ┌─────────────┐
                         │   Traefik   │  (Load Balancer)
                         │   :80/:443  │
                         └──────┬──────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Gateway 1   │       │   Gateway 2   │       │   Gateway N   │
│   (WebSocket) │       │   (WebSocket) │       │   (WebSocket) │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                         ┌──────▼──────┐
                         │    NATS     │  (Message Bus)
                         └──────┬──────┘
                                │
        ┌───────────────┬───────┼───────┬───────────────┐
        │               │       │       │               │
        ▼               ▼       ▼       ▼               ▼
┌───────────┐   ┌───────────┐ ┌─────┐ ┌───────────┐   ┌─────┐
│   Auth    │   │  Message  │ │Pres │ │   Push    │   │ ... │
│  Service  │   │  Service  │ │ence │ │  Service  │   │     │
└─────┬─────┘   └─────┬─────┘ └──┬──┘ └─────┬─────┘   └─────┘
      │               │          │          │
      ▼               ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                         Redis                                │
│                    (Session/State)                          │
└─────────────────────────────────────────────────────────────┘
                                │
                         ┌──────▼──────┐
                         │  ScyllaDB   │
                         │ (Messages)  │
                         └─────────────┘
```

## 서비스 구성

| 서비스 | 포트 | 역할 |
|--------|------|------|
| `auth` | 8081 | OAuth/JWT 인증, 사용자 관리 |
| `gateway` | 8080 | WebSocket 연결, 클라이언트 통신 |
| `message` | 8082 | 메시지 라우팅, 저장, 팬아웃 |
| `presence` | 8083 | 온라인 상태, 타이핑 표시 |
| `push` | 8084 | FCM/APNs 푸시 알림 |

## 빠른 시작

### Docker Swarm 배포

```bash
# 1. 이미지 빌드
./scripts/build.sh localhost:5000 latest

# 2. 레지스트리에 푸시 (선택사항)
./scripts/push.sh localhost:5000 latest

# 3. 스택 배포
./scripts/deploy.sh push-server localhost:5000 latest

# 4. 상태 확인
docker stack services push-server
```

### 스케일링

```bash
# Gateway를 5개로 확장
./scripts/scale.sh gateway 5

# Auth 서비스를 3개로 확장
./scripts/scale.sh auth 3
```

### 로컬 개발

```bash
# 인프라만 실행
docker-compose up -d redis nats scylla

# 개별 서비스 실행
cd crates/auth && cargo run
cd crates/gateway-service && cargo run
```

## OAuth 설정

### Google OAuth

```bash
export OAUTH_GOOGLE_CLIENT_ID=your-client-id
export OAUTH_GOOGLE_CLIENT_SECRET=your-client-secret
export OAUTH_GOOGLE_REDIRECT_URL=https://your-domain.com/oauth/google/callback
```

### GitHub OAuth

```bash
export OAUTH_GITHUB_CLIENT_ID=your-client-id
export OAUTH_GITHUB_CLIENT_SECRET=your-client-secret
export OAUTH_GITHUB_REDIRECT_URL=https://your-domain.com/oauth/github/callback
```

## API 엔드포인트

### Auth Service

| 메소드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/register` | 회원가입 |
| POST | `/auth/login` | 로그인 |
| POST | `/auth/refresh` | 토큰 갱신 |
| POST | `/auth/logout` | 로그아웃 |
| GET | `/auth/me` | 현재 사용자 정보 |
| GET | `/oauth/google` | Google OAuth 시작 |
| GET | `/oauth/github` | GitHub OAuth 시작 |

### Gateway Service (WebSocket)

```javascript
// 연결
const ws = new WebSocket('wss://your-domain.com/ws?token=YOUR_JWT_TOKEN');

// 메시지 전송
ws.send(JSON.stringify({
  type: 'send_message',
  recipient_id: 'user-uuid',
  content: 'Hello!'
}));

// 메시지 수신
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg);
};
```

## 환경 변수

### 공통

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `REDIS_URL` | Redis 연결 URL | `redis://redis:6379` |
| `NATS_URL` | NATS 연결 URL | `nats://nats:4222` |

### Auth Service

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `JWT_SECRET` | JWT 서명 키 | (필수) |
| `JWT_EXPIRY_HOURS` | 액세스 토큰 만료시간 | `24` |
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | - |
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth 클라이언트 ID | - |

### Push Service

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `FCM_API_KEY` | Firebase 서버 키 | - |
| `APNS_KEY_PATH` | APNs 키 파일 경로 | - |

## 모니터링

Traefik 대시보드: `http://localhost:8090`
Grafana: `http://localhost/grafana` (admin/admin)

## 프로젝트 구조

```
enterprise-push-server/
├── Cargo.toml              # Workspace 설정
├── Dockerfile              # 멀티스테이지 빌드
├── docker-stack.yml        # Docker Swarm 스택
├── docker-compose.yml      # 로컬 개발용
├── prometheus.yml          # 모니터링 설정
├── crates/
│   ├── common/            # 공통 라이브러리
│   │   ├── src/
│   │   │   ├── config.rs  # 설정
│   │   │   ├── types.rs   # 공통 타입
│   │   │   ├── bus.rs     # NATS 메시지 버스
│   │   │   ├── auth.rs    # JWT 유틸리티
│   │   │   └── error.rs   # 에러 타입
│   ├── auth/              # Auth 서비스
│   ├── gateway-service/   # Gateway 서비스
│   ├── message-service/   # Message 서비스
│   ├── presence-service/  # Presence 서비스
│   └── push-service/      # Push 서비스
└── scripts/
    ├── build.sh           # 이미지 빌드
    ├── push.sh            # 이미지 푸시
    ├── deploy.sh          # 스택 배포
    └── scale.sh           # 서비스 스케일링
```

## 확장 가이드

### 소규모 (동시 접속 1만 이하)
```
Gateway × 1-2
Auth × 1
Message × 1
Presence × 1
Push × 1
```

### 중규모 (동시 접속 10만)
```
Gateway × 5
Auth × 2
Message × 3
Presence × 2
Push × 2
```

### 대규모 (동시 접속 100만+)
```
Gateway × 20+
Auth × 5+
Message × 10+
Presence × 5+
Push × 5+
```

## 라이선스

MIT License
