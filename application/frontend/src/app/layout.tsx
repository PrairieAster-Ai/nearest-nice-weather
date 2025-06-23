import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nearest Nice Weather - Infrastructure Validation',
  description: 'Weather intelligence platform for outdoor enthusiasts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}