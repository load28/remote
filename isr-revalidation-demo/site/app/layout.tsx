export const metadata = {
  title: 'ISR Site',
  description: 'ISR로 캐싱된 페이지 데모',
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
