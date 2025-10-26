"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
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
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef("qr-reader");

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isActive && cameraId && !scanning) {
      startScanning();
    } else if (!isActive && scanning) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        setScanning(false);
      }
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
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          
          // Vibrate on successful scan (if supported)
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        },
        (errorMessage) => {
          // Error callback (called very frequently, so we don't show these)
          // Only log actual errors, not "No QR code found"
          if (!errorMessage.includes("No MultiFormat Readers")) {
            // console.log("Scan error:", errorMessage);
          }
        }
      );

      setScanning(true);
      setError("");

      // Check if torch is available
      const capabilities = await scanner.getRunningTrackCameraCapabilities();
      setHasTorch(capabilities.torchFeature().isSupported());
      
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
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
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
        // @ts-expect-error - torch is not in the types but is supported
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Error toggling torch:", err);
    }
  };

  return (
    <div className="relative">
      {/* Camera Preview */}
      <div
        id={scannerIdRef.current}
        className="rounded-lg overflow-hidden border-4 border-indigo-600 shadow-lg"
      />

      {/* Controls */}
      {scanning && (
        <div className="flex justify-center gap-4 mt-4">
          {/* Switch Camera */}
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {/* Torch/Flashlight */}
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`px-4 py-2 rounded-lg transition ${
                torchOn
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-700 text-white hover:bg-gray-800"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 text-center">
          📱 Point camera at QR code or barcode
        </p>
      </div>
    </div>
  );
}
