'use client';

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { store, AppState } from '@/lib/store';
import { TableSection, PreOrderItem, MenuItem, Reservation } from '@/lib/types';
import {
  formatCurrency,
  formatDate,
  formatTime12h,
  getTodayDateString,
  getTomorrowDateString,
  generateIcsFile,
} from '@/lib/utils';
import { findSmartTableAllocation, getSlotAvailabilityStatus, AllocationResult } from '@/lib/aiAllocation';
import {
  X,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Users,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  QrCode,
  ShieldCheck,
  CreditCard,
  Percent,
  Download,
  MapPin,
  Flame,
  Leaf,
  Info,
} from 'lucide-react';

export default function BookingWizardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<AppState>(store.getState());

  // Form Step State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [timeSlot, setTimeSlot] = useState<string>('19:30');
  const [guestCount, setGuestCount] = useState<number>(4);
  const [tablePreference, setTablePreference] = useState<TableSection>('WINDOW');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [preOrderCart, setPreOrderCart] = useState<Record<string, number>>({});
  const [promoCode, setPromoCode] = useState<string>('PREORDER10');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'CASH_AT_DESK'>('UPI');
  const [customerName, setCustomerName] = useState<string>('Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState<string>('+91 98765 43210');
  const [customerEmail, setCustomerEmail] = useState<string>('rahul.sharma@example.com');

  // AI Allocation Live Result
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const restaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  // Re-calculate AI table allocation whenever inputs change
  const allocation = useMemo(() => {
    if (!restaurant) return null;
    return findSmartTableAllocation({
      restaurant,
      date,
      timeSlot,
      guestCount,
      preference: tablePreference,
      existingReservations: state.reservations,
    });
  }, [restaurant, date, timeSlot, guestCount, tablePreference, state.reservations]);

  if (!isOpen) return null;

  // Available Time Slots
  const lunchSlots = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];
  const dinnerSlots = ['18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  // Table Preferences List
  const preferences: { id: TableSection; title: string; desc: string; icon: string }[] = [
    { id: 'WINDOW', title: 'Window Seat', desc: 'Scenic view & natural lighting', icon: '🪟' },
    { id: 'INDOOR', title: 'Indoor Cozy', desc: 'Quiet & ambient seating', icon: '🛋️' },
    { id: 'OUTDOOR', title: 'Garden Patio', desc: 'Fresh air & fairy-light patio', icon: '🌿' },
    { id: 'AC_SECTION', title: 'AC Section', desc: 'Central cooling & family comfort', icon: '❄️' },
    { id: 'FAMILY', title: 'Family Table', desc: 'Large space for 4-8 persons', icon: '👨‍👩‍👧‍👦' },
    { id: 'COUPLE', title: 'Couple Table', desc: 'Intimate candle-lit 2-seater', icon: '🕯️' },
    { id: 'VIP_LOUNGE', title: 'VIP Lounge', desc: 'Private lounge with dedicated host', icon: '👑' },
    { id: 'ANY', title: 'Any Available', desc: 'Quickest table assignment', icon: '✨' },
  ];

  // Pre-Order Calculations
  const selectedPreOrderItems: PreOrderItem[] = Object.entries(preOrderCart)
    .filter(([_, qty]) => qty > 0)
    .map(([itemId, qty]) => {
      const item = restaurant.menu.find((m) => m.id === itemId)!;
      return { item, quantity: qty };
    });

  const preOrderSubtotal = selectedPreOrderItems.reduce(
    (acc, pi) => acc + pi.item.price * pi.quantity,
    0
  );

  const discountAmount =
    selectedPreOrderItems.length > 0 ? Math.round(preOrderSubtotal * 0.1) : 0;
  const preOrderFinal = Math.max(0, preOrderSubtotal - discountAmount);
  const depositAmount = restaurant.depositRequired ? restaurant.depositAmount : 0;
  const grandTotal = preOrderFinal + depositAmount;

  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    setTimeout(() => {
      const res = store.createReservation({
        restaurantId: restaurant.id,
        customerName,
        customerPhone,
        customerEmail,
        date,
        startTime: timeSlot,
        guestCount,
        tablePreference,
        specialRequests,
        preOrderItems: selectedPreOrderItems,
        discountCode: promoCode,
        paymentMethod,
      });

      setIsSubmitting(false);
      if (res.success && res.reservation) {
        setConfirmedReservation(res.reservation);
        setCurrentStep(7); // Final step
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // confetti fallback
        }
      } else {
        setErrorMessage(res.error || 'Failed to allocate table. Please try another time.');
      }
    }, 600);
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setPreOrderCart((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const nextStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  const prevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Reserve Table • {restaurant.name}
              </h2>
              <p className="text-[11px] text-zinc-500">
                Step {currentStep} of 6 • AI Conflict-Free Booking
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              store.setActiveBookingModal(false);
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        {currentStep < 7 && (
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Date Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-amber-500" />
                  Select Reservation Date
                </h3>
                <p className="text-xs text-zinc-500">Choose when you would like to visit</p>
              </div>

              {/* Quick Date Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Today', value: getTodayDateString() },
                  { label: 'Tomorrow', value: getTomorrowDateString() },
                  {
                    label: 'In 2 Days',
                    value: (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 2);
                      return d.toISOString().split('T')[0];
                    })(),
                  },
                  {
                    label: 'This Weekend',
                    value: (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      return d.toISOString().split('T')[0];
                    })(),
                  },
                ].map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setDate(chip.value)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      date === chip.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{chip.label}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {formatDate(chip.value)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Custom Date Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Or pick a custom date:
                </label>
                <input
                  type="date"
                  min={getTodayDateString()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Time Slot Selection */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Select Dining Time Slot
                </h3>
                <p className="text-xs text-zinc-500">
                  Slots update dynamically based on live table occupancy
                </p>
              </div>

              {/* Lunch Slots */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  ☀️ Lunch Slots (12:00 PM – 3:30 PM)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {lunchSlots.map((slot) => {
                    const status = getSlotAvailabilityStatus(
                      restaurant,
                      date,
                      slot,
                      guestCount,
                      state.reservations
                    );
                    const isSelected = timeSlot === slot;
                    const isFull = status === 'FULL';

                    return (
                      <button
                        key={slot}
                        disabled={isFull}
                        onClick={() => setTimeSlot(slot)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 text-zinc-900 dark:text-white font-bold ring-2 ring-amber-500'
                            : isFull
                            ? 'opacity-40 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{formatTime12h(slot)}</span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              status === 'AVAILABLE'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : status === 'LIMITED'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/20 text-rose-600'
                            }`}
                          >
                            {status === 'AVAILABLE' ? 'Available' : status === 'LIMITED' ? 'Almost Full' : 'Full'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dinner Slots */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  🌙 Dinner Slots (6:30 PM – 10:30 PM)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dinnerSlots.map((slot) => {
                    const status = getSlotAvailabilityStatus(
                      restaurant,
                      date,
                      slot,
                      guestCount,
                      state.reservations
                    );
                    const isSelected = timeSlot === slot;
                    const isFull = status === 'FULL';

                    return (
                      <button
                        key={slot}
                        disabled={isFull}
                        onClick={() => setTimeSlot(slot)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 text-zinc-900 dark:text-white font-bold ring-2 ring-amber-500'
                            : isFull
                            ? 'opacity-40 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{formatTime12h(slot)}</span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              status === 'AVAILABLE'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : status === 'LIMITED'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/20 text-rose-600'
                            }`}
                          >
                            {status === 'AVAILABLE' ? 'Available' : status === 'LIMITED' ? 'Almost Full' : 'Full'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Number of Guests */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  How many people are dining?
                </h3>
                <p className="text-xs text-zinc-500">
                  Select your exact party size to allocate optimal table seating
                </p>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-center gap-6 py-6">
                <button
                  onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                  className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white flex items-center justify-center font-bold text-xl transition-transform active:scale-90"
                >
                  <Minus className="w-6 h-6" />
                </button>

                <div className="text-center min-w-28">
                  <span className="text-5xl font-black text-amber-600 dark:text-amber-400">
                    {guestCount}
                  </span>
                  <p className="text-xs font-bold text-zinc-500 mt-1">
                    {guestCount === 1 ? 'Guest' : 'Guests'}
                  </p>
                </div>

                <button
                  onClick={() => setGuestCount((g) => Math.min(12, g + 1))}
                  className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white flex items-center justify-center font-bold text-xl transition-transform active:scale-90"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Table match hint */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  💡 Best table available for {guestCount} guests:
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                  {guestCount <= 2
                    ? '2-Seater Cozy Window / Outdoor Balcony Table'
                    : guestCount <= 4
                    ? '4-Seater Booth or AC Family Table'
                    : guestCount <= 6
                    ? '6-Seater Garden Gazebo'
                    : '8-Seater VIP Lounge Section'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Table Preference & AI Smart Allocation */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Table Preference & AI Allocation
                </h3>
                <p className="text-xs text-zinc-500">
                  Choose your preferred ambience. AI will intelligently match the best available table.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {preferences.map((pref) => (
                  <button
                    key={pref.id}
                    onClick={() => setTablePreference(pref.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      tablePreference === pref.id
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{pref.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{pref.title}</h4>
                        <p className="text-[10px] text-zinc-500 truncate">{pref.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Live AI Smart Table Allocation Output Card */}
              {allocation && (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    allocation.isAvailable
                      ? allocation.isExactPreferenceMatch
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/50'
                      : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        allocation.isAvailable
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white">
                        AI Table Allocation Engine
                      </h4>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {allocation.aiExplanation}
                      </p>

                      {/* Alternative suggestion quick action buttons */}
                      {!allocation.isExactPreferenceMatch && allocation.alternativeTable && (
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Accept alternative table
                              setTablePreference(allocation.alternativeTable!.section);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-sm"
                          >
                            Confirm Alternative ({allocation.alternativeTable.sectionName})
                          </button>
                        </div>
                      )}

                      {!allocation.isAvailable && allocation.alternativeTimeSlots && (
                        <div className="pt-2 space-y-1">
                          <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                            Available Alternative Times:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {allocation.alternativeTimeSlots.map((altSlot) => (
                              <button
                                key={altSlot}
                                onClick={() => setTimeSlot(altSlot)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
                              >
                                {formatTime12h(altSlot)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Special Requests */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Special Requests (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. High chair for toddler, birthday celebration decoration"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Food Pre-Ordering ("Make Your Visit Faster") */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                    Make Your Visit Faster (Pre-Order Food)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Kitchen will start timed preparation 15 mins before your reservation
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
                  10% OFF APPLIED
                </span>
              </div>

              {/* Pre-Order Menu List */}
              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                {restaurant.menu.map((item) => {
                  const qty = preOrderCart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              item.dietary === 'NON_VEG'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                            }`}
                          >
                            {item.dietary === 'NON_VEG' ? 'NV' : 'VEG'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">{item.description}</p>
                        <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        {qty === 0 ? (
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-700 p-1 rounded-xl">
                            <button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold px-1.5">{qty}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart Summary Pill */}
              {selectedPreOrderItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white">
                      {selectedPreOrderItems.reduce((a, b) => a + b.quantity, 0)} Items Added
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Includes 10% Pre-Order Discount (-{formatCurrency(discountAmount)})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {formatCurrency(preOrderFinal)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Customer Details, Deposit & Payment */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  Booking Summary & Confirmation
                </h3>
                <p className="text-xs text-zinc-500">
                  Review your reservation details before locking your table
                </p>
              </div>

              {/* Customer Info Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Order / Deposit Summary Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Table Allocation</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {allocation?.assignedTable?.tableNumber} ({guestCount} Guests • {formatDate(date)} at {formatTime12h(timeSlot)})
                  </span>
                </div>

                {selectedPreOrderItems.length > 0 && (
                  <>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Pre-Order Subtotal ({selectedPreOrderItems.length} items)</span>
                      <span>{formatCurrency(preOrderSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Pre-Order Discount (10% OFF)</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  </>
                )}

                {restaurant.depositRequired && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    <div>
                      <span className="font-semibold">Table Reservation Deposit</span>
                      <p className="text-[10px] text-zinc-400">
                        Adjustable against final dine-in bill
                      </p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(restaurant.depositAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Total Payable Now</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              {grandTotal > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'UPI', label: 'UPI (GPay/PhonePe)', icon: '⚡' },
                      { id: 'CARD', label: 'Credit/Debit Card', icon: '💳' },
                      { id: 'NETBANKING', label: 'Net Banking', icon: '🏦' },
                      { id: 'CASH_AT_DESK', label: 'Pay at Desk', icon: '💵' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethod === pm.id
                            ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="block text-base mb-0.5">{pm.icon}</span>
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Booking Confirmed Screen */}
          {currentStep === 7 && confirmedReservation && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                  Booking Confirmed 🎉
                </h3>
                <p className="text-xs text-zinc-500">
                  Your table has been guaranteed and reserved in the restaurant system
                </p>
              </div>

              {/* Confirmation Card */}
              <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-left space-y-3 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Booking ID</span>
                    <p className="text-base font-mono font-black text-amber-600 dark:text-amber-400">
                      {confirmedReservation.reservationId}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black">
                    CONFIRMED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400">Restaurant:</span>
                    <p className="font-bold text-zinc-900 dark:text-white">
                      {confirmedReservation.restaurantName}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Assigned Table:</span>
                    <p className="font-bold text-amber-600 dark:text-amber-400">
                      {confirmedReservation.tableNumber} ({confirmedReservation.guestCount} Guests)
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Date & Time:</span>
                    <p className="font-bold text-zinc-900 dark:text-white">
                      {formatDate(confirmedReservation.date)} at {formatTime12h(confirmedReservation.startTime)}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Pre-Order:</span>
                    <p className="font-bold text-zinc-900 dark:text-white">
                      {confirmedReservation.preOrderItems.length > 0
                        ? `${confirmedReservation.preOrderItems.length} items (Prep: ${confirmedReservation.prepStartTime})`
                        : 'No Pre-Order'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    store.setActiveBookingModal(false);
                    store.setSelectedBookingForQR(confirmedReservation);
                  }}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  View Digital QR Pass
                </button>

                <button
                  onClick={() =>
                    generateIcsFile({
                      bookingId: confirmedReservation.reservationId,
                      restaurantName: confirmedReservation.restaurantName,
                      address: restaurant.address,
                      date: confirmedReservation.date,
                      startTime: confirmedReservation.startTime,
                      guestCount: confirmedReservation.guestCount,
                      tableNumber: confirmedReservation.tableNumber,
                    })
                  }
                  className="py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Add to Calendar (.ics)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {currentStep < 7 && (
          <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Allocating Table...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Reserve Table
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
