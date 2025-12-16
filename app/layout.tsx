import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stock-Out Tracker',
  description: 'Track stock-out quantities by merchant SKU',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}




