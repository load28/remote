import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "Suspense Query Architecture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "system-ui", maxWidth: 720, margin: "0 auto", padding: "40px 16px" }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
