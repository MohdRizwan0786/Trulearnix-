import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import PopupManager from '@/components/popups/PopupManager'
import PushSetup from '@/components/ui/PushSetup'

export const metadata: Metadata = {
  title: { default: 'TruLearnix - Learn, Earn & Grow', template: '%s | TruLearnix' },
  description: 'India\'s premium EdTech platform for live classes, courses, certifications, and earning opportunities.',
  keywords: ['online learning', 'live classes', 'certification', 'EdTech', 'TruLearnix'],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'TruLearnix - Learn, Earn & Grow',
    description: 'India\'s premium EdTech platform',
    type: 'website',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'TruLearnix' }],
  },
  twitter: {
    card: 'summary',
    title: 'TruLearnix',
    images: ['/logo.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PushSetup />
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1a1740', color: '#fff', border: '1px solid #6366f1' } }} />
          <PopupManager />
        </Providers>
      </body>
    </html>
  )
}
