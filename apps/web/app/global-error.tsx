'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (error?.name === 'ChunkLoadError') {
      const key = '_tl_chunk_reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      } else {
        sessionStorage.removeItem(key);
      }
    }
  }, [error]);

  if (error?.name === 'ChunkLoadError') {
    return (
      <html>
        <body style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', background: '#0f0e1a', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <p>Refreshing to load the latest version...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html>
      <body style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', background: '#0f0e1a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <button onClick={reset} style={{ marginTop: 16, padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
