'use client';
import React, { useRef, useEffect } from 'react';
import { HandTracker } from '../_modules/handTracking';

const TARGET_FPS = 15;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

const CameraView = ({ onResults }) => {
  const videoRef = useRef(null);
  const trackerRef = useRef(null);
  const onResultsRef = useRef(onResults);

  useEffect(() => { onResultsRef.current = onResults; }, [onResults]);

  useEffect(() => {
    const video = videoRef.current;
    let stopped = false;
    let inflight = false;
    let lastSentAt = 0;
    let rafId = 0;
    let stream = null;

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

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 24, max: 30 },
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
        trackerRef.current = new HandTracker((results) => {
          const cb = onResultsRef.current;
          if (cb) cb(results);
        });
      } catch (err) {
        console.error('Hand tracker init failed:', err);
        return;
      }

      const processFrame = async (now) => {
        if (stopped) return;
        rafId = requestAnimationFrame(processFrame);
        if (inflight) return;
        if (now - lastSentAt < FRAME_INTERVAL_MS) return;
        if (video.readyState !== 4) return;

        inflight = true;
        lastSentAt = now;
        try {
          await trackerRef.current.send(video);
        } catch {
          // ignore transient send errors
        } finally {
          inflight = false;
        }
      };

      rafId = requestAnimationFrame(processFrame);
    };

    startCamera();

    return () => {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) {
        try { stream.getTracks().forEach(t => t.stop()); } catch {}
      }
      if (video && video.srcObject) {
        try { video.srcObject.getTracks().forEach(t => t.stop()); } catch {}
        video.srcObject = null;
      }
      try { trackerRef.current?.hands?.close?.(); } catch {}
      trackerRef.current = null;
    };
  }, []);

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
        muted
      />
    </div>
  );
};

export default CameraView;
