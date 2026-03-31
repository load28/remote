import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compiler: {
    // Next.js 내장 Relay 지원 활성화
    // SWC 컴파일러가 babel-plugin-relay 역할을 대신함
    relay: {
      src: './src',
      artifactDirectory: './src/__generated__',
      language: 'typescript',
    },
  },
};

export default nextConfig;
