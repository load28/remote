export const metadata = {
  title: 'Admin',
  description: 'ISR 갱신 트리거',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
        {children}
      </body>
    </html>
  )
}
