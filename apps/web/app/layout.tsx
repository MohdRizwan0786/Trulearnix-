import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'TruLearnix - Learn, Earn & Grow', template: '%s | TruLearnix' },
  description: 'India\'s premium EdTech platform for live classes, courses, certifications, and earning opportunities.',
  keywords: ['online learning', 'live classes', 'certification', 'EdTech', 'TruLearnix'],
  openGraph: {
    title: 'TruLearnix - Learn, Earn & Grow',
    description: 'India\'s premium EdTech platform',
    type: 'website'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1a1740', color: '#fff', border: '1px solid #6366f1' } }} />
        </Providers>
      </body>
    </html>
  )
}
