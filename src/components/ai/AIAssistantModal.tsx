'use client';

import React, { useState, useRef, useEffect } from 'react';
import { store, AppState } from '@/lib/store';
import { processUserChatMessage } from '@/lib/aiChatEngine';
import { MenuItem, TableSection, ActionCardData } from '@/lib/types';
import { formatDate, formatTime12h, formatCurrency } from '@/lib/utils';
import {
  Bot,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Ticket,
  UtensilsCrossed,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function AIAssistantModal() {
  const [state, setState] = useState<AppState>(store.getState());
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages, isTyping]);

  if (!state.isAiChatOpen) return null;

  const quickPrompts = [
    'Book a table for 4 tomorrow at 8 PM',
    'Do you have an outdoor table for 2 at 7:30 PM?',
    'What is the live wait time right now?',
    'Recommend best vegetarian dishes',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message
    store.addChatMessage({
      sender: 'user',
      text: query,
    });
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = processUserChatMessage(query);
      store.addChatMessage({
        sender: 'assistant',
        text: response.text,
        actionCard: response.actionCard,
      });
      setIsTyping(false);
    }, 450);
  };

  const handleQuickConfirmBooking = (cardData: ActionCardData) => {
    const res = store.createReservation({
      restaurantId: cardData.restaurantId || '',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 43210',
      date: cardData.date || '',
      startTime: cardData.timeSlot || '',
      guestCount: cardData.guestCount || 1,
      tablePreference: cardData.preference || 'ANY',
      preOrderItems: [],
    });

    if (res.success && res.reservation) {
      store.addChatMessage({
        sender: 'assistant',
        text: `🎉 **Booking Confirmed!** Your table **${res.reservation.tableNumber}** has been reserved with Booking ID: **${res.reservation.reservationId}**. You can view your pass in 'My Bookings'.`,
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[560px] animate-in slide-in-from-bottom-5 duration-300">
      {/* Chat Header */}
      <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold">Queuebite AI Assistant</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-zinc-100">Natural Language Booking & Concierge</p>
          </div>
        </div>

        <button
          onClick={() => store.setAiChatOpen(false)}
          className="p-1 rounded-lg hover:bg-black/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="p-4 overflow-y-auto flex-1 space-y-3.5 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs">
        {state.chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-white rounded-br-none shadow-sm'
                  : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>

            {/* In-Chat Action Cards */}
            {msg.actionCard && (
              <div className="w-full max-w-[90%] mt-2 space-y-2">
                {/* 1. Booking Proposal Card */}
                {msg.actionCard.type === 'BOOKING_PROPOSAL' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-amber-900 dark:text-amber-300">
                      <span>Table {msg.actionCard.data.assignedTable?.tableNumber || ''}</span>
                      <span>{formatTime12h(msg.actionCard.data.timeSlot || '')}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      {msg.actionCard.data.guestCount || 0} Guests • {formatDate(msg.actionCard.data.date || '')} • {msg.actionCard.data.assignedTable?.sectionName || ''}
                    </p>
                    <button
                      onClick={() => handleQuickConfirmBooking(msg.actionCard!.data)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Confirm Reservation
                    </button>
                  </div>
                )}

                {/* 2. Alternative Slots Card */}
                {msg.actionCard.type === 'ALTERNATIVE_SLOTS' && (
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 space-y-1.5 text-xs">
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">Recommended Alternative Times:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(msg.actionCard.data.alternativeSlots || []).map((slot: string) => (
                        <button
                          key={slot}
                          onClick={() => handleSendMessage(`Book a table for ${msg.actionCard!.data.guestCount} at ${slot}`)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600"
                        >
                          {formatTime12h(slot)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Menu Recommendation Card */}
                {msg.actionCard.type === 'MENU_RECOMMENDATION' && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {(msg.actionCard.data.items || []).map((item: MenuItem) => (
                        <div key={item.id} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
                          <p className="font-bold truncate">{item.name}</p>
                          <p className="text-amber-600 font-extrabold">{formatCurrency(item.price)}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => store.setActiveBookingModal(true)}
                      className="w-full py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs"
                    >
                      Pre-Order in Booking Modal →
                    </button>
                  </div>
                )}

                {/* 4. Queue Token Card */}
                {msg.actionCard.type === 'QUEUE_TOKEN' && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-xs space-y-2">
                    <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-300">
                      <span>Live Wait: ~{msg.actionCard.data.estimatedWaitMinutes} mins</span>
                      <span>{msg.actionCard.data.waitingCount} in line</span>
                    </div>
                    <button
                      onClick={() => store.setActiveQueueModal(true)}
                      className="w-full py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs"
                    >
                      <Ticket className="w-3.5 h-3.5 inline mr-1" /> Get Queue Token
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs italic p-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
            AI is checking table availability...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Pills */}
      <div className="px-3 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold whitespace-nowrap hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask AI to book a table, check queue..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          onClick={() => handleSendMessage()}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-transform active:scale-95 shadow-md shadow-amber-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
