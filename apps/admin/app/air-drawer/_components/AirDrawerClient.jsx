'use client';
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import CameraView from './CameraView';
import DrawingCanvas from './DrawingCanvas';
import HelpPanel from './HelpPanel';
import ControlPanel from './ControlPanel';
import { GestureInterpreter, CONTROL_GESTURES } from '../_modules/gestureInterpreter';
import { GESTURES } from '../_modules/gestureController';

const MEDIAPIPE_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js',
];

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

export default function AirDrawerClient() {
  const router = useRouter();

  const [mpReady, setMpReady] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [settings, setSettings] = useState({
    color: '#00ffff',
    lineWidth: 8,
    glowIntensity: 20,
  });

  const [gesture, setGesture] = useState(GESTURES.IDLE);
  const [landmark, setLandmark] = useState(null);
  const [fingertips, setFingertips] = useState([]);

  const [controlGesture, setControlGesture] = useState(CONTROL_GESTURES.IDLE);
  const [controlLandmark, setControlLandmark] = useState(null);
  const [controlFingertips, setControlFingertips] = useState([]);
  const [controlPinchDelta, setControlPinchDelta] = useState(0);
  const [controlAngleDelta, setControlAngleDelta] = useState(0);

  const [cameraVisible, setCameraVisible] = useState(true);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const canvasRef = useRef(null);
  const interpreter = useMemo(() => new GestureInterpreter(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (const src of MEDIAPIPE_SCRIPTS) {
          await loadScriptOnce(src);
          if (cancelled) return;
        }
        setMpReady(true);
      } catch (e) {
        setLoadError('MediaPipe load failed. Check internet connection.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onResults = useCallback((results) => {
    if (!gesturesEnabled) {
      setGesture(GESTURES.IDLE);
      setLandmark(null);
      setFingertips([]);
      setControlGesture(CONTROL_GESTURES.IDLE);
      setControlLandmark(null);
      setControlFingertips([]);
      return;
    }

    const { primary, secondary } = interpreter.interpret(results);

    setGesture(primary.gesture);
    setLandmark(primary.landmark);
    setFingertips(primary.fingertips);

    setControlGesture(secondary.gesture);
    setControlLandmark(secondary.landmark);
    setControlFingertips(secondary.fingertips);
    setControlPinchDelta(secondary.pinchDelta);
    setControlAngleDelta(secondary.angleDelta);
  }, [interpreter, gesturesEnabled]);

  const handleSave = () => {
    const dataUrl = canvasRef.current?.save();
    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `trulearnix-whiteboard-${Date.now()}.png`;
      link.click();
    }
  };

  const activeMode = controlGesture !== CONTROL_GESTURES.IDLE
    ? controlGesture.replace('CTRL_', '')
    : gesture;

  if (loadError) {
    return (
      <div style={styles.errorBox}>
        <p>{loadError}</p>
        <button onClick={() => router.back()} style={styles.errorBtn}>Go Back</button>
      </div>
    );
  }

  if (!mpReady) {
    return (
      <div style={styles.loadingBox}>
        <div style={styles.spinner} />
        <p style={{ marginTop: 16, letterSpacing: 2, fontSize: 14 }}>LOADING AI ENGINE…</p>
      </div>
    );
  }

  return (
    <div className="airdrawer-container">
      {cameraVisible && <CameraView onResults={onResults} />}

      <DrawingCanvas
        ref={canvasRef}
        settings={settings}
        gesture={gesture}
        landmark={landmark}
        controlGesture={controlGesture}
        controlLandmark={controlLandmark}
        controlPinchDelta={controlPinchDelta}
        controlAngleDelta={controlAngleDelta}
      />

      <ControlPanel
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
        onClear={() => canvasRef.current?.clear()}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onSave={handleSave}
        onToggleCamera={() => setCameraVisible(!cameraVisible)}
        cameraVisible={cameraVisible}
        gestureVisible={gesturesEnabled}
        onToggleGestures={() => setGesturesEnabled(!gesturesEnabled)}
        onHelp={() => setIsHelpOpen(true)}
        onExit={() => router.push('/live-classes')}
      />

      <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <AnimatePresence>
        {activeMode !== 'IDLE' && activeMode !== CONTROL_GESTURES.IDLE && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="airdrawer-gesture-status glass-meta"
          >
            {activeMode} MODE
          </motion.div>
        )}
      </AnimatePresence>

      {fingertips.map((tip, i) => {
        if (!tip) return null;
        const x = (1 - tip.x) * window.innerWidth;
        const y = tip.y * window.innerHeight;

        let size = '10px';
        let opacity = 0.6;
        let color = settings.color;
        let shadow = `0 0 10px 2px ${color}`;

        if (i === 1) {
          if (gesture === 'ERASE') {
            size = '60px';
            color = 'transparent';
            shadow = '0 0 15px 4px rgba(255, 0, 0, 0.8), inset 0 0 10px 2px rgba(255, 0, 0, 0.5)';
            opacity = 1;
          } else {
            size = '16px';
            opacity = 1;
            shadow = `0 0 15px 4px ${color}`;
          }
        }

        return (
          <div
            key={`p-${i}`}
            style={{
              position: 'fixed',
              left: x, top: y,
              width: size, height: size,
              backgroundColor: color,
              border: gesture === 'ERASE' ? '2px solid rgba(255, 50, 50, 0.8)' : 'none',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: shadow,
              opacity,
              zIndex: 40,
              pointerEvents: 'none',
              transition: 'width 0.1s, height 0.1s',
            }}
          />
        );
      })}

      {controlFingertips.map((tip, i) => {
        if (!tip) return null;
        const x = (1 - tip.x) * window.innerWidth;
        const y = tip.y * window.innerHeight;

        let size = '10px';
        let opacity = 0.5;
        let color = 'transparent';
        let shadow = '0 0 8px 2px rgba(255, 165, 0, 0.5)';
        let border = '1.5px solid rgba(255, 165, 0, 0.6)';

        if (i === 1) {
          size = '18px';
          opacity = 1;
          if (controlGesture === CONTROL_GESTURES.MOVE) {
            shadow = '0 0 20px 4px rgba(100, 180, 255, 0.8)';
            border = '2px solid rgba(100, 180, 255, 0.8)';
          } else if (controlGesture === CONTROL_GESTURES.SCALE) {
            shadow = '0 0 20px 4px rgba(0, 255, 200, 0.8)';
            border = '2px solid rgba(0, 255, 200, 0.8)';
          } else if (controlGesture === CONTROL_GESTURES.ROTATE) {
            shadow = '0 0 20px 4px rgba(255, 165, 0, 0.8)';
            border = '2px solid rgba(255, 165, 0, 0.8)';
          }
        }

        return (
          <div
            key={`s-${i}`}
            style={{
              position: 'fixed',
              left: x, top: y,
              width: size, height: size,
              backgroundColor: color,
              border,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: shadow,
              opacity,
              zIndex: 40,
              pointerEvents: 'none',
              transition: 'width 0.1s, height 0.1s',
            }}
          />
        );
      })}

      {!landmark && !controlLandmark && (
        <div className="airdrawer-overlay-message">
          👋 Raise your hand to start drawing
        </div>
      )}
    </div>
  );
}

const styles = {
  loadingBox: {
    position: 'fixed', inset: 0, background: '#0f172a', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
  },
  errorBox: {
    position: 'fixed', inset: 0, background: '#0f172a', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif', gap: 20, padding: 40, textAlign: 'center',
  },
  errorBtn: {
    padding: '10px 24px', background: '#8b5cf6', color: '#fff', border: 'none',
    borderRadius: 10, cursor: 'pointer', fontSize: 14,
  },
  spinner: {
    width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#00ffff', borderRadius: '50%',
    animation: 'airdrawer-spin 1s linear infinite',
  },
};
