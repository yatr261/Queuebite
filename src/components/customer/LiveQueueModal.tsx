'use client';

import React, { useState, useEffect } from 'react';
import { store, AppState } from '@/lib/store';
import { TableSection, QueueToken, PreOrderItem, DailySpecial } from '@/lib/types';
import { formatCurrency, getTodayDateString, formatDate } from '@/lib/utils';
import {
  X,
  Clock,
  Users,
  UtensilsCrossed,
  CheckCircle2,
  Ticket,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export default function LiveQueueModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<AppState>(store.getState());

  // Form Step State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('Vikram Malhotra');
  const [customerPhone, setCustomerPhone] = useState<string>('+91 99887 76655');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [tablePreference, setTablePreference] = useState<TableSection>('ANY');
  
  // Pre-Order State
  const [preOrderCart, setPreOrderCart] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'CASH_AT_DESK'>('UPI');
  const [issuedToken, setIssuedToken] = useState<QueueToken | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  const restaurant =
    state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

  // Sync accepted payment methods
  useEffect(() => {
    if (restaurant) {
      const accepted = restaurant.acceptedPaymentMethods || ['UPI', 'CARD', 'NETBANKING', 'CASH_AT_DESK'];
      if (accepted.length > 0 && !accepted.includes(paymentMethod)) {
        setPaymentMethod(accepted[0] as any);
      }
    }
  }, [restaurant, restaurant?.acceptedPaymentMethods, paymentMethod]);

  if (!isOpen) return null;

  const waitingTokens = state.queueTokens.filter((q) => q.status === 'WAITING');
  const estimatedWait = Math.max(5, (waitingTokens.length + 1) * 8 + (guestCount > 4 ? 10 : 0));

  // Table Preferences List
  const preferences: { id: TableSection; title: string; desc: string; icon: string }[] = [
    { id: 'ANY', title: 'Any Available', desc: 'Fastest seating assignment', icon: '✨' },
    { id: 'WINDOW', title: 'Window Seat', desc: 'Garden views & soft lighting', icon: '🪟' },
    { id: 'INDOOR', title: 'Indoor Cozy', desc: 'Quiet & ambient spaces inside', icon: '🛋️' },
    { id: 'OUTDOOR', title: 'Garden Patio', desc: 'Open-air patio ambience', icon: '🌿' },
    { id: 'AC_SECTION', title: 'AC Section', desc: 'Central cooling family comfort', icon: '❄️' },
    { id: 'FAMILY', title: 'Family Table', desc: 'Large tables for 4-8 persons', icon: '👨‍👩‍👧‍👦' },
    { id: 'COUPLE', title: 'Couple Table', desc: 'Intimate candle-lit 2-seater', icon: '🕯️' },
    { id: 'VIP_LOUNGE', title: 'VIP Lounge', desc: 'Private lounge with host access', icon: '👑' },
  ];

  // Menu Categories
  const categories = ['All', 'Starters', 'Main Course', 'Dosa', 'Pizza', 'Burgers', 'Beverages', 'Desserts', 'Combos'];

  // Filtered Menu Items
  const filteredMenu = restaurant.menu.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  // Pre-Order Calculations
  const selectedPreOrderItems: PreOrderItem[] = Object.entries(preOrderCart)
    .filter(([_, qty]) => qty > 0)
    .map(([itemId, qty]) => {
      const item = restaurant.menu.find((m) => m.id === itemId) ||
                   restaurant.dailySpecials?.find((s) => s.id === itemId)!;
      return { item, quantity: qty };
    });

  const preOrderSubtotal = selectedPreOrderItems.reduce(
    (acc, pi) => acc + pi.item.price * pi.quantity,
    0
  );

  const discountAmount = Math.round(preOrderSubtotal * 0.1);
  const grandTotal = Math.max(0, preOrderSubtotal - discountAmount);

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

  const handleJoinQueueSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const token = store.joinLiveQueue({
        restaurantId: restaurant.id,
        customerName,
        customerPhone,
        guestCount,
        tablePreference,
        preOrderItems: selectedPreOrderItems,
      });
      setIssuedToken(token);
      setIsSubmitting(false);
      setCurrentStep(5); // Final token screen
    }, 600);
  };

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedPreOrderItems.length > 0) {
        setCurrentStep(4);
      } else {
        handleJoinQueueSubmit();
      }
    } else if (currentStep === 4) {
      handleJoinQueueSubmit();
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-extrabold">Join Live Walk-In Queue • {restaurant.name}</h3>
              {currentStep < 5 && (
                <p className="text-[10px] text-emerald-100">Step {currentStep} of 4 • Est. Wait ~{estimatedWait} mins</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Line */}
        {currentStep < 5 && (
          <div className="w-full bg-emerald-100 dark:bg-zinc-800 h-1">
            <div
              className="bg-emerald-500 h-1 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {currentStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
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

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-semibold bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-semibold bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-850 font-bold text-sm text-zinc-850 dark:text-white"
                  >
                    -
                  </button>
                  <span className="text-xl font-black text-emerald-600">{guestCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => Math.min(10, g + 1))}
                    className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-850 font-bold text-sm text-zinc-855 dark:text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  Choose Table Preference
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">Choose Table Preference</h4>
                <p className="text-zinc-500">Pick where you would prefer to be seated once your token is called</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {preferences.map((pref) => (
                  <button
                    key={pref.id}
                    onClick={() => setTablePreference(pref.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                      tablePreference === pref.id
                        ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <span className="text-lg">{pref.icon}</span>
                    <div className="min-w-0">
                      <h5 className="font-bold text-zinc-900 dark:text-white">{pref.title}</h5>
                      <p className="text-[10px] text-zinc-500 truncate">{pref.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => handleNextStep()}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  Next: Pre-Order Food
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                    Pre-Order Food & Skip Waiting (Optional)
                  </h4>
                  <p className="text-zinc-500">Order now to receive food fresh & hot immediately when seated</p>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase">
                  10% OFF Applied
                </span>
              </div>

              {/* Category selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl font-bold border whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu items grid */}
              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1.5">
                {/* Daily Specials for Today */}
                {restaurant.dailySpecials && restaurant.dailySpecials.filter(s => s.date === getTodayDateString()).length > 0 && (
                  <div className="space-y-2.5 mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Today&apos;s Specials & Offers:
                    </p>
                    
                    {restaurant.dailySpecials.filter(s => s.date === getTodayDateString()).map((special) => {
                      const qty = preOrderCart[special.id] || 0;
                      return (
                        <div
                          key={special.id}
                          className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-between gap-3 relative"
                        >
                          {special.discountNote && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-amber-500 text-zinc-955 text-[8px] font-black uppercase tracking-wider shadow z-10">
                              {special.discountNote}
                            </span>
                          )}

                          <img
                            src={special.image}
                            alt={special.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 bg-zinc-205"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mt-2">
                              <h5 className="font-bold text-zinc-900 dark:text-white truncate">
                                {special.name}
                              </h5>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                  special.dietary === 'NON_VEG'
                                    ? 'bg-rose-500/15 text-rose-500'
                                    : special.dietary === 'VEGAN'
                                    ? 'bg-green-500/15 text-green-500'
                                    : 'bg-emerald-500/15 text-emerald-555'
                                }`}
                              >
                                {special.dietary === 'NON_VEG' ? 'NON-VEG' : special.dietary === 'VEGAN' ? 'VEGAN' : 'VEG'}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-550 truncate mt-0.5">{special.description}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(special.price)}
                              </span>
                              {special.menuItemId && (
                                <span className="text-[10px] text-zinc-400 line-through">
                                  {formatCurrency(restaurant.menu.find(m => m.id === special.menuItemId)?.price || 0)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Add/Quantity counter */}
                          <div className="shrink-0">
                            {qty === 0 ? (
                              <button
                                onClick={() => handleQuantityChange(special.id, 1)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm transition-all"
                              >
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-300 dark:border-zinc-700">
                                <button
                                  onClick={() => handleQuantityChange(special.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-750 text-zinc-900 dark:text-white flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-bold px-1 text-zinc-900 dark:text-white">{qty}</span>
                                <button
                                  onClick={() => handleQuantityChange(special.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold"
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
                )}
                
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">Regular Menu:</p>
                {filteredMenu.map((item) => {
                  const qty = preOrderCart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 bg-zinc-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-zinc-900 dark:text-white truncate">{item.name}</h5>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              item.dietary === 'NON_VEG'
                                ? 'bg-rose-500/15 text-rose-500'
                                : item.dietary === 'VEGAN'
                                ? 'bg-green-500/15 text-green-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}
                          >
                            {item.dietary === 'NON_VEG' ? 'NON-VEG' : item.dietary === 'VEGAN' ? 'VEGAN' : 'VEG'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.description}</p>
                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      {/* Add/Quantity counter */}
                      <div className="shrink-0">
                        {qty === 0 ? (
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm transition-all"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-300 dark:border-zinc-700">
                            <button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-750 text-zinc-900 dark:text-white flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold px-1 text-zinc-900 dark:text-white">{qty}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold"
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

              {/* Cart summary footer */}
              {selectedPreOrderItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-950 dark:text-emerald-300">
                      {selectedPreOrderItems.reduce((a, b) => a + b.quantity, 0)} Items Added
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Includes 10% Pre-Order discount (saved {formatCurrency(discountAmount)})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(grandTotal)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => handleNextStep()}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  {selectedPreOrderItems.length > 0 ? (
                    <>
                      Next: Checkout
                      <ChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Skip & Join Queue
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Pre-Order Checkout Summary
                </h4>
                <p className="text-zinc-500">Pay deposit or pre-order balance to finalize your queue token</p>
              </div>

              {/* Order checkout bill */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-850 space-y-2">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Guest Details</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {customerName} ({guestCount} Guests)
                  </span>
                </div>
                <div className="flex justify-between text-zinc-650 dark:text-zinc-400">
                  <span>Table Preference</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {tablePreference === 'ANY' ? 'Any Free Table' : tablePreference}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-650 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Pre-Order Subtotal ({selectedPreOrderItems.length} items)</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(preOrderSubtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Pre-Order Discount (10% OFF)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Dine-in Balance (Payable Now)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 pt-1">
                <label className="block font-bold text-zinc-700 dark:text-zinc-300">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI (GPay/PhonePe)', icon: '⚡' },
                    { id: 'CARD', label: 'Credit/Debit Card', icon: '💳' },
                    { id: 'NETBANKING', label: 'Net Banking', icon: '🏦' },
                    { id: 'CASH_AT_DESK', label: 'Pay at Desk', icon: '💵' },
                  ].filter((pm) => {
                    const accepted = restaurant.acceptedPaymentMethods || ['UPI', 'CARD', 'NETBANKING', 'CASH_AT_DESK'];
                    return accepted.includes(pm.id as any);
                  }).map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === pm.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-2 ring-emerald-500'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400'
                      }`}
                    >
                      <span className="text-base">{pm.icon}</span>
                      <span className="text-[10px] whitespace-nowrap">{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => handleNextStep()}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Issuing Token...'
                  ) : (
                    <>
                      Pay & Get Token
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && issuedToken && (
            /* Token Issued View */
            <div className="text-center space-y-4 py-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-zinc-900 dark:text-white">
                  You are in Line!
                </h4>
                <p className="text-xs text-zinc-500">We will notify you the moment your table is ready</p>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Your Queue Token</span>
                <p className="text-5xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {issuedToken.tokenId}
                </p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {issuedToken.guestCount} Guests • {issuedToken.tablePreference === 'ANY' ? 'Any Section' : issuedToken.tablePreference} Preference
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold">
                  Estimated Wait: ~{issuedToken.estimatedWaitMinutes} mins
                </p>
                {selectedPreOrderItems.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700 text-left space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">Pre-ordered Food ({selectedPreOrderItems.length} items)</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPreOrderItems.map((pi, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          {pi.quantity}x {pi.item.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 pt-0.5">Paid {formatCurrency(grandTotal)} via {paymentMethod}</p>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-250 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 font-black text-xs transition-colors"
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
