import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'مراجع الإشعارات',
  description: 'منصة لمراجعة وتحسين الإشعارات وفق المعايير المعتمدة',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
