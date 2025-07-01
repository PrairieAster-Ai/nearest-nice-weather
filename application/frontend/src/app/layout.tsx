import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MaterialThemeProvider } from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/react'
import { NetworkMonitorProvider } from '@/components/network-monitor-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nearest Nice Weather - Find Your Perfect Weather',
  description: 'A PrairieAster.Ai Product - Find the nearest nice weather that matches your preferences',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#4A90E2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nice Weather" />
      </head>
      <body className={`${inter.className} font-primary`}>
        <MaterialThemeProvider>
          <NetworkMonitorProvider>
            {children}
          </NetworkMonitorProvider>
        </MaterialThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}