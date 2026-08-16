'use client';

import React, { useState } from 'react';
import { store, AppState } from '@/lib/store';
import { Reservation, TableSection } from '@/lib/types';
import { formatDate, formatTime12h, getTodayDateString, getTomorrowDateString } from '@/lib/utils';
import {
  X,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function ModifyBookingModal({
  booking,
  onClose,
}: {
  booking: Reservation | null;
  onClose: () => void;
}) {
  const [date, setDate] = useState<string>(booking?.date || '');
  const [timeSlot, setTimeSlot] = useState<string>(booking?.startTime || '');
  const [guestCount, setGuestCount] = useState<number>(booking?.guestCount || 1);
  const [tablePreference, setTablePreference] = useState<TableSection>(booking?.tablePreference || 'ANY');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!booking) return null;

  const slots = ['12:00', '12:30', '13:00', '13:30', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

  const handleSave = () => {
    setErrorMsg(null);
    const result = store.modifyReservation(booking.reservationId, {
      date,
      startTime: timeSlot,
      guestCount,
      tablePreference,
    });

    if (result.success) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Requested slot is unavailable.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            <h3 className="text-sm font-extrabold">Modify Reservation • {booking.reservationId}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDate(getTodayDateString())}
                className={`p-2.5 rounded-xl border text-center font-bold ${
                  date === getTodayDateString() ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Today ({formatDate(getTodayDateString())})
              </button>
              <button
                type="button"
                onClick={() => setDate(getTomorrowDateString())}
                className={`p-2.5 rounded-xl border text-center font-bold ${
                  date === getTomorrowDateString() ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600' : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Tomorrow ({formatDate(getTomorrowDateString())})
              </button>
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Time Slot
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`p-2 rounded-xl border text-center font-bold ${
                    timeSlot === slot
                      ? 'border-amber-500 bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {formatTime12h(slot)}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Party Size (Guests)
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold"
              >
                -
              </button>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">{guestCount}</span>
              <button
                type="button"
                onClick={() => setGuestCount((g) => Math.min(8, g + 1))}
                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20 hover:bg-amber-600"
            >
              Confirm Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CancelBookingModal({
  booking,
  onClose,
}: {
  booking: Reservation | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>('Change of plans');

  if (!booking) return null;

  const handleCancel = () => {
    store.cancelReservation(booking.reservationId, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-4 bg-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            <h3 className="text-sm font-extrabold">Cancel Reservation</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
            <p className="font-bold">Are you sure you want to cancel {booking.reservationId}?</p>
            <p className="mt-1 text-[11px]">
              Table {booking.tableNumber} for {formatDate(booking.date)} at {formatTime12h(booking.startTime)} will be released immediately.
            </p>
            {booking.depositAmount > 0 && (
              <p className="mt-1.5 font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                ✓ 100% Refund of ₹{booking.depositAmount} deposit will be credited back to your payment source.
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Reason for cancellation:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800"
            >
              <option>Change of plans</option>
              <option>Unable to reach restaurant on time</option>
              <option>Booking made by mistake</option>
              <option>Found another restaurant</option>
            </select>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 font-bold"
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 rounded-xl bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20 hover:bg-rose-600"
            >
              Cancel Reservation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
