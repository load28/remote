import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/app/providers';
import { BottomNav } from '@/widgets/bottom-nav';
import '@/app/styles/globals.css';

export const metadata: Metadata = {
  title: 'Shop - Mobile Shopping Mall',
  description: 'Your favorite mobile shopping experience',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
