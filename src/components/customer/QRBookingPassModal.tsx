'use client';

import React from 'react';
import { store } from '@/lib/store';
import { Reservation, QueueToken } from '@/lib/types';
import {
  formatDate,
  formatTime12h,
  formatCurrency,
  svgToPngDataUrl,
  downloadDataUrl,
  downloadPdfPass,
} from '@/lib/utils';
import {
  X,
  QrCode,
  Calendar,
  Clock,
  Users,
  MapPin,
  UtensilsCrossed,
  CheckCircle2,
  Download,
  Edit3,
  Trash2,
  Navigation,
  Sparkles,
  ChefHat,
} from 'lucide-react';

export default function QRBookingPassModal({
  booking,
  onClose,
}: {
  booking: Reservation | QueueToken | null;
  onClose: () => void;
}) {
  if (!booking) return null;

  const isReservation = 'reservationId' in booking;
  const passId = isReservation ? (booking as Reservation).reservationId : (booking as QueueToken).tokenId;

  const state = store.getState();
  const restaurant = state.restaurants.find((r) => r.id === booking.restaurantId) || state.restaurants[0];
  const restaurantName = isReservation ? (booking as Reservation).restaurantName : restaurant.name;
  const restaurantAddress = restaurant.address;

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-emerald-500 text-white',
    CHECKED_IN: 'bg-blue-500 text-white',
    SEATED: 'bg-amber-500 text-zinc-950',
    COMPLETED: 'bg-zinc-700 text-white',
    CANCELLED: 'bg-rose-500 text-white',
    NO_SHOW: 'bg-red-700 text-white',
    // Queue statuses
    WAITING: 'bg-emerald-500 text-white',
    CALLING: 'bg-amber-500 text-zinc-950 animate-pulse',
  };

  const bookingStatus = isReservation ? (booking as Reservation).bookingStatus : (booking as QueueToken).status;

  const steps = isReservation
    ? [
        { label: 'Confirmed', done: true },
        { label: 'Checked-In', done: bookingStatus === 'CHECKED_IN' || bookingStatus === 'SEATED' || bookingStatus === 'COMPLETED' },
        { label: 'Seated', done: bookingStatus === 'SEATED' || bookingStatus === 'COMPLETED' },
        { label: 'Completed', done: bookingStatus === 'COMPLETED' },
      ]
    : [
        { label: 'Joined Queue', done: true },
        { label: 'Calling', done: bookingStatus === 'CALLING' || bookingStatus === 'SEATED' },
        { label: 'Seated', done: bookingStatus === 'SEATED' },
      ];

  const progressPercent = isReservation
    ? (bookingStatus === 'COMPLETED'
        ? 100
        : bookingStatus === 'SEATED'
        ? 75
        : bookingStatus === 'CHECKED_IN'
        ? 50
        : 25)
    : (bookingStatus === 'SEATED'
        ? 100
        : bookingStatus === 'CALLING'
        ? 66
        : 33);

  const handleDownloadQR = async () => {
    try {
      const svgElement = document.getElementById('qr-code-svg') as unknown as SVGElement;
      if (svgElement) {
        const dataUrl = await svgToPngDataUrl(svgElement);
        downloadDataUrl(dataUrl, `queuebite-qr-${passId}.png`);
      }
    } catch (err) {
      console.error('Failed to download QR code', err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const svgElement = document.getElementById('qr-code-svg') as unknown as SVGElement;
      if (svgElement) {
        const dataUrl = await svgToPngDataUrl(svgElement);
        await downloadPdfPass(booking, restaurantName, restaurantAddress, dataUrl);
      }
    } catch (err) {
      console.error('Failed to download PDF pass', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Pass Top Bar */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            <h3 className="text-sm font-extrabold tracking-wide">
              {isReservation ? 'DIGITAL BOOKING PASS' : 'LIVE QUEUE TOKEN'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Tracker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1 ${
                    s.done ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                      s.done
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* QR Code Container */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-center space-y-3">
            {/* SVG Simulated QR code */}
            <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-md border border-zinc-200 flex flex-col items-center justify-center">
              <svg id="qr-code-svg" viewBox="0 0 100 100" className="w-full h-full text-zinc-900">
                <rect width="100" height="100" fill="white" />
                {/* Corner markers */}
                <rect x="5" y="5" width="30" height="30" fill="black" />
                <rect x="9" y="9" width="22" height="22" fill="white" />
                <rect x="13" y="13" width="14" height="14" fill="black" />

                <rect x="65" y="5" width="30" height="30" fill="black" />
                <rect x="69" y="9" width="22" height="22" fill="white" />
                <rect x="73" y="13" width="14" height="14" fill="black" />

                <rect x="5" y="65" width="30" height="30" fill="black" />
                <rect x="9" y="69" width="22" height="22" fill="white" />
                <rect x="13" y="73" width="14" height="14" fill="black" />

                {/* Random QR pixels for unique pattern */}
                <rect x="42" y="10" width="6" height="6" fill="black" />
                <rect x="52" y="10" width="6" height="6" fill="black" />
                <rect x="42" y="24" width="8" height="8" fill="black" />
                <rect x="54" y="24" width="6" height="6" fill="black" />

                <rect x="10" y="42" width="8" height="8" fill="black" />
                <rect x="22" y="42" width="6" height="6" fill="black" />
                <rect x="10" y="54" width="6" height="6" fill="black" />
                <rect x="22" y="54" width="8" height="8" fill="black" />

                <rect x="42" y="42" width="16" height="16" fill="black" />
                <rect x="46" y="46" width="8" height="8" fill="white" />
                <rect x="65" y="45" width="10" height="6" fill="black" />
                <rect x="80" y="45" width="12" height="8" fill="black" />
                <rect x="65" y="58" width="8" height="8" fill="black" />
                <rect x="78" y="58" width="14" height="6" fill="black" />

                <rect x="42" y="65" width="12" height="6" fill="black" />
                <rect x="58" y="65" width="6" height="8" fill="black" />
                <rect x="42" y="78" width="6" height="14" fill="black" />
                <rect x="54" y="78" width="14" height="8" fill="black" />
                <rect x="75" y="75" width="16" height="16" fill="black" />
              </svg>
            </div>

            <div>
              <p className="text-base font-mono font-black text-zinc-900 dark:text-white">
                {passId}
              </p>
              <p className="text-[11px] text-zinc-500">Show this QR pass at the entrance</p>
            </div>

            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                statusColors[bookingStatus] || 'bg-zinc-500 text-white'
              }`}
            >
              {bookingStatus.replace('_', ' ')}
            </span>

            {/* QR and PDF Download Action Buttons */}
            <div className="flex justify-center gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-700/60 mt-2">
              <button
                onClick={handleDownloadQR}
                className="py-1.5 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR
              </button>
              <button
                onClick={handleDownloadPDF}
                className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-amber-500/10"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Details Ticket */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 text-xs">
            <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
              <span className="text-zinc-500">Restaurant</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                {restaurantName}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
              <span className="text-zinc-500">Guest Name</span>
              <span className="font-bold text-zinc-900 dark:text-white">{booking.customerName}</span>
            </div>
            
            {isReservation ? (
              <>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-zinc-500">Date & Slot</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {formatDate((booking as Reservation).date)} • {formatTime12h((booking as Reservation).startTime)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-zinc-500">Assigned Table</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    {(booking as Reservation).tableNumber} ({(booking as Reservation).guestCount} Guests • {(booking as Reservation).tablePreference})
                  </span>
                </div>

                {(booking as Reservation).preOrderItems.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-zinc-500 block mb-1">
                      Pre-Ordered Food ({(booking as Reservation).preOrderItems.length} items):
                    </span>
                    <div className="space-y-1 bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      {(booking as Reservation).preOrderItems.map((pi, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span>{pi.quantity}x {pi.item.name}</span>
                          <span className="font-bold">{formatCurrency(pi.item.price * pi.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700 text-amber-600 dark:text-amber-400 font-bold">
                        <span>Kitchen Prep Start</span>
                        <span>{formatTime12h((booking as Reservation).prepStartTime || '19:15')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-zinc-500">Joined Queue</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {new Date((booking as QueueToken).joinedAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-zinc-500">Party Size</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {(booking as QueueToken).guestCount} Guests
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-zinc-500">Table Preference</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {(booking as QueueToken).tablePreference} Seating
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  <span className="text-zinc-500">Estimated Wait</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    ~{(booking as QueueToken).estimatedWaitMinutes} mins
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {isReservation && (
            <div className="space-y-2 pt-1">
              {(booking as Reservation).bookingStatus === 'CONFIRMED' && (
                <button
                  onClick={() => {
                    store.checkInReservation((booking as Reservation).reservationId);
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simulate Geolocation Check-In Now
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    store.setSelectedBookingForModify(booking as Reservation);
                  }}
                  className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modify Booking
                </button>

                <button
                  onClick={() => {
                    onClose();
                    store.setSelectedBookingForCancel(booking as Reservation);
                  }}
                  className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancel Booking
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
