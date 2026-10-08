'use client';

import React, { useState } from 'react';
import { store, AppState } from '@/lib/store';
import { TableSection, QueueToken } from '@/lib/types';
import {
  X,
  Clock,
  Users,
  UtensilsCrossed,
  CheckCircle2,
  Sparkles,
  Ticket,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function LiveQueueModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<AppState>(store.getState());
  const [customerName, setCustomerName] = useState<string>('Vikram Malhotra');
  const [customerPhone, setCustomerPhone] = useState<string>('+91 99887 76655');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [tablePreference, setTablePreference] = useState<TableSection>('ANY');
  const [issuedToken, setIssuedToken] = useState<QueueToken | null>(null);

  if (!isOpen) return null;

  const restaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  const waitingTokens = state.queueTokens.filter((q) => q.status === 'WAITING');
  const estimatedWait = Math.max(5, (waitingTokens.length + 1) * 8 + (guestCount > 4 ? 10 : 0));

  const handleJoinQueue = (e: React.FormEvent) => {
    e.preventDefault();
    const token = store.joinLiveQueue({
      restaurantId: restaurant.id,
      customerName,
      customerPhone,
      guestCount,
      tablePreference,
    });
    setIssuedToken(token);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            <h3 className="text-sm font-extrabold">Join Live Walk-In Queue • {restaurant.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!issuedToken ? (
            <form onSubmit={handleJoinQueue} className="space-y-4 text-xs">
              {/* Live Queue Stat Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                    Live Walk-In Queue
                  </p>
                  <p className="text-base font-extrabold text-emerald-950 dark:text-white">
                    {waitingTokens.length} Groups Ahead of You
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                    Estimated Wait
                  </p>
                  <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                    ~{estimatedWait} mins
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mobile Number (For SMS Alert)
                </label>
                <input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Number of Guests
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="text-xl font-black text-emerald-600">{guestCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => Math.min(10, g + 1))}
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 text-xs flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  Get Live Queue Token
                </button>
              </div>
            </form>
          ) : (
            /* Token Issued View */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-zinc-900 dark:text-white">
                  You are in Line!
                </h4>
                <p className="text-xs text-zinc-500">We will notify you the moment your table is ready</p>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Your Queue Token</span>
                <p className="text-4xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {issuedToken.tokenId}
                </p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {issuedToken.guestCount} Guests • Estimated Wait: ~{issuedToken.estimatedWaitMinutes} mins
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
