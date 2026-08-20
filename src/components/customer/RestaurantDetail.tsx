'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { Restaurant, MenuItem, DailySpecial, DietaryType } from '@/lib/types';
import { formatCurrency, getTodayDateString } from '@/lib/utils';
import {
  Sparkles,
  Clock,
  MapPin,
  Phone,
  Star,
  Users,
  ShieldCheck,
  Percent,
  Flame,
  Leaf,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function RestaurantDetail({
  restaurant,
  onBack,
}: {
  restaurant: Restaurant;
  onBack: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  const categories = ['All', 'Starters', 'Main Course', 'Dosa', 'Pizza', 'Burgers', 'Beverages', 'Desserts', 'Combos'];

  const filteredMenu = restaurant.menu.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesDiet =
      dietaryFilter === 'ALL' ||
      (dietaryFilter === 'VEG' && (item.dietary === 'VEG' || item.dietary === 'VEGAN')) ||
      (dietaryFilter === 'NON_VEG' && item.dietary === 'NON_VEG');
    return matchesCat && matchesDiet;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to All Restaurants
      </button>

      {/* Restaurant Banner Card */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-zinc-900">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {restaurant.rating}
              <span className="text-zinc-300">({restaurant.reviewCount} reviews)</span>
            </div>
          </div>

          {/* Bottom Title & Details */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-2">
            <div className="flex flex-wrap gap-2">
              {restaurant.cuisines.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold backdrop-blur-sm border border-amber-500/30"
                >
                  {c}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold">{restaurant.name}</h1>
            <p className="text-xs sm:text-sm text-zinc-300">{restaurant.tagline}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{restaurant.address}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{restaurant.openingTime} – {restaurant.closingTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{restaurant.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Status & Quick Action Bar */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400">Live Table Status</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {restaurant.availableTables} of {restaurant.totalTables} Tables Available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400">Queue Wait Time</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                ~{restaurant.estimatedQueueWaitMinutes} mins estimated
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => store.setActiveBookingModal(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Book a Table
            </button>
            <button
              onClick={() => store.setActiveQueueModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Clock className="w-4 h-4" />
              Join Live Queue
            </button>
          </div>
        </div>
      </div>

      {/* Offers Section */}
      {restaurant.offers && restaurant.offers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {restaurant.offers.map((offer, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    {offer.title}
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    {offer.code}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                  {offer.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Today's Specials Section */}
      {restaurant.dailySpecials && restaurant.dailySpecials.filter(s => s.date === getTodayDateString()).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Today&apos;s Specials & Deals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurant.dailySpecials.filter(s => s.date === getTodayDateString()).map((special) => (
              <div
                key={special.id}
                className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-50/10 dark:bg-amber-955/5 p-4 space-y-3 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                {special.discountNote && (
                  <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-lg bg-amber-500 text-zinc-955 text-[10px] font-black uppercase tracking-wider shadow z-10">
                    {special.discountNote}
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-zinc-850 shrink-0">
                    <img
                      src={special.image}
                      alt={special.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {special.prepTimeMinutes}m prep
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-black dark:text-white truncate">{special.name}</h4>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                          {formatCurrency(special.price)}
                        </span>
                        {special.menuItemId && (
                          <span className="text-[10px] text-zinc-400 line-through block leading-none">
                            {formatCurrency(restaurant.menu.find(m => m.id === special.menuItemId)?.price || 0)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-black dark:text-zinc-300 mt-1 line-clamp-2 font-medium">
                      {special.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 mt-3 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
                      special.dietary === 'NON_VEG'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {special.dietary === 'NON_VEG' ? '🍗 Non-Veg' : '🥬 Pure Veg'}
                  </span>

                  <button
                    onClick={() => store.setActiveBookingModal(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1"
                  >
                    Pre-Order in Booking →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Sections Showcase */}
      <div className="space-y-3">
        <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          Seating Sections & Capacities
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {restaurant.tables.map((t) => (
            <div
              key={t.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  {t.tableNumber}
                </span>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    t.status === 'AVAILABLE'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : t.status === 'OCCUPIED'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {t.sectionName}
              </p>
              <p className="text-[11px] text-zinc-500">Max {t.capacity} Guests • {t.floor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu & Pre-Ordering Preview */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">
              Menu & Pre-Order Dishes
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pre-order during table booking to skip food waiting time completely!
            </p>
          </div>

          {/* Dietary Filter */}
          <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                dietaryFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter('VEG')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                dietaryFilter === 'VEG'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              <Leaf className="w-3 h-3" /> Veg Only
            </button>
            <button
              onClick={() => setDietaryFilter('NON_VEG')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                dietaryFilter === 'NON_VEG'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              <Flame className="w-3 h-3" /> Non-Veg
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="relative h-40 w-full overflow-hidden bg-zinc-800">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {item.isPopular && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow">
                    Chef Special
                  </span>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {item.prepTimeMinutes}m prep
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{item.name}</h4>
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      item.dietary === 'NON_VEG'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.dietary === 'NON_VEG' ? '🍗 Non-Veg' : '🥬 Pure Veg'}
                  </span>

                  <button
                    onClick={() => store.setActiveBookingModal(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1"
                  >
                    Pre-Order in Booking →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
