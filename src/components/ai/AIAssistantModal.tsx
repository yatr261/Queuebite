/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { store, AppState } from '@/lib/store';
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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  MapPin,
  Tag,
  ChevronRight,
  Zap,
  AlertCircle,
} from 'lucide-react';

export default function AIAssistantModal() {
  const [state, setState] = useState<AppState>(store.getState());
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return store.subscribe(() => {
      setState({ ...store.getState() });
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages, isTyping]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-IN'; // Multi-accent English & Hinglish support

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser environment.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const cleanText = text.replace(/[*_~`#•]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isTyping) return;

    setApiError(null);

    // 1. Append user message
    store.addChatMessage({
      sender: 'user',
      text: query,
    });
    setInput('');
    setIsTyping(true);

    const currentRestaurant =
      state.restaurants.find((r) => r.id === state.selectedRestaurantId) || state.restaurants[0];

    try {
      // 2. Call server-side API route for secure context-aware response
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: query,
          messages: state.chatMessages,
          restaurantContext: {
            name: currentRestaurant.name,
            address: currentRestaurant.address,
            phone: currentRestaurant.phone,
            openingTime: currentRestaurant.openingTime,
            closingTime: currentRestaurant.closingTime,
            cuisines: currentRestaurant.cuisines,
            menu: currentRestaurant.menu,
          },
          userReservationsContext: state.reservations.map((r) => ({
            id: r.reservationId,
            date: r.date,
            time: r.startTime,
            guests: r.guestCount,
            status: r.bookingStatus,
            tableNumber: r.tableNumber,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      store.addChatMessage({
        sender: 'assistant',
        text: data.text || "I'm not able to find that information right now. You can check the restaurant details or contact the restaurant directly.",
        actionCard: data.actionCard,
      });
      speakText(data.text);
    } catch (err) {
      setApiError('Unable to connect to assistant service. Showing offline helper response.');
      // Graceful offline fallback
      store.addChatMessage({
        sender: 'assistant',
        text: "I'm here to help! You can ask me about table bookings, live queue wait times, menu recommendations, active promo codes, or booking cancellations.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickConfirmBooking = (cardData: any) => {
    const res = store.createReservation({
      restaurantId: cardData.restaurantId,
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 43210',
      date: cardData.date,
      startTime: cardData.timeSlot,
      guestCount: cardData.guestCount,
      tablePreference: cardData.preference,
      preOrderItems: [],
    });

    if (res.success && res.reservation) {
      const confirmationMsg = `🎉 **Booking Confirmed!**\n\nYour table **${res.reservation.tableNumber}** at **${cardData.restaurantName}** has been locked.\n\n• **Booking ID:** \`${res.reservation.reservationId}\`\n• **Date & Time:** ${formatDate(res.reservation.date)} at ${formatTime12h(res.reservation.startTime)}\n• **Guests:** ${res.reservation.guestCount}\n\nYou can access your QR Digital Pass anytime in 'My Bookings'.`;
      store.addChatMessage({
        sender: 'assistant',
        text: confirmationMsg,
      });
      speakText(`Your table booking is confirmed with ID ${res.reservation.reservationId}`);
    }
  };

  const promptCategories = [
    { name: 'All', icon: Zap },
    { name: 'Booking', icon: UtensilsCrossed },
    { name: 'Queue', icon: Ticket },
    { name: 'Menu', icon: Sparkles },
    { name: 'Offers', icon: Tag },
  ];

  const quickPrompts: Record<string, string[]> = {
    All: [
      'Book a table for 4 tomorrow at 8 PM',
      'What is the live wait time right now?',
      'Recommend top vegetarian starters',
      'How does QR check-in work?',
      'Any active discount coupons?',
    ],
    Booking: [
      'Book an outdoor table for 2 at 7:30 PM',
      'Do you have a window table for lunch?',
      '4 guests table for Sunday dinner',
      'Where can I see my booking?',
    ],
    Queue: [
      'What is the current walk-in queue wait time?',
      'How does the walk-in queue work?',
      'Generate a live queue token for 3 guests',
    ],
    Menu: [
      'Recommend chef special dishes',
      'What are the best vegetarian options?',
      'Which items are non-spicy?',
      'Can I pre-order food with my table?',
    ],
    Offers: [
      'Show available discount coupons',
      'How to get 10% off on pre-orders?',
      'What is the promo code for free beverage?',
    ],
  };

  // Render text with basic markdown styling (bold, linebreaks, inline code)
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*|\`.*?\`)/g);
      return (
        <span key={idx} className="block min-h-[1.25em]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-amber-600 dark:text-amber-400">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code key={pIdx} className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-[11px]">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  // FLOATING LAUNCHER BUTTON (When Chat is Minimized)
  if (!state.isAiChatOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Tooltip Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900/90 text-white text-xs font-semibold shadow-xl border border-zinc-800 backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Ask QueueBite Assistant!</span>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => store.setAiChatOpen(true)}
          className="relative group p-4 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/20"
          title="Open QueueBite Assistant"
        >
          <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-zinc-900 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-zinc-900" />
        </button>
      </div>
    );
  }

  // EXPANDED CHATBOT MODAL WINDOW
  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md sm:max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col h-[590px] max-h-[85vh] animate-in slide-in-from-bottom-5 duration-300">
      {/* Chat Header */}
      <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight">QueueBite Assistant</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[9px] font-bold uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            </div>
            <p className="text-[10px] text-amber-100">How can I help you today?</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* TTS Speaker Toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-1.5 rounded-xl transition-colors ${
              ttsEnabled ? 'bg-white/30 text-white' : 'hover:bg-black/20 text-white/80'
            }`}
            title={ttsEnabled ? 'Disable Voice Playback' : 'Enable Voice Playback'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clear History */}
          <button
            onClick={() => store.clearChatMessages()}
            className="p-1.5 rounded-xl hover:bg-black/20 text-white/80 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Close Button */}
          <button
            onClick={() => store.setAiChatOpen(false)}
            className="p-1.5 rounded-xl hover:bg-black/20 text-white transition-colors"
            title="Minimize Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-zinc-50/60 dark:bg-zinc-950/60 text-xs">
        {state.chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-none'
                  : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-100 rounded-bl-none'
              }`}
            >
              {renderFormattedText(msg.text)}
            </div>

            {/* Interactive Action Cards */}
            {msg.actionCard && (
              <div className="w-full max-w-[90%] mt-2 space-y-2">
                {/* 1. Booking Proposal Card */}
                {msg.actionCard.type === 'BOOKING_PROPOSAL' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 space-y-2.5 text-xs shadow-sm">
                    <div className="flex justify-between items-center font-extrabold text-amber-900 dark:text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                        Table {msg.actionCard.data.assignedTable.tableNumber} ({msg.actionCard.data.assignedTable.sectionName})
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono text-[11px]">
                        {formatTime12h(msg.actionCard.data.timeSlot)}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                      📅 {formatDate(msg.actionCard.data.date)} • 👥 {msg.actionCard.data.guestCount} Guests • 📍 {msg.actionCard.data.restaurantName}
                    </p>

                    <button
                      onClick={() => handleQuickConfirmBooking(msg.actionCard!.data)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 1-Click Confirm Reservation
                    </button>
                  </div>
                )}

                {/* 2. Alternative Slots Card */}
                {msg.actionCard.type === 'ALTERNATIVE_SLOTS' && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-2 text-xs">
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> Choose Alternative Time:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actionCard.data.alternativeSlots.map((slot: string) => (
                        <button
                          key={slot}
                          onClick={() =>
                            handleSendMessage(
                              `Book a table for ${msg.actionCard!.data.guestCount} at ${slot}`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-sm"
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
                      {msg.actionCard.data.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1"
                        >
                          <p className="font-bold truncate text-zinc-900 dark:text-zinc-100">{item.name}</p>
                          <p className="text-amber-600 dark:text-amber-400 font-extrabold">{formatCurrency(item.price)}</p>
                          <p className="text-[9px] text-zinc-400">{item.dietary} • Prep: {item.prepTimeMinutes} mins</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => store.setActiveBookingModal(true)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      Pre-Order in Booking Wizard <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 4. Queue Token Card */}
                {msg.actionCard.type === 'QUEUE_TOKEN' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs space-y-2.5">
                    <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-300">
                      <span>Live Waiting: ~{msg.actionCard.data.estimatedWaitMinutes} mins</span>
                      <span>{msg.actionCard.data.waitingCount} groups waiting</span>
                    </div>
                    <button
                      onClick={() => store.setActiveQueueModal(true)}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Ticket className="w-4 h-4" /> Get Live Queue Pass
                    </button>
                  </div>
                )}

                {/* 5. Location Info Card */}
                {msg.actionCard.type === 'LOCATION_INFO' && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/60 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{msg.actionCard.data.name}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300">{msg.actionCard.data.address}</p>
                    <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-1">
                      <span>📞 {msg.actionCard.data.phone}</span>
                      <span>⏰ {msg.actionCard.data.openingTime} - {msg.actionCard.data.closingTime}</span>
                    </div>
                  </div>
                )}

                {/* 6. Offers Info Card */}
                {msg.actionCard.type === 'OFFERS_INFO' && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                    {msg.actionCard.data.offers.map((offer: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-900/50">
                        <div>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{offer.code}</span>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{offer.title}</p>
                        </div>
                        <button
                          onClick={() => handleSendMessage(`Book table using code ${offer.code}`)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600"
                        >
                          Use Code
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs p-2">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>QueueBite Assistant is thinking...</span>
          </div>
        )}

        {apiError && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Category Pills & Quick Prompts */}
      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-3 pt-2 overflow-x-auto scrollbar-none">
          {promptCategories.map((cat) => {
            const Icon = cat.icon;
            const isSel = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isSel
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-3 h-3" />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Quick Prompts Chips */}
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {(quickPrompts[activeCategory] || quickPrompts.All).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold whitespace-nowrap hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        {/* Voice Input Button */}
        <button
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-xl border transition-colors ${
            isListening
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200'
          }`}
          title={isListening ? 'Listening... Speak now!' : 'Click to Speak (Voice Query)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          placeholder={isListening ? 'Listening to your voice...' : 'Ask anything about QueueBite...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          disabled={isTyping}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
        />

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={isTyping || !input.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold transition-transform active:scale-95 shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
