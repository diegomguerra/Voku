import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Voku — Marketing assets, delivered fast',
  description: 'Landing pages, content packs, and email sequences powered by AI. Delivered in 24–48h.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={mono.variable}>
      <body className="font-mono antialiased">{children}</body>
    </html>
  )
}
