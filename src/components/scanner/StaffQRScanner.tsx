'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { store, AppState } from '@/lib/store';
import { Reservation } from '@/lib/types';
import { formatDate, formatTime12h, formatCurrency } from '@/lib/utils';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UtensilsCrossed,
  RefreshCw,
  Camera,
  ChefHat,
  MapPin,
  ShieldAlert,
  SwitchCamera,
  FileImage,
} from 'lucide-react';

export type ScanVerificationResult =
  | { type: 'SUCCESS'; reservation: Reservation }
  | { type: 'ALREADY_CHECKED_IN'; reservation: Reservation }
  | { type: 'CANCELLED'; reservation: Reservation }
  | { type: 'WRONG_RESTAURANT'; reservation: Reservation; targetRestaurantName: string }
  | { type: 'INVALID_QR'; rawPayload: string };

// Helper function to decode QR code from an Image File (JPG, PNG, WEBP, screenshots)
async function decodeQRFromImageFile(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;

  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
      image.src = objectUrl;
    });
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new Error('IMAGE_LOAD_FAILED');
  }

  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (!origWidth || !origHeight) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('IMAGE_LOAD_FAILED');
  }

  // Multi-resolution downsampling list for high-res mobile screenshots
  const scales = [
    { w: origWidth, h: origHeight }, // Original size
    { w: 1200, h: Math.round((origHeight * 1200) / origWidth) }, // High
    { w: 800, h: Math.round((origHeight * 800) / origWidth) }, // Medium
    { w: 500, h: Math.round((origHeight * 500) / origWidth) }, // Low
  ].filter((s) => s.w > 0 && s.h > 0);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (ctx) {
    // 1. Full Image Scan across multiple resolutions
    for (const scale of scales) {
      canvas.width = scale.w;
      canvas.height = scale.h;
      ctx.clearRect(0, 0, scale.w, scale.h);
      ctx.drawImage(img, 0, 0, scale.w, scale.h);

      try {
        const imageData = ctx.getImageData(0, 0, scale.w, scale.h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code && code.data && code.data.trim()) {
          URL.revokeObjectURL(objectUrl);
          return code.data.trim();
        }
      } catch {
        // Try next resolution
      }
    }

    // 2. Central Crop Region Scan (common for mobile screenshots with header/footer cards)
    try {
      const cropW = Math.round(origWidth * 0.7);
      const cropH = Math.round(origHeight * 0.7);
      const cropX = Math.round((origWidth - cropW) / 2);
      const cropY = Math.round((origHeight - cropH) / 2);

      canvas.width = cropW;
      canvas.height = cropH;
      ctx.clearRect(0, 0, cropW, cropH);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const croppedData = ctx.getImageData(0, 0, cropW, cropH);
      const code = jsQR(croppedData.data, croppedData.width, croppedData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data && code.data.trim()) {
        URL.revokeObjectURL(objectUrl);
        return code.data.trim();
      }
    } catch {
      // Continue to offline scanner fallback
    }
  }

  // 3. Fallback to Html5Qrcode offline scan on isolated hidden DOM element
  try {
    const tempDiv = document.createElement('div');
    const tempId = `temp-qr-file-${Date.now()}`;
    tempDiv.id = tempId;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    const { Html5Qrcode } = await import('html5-qrcode');
    const offlineScanner = new Html5Qrcode(tempId);
    const decodedText = await offlineScanner.scanFile(file, false);

    try {
      offlineScanner.clear();
    } catch {
      // ignore
    }
    if (tempDiv.parentNode) {
      tempDiv.parentNode.removeChild(tempDiv);
    }

    URL.revokeObjectURL(objectUrl);
    if (decodedText && decodedText.trim()) {
      return decodedText.trim();
    }
  } catch {
    // Offline fallback failed
  }

  URL.revokeObjectURL(objectUrl);
  throw new Error('NO_QR_DETECTED');
}

