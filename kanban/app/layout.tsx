import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import '@/app/styles/globals.css';

export const metadata: Metadata = {
  title: 'Kanban Board',
  description: 'A Trello-like kanban board built with Next.js and FSD architecture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
