import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: {
    // 관리자 앱 Origin 허용 (Server Actions 사용 시 필요)
    serverActions: {
      allowedOrigins: ['localhost:3001'],
    },
  },
}

export default config
