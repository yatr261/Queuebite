'use client';

import React, { useState } from 'react';
import { store, AppState } from '@/lib/store';
import { TableSection } from '@/lib/types';
import { getTodayDateString } from '@/lib/utils';
import { X, Clock, Users, CheckCircle2, ListPlus } from 'lucide-react';

export default function WaitlistModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<AppState>(store.getState());
  const [name, setName] = useState<string>('Sanjay Deshmukh');
  const [phone, setPhone] = useState<string>('+91 98220 33445');
  const [guests, setGuests] = useState<number>(4);
  const [time, setTime] = useState<string>('20:00');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const restaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.joinWaitlist({
      restaurantId: restaurant.id,
      customerName: name,
      customerPhone: phone,
      guestCount: guests,
      preferredDate: getTodayDateString(),
      preferredTime: time,
      tablePreference: 'ANY',
    });
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-4 bg-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5" />
            <h3 className="text-sm font-extrabold">Join Smart Waitlist • {restaurant.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-zinc-500">
                All regular slots are full. Enter your details to get instantly notified if a table cancels or frees up.
              </p>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Your Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Guests</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Preferred Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
              >
                Join Waitlist
              </button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-purple-600 mx-auto" />
              <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                Added to Waitlist!
              </h4>
              <p className="text-zinc-500">
                We&apos;ll send a push notification with a 1-click claim link as soon as a table is released.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 font-bold"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
