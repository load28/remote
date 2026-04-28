import type { ReactNode } from "react";

export const metadata = {
  title: "Next.js Streaming 검증 데모",
  description:
    "HTTP chunked, Suspense placeholder swap, RSC Flight payload 동작을 직접 확인",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          padding: 24,
          maxWidth: 960,
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        {children}
      </body>
    </html>
  );
}
