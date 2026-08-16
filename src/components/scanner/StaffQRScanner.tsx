'use client';

import React, { useState } from 'react';
import { store, AppState } from '@/lib/store';
import { Reservation } from '@/lib/types';
import { formatDate, formatTime12h, formatCurrency } from '@/lib/utils';
import {
  QrCode,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Camera,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function StaffQRScanner() {
  const [state, setState] = React.useState<AppState>(store.getState());
  const [scannedRes, setScannedRes] = useState<Reservation | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  React.useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const handleSimulateScan = (res: Reservation) => {
    setIsScanning(true);
    setTimeout(() => {
      setScannedRes(res);
      setIsScanning(false);
    }, 500);
  };

  const handleAdvanceStatus = (res: Reservation) => {
    if (res.bookingStatus === 'CONFIRMED') {
      store.checkInReservation(res.reservationId);
      setScannedRes({ ...res, bookingStatus: 'CHECKED_IN' });
    } else if (res.bookingStatus === 'CHECKED_IN') {
      store.seatReservation(res.reservationId);
      setScannedRes({ ...res, bookingStatus: 'SEATED' });
    } else if (res.bookingStatus === 'SEATED') {
      store.completeReservation(res.reservationId);
      setScannedRes({ ...res, bookingStatus: 'COMPLETED' });
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      {/* Scanner Header Banner */}
      <div className="p-6 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black">Staff Entrance Scanner</h1>
            <p className="text-xs text-zinc-400">
              Scan customer QR passes to check-in diners and notify kitchen
            </p>
          </div>
        </div>
      </div>

      {/* Simulated Scanner Viewfinder */}
      <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="w-56 h-56 mx-auto rounded-3xl border-2 border-dashed border-purple-500/70 p-4 flex flex-col items-center justify-center relative bg-purple-950/20">
          {/* Laser scanning line animation */}
          <div className="absolute top-2 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />
          <Camera className="w-10 h-10 text-purple-400 mb-2" />
          <p className="text-xs font-bold text-zinc-300">Point Camera at Customer QR</p>
          <p className="text-[10px] text-zinc-500 mt-1">Simulate by clicking a booking below</p>
        </div>
      </div>

      {/* Scanned Result Card */}
      {scannedRes && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-purple-500 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Verified QR Scan</span>
              <h3 className="text-lg font-mono font-black text-purple-600 dark:text-purple-400">
                {scannedRes.reservationId}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-500 text-white font-black text-xs uppercase">
              {scannedRes.bookingStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-400">Customer:</span>
              <p className="font-bold text-zinc-900 dark:text-white">{scannedRes.customerName}</p>
            </div>
            <div>
              <span className="text-zinc-400">Assigned Table:</span>
              <p className="font-extrabold text-amber-600 text-sm">
                Table {scannedRes.tableNumber} ({scannedRes.guestCount} Guests)
              </p>
            </div>
            <div>
              <span className="text-zinc-400">Reservation Time:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {formatDate(scannedRes.date)} at {formatTime12h(scannedRes.startTime)}
              </p>
            </div>
            <div>
              <span className="text-zinc-400">Pre-Order Status:</span>
              <p className="font-bold text-emerald-600">
                {scannedRes.preOrderItems.length > 0
                  ? `${scannedRes.preOrderItems.length} items (Prep: ${formatTime12h(scannedRes.prepStartTime || '19:15')})`
                  : 'No Pre-Order'}
              </p>
            </div>
          </div>

          {/* Advance status action */}
          <div className="pt-2">
            {scannedRes.bookingStatus === 'CONFIRMED' && (
              <button
                onClick={() => handleAdvanceStatus(scannedRes)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Check-In Customer & Notify Kitchen
              </button>
            )}

            {scannedRes.bookingStatus === 'CHECKED_IN' && (
              <button
                onClick={() => handleAdvanceStatus(scannedRes)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" /> Escort & Seat at Table {scannedRes.tableNumber}
              </button>
            )}

            {scannedRes.bookingStatus === 'SEATED' && (
              <button
                onClick={() => handleAdvanceStatus(scannedRes)}
                className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                <UtensilsCrossed className="w-4 h-4" /> Complete Dining & Free Table
              </button>
            )}

            {scannedRes.bookingStatus === 'COMPLETED' && (
              <div className="text-center py-2 text-xs font-bold text-emerald-600">
                ✓ Guest completed meal. Table released for cleaning.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click-to-Scan Quick Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
          Active Customer QR Passes (Click to Simulate Scan)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {state.reservations.map((res) => (
            <button
              key={res.reservationId}
              onClick={() => handleSimulateScan(res)}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-amber-600">{res.reservationId}</span>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">{res.bookingStatus}</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white mt-1">
                  {res.customerName} (Table {res.tableNumber})
                </h4>
                <p className="text-[11px] text-zinc-500">{formatTime12h(res.startTime)} • {res.guestCount} Guests</p>
              </div>

              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
