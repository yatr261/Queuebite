'use client';

import {
  Restaurant,
  Reservation,
  QueueToken,
  WaitlistEntry,
  KitchenTicket,
  NotificationItem,
  ChatMessage,
  AppViewRole,
  PreOrderItem,
  TableSection,
  Table,
} from './types';
import {
  INITIAL_RESTAURANTS,
  INITIAL_RESERVATIONS,
  INITIAL_QUEUE_TOKENS,
  INITIAL_WAITLIST,
  INITIAL_KITCHEN_TICKETS,
  INITIAL_NOTIFICATIONS,
} from './mockData';
import {
  generateBookingId,
  generateTokenId,
  generateWaitlistId,
  calculateEndTime,
  calculatePrepStartTime,
  playNotificationChime,
  getTodayDateString,
} from './utils';
import { findSmartTableAllocation } from './aiAllocation';

const STORAGE_KEY = 'queuebite_state_v1';

export interface AppState {
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  reservations: Reservation[];
  queueTokens: QueueToken[];
  waitlist: WaitlistEntry[];
  kitchenTickets: KitchenTicket[];
  notifications: NotificationItem[];
  chatMessages: ChatMessage[];
  currentRole: AppViewRole;
  isAiChatOpen: boolean;
  activeBookingModal: boolean;
  activeQueueModal: boolean;
  activeScannerModal: boolean;
  activeCheckInBookingId: string | null;
  selectedBookingForQR: Reservation | null;
  selectedBookingForModify: Reservation | null;
  selectedBookingForCancel: Reservation | null;
  activeWaitlistModal: boolean;
}

const DEFAULT_STATE: AppState = {
  restaurants: INITIAL_RESTAURANTS,
  selectedRestaurantId: INITIAL_RESTAURANTS[0].id,
  reservations: INITIAL_RESERVATIONS,
  queueTokens: INITIAL_QUEUE_TOKENS,
  waitlist: INITIAL_WAITLIST,
  kitchenTickets: INITIAL_KITCHEN_TICKETS,
  notifications: INITIAL_NOTIFICATIONS,
  chatMessages: [
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: '👋 Hello! I am your Queuebite AI Assistant. I can help you reserve a table, check wait times, pre-order food, or modify your bookings. How may I assist you today?',
      timestamp: new Date().toISOString(),
    },
  ],
  currentRole: 'CUSTOMER',
  isAiChatOpen: false,
  activeBookingModal: false,
  activeQueueModal: false,
  activeScannerModal: false,
  activeCheckInBookingId: null,
  selectedBookingForQR: null,
  selectedBookingForModify: null,
  selectedBookingForCancel: null,
  activeWaitlistModal: false,
};

type Listener = () => void;

