'use client';

import React, { useState } from 'react';
import { store, AppState } from '@/lib/store';
import { Reservation, QueueToken } from '@/lib/types';
import { formatDate, formatTime12h, formatCurrency } from '@/lib/utils';
import {
  CalendarCheck,
  Clock,
  QrCode,
  Edit3,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Ticket,
  MapPin,
  UtensilsCrossed,
} from 'lucide-react';

export default function MyBookingsView({
  onOpenBookingModal,
}: {
  onOpenBookingModal: () => void;
}) {
  const [state, setState] = React.useState<AppState>(store.getState());
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'QUEUE'>('UPCOMING');

  const [sessionPhone, setSessionPhone] = useState<string>('');
  const [tempPhoneInput, setTempPhoneInput] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('qb_session_phone');
      if (savedPhone) {
        setSessionPhone(savedPhone);
        setTempPhoneInput(savedPhone);
        setIsLoggedIn(true);
      }
    }
  }, []);

  React.useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempPhoneInput.trim()) return;
    localStorage.setItem('qb_session_phone', tempPhoneInput.trim());
    setSessionPhone(tempPhoneInput.trim());
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('qb_session_phone');
    setSessionPhone('');
    setTempPhoneInput('');
    setIsLoggedIn(false);
  };

  const cleanPhone = (p: string) => p.replace(/\s+/g, '').replace(/[^0-9]/g, '');

  const upcomingReservations = state.reservations.filter(
    (r) => {
      const matchPhone = isLoggedIn ? cleanPhone(r.customerPhone) === cleanPhone(sessionPhone) : false;
      return matchPhone && (r.bookingStatus === 'CONFIRMED' || r.bookingStatus === 'CHECKED_IN' || r.bookingStatus === 'SEATED');
    }
  );

  const completedReservations = state.reservations.filter(
    (r) => {
      const matchPhone = isLoggedIn ? cleanPhone(r.customerPhone) === cleanPhone(sessionPhone) : false;
      return matchPhone && r.bookingStatus === 'COMPLETED';
    }
  );

  const cancelledReservations = state.reservations.filter(
    (r) => {
      const matchPhone = isLoggedIn ? cleanPhone(r.customerPhone) === cleanPhone(sessionPhone) : false;
      return matchPhone && (r.bookingStatus === 'CANCELLED' || r.bookingStatus === 'NO_SHOW');
    }
  );

  const activeQueueTokens = state.queueTokens.filter(
    (q) => {
      return isLoggedIn ? cleanPhone(q.customerPhone) === cleanPhone(sessionPhone) : false;
    }
  );

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl">
            🔑
          </div>
          <h3 className="text-lg font-black text-zinc-900 dark:text-white">Retrieve Passes & Bookings</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Forget to take a screenshot or download your queue token/reservation pass? Log in with your phone number to get it.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="font-bold text-zinc-400 uppercase tracking-widest pl-1">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 99887 76655"
              value={tempPhoneInput}
              onChange={(e) => setTempPhoneInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-800 dark:text-zinc-100 font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            Find Active Passes
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Session Active Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-amber-500 animate-pulse" />
          Active Seating Session: {sessionPhone} (Retrieved bookings across all devices)
        </span>
        <button
          onClick={handleLogout}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-zinc-950 text-[10px] font-black hover:bg-amber-600 self-start sm:self-auto transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-amber-500" />
            My Bookings & Queue Passes
          </h2>
          <p className="text-xs text-zinc-500">
            Manage your active restaurant reservations, QR passes and live walk-in queue tokens
          </p>
        </div>

        <button
          onClick={onOpenBookingModal}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Book Another Table
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'UPCOMING'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Upcoming ({upcomingReservations.length})
        </button>

        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'QUEUE'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Live Queue Tokens ({activeQueueTokens.length})
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'COMPLETED'
              ? 'bg-zinc-800 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed ({completedReservations.length})
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'CANCELLED'
              ? 'bg-rose-500 text-white shadow-md'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Cancelled ({cancelledReservations.length})
        </button>
      </div>

      {/* List Container */}
      <div className="space-y-4">
        {activeTab === 'UPCOMING' && (
          <>
            {upcomingReservations.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <CalendarCheck className="w-12 h-12 text-zinc-300 mx-auto" />
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  No upcoming reservations
                </h3>
                <button
                  onClick={onOpenBookingModal}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold shadow"
                >
                  Book a Table Now
                </button>
              </div>
            ) : (
              upcomingReservations.map((res) => (
                <div
                  key={res.reservationId}
                  className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-black border border-amber-500/20">
                        {res.reservationId}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          res.bookingStatus === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : res.bookingStatus === 'CHECKED_IN'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {res.bookingStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                      {res.restaurantName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        Table {res.tableNumber}
                      </span>
                      <span>•</span>
                      <span>{res.guestCount} Guests</span>
                      <span>•</span>
                      <span>{formatDate(res.date)} at {formatTime12h(res.startTime)}</span>
                    </div>

                    {res.preOrderItems.length > 0 && (
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 pt-1">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pre-Ordered: {res.preOrderItems.length} items (Prep start: {formatTime12h(res.prepStartTime || '19:15')})</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => store.setSelectedBookingForQR(res)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow flex items-center gap-1.5 hover:scale-105 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      QR Pass
                    </button>

                    {res.bookingStatus === 'CONFIRMED' && (
                      <button
                        onClick={() => store.checkInReservation(res.reservationId)}
                        className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        Check-In
                      </button>
                    )}

                    <button
                      onClick={() => store.setSelectedBookingForModify(res)}
                      className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition-colors"
                      title="Modify"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => store.setSelectedBookingForCancel(res)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Cancel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Live Queue Tokens Tab */}
        {activeTab === 'QUEUE' && (
          <>
            {activeQueueTokens.map((token) => (
              <div
                key={token.tokenId}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {token.tokenId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">
                      {token.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    {token.customerName} • {token.guestCount} Guests
                  </p>
                  <p className="text-xs text-zinc-500">
                    Est. Wait Time: ~{token.estimatedWaitMinutes} mins
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {token.status === 'CALLING' && (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-black animate-pulse">
                      🔔 Proceed to Table {token.assignedTableNumber || 'T-1'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Completed Tab */}
        {activeTab === 'COMPLETED' && (
          <>
            {completedReservations.map((res) => (
              <div
                key={res.reservationId}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between opacity-80"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs">{res.reservationId}</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold">
                      COMPLETED
                    </span>
                  </div>
                  <h4 className="text-sm font-bold">{res.restaurantName}</h4>
                  <p className="text-xs text-zinc-500">
                    {formatDate(res.date)} • Table {res.tableNumber} • {res.guestCount} Guests
                  </p>
                </div>

                <button
                  onClick={onOpenBookingModal}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 hover:bg-amber-100 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Book Again
                </button>
              </div>
            ))}
          </>
        )}

        {/* Cancelled Tab */}
        {activeTab === 'CANCELLED' && (
          <>
            {cancelledReservations.map((res) => (
              <div
                key={res.reservationId}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between opacity-70"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs line-through text-zinc-400">
                      {res.reservationId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">
                      CANCELLED
                    </span>
                  </div>
                  <h4 className="text-sm font-bold">{res.restaurantName}</h4>
                  <p className="text-xs text-zinc-500">
                    {formatDate(res.date)} • {res.notes || 'Cancelled'}
                  </p>
                </div>

                <button
                  onClick={onOpenBookingModal}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-xs"
                >
                  Book Again
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
