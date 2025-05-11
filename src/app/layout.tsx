import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { WebSocketProvider } from '@/components/WebSocketProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trading Analysis App',
  description: 'Advanced stock technical analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <WebSocketProvider wsUrl={process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}>
            {children}
          </WebSocketProvider>
        </div>
      </body>
    </html>
  )
} 