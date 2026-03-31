import type { Metadata } from 'next';
import { RelayProvider } from '@/relay/RelayProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Relay Todo App',
  description: 'Relay + Next.js로 만든 Todo 앱 - Relay 학습용',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <RelayProvider>
          {children}
        </RelayProvider>
      </body>
    </html>
  );
}
