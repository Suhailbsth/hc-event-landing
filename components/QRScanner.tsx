"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void | Promise<void>;
  onError?: (error: string) => void;
  isActive: boolean;
}

export default function QRScanner({ onScan, onError, isActive }: QRScannerProps) {
  const [cameraId, setCameraId] = useState<string>("");
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Zoom features
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomValue, setZoomValue] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef("qr-reader");
  const scanLockRef = useRef(false);
  const scanUnlockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          const cameraList = devices.map((device) => ({
            id: device.id,
            label: device.label || `Camera ${device.id}`,
          }));
          setCameras(cameraList);

          // Try to select back camera by default
          const backCamera = devices.find((device) =>
            device.label.toLowerCase().includes("back")
          );
          setCameraId(backCamera?.id || devices[0].id);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras:", err);
        setError("Unable to access camera. Please check permissions.");
        if (onError) {
          onError("Camera access denied");
        }
      });

    return () => {
      // Cleanup function
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }

      if (scanUnlockTimeoutRef.current) {
        clearTimeout(scanUnlockTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isActive && cameraId && !scanning) {
      startScanning();
    } else if (!isActive && scanning) {
      void stopScanning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, cameraId]);

  const startScanning = async () => {
    if (!cameraId || scanning) return;

    try {
      const scanner = new Html5Qrcode(scannerIdRef.current, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.floor(minEdgeSize * 0.75); // Slightly larger for better mobile capture
            return { width: boxSize, height: boxSize };
          },
        },
        (decodedText) => {
          if (scanLockRef.current) return;

          scanLockRef.current = true;
          void Promise.resolve(onScan(decodedText)).finally(() => {
            if (scanUnlockTimeoutRef.current) {
              clearTimeout(scanUnlockTimeoutRef.current);
            }

            scanUnlockTimeoutRef.current = setTimeout(() => {
              scanLockRef.current = false;
            }, 900);
          });
        },
        () => {
          // Silent scan failure
        }
      );

      setScanning(true);
      setError("");

      // Check capabilities for Zoom and Torch
      try {
        const capabilities = scanner.getRunningTrackCameraCapabilities();
        
        // Torch
        setHasTorch(capabilities.torchFeature().isSupported());
        
        // Zoom
        const zoom = capabilities.zoomFeature();
        if (zoom.isSupported()) {
          setZoomSupported(true);
          setZoomRange({
            min: zoom.min(),
            max: zoom.max(),
            step: zoom.step(),
          });
          setZoomValue(zoom.min());
        } else {
          setZoomSupported(false);
        }
      } catch (capErr) {
        console.warn("Could not fetch camera capabilities:", capErr);
      }

    } catch (err) {
      console.error("Error starting scanner:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to start camera";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setScanning(false);
        setTorchOn(false);
        setZoomSupported(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleZoomChange = async (value: number) => {
    if (!scannerRef.current || !zoomSupported) return;
    
    try {
      await scannerRef.current.applyVideoConstraints({
        // @ts-expect-error - zoom is supported but might not be in standard types
        advanced: [{ zoom: value }],
      });
      setZoomValue(value);
    } catch (err) {
      console.error("Error applying zoom:", err);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    const currentIndex = cameras.findIndex((cam) => cam.id === cameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;

    await stopScanning();
    setCameraId(cameras[nextIndex].id);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;

    try {
      await scannerRef.current.applyVideoConstraints({
        // @ts-expect-error - torch is supported
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Error toggling torch:", err);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl ring-1 ring-white/10">
      {/* Camera Preview */}
      <div
        id={scannerIdRef.current}
        className="w-full aspect-square bg-zinc-900 overflow-hidden"
      />

      {/* Overlay controls - top right */}
      {scanning && (
        <div className="absolute top-4 right-4 flex flex-col gap-3">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-3 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-all border border-white/20 active:scale-95"
              aria-label="Switch Camera"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-3 backdrop-blur-md rounded-full transition-all border active:scale-95 ${
                torchOn 
                  ? "bg-yellow-400 text-zinc-900 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
                  : "bg-black/40 text-white border-white/20 hover:bg-black/60"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Bottom Controls / Zoom Bar */}
      {scanning && zoomSupported && (
        <div className="absolute bottom-6 inset-x-0 px-6">
          <div className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <button 
              onClick={() => handleZoomChange(Math.max(zoomRange.min, zoomValue - zoomRange.step * 2))}
              className="text-white hover:text-indigo-400 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              value={zoomValue}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <button 
              onClick={() => handleZoomChange(Math.min(zoomRange.max, zoomValue + zoomRange.step * 2))}
              className="text-white hover:text-indigo-400 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Viewfinder Guide Overlay - CSS only */}
      {scanning && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-3/4 aspect-square border-2 border-indigo-400/50 rounded-3xl relative">
             {/* Corner Accents */}
             <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
             <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
             <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
             <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
             {/* Scanning Line Animation */}
             <div className="absolute top-0 inset-x-0 h-1 bg-indigo-400/30 blur-[2px] shadow-[0_0_15px_rgba(129,140,248,0.8)] animate-[scan_2s_linear_infinite]" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 5%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 95%; }
        }
      `}</style>

      {/* Status/Help footer */}
      <div className="p-4 bg-zinc-900 border-t border-white/5 flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-400 font-medium">
          {scanning ? "🔍 Align code within frame" : "📷 Camera is off"}
        </p>
        {!scanning && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      {/* Error Message popover */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-red-500/30 p-6 rounded-2xl text-center max-w-[280px]">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-300 mb-4">{error}</p>
            <button 
              onClick={() => setError("")}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
