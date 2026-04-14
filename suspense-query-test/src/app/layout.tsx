import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "Suspense Query Test",
  description: "Testing useSuspenseQuery with Next.js Server Components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
