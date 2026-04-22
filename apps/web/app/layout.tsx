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
  other: {
    'facebook-domain-verification': 'gyc97lw61w8k26rs2xf5wp6c5ehcuc',
  },
}

const chunkErrorScript = `
(function(){
  var key='_tl_chunk_reload';
  function reload(){if(!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');window.location.reload();}else{sessionStorage.removeItem(key);}}
  window.addEventListener('error',function(e){if(e.message&&e.message.indexOf('Loading chunk')!==-1)reload();});
  window.addEventListener('unhandledrejection',function(e){if(e.reason&&e.reason.name==='ChunkLoadError')reload();});
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: chunkErrorScript }} />
      </head>
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