class StateStore {
  private state: AppState = DEFAULT_STATE;
  private listeners: Set<Listener> = new Set();
  private isHydrated = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...DEFAULT_STATE,
          ...parsed,
          restaurants: parsed.restaurants || INITIAL_RESTAURANTS,
          reservations: parsed.reservations || INITIAL_RESERVATIONS,
          queueTokens: parsed.queueTokens || INITIAL_QUEUE_TOKENS,
          kitchenTickets: parsed.kitchenTickets || INITIAL_KITCHEN_TICKETS,
          waitlist: parsed.waitlist || INITIAL_WAITLIST,
          notifications: parsed.notifications || INITIAL_NOTIFICATIONS,
        };
      }
    } catch {
      // Storage error fallback
    }
    this.isHydrated = true;
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && this.isHydrated) {
      try {
        const toSave = {
          restaurants: this.state.restaurants,
          selectedRestaurantId: this.state.selectedRestaurantId,
          reservations: this.state.reservations,
          queueTokens: this.state.queueTokens,
          kitchenTickets: this.state.kitchenTickets,
          waitlist: this.state.waitlist,
          notifications: this.state.notifications,
          chatMessages: this.state.chatMessages,
          currentRole: this.state.currentRole,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        // LocalStorage full
      }
    }
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): AppState {
    return this.state;
  }

  public resetToDefaults() {
    this.state = {
      ...DEFAULT_STATE,
      restaurants: JSON.parse(JSON.stringify(INITIAL_RESTAURANTS)),
      reservations: JSON.parse(JSON.stringify(INITIAL_RESERVATIONS)),
      queueTokens: JSON.parse(JSON.stringify(INITIAL_QUEUE_TOKENS)),
      kitchenTickets: JSON.parse(JSON.stringify(INITIAL_KITCHEN_TICKETS)),
      waitlist: JSON.parse(JSON.stringify(INITIAL_WAITLIST)),
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    };
    this.notify();
  }

  // --- Role & Modal Actions ---
  public setRole(role: AppViewRole) {
    this.state = { ...this.state, currentRole: role };
    this.notify();
  }

  public setSelectedRestaurant(restaurantId: string) {
    this.state = { ...this.state, selectedRestaurantId: restaurantId };
    this.notify();
  }

  public setAiChatOpen(open: boolean) {
    this.state = { ...this.state, isAiChatOpen: open };
    this.notify();
  }

  public setActiveBookingModal(open: boolean) {
    this.state = { ...this.state, activeBookingModal: open };
    this.notify();
  }

  public setActiveQueueModal(open: boolean) {
    this.state = { ...this.state, activeQueueModal: open };
    this.notify();
  }

  public setActiveScannerModal(open: boolean) {
    this.state = { ...this.state, activeScannerModal: open };
    this.notify();
  }

  public setActiveCheckInBookingId(bookingId: string | null) {
    this.state = { ...this.state, activeCheckInBookingId: bookingId };
    this.notify();
  }

  public setSelectedBookingForQR(res: Reservation | null) {
    this.state = { ...this.state, selectedBookingForQR: res };
    this.notify();
  }

  public setSelectedBookingForModify(res: Reservation | null) {
    this.state = { ...this.state, selectedBookingForModify: res };
    this.notify();
  }

  public setSelectedBookingForCancel(res: Reservation | null) {
    this.state = { ...this.state, selectedBookingForCancel: res };
    this.notify();
  }

  public setActiveWaitlistModal(open: boolean) {
    this.state = { ...this.state, activeWaitlistModal: open };
    this.notify();
  }

  // --- Reservation Management ---
  public createReservation(data: {
    restaurantId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    date: string;
    startTime: string;
    guestCount: number;
    tablePreference: TableSection;
    specialRequests?: string;
    preOrderItems: PreOrderItem[];
    discountCode?: string;
    paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING' | 'CASH_AT_DESK';
  }): { success: boolean; reservation?: Reservation; error?: string } {
    const restaurant = this.state.restaurants.find((r) => r.id === data.restaurantId);
    if (!restaurant) return { success: false, error: 'Restaurant not found' };

    // AI Table Allocation
    const allocation = findSmartTableAllocation({
      restaurant,
      date: data.date,
      timeSlot: data.startTime,
      guestCount: data.guestCount,
      preference: data.tablePreference,
      existingReservations: this.state.reservations,
    });

    if (!allocation.isAvailable || !allocation.assignedTable) {
      return {
        success: false,
        error: allocation.aiExplanation || 'No suitable table available for the requested time.',
      };
    }

    const assignedTable = allocation.assignedTable;
    const reservationId = generateBookingId();
    const endTime = calculateEndTime(data.startTime, restaurant.slotDurationMinutes);
    
    // Calculate pre-order totals
    let preOrderTotal = 0;
    data.preOrderItems.forEach((pi) => {
      preOrderTotal += pi.item.price * pi.quantity;
    });

    let discountAmount = 0;
    if (data.discountCode === 'PREORDER10' || (data.preOrderItems.length > 0 && !data.discountCode)) {
      discountAmount = Math.round(preOrderTotal * 0.1);
    } else if (data.discountCode === 'FEAST100' && preOrderTotal >= 799) {
      discountAmount = 100;
    } else if (data.discountCode === 'FREEBEV' && preOrderTotal >= 600) {
      discountAmount = 90;
    }

    const finalAmount = Math.max(0, preOrderTotal - discountAmount);
    const depositAmount = restaurant.depositRequired ? restaurant.depositAmount : 0;
    const prepDuration = data.preOrderItems.length > 0 ? 15 : 0;
    const prepStartTime = data.preOrderItems.length > 0 ? calculatePrepStartTime(data.startTime, prepDuration) : undefined;

    const newReservation: Reservation = {
      reservationId,
      customerId: `cust-${Date.now()}`,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || `${data.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      tableId: assignedTable.id,
      tableNumber: assignedTable.tableNumber,
      date: data.date,
      startTime: data.startTime,
      endTime,
      guestCount: data.guestCount,
      tablePreference: data.tablePreference,
      specialRequests: data.specialRequests,
      preOrderItems: data.preOrderItems,
      preOrderTotal,
      discountAmount,
      finalAmount,
      depositRequired: restaurant.depositRequired,
      depositAmount,
      paymentStatus: depositAmount > 0 ? 'PAID' : 'NOT_REQUIRED',
      paymentMethod: data.paymentMethod || 'UPI',
      bookingStatus: 'CONFIRMED',
      qrCodeData: `QUEUEBITE:RES:${reservationId}:${assignedTable.tableNumber}:${data.date}:${data.startTime}`,
      prepStartTime,
      prepStatus: data.preOrderItems.length > 0 ? 'SCHEDULED' : 'SERVED',
      gracePeriodMinutes: restaurant.gracePeriodMinutes || 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If pre-orders exist, schedule Kitchen Ticket
    const updatedKitchen = [...this.state.kitchenTickets];
    if (data.preOrderItems.length > 0 && prepStartTime) {
      const ticket: KitchenTicket = {
        ticketId: `KT-${reservationId.split('-')[2]}`,
        sourceType: 'RESERVATION',
        sourceId: reservationId,
        customerName: data.customerName,
        tableNumber: assignedTable.tableNumber,
        items: data.preOrderItems,
        scheduledPrepTime: prepStartTime,
        targetServeTime: data.startTime,
        prepDurationMinutes: prepDuration,
        status: 'SCHEDULED',
        specialNotes: `Pre-ordered reservation for ${data.guestCount} guests at Table ${assignedTable.tableNumber}. Start prep at ${prepStartTime}.`,
        createdAt: new Date().toISOString(),
      };
      updatedKitchen.push(ticket);
    }

    // Add confirmation notification
    const notification: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Booking Confirmed 🎉',
      message: `Your reservation ${reservationId} at ${restaurant.name} (Table ${assignedTable.tableNumber}) is confirmed for ${data.date} at ${data.startTime}.`,
      type: 'CONFIRMATION',
      timestamp: new Date().toISOString(),
      read: false,
      bookingId: reservationId,
    };

    this.state = {
      ...this.state,
      reservations: [newReservation, ...this.state.reservations],
      kitchenTickets: updatedKitchen,
      notifications: [notification, ...this.state.notifications],
      selectedBookingForQR: newReservation,
    };

    playNotificationChime('success');
    this.notify();
    return { success: true, reservation: newReservation };
  }

  public modifyReservation(reservationId: string, updates: {
    date: string;
    startTime: string;
    guestCount: number;
    tablePreference: TableSection;
    preOrderItems?: PreOrderItem[];
  }): { success: boolean; error?: string } {
    const res = this.state.reservations.find((r) => r.reservationId === reservationId);
    if (!res) return { success: false, error: 'Reservation not found' };

    const restaurant = this.state.restaurants.find((r) => r.id === res.restaurantId);
    if (!restaurant) return { success: false, error: 'Restaurant not found' };

    // AI Re-allocation
    const allocation = findSmartTableAllocation({
      restaurant,
      date: updates.date,
      timeSlot: updates.startTime,
      guestCount: updates.guestCount,
      preference: updates.tablePreference,
      existingReservations: this.state.reservations,
      excludeReservationId: reservationId,
    });

    if (!allocation.isAvailable || !allocation.assignedTable) {
      return {
        success: false,
        error: allocation.aiExplanation || 'Requested modification conflicts with existing bookings.',
      };
    }

    const assignedTable = allocation.assignedTable;
    const endTime = calculateEndTime(updates.startTime, restaurant.slotDurationMinutes);
    const preOrderItems = updates.preOrderItems || res.preOrderItems;
    
    let preOrderTotal = 0;
    preOrderItems.forEach((pi) => {
      preOrderTotal += pi.item.price * pi.quantity;
    });
    const discountAmount = Math.round(preOrderTotal * 0.1);
    const finalAmount = Math.max(0, preOrderTotal - discountAmount);
    const prepDuration = preOrderItems.length > 0 ? 15 : 0;
    const prepStartTime = preOrderItems.length > 0 ? calculatePrepStartTime(updates.startTime, prepDuration) : undefined;

    const updatedRes: Reservation = {
      ...res,
      tableId: assignedTable.id,
      tableNumber: assignedTable.tableNumber,
      date: updates.date,
      startTime: updates.startTime,
      endTime,
      guestCount: updates.guestCount,
      tablePreference: updates.tablePreference,
      preOrderItems,
      preOrderTotal,
      discountAmount,
      finalAmount,
      prepStartTime,
      qrCodeData: `QUEUEBITE:RES:${reservationId}:${assignedTable.tableNumber}:${updates.date}:${updates.startTime}`,
      updatedAt: new Date().toISOString(),
    };

    // Update Kitchen ticket if applicable
    const updatedKitchen = this.state.kitchenTickets.map((kt) => {
      if (kt.sourceId === reservationId) {
        return {
          ...kt,
          tableNumber: assignedTable.tableNumber,
          items: preOrderItems,
          scheduledPrepTime: prepStartTime || kt.scheduledPrepTime,
          targetServeTime: updates.startTime,
        };
      }
      return kt;
    });

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Booking Modified ✏️',
      message: `Your reservation ${reservationId} has been updated to ${updates.date} at ${updates.startTime} (Table ${assignedTable.tableNumber}).`,
      type: 'CONFIRMATION',
      timestamp: new Date().toISOString(),
      read: false,
      bookingId: reservationId,
    };

    this.state = {
      ...this.state,
      reservations: this.state.reservations.map((r) =>
        r.reservationId === reservationId ? updatedRes : r
      ),
      kitchenTickets: updatedKitchen,
      notifications: [notif, ...this.state.notifications],
      selectedBookingForModify: null,
      selectedBookingForQR: updatedRes,
    };

    playNotificationChime('success');
    this.notify();
    return { success: true };
  }

  public cancelReservation(reservationId: string, reason?: string): { success: boolean; error?: string } {
    const res = this.state.reservations.find((r) => r.reservationId === reservationId);
    if (!res) return { success: false, error: 'Reservation not found' };

    const updatedReservations = this.state.reservations.map((r) => {
      if (r.reservationId === reservationId) {
        return {
          ...r,
          bookingStatus: 'CANCELLED' as const,
          paymentStatus: r.depositAmount > 0 ? ('REFUNDED' as const) : r.paymentStatus,
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer',
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    const updatedKitchen = this.state.kitchenTickets.filter((kt) => kt.sourceId !== reservationId);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Reservation Cancelled ❌',
      message: `Reservation ${reservationId} was cancelled. ${res.depositAmount > 0 ? 'Your ₹' + res.depositAmount + ' deposit refund has been initiated.' : 'Table released.'}`,
      type: 'CANCELLED',
      timestamp: new Date().toISOString(),
      read: false,
      bookingId: reservationId,
    };

    // Check if someone in waitlist can be notified of this freed table
    const waitlistIndex = this.state.waitlist.findIndex(
      (w) => w.status === 'WAITING' && w.preferredDate === res.date
    );
    const updatedWaitlist = [...this.state.waitlist];
    if (waitlistIndex !== -1) {
      updatedWaitlist[waitlistIndex] = {
        ...updatedWaitlist[waitlistIndex],
        status: 'NOTIFIED',
        notifiedAt: new Date().toISOString(),
        offeredTableId: res.tableId,
        offeredTableNumber: res.tableNumber,
      };
    }

    this.state = {
      ...this.state,
      reservations: updatedReservations,
      kitchenTickets: updatedKitchen,
      waitlist: updatedWaitlist,
      notifications: [notif, ...this.state.notifications],
      selectedBookingForCancel: null,
    };

    playNotificationChime('alert');
    this.notify();
    return { success: true };
  }

  // --- Booking Status Progression ---
  public checkInReservation(reservationId: string) {
    const res = this.state.reservations.find((r) => r.reservationId === reservationId);
    if (!res) return;

    const now = new Date().toISOString();
    const updated = this.state.reservations.map((r) => {
      if (r.reservationId === reservationId) {
        return {
          ...r,
          bookingStatus: 'CHECKED_IN' as const,
          checkInTime: now,
          updatedAt: now,
        };
      }
      return r;
    });

    // Bump kitchen prep to COOKING if scheduled
    const updatedKitchen = this.state.kitchenTickets.map((kt) => {
      if (kt.sourceId === reservationId && kt.status === 'SCHEDULED') {
        return {
          ...kt,
          status: 'COOKING' as const,
          startedCookingAt: now,
        };
      }
      return kt;
    });

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Checked In! 📍',
      message: `Welcome ${res.customerName}! Your table ${res.tableNumber} is being prepared. Kitchen notified.`,
      type: 'TABLE_READY',
      timestamp: now,
      read: false,
      bookingId: reservationId,
    };

    this.state = {
      ...this.state,
      reservations: updated,
      kitchenTickets: updatedKitchen,
      notifications: [notif, ...this.state.notifications],
      activeCheckInBookingId: null,
    };

    playNotificationChime('kitchen');
    this.notify();
  }

  public seatReservation(reservationId: string) {
    const res = this.state.reservations.find((r) => r.reservationId === reservationId);
    if (!res) return;

    const now = new Date().toISOString();
    const updatedRes = this.state.reservations.map((r) => {
      if (r.reservationId === reservationId) {
        return {
          ...r,
          bookingStatus: 'SEATED' as const,
          seatedTime: now,
          updatedAt: now,
        };
      }
      return r;
    });

    // Mark restaurant table status as OCCUPIED
    const updatedRestaurants = this.state.restaurants.map((rest) => {
      if (rest.id === res.restaurantId) {
        return {
          ...rest,
          tables: rest.tables.map((t) => (t.id === res.tableId ? { ...t, status: 'OCCUPIED' as const } : t)),
        };
      }
      return rest;
    });

    this.state = {
      ...this.state,
      reservations: updatedRes,
      restaurants: updatedRestaurants,
    };
    playNotificationChime('success');
    this.notify();
  }

  public completeReservation(reservationId: string) {
    const res = this.state.reservations.find((r) => r.reservationId === reservationId);
    if (!res) return;

    const now = new Date().toISOString();
    const updatedRes = this.state.reservations.map((r) => {
      if (r.reservationId === reservationId) {
        return {
          ...r,
          bookingStatus: 'COMPLETED' as const,
          completedTime: now,
          updatedAt: now,
        };
      }
      return r;
    });

    // Mark table AVAILABLE again
    const updatedRestaurants = this.state.restaurants.map((rest) => {
      if (rest.id === res.restaurantId) {
        return {
          ...rest,
          tables: rest.tables.map((t) => (t.id === res.tableId ? { ...t, status: 'AVAILABLE' as const } : t)),
        };
      }
      return rest;
    });

    this.state = {
      ...this.state,
      reservations: updatedRes,
      restaurants: updatedRestaurants,
    };
    playNotificationChime('success');
    this.notify();
  }

  // --- Live Queue & Walk-In System ---
  public joinLiveQueue(data: {
    restaurantId: string;
    customerName: string;
    customerPhone: string;
    guestCount: number;
    tablePreference: TableSection;
    preOrderItems?: PreOrderItem[];
  }): QueueToken {
    const restaurant = this.state.restaurants.find((r) => r.id === data.restaurantId) || this.state.restaurants[0];
    const tokenId = generateTokenId(this.state.queueTokens.length);
    
    // AI Wait-time prediction algorithm
    const waitingTokens = this.state.queueTokens.filter((q) => q.status === 'WAITING').length;
    const estimatedWaitMinutes = Math.max(5, (waitingTokens + 1) * 8 + (data.guestCount > 4 ? 10 : 0));

    let preOrderTotal = 0;
    data.preOrderItems?.forEach((pi) => {
      preOrderTotal += pi.item.price * pi.quantity;
    });

    const newToken: QueueToken = {
      tokenId,
      restaurantId: restaurant.id,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      guestCount: data.guestCount,
      tablePreference: data.tablePreference,
      status: 'WAITING',
      joinedAt: new Date().toISOString(),
      estimatedWaitMinutes,
      preOrderItems: data.preOrderItems,
      preOrderTotal,
    };

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Queue Token Issued 🎟️',
      message: `Token ${tokenId} generated for ${data.customerName}. Estimated wait: ~${estimatedWaitMinutes} mins.`,
      type: 'CONFIRMATION',
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.state = {
      ...this.state,
      queueTokens: [newToken, ...this.state.queueTokens],
      notifications: [notif, ...this.state.notifications],
    };

    playNotificationChime('success');
    this.notify();
    return newToken;
  }

  public callQueueToken(tokenId: string, assignedTableNumber?: string) {
    const token = this.state.queueTokens.find((q) => q.tokenId === tokenId);
    if (!token) return;

    const updated = this.state.queueTokens.map((q) => {
      if (q.tokenId === tokenId) {
        return {
          ...q,
          status: 'CALLING' as const,
          assignedTableNumber: assignedTableNumber || 'T-1',
          notifiedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Table Ready for Token ${tokenId} 🔔`,
      message: `Calling ${token.customerName}! Please proceed to Table ${assignedTableNumber || 'T-1'}.`,
      type: 'TABLE_READY',
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.state = {
      ...this.state,
      queueTokens: updated,
      notifications: [notif, ...this.state.notifications],
    };

    playNotificationChime('kitchen');
    this.notify();
  }

  public seatQueueToken(tokenId: string) {
    const updated = this.state.queueTokens.map((q) => {
      if (q.tokenId === tokenId) {
        return { ...q, status: 'SEATED' as const };
      }
      return q;
    });

    this.state = { ...this.state, queueTokens: updated };
    playNotificationChime('success');
    this.notify();
  }

  // --- Waitlist System ---
  public joinWaitlist(data: {
    restaurantId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    guestCount: number;
    preferredDate: string;
    preferredTime: string;
    tablePreference: TableSection;
  }): WaitlistEntry {
    const waitlistId = generateWaitlistId();
    const entry: WaitlistEntry = {
      waitlistId,
      restaurantId: data.restaurantId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      guestCount: data.guestCount,
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      tablePreference: data.tablePreference,
      status: 'WAITING',
      joinedAt: new Date().toISOString(),
      estimatedWaitMinutes: 20,
    };

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Added to Smart Waitlist 📋',
      message: `Waitlist entry ${waitlistId} created for ${data.customerName}. We will notify you the moment a table frees up.`,
      type: 'WAITLIST',
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.state = {
      ...this.state,
      waitlist: [entry, ...this.state.waitlist],
      notifications: [notif, ...this.state.notifications],
      activeWaitlistModal: false,
    };

    playNotificationChime('success');
    this.notify();
    return entry;
  }

  public claimWaitlistTable(waitlistId: string) {
    const entry = this.state.waitlist.find((w) => w.waitlistId === waitlistId);
    if (!entry) return;

    // Convert to confirmed reservation
    this.createReservation({
      restaurantId: entry.restaurantId,
      customerName: entry.customerName,
      customerPhone: entry.customerPhone,
      customerEmail: entry.customerEmail,
      date: entry.preferredDate,
      startTime: entry.preferredTime,
      guestCount: entry.guestCount,
      tablePreference: entry.tablePreference,
      preOrderItems: [],
    });

    const updatedWaitlist = this.state.waitlist.map((w) =>
      w.waitlistId === waitlistId ? { ...w, status: 'CLAIMED' as const } : w
    );

    this.state = { ...this.state, waitlist: updatedWaitlist };
    this.notify();
  }

  // --- Kitchen Display System Actions ---
  public updateKitchenTicketStatus(ticketId: string, status: 'SCHEDULED' | 'COOKING' | 'READY' | 'SERVED') {
    const updated = this.state.kitchenTickets.map((kt) => {
      if (kt.ticketId === ticketId) {
        return {
          ...kt,
          status,
          startedCookingAt: status === 'COOKING' ? new Date().toISOString() : kt.startedCookingAt,
          completedAt: status === 'SERVED' || status === 'READY' ? new Date().toISOString() : kt.completedAt,
        };
      }
      return kt;
    });

    this.state = { ...this.state, kitchenTickets: updated };
    playNotificationChime(status === 'READY' ? 'kitchen' : 'alert');
    this.notify();
  }

  // --- Restaurant Admin Configuration ---
  public updateRestaurantSettings(restaurantId: string, updates: Partial<Restaurant>) {
    const updatedRestaurants = this.state.restaurants.map((rest) => {
      if (rest.id === restaurantId) {
        return { ...rest, ...updates };
      }
      return rest;
    });

    this.state = { ...this.state, restaurants: updatedRestaurants };
    this.notify();
  }

  public updateTableStatus(restaurantId: string, tableId: string, status: Table['status']) {
    const updatedRestaurants = this.state.restaurants.map((rest) => {
      if (rest.id === restaurantId) {
        return {
          ...rest,
          tables: rest.tables.map((t) => (t.id === tableId ? { ...t, status } : t)),
        };
      }
      return rest;
    });

    this.state = { ...this.state, restaurants: updatedRestaurants };
    this.notify();
  }

  // --- Chat Messages ---
  public addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.state = {
      ...this.state,
      chatMessages: [...this.state.chatMessages, newMsg],
    };
    this.notify();
  }

  // --- Notifications ---
  public markNotificationRead(id: string) {
    this.state = {
      ...this.state,
      notifications: this.state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    };
    this.notify();
  }

  public clearAllNotifications() {
    this.state = { ...this.state, notifications: [] };
    this.notify();
  }
}

export const store = new StateStore();
