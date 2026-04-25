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

const PRIMARY_BASE_STYLE = {
  position: 'fixed',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 40,
  pointerEvents: 'none',
  willChange: 'left, top, width, height, background-color, box-shadow',
  display: 'none',
};

const SECONDARY_BASE_STYLE = {
  position: 'fixed',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 40,
  pointerEvents: 'none',
  willChange: 'left, top, box-shadow, border-color',
  display: 'none',
};

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

  const [controlGesture, setControlGesture] = useState(CONTROL_GESTURES.IDLE);
  const [controlLandmark, setControlLandmark] = useState(null);
  const controlPinchDeltaRef = useRef(0);
  const controlAngleDeltaRef = useRef(0);
  const [, forceTransformTick] = useState(0);

  const [cameraVisible, setCameraVisible] = useState(true);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const canvasRef = useRef(null);
  const interpreter = useMemo(() => new GestureInterpreter(), []);

  // Refs for cursor divs (2 primary fingertip slots, 2 secondary). Updated directly
  // from onResults to avoid React re-renders at hand-tracking frame rate.
  const primary0Ref = useRef(null);
  const primary1Ref = useRef(null);
  const secondary0Ref = useRef(null);
  const secondary1Ref = useRef(null);

  const prevStateRef = useRef({
    pGesture: GESTURES.IDLE,
    pHasLm: false,
    sGesture: CONTROL_GESTURES.IDLE,
    sHasLm: false,
  });

  const updateCursor = (el, tip, opts) => {
    if (!el) return;
    if (!tip) { el.style.display = 'none'; return; }
    const x = (1 - tip.x) * window.innerWidth;
    const y = tip.y * window.innerHeight;
    el.style.display = 'block';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.width = opts.size;
    el.style.height = opts.size;
    el.style.backgroundColor = opts.bg;
    el.style.boxShadow = opts.shadow;
    el.style.opacity = opts.opacity;
    if (opts.border !== undefined) el.style.border = opts.border;
  };

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
      const prev = prevStateRef.current;
      // Always blank cursors on disable, but only setState if needed
      updateCursor(primary0Ref.current, null, {});
      updateCursor(primary1Ref.current, null, {});
      updateCursor(secondary0Ref.current, null, {});
      updateCursor(secondary1Ref.current, null, {});
      if (prev.pGesture === GESTURES.IDLE && !prev.pHasLm
       && prev.sGesture === CONTROL_GESTURES.IDLE && !prev.sHasLm) return;
      prevStateRef.current = {
        pGesture: GESTURES.IDLE, pHasLm: false,
        sGesture: CONTROL_GESTURES.IDLE, sHasLm: false,
      };
      setGesture(GESTURES.IDLE);
      setLandmark(null);
      setControlGesture(CONTROL_GESTURES.IDLE);
      setControlLandmark(null);
      return;
    }

    const { primary, secondary } = interpreter.interpret(results);
    const pHasLm = !!primary.landmark;
    const sHasLm = !!secondary.landmark;

    // Direct DOM cursor update — no React render
    const pTips = primary.fingertips || [];
    const color = settings.color;
    updateCursor(primary0Ref.current, pTips[0], {
      size: '10px', bg: color, shadow: `0 0 10px 2px ${color}`, opacity: 0.6,
    });
    if (primary.gesture === 'ERASE') {
      updateCursor(primary1Ref.current, pTips[1], {
        size: '60px', bg: 'transparent',
        shadow: '0 0 15px 4px rgba(255,0,0,0.8), inset 0 0 10px 2px rgba(255,0,0,0.5)',
        opacity: 1, border: '2px solid rgba(255,50,50,0.8)',
      });
    } else {
      updateCursor(primary1Ref.current, pTips[1], {
        size: '16px', bg: color, shadow: `0 0 15px 4px ${color}`,
        opacity: 1, border: 'none',
      });
    }

    const sTips = secondary.fingertips || [];
    updateCursor(secondary0Ref.current, sTips[0], {
      size: '10px', bg: 'transparent',
      shadow: '0 0 8px 2px rgba(255,165,0,0.5)', opacity: 0.5,
      border: '1.5px solid rgba(255,165,0,0.6)',
    });
    let sShadow = '0 0 8px 2px rgba(255,165,0,0.5)';
    let sBorder = '1.5px solid rgba(255,165,0,0.6)';
    if (secondary.gesture === CONTROL_GESTURES.MOVE) {
      sShadow = '0 0 20px 4px rgba(100,180,255,0.8)';
      sBorder = '2px solid rgba(100,180,255,0.8)';
    } else if (secondary.gesture === CONTROL_GESTURES.SCALE) {
      sShadow = '0 0 20px 4px rgba(0,255,200,0.8)';
      sBorder = '2px solid rgba(0,255,200,0.8)';
    } else if (secondary.gesture === CONTROL_GESTURES.ROTATE) {
      sShadow = '0 0 20px 4px rgba(255,165,0,0.8)';
      sBorder = '2px solid rgba(255,165,0,0.8)';
    }
    updateCursor(secondary1Ref.current, sTips[1], {
      size: '18px', bg: 'transparent', shadow: sShadow, opacity: 1, border: sBorder,
    });

    // Pinch/angle deltas drive transform engine — refs ok, DrawingCanvas reads via prop
    controlPinchDeltaRef.current = secondary.pinchDelta || 0;
    controlAngleDeltaRef.current = secondary.angleDelta || 0;

    // Skip React render if gesture state is unchanged (e.g. just landmark drift on idle)
    const prev = prevStateRef.current;
    const gestureChanged = prev.pGesture !== primary.gesture || prev.sGesture !== secondary.gesture;
    const visibilityChanged = prev.pHasLm !== pHasLm || prev.sHasLm !== sHasLm;

    // For DRAW/ERASE/MOVE/SCALE/ROTATE we always need React to forward the new landmark
    // to DrawingCanvas. For IDLE-with-landmark we only need to render once when state flips.
    const isActive = primary.gesture !== GESTURES.IDLE || secondary.gesture !== CONTROL_GESTURES.IDLE;

    if (!isActive && !gestureChanged && !visibilityChanged) {
      // Nothing to commit to React — cursors already moved via DOM
      if (sHasLm && (controlPinchDeltaRef.current !== 0 || controlAngleDeltaRef.current !== 0)) {
        // still bump transform tick? No — only active gestures use these
      }
      return;
    }

    prevStateRef.current = {
      pGesture: primary.gesture, pHasLm,
      sGesture: secondary.gesture, sHasLm,
    };

    setGesture(primary.gesture);
    setLandmark(primary.landmark);
    setControlGesture(secondary.gesture);
    setControlLandmark(secondary.landmark);

    // Tick to push pinch/angle deltas through to DrawingCanvas useEffect
    if (secondary.gesture !== CONTROL_GESTURES.IDLE) {
      forceTransformTick(t => (t + 1) & 0xff);
    }
  }, [interpreter, gesturesEnabled, settings.color]);

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
        controlPinchDelta={controlPinchDeltaRef.current}
        controlAngleDelta={controlAngleDeltaRef.current}
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
        onExit={() => router.back()}
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

      {/* Fixed cursor slots — positioned via direct DOM updates from onResults */}
      <div ref={primary0Ref} style={PRIMARY_BASE_STYLE} />
      <div ref={primary1Ref} style={PRIMARY_BASE_STYLE} />
      <div ref={secondary0Ref} style={SECONDARY_BASE_STYLE} />
      <div ref={secondary1Ref} style={SECONDARY_BASE_STYLE} />

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