export default function StaffQRScanner() {
  const [state, setState] = useState<AppState>(store.getState());
  const [scanResult, setScanResult] = useState<ScanVerificationResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [manualInput, setManualInput] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isCameraRunningRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const readerDivId = 'queuebite-qr-reader';

  // Subscribe to store updates
  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const currentRestaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  // Safely fetch available camera devices on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isSubscribed = true;
    import('html5-qrcode')
      .then(({ Html5Qrcode: QrScannerClass }) => {
        return QrScannerClass.getCameras();
      })
      .then((devices) => {
        if (isSubscribed && devices && devices.length > 0) {
          setAvailableCameras(
            devices.map((d) => ({
              id: d.id,
              label: d.label || `Camera ${d.id.substring(0, 4)}`,
            }))
          );
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('environment')
          );
          if (backCam) {
            setSelectedCameraId(backCam.id);
          } else {
            setSelectedCameraId(devices[0].id);
          }
        }
      })
      .catch(() => {
        // Camera enumeration fallback (handled gracefully)
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // UNIFIED VERIFICATION PIPELINE (Single handler for Camera QR Scan, Photo Upload, & Manual Booking ID)
  const verifyAndCheckInBooking = useCallback((payload: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const raw = payload.trim();
    if (!raw) {
      isProcessingRef.current = false;
      return;
    }

    // Stop camera scanning immediately to avoid duplicate scans
    if (html5QrCodeRef.current && isCameraRunningRef.current) {
      try {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      } catch {
        // ignore stop errors
      } finally {
        isCameraRunningRef.current = false;
        html5QrCodeRef.current = null;
      }
    }
    setIsScanningActive(false);

    // Retrieve fresh snapshot directly from store to prevent hook stale closures
    const currentState = store.getState();
    const currentRest =
      currentState.restaurants.find((r) => r.id === currentState.selectedRestaurantId) ||
      currentState.restaurants[0];

    // Search for matching reservation in store
    let matchedReservation: Reservation | undefined;

    // 1. Check formatted payload: QUEUEBITE:RES:{reservationId}:{tableNumber}:{date}:{startTime}
    if (raw.includes('QUEUEBITE:RES:')) {
      const parts = raw.split(':');
      const resId = parts[2];
      matchedReservation = currentState.reservations.find(
        (r) => r.reservationId.toLowerCase() === resId.toLowerCase()
      );
    }

    // 2. Check regex match for QB booking ID format e.g. QB-2026-1048
    if (!matchedReservation) {
      const idMatch = raw.match(/QB-\d{4}-\d+/i);
      if (idMatch) {
        matchedReservation = currentState.reservations.find(
          (r) => r.reservationId.toLowerCase() === idMatch[0].toLowerCase()
        );
      }
    }

    // 3. Fallback direct match on reservation ID string
    if (!matchedReservation) {
      matchedReservation = currentState.reservations.find(
        (r) => r.reservationId.toLowerCase() === raw.toLowerCase()
      );
    }

    // Evaluate Verification Status
    if (!matchedReservation) {
      setScanResult({ type: 'INVALID_QR', rawPayload: raw });
      isProcessingRef.current = false;
      return;
    }

    // Check Restaurant Ownership
    if (matchedReservation.restaurantId !== currentRest.id) {
      setScanResult({
        type: 'WRONG_RESTAURANT',
        reservation: matchedReservation,
        targetRestaurantName: matchedReservation.restaurantName,
      });
      isProcessingRef.current = false;
      return;
    }

    // Check Cancelled Status
    if (matchedReservation.bookingStatus === 'CANCELLED') {
      setScanResult({ type: 'CANCELLED', reservation: matchedReservation });
      isProcessingRef.current = false;
      return;
    }

    // Check Already Checked-In / Seated / Completed Status
    if (
      matchedReservation.bookingStatus === 'CHECKED_IN' ||
      matchedReservation.bookingStatus === 'SEATED' ||
      matchedReservation.bookingStatus === 'COMPLETED'
    ) {
      setScanResult({ type: 'ALREADY_CHECKED_IN', reservation: matchedReservation });
      isProcessingRef.current = false;
      return;
    }

    // Valid CONFIRMED Reservation Check-In!
    store.checkInReservation(matchedReservation.reservationId);

    // Retrieve fresh updated reservation object
    const updatedState = store.getState();
    const updatedRes =
      updatedState.reservations.find(
        (r) => r.reservationId === matchedReservation!.reservationId
      ) || matchedReservation;

    setScanResult({ type: 'SUCCESS', reservation: updatedRes });
    isProcessingRef.current = false;
  }, []);

  // Start Real Camera Scanner via html5-qrcode
  const startCameraScanner = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    setCameraError(null);

    const element = document.getElementById(readerDivId);
    if (!element) {
      isInitializingRef.current = false;
      return;
    }

    try {
      const { Html5Qrcode: QrScannerClass } = await import('html5-qrcode');

      if (html5QrCodeRef.current) {
        try {
          if (isCameraRunningRef.current) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch {
          // ignore stop errors
        }
        html5QrCodeRef.current = null;
      }

      // Purge any stale video or canvas DOM elements inside container
      element.innerHTML = '';

      const html5QrCode = new QrScannerClass(readerDivId);
      html5QrCodeRef.current = html5QrCode;

      const cameraConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          // Continuous real-time detection: Stop camera stream immediately and process payload
          verifyAndCheckInBooking(decodedText);
        },
        () => {
          // Continuous frame parsing error (silent)
        }
      );
      isCameraRunningRef.current = true;
    } catch {
      isCameraRunningRef.current = false;
      setCameraError(
        'Camera access is required to scan customer QR codes. Please ensure camera permissions are granted or enter the Booking ID manually.'
      );
    } finally {
      isInitializingRef.current = false;
    }
  }, [selectedCameraId, verifyAndCheckInBooking]);

  // Stop Camera Scanner helper
  const stopCameraScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (isCameraRunningRef.current) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch {
        // ignore stop errors
      } finally {
        isCameraRunningRef.current = false;
        html5QrCodeRef.current = null;
        const element = typeof document !== 'undefined' ? document.getElementById(readerDivId) : null;
        if (element) {
          element.innerHTML = '';
        }
      }
    }
  }, []);

  // Initialize camera scanner when active and no result showing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    if (isScanningActive && !scanResult) {
      const timer = setTimeout(() => {
        if (isMounted) {
          startCameraScanner();
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [isScanningActive, scanResult, selectedCameraId, startCameraScanner, stopCameraScanner]);

  // PHOTO / GALLERY QR FILE UPLOAD DECODER
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingUpload(true);

    try {
      const decodedText = await decodeQRFromImageFile(file);
      setIsProcessingUpload(false);
      verifyAndCheckInBooking(decodedText);
    } catch (err: unknown) {
      setIsProcessingUpload(false);
      const errorObj = err as Error;
      if (errorObj?.message === 'IMAGE_LOAD_FAILED') {
        setUploadError('Unable to load this image. Please try another image.');
      } else {
        setUploadError(
          'No QR code detected. Please select a clear image containing the QueueBite booking QR.'
        );
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetScan = () => {
    isProcessingRef.current = false;
    setScanResult(null);
    setCameraError(null);
    setUploadError(null);
    setIsProcessingUpload(false);
    setManualInput('');
    setIsScanningActive(true);
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      {/* Scoped CSS Rules for html5-qrcode to guarantee EXACTLY ONE clean video element */}
      <style>{`
        #queuebite-qr-reader {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
          overflow: hidden !important;
          border: none !important;
          background: #000000 !important;
        }
        #queuebite-qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
          border-radius: 1.5rem !important;
        }
        #queuebite-qr-reader canvas {
          display: none !important;
        }
        #queuebite-qr-reader img {
          display: none !important;
        }
        #queuebite-qr-reader #qr-shaded-region {
          display: none !important;
        }
        #queuebite-qr-reader__scan_region {
          width: 100% !important;
          height: 100% !important;
          background: transparent !important;
        }
        #queuebite-qr-reader__dashboard {
          display: none !important;
        }
      `}</style>

      {/* Scanner Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-purple-950 text-white border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Staff Entrance Scanner</h1>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-500/30">
                Live Verification
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Scan customer QR passes to check-in diners and notify kitchen
            </p>
          </div>
        </div>

        {/* Selected Restaurant Indicator */}
        <div className="px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-xs font-bold text-amber-400 flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
          <MapPin className="w-3.5 h-3.5" />
          <span>{currentRestaurant.name}</span>
        </div>
      </div>

      {/* REAL CAMERA SCANNER VIEW (When scanning is active and no result is showing) */}
      {isScanningActive && !scanResult && (
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-white flex items-center justify-center gap-2">
              <Camera className="w-4 h-4 text-purple-400 animate-pulse" />
              Scan Customer QR
            </h2>
            <p className="text-xs text-zinc-400">
              Point the camera at the customer&apos;s QueueBite booking QR code
            </p>
          </div>

          {/* Camera Selection Dropdown (If multiple cameras detected) */}
          {availableCameras.length > 1 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <SwitchCamera className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] font-semibold text-zinc-400">Camera:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {availableCameras.map((cam) => (
                  <option key={cam.id} value={cam.id} className="bg-zinc-900 text-white">
                    {cam.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Viewfinder & Scanner Frame */}
          <div className="relative w-full max-w-sm aspect-square mx-auto rounded-3xl overflow-hidden bg-black border-2 border-purple-500/50 shadow-inner flex items-center justify-center">
            {/* HTML5 QR Code Video Stream Container */}
            <div id={readerDivId} className="w-full h-full text-white" />

            {/* Custom Overlay Scanner Target Reticle */}
            {!cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-56 h-56 border-2 border-purple-400 rounded-2xl relative shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  {/* Corners accent */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

                  {/* Laser Scan Bar */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent top-1/2 animate-pulse shadow-md shadow-amber-400/50" />
                </div>
              </div>
            )}
          </div>

          {/* Camera Permission / Access Error State */}
          {cameraError && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-3 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 font-bold text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <span>Camera Permission Required</span>
              </div>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startCameraScanner}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Enable Camera & Retry
              </button>
            </div>
          )}

          {/* Action Divider OR */}
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* PHOTO / GALLERY QR UPLOAD BUTTON */}
          <div className="max-w-md mx-auto space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="qr-photo-upload-input"
            />
            <button
              type="button"
              disabled={isProcessingUpload}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 group cursor-pointer disabled:opacity-50"
            >
              {isProcessingUpload ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span>Scanning Photo for QR...</span>
                </>
              ) : (
                <>
                  <FileImage className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>🖼️ Upload QR from Photos / Gallery</span>
                </>
              )}
            </button>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-200">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="flex-1 text-left">{uploadError}</p>
              </div>
            )}
          </div>

          {/* Action Divider OR */}
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Manual Booking Code Entry Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualInput.trim()) {
                verifyAndCheckInBooking(manualInput);
              }
            }}
            className="pt-2 max-w-md mx-auto space-y-2"
          >
            <p className="text-[11px] text-zinc-400 font-semibold">Or enter Booking ID manually:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="QB-2026-1048"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (manualInput.trim()) {
                      verifyAndCheckInBooking(manualInput);
                    }
                  }
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VERIFICATION RESULT SCREEN */}
      {scanResult && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* 1. SUCCESS RESULT CARD */}
          {scanResult.type === 'SUCCESS' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-emerald-500 shadow-2xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      ✓ Check-in Successful
                    </h2>
                    <p className="text-xs text-zinc-500">
                      Guest booking verified & checked in at entrance
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider">
                  CHECKED IN
                </span>
              </div>

              {/* Guest & Reservation Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950/60 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Customer Name</span>
                  <p className="font-extrabold text-sm text-zinc-900 dark:text-white mt-0.5">
                    {scanResult.reservation.customerName}
                  </p>
                  <p className="text-[11px] text-zinc-500">{scanResult.reservation.customerPhone}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Booking ID</span>
                  <p className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                    {scanResult.reservation.reservationId}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Assigned Table</span>
                  <p className="font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                    Table {scanResult.reservation.tableNumber} ({scanResult.reservation.guestCount} Guests)
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Section: {scanResult.reservation.tablePreference}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Schedule</span>
                  <p className="font-bold text-zinc-900 dark:text-white mt-0.5">
                    {formatDate(scanResult.reservation.date)}
                  </p>
                  <p className="text-[11px] text-amber-600 font-semibold">
                    Slot: {formatTime12h(scanResult.reservation.startTime)} - {formatTime12h(scanResult.reservation.endTime)}
                  </p>
                </div>
              </div>

              {/* Pre-ordered Food Items Summary */}
              {scanResult.reservation.preOrderItems && scanResult.reservation.preOrderItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4" /> Pre-ordered Food Items
                    </span>
                    <span>Total: {formatCurrency(scanResult.reservation.preOrderTotal || 0)}</span>
                  </div>
                  <div className="divide-y divide-amber-500/10 text-xs">
                    {scanResult.reservation.preOrderItems.map((item, idx) => (
                      <div key={item.item?.id || idx} className="py-1.5 flex justify-between items-center text-zinc-700 dark:text-zinc-300">
                        <span>
                          {item.quantity}x <strong>{item.item?.name}</strong>
                        </span>
                        <span className="font-semibold">{formatCurrency((item.item?.price || 0) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notification Badge */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                <ChefHat className="w-4 h-4 text-purple-600" />
                <span>Kitchen Display Ticket status automatically set to <strong>COOKING</strong>.</span>
              </div>
            </div>
          )}

          {/* 2. ALREADY CHECKED-IN CARD */}
          {scanResult.type === 'ALREADY_CHECKED_IN' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-blue-500 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-blue-600 dark:text-blue-400">
                      Already Checked-in
                    </h2>
                    <p className="text-xs text-zinc-500">
                      This QR pass has already been processed
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold uppercase">
                  {scanResult.reservation.bookingStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl">
                <div>
                  <span className="text-zinc-400">Customer:</span>
                  <p className="font-bold text-zinc-900 dark:text-white">
                    {scanResult.reservation.customerName}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">Assigned Table:</span>
                  <p className="font-bold text-amber-600">
                    Table {scanResult.reservation.tableNumber}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">Booking ID:</span>
                  <p className="font-mono font-bold text-zinc-900 dark:text-white">
                    {scanResult.reservation.reservationId}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">Time:</span>
                  <p className="font-bold text-zinc-900 dark:text-white">
                    {formatTime12h(scanResult.reservation.startTime)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. CANCELLED BOOKING CARD */}
          {scanResult.type === 'CANCELLED' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-rose-500 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-rose-600 dark:text-rose-400">
                    Booking Cancelled
                  </h2>
                  <p className="text-xs text-zinc-500">
                    This reservation was cancelled and cannot be checked in.
                  </p>
                </div>
              </div>

              <div className="text-xs space-y-1 text-zinc-600 dark:text-zinc-300">
                <p>
                  Booking ID: <strong className="font-mono text-rose-600">{scanResult.reservation.reservationId}</strong>
                </p>
                <p>Customer: <strong>{scanResult.reservation.customerName}</strong></p>
              </div>
            </div>
          )}

          {/* 4. WRONG RESTAURANT CARD */}
          {scanResult.type === 'WRONG_RESTAURANT' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-amber-500 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-amber-600 dark:text-amber-400">
                    Invalid Restaurant
                  </h2>
                  <p className="text-xs text-zinc-500">
                    This booking does not belong to this restaurant.
                  </p>
                </div>
              </div>

              <div className="text-xs space-y-1.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
                <p>
                  Scanned Booking belongs to: <strong>{scanResult.targetRestaurantName}</strong>
                </p>
                <p>
                  Currently Operating Staff Scanner: <strong>{currentRestaurant.name}</strong>
                </p>
              </div>
            </div>
          )}

          {/* 5. INVALID QR CARD */}
          {scanResult.type === 'INVALID_QR' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-zinc-400 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-800 dark:text-zinc-200">
                    Invalid QR Code
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Please scan a valid QueueBite booking QR code.
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-mono text-zinc-400 break-all">
                Payload scanned: &quot;{scanResult.rawPayload}&quot;
              </p>
            </div>
          )}

          {/* RESET / SCAN ANOTHER CUSTOMER BUTTON */}
          <button
            type="button"
            onClick={handleResetScan}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Scan Another Customer
          </button>
        </div>
      )}
    </div>
  );
}
