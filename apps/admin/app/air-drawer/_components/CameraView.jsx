'use client';
import React, { useRef, useEffect } from 'react';
import { HandTracker } from '../_modules/handTracking';

const CameraView = ({ onResults }) => {
  const videoRef = useRef(null);
  const trackerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    let stopped = false;

    const waitForMediaPipe = () => new Promise((resolve) => {
      const check = () => {
        if (typeof window !== 'undefined' && window.Hands) return resolve(true);
        setTimeout(check, 100);
      };
      check();
    });

    const startCamera = async () => {
      try {
        await waitForMediaPipe();
        if (stopped) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          startTracking();
        };
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    const startTracking = () => {
      try {
        trackerRef.current = new HandTracker(onResults);
      } catch (err) {
        console.error('Hand tracker init failed:', err);
        return;
      }

      const processFrame = async () => {
        if (stopped) return;
        if (video.readyState === 4) {
          try { await trackerRef.current.send(video); } catch {}
        }
        requestAnimationFrame(processFrame);
      };

      processFrame();
    };

    startCamera();

    return () => {
      stopped = true;
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [onResults]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      zIndex: -1,
      backgroundColor: '#000',
    }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          filter: 'brightness(1)',
        }}
        playsInline
      />
    </div>
  );
};

export default CameraView;
