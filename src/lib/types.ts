export type TableSection = 'WINDOW' | 'INDOOR' | 'OUTDOOR' | 'AC_SECTION' | 'FAMILY' | 'COUPLE' | 'VIP_LOUNGE' | 'ANY';

export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'BLOCKED';

export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'NOT_REQUIRED';

export type QueueStatus = 'WAITING' | 'CALLING' | 'SEATED' | 'CANCELLED';

export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'CLAIMED' | 'EXPIRED';

export type PrepStatus = 'SCHEDULED' | 'COOKING' | 'READY' | 'SERVED';

export type DietaryType = 'VEG' | 'NON_VEG' | 'VEGAN';

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  section: TableSection;
  sectionName: string;
  floor: string;
  status: TableStatus;
  isAccessible: boolean;
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Starters' | 'Main Course' | 'Dosa' | 'Pizza' | 'Burgers' | 'Beverages' | 'Desserts' | 'Combos';
  price: number;
  description: string;
  image: string;
  dietary: DietaryType;
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy';
  prepTimeMinutes: number;
  isPopular?: boolean;
  calories?: number;
}

export interface PreOrderItem {
  item: MenuItem;
  quantity: number;
  specialNotes?: string;
}

export interface Reservation {
  reservationId: string; // e.g. "QB-2026-1048"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  restaurantId: string;
  restaurantName: string;
  tableId: string;
  tableNumber: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "19:30"
  endTime: string; // "21:00"
  guestCount: number;
  tablePreference: TableSection;
  specialRequests?: string;
  preOrderItems: PreOrderItem[];
  preOrderTotal: number;
  discountAmount: number;
  finalAmount: number;
  depositRequired: boolean;
  depositAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING' | 'CASH_AT_DESK';
  bookingStatus: BookingStatus;
  qrCodeData: string;
  prepStartTime?: string; // e.g. "19:15"
  prepStatus: PrepStatus;
  checkInTime?: string;
  seatedTime?: string;
  completedTime?: string;
  gracePeriodMinutes: number;
  isLate?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueToken {
  tokenId: string; // e.g. "T-042"
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  tablePreference: TableSection;
  status: QueueStatus;
  joinedAt: string;
  estimatedWaitMinutes: number;
  assignedTableId?: string;
  assignedTableNumber?: string;
  preOrderItems?: PreOrderItem[];
  preOrderTotal?: number;
  notifiedAt?: string;
}

export interface WaitlistEntry {
  waitlistId: string; // e.g. "WL-284"
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  guestCount: number;
  preferredDate: string;
  preferredTime: string;
  tablePreference: TableSection;
  status: WaitlistStatus;
  joinedAt: string;
  estimatedWaitMinutes: number;
  notifiedAt?: string;
  offeredTableId?: string;
  offeredTableNumber?: string;
}

export interface KitchenTicket {
  ticketId: string;
  sourceType: 'RESERVATION' | 'LIVE_QUEUE' | 'DINE_IN';
  sourceId: string; // reservationId or tokenId
  customerName: string;
  tableNumber: string;
  items: PreOrderItem[];
  scheduledPrepTime: string; // "19:15"
  targetServeTime: string; // "19:30"
  prepDurationMinutes: number;
  status: PrepStatus;
  specialNotes?: string;
  startedCookingAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  image: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  cuisines: string[];
  location: string;
  address: string;
  phone: string;
  openingTime: string; // "11:00"
  closingTime: string; // "23:00"
  slotDurationMinutes: number; // 90
  cleaningBufferMinutes: number; // 15
  gracePeriodMinutes: number; // 15
  depositRequired: boolean;
  depositAmount: number; // 200
  tables: Table[];
  menu: MenuItem[];
  currentOccupancy: number; // percentage e.g. 75
  totalTables: number;
  availableTables: number;
  estimatedQueueWaitMinutes: number;
  offers: {
    code: string;
    title: string;
    description: string;
    discountPercent?: number;
    discountFlat?: number;
    minOrder?: number;
  }[];
  acceptedPaymentMethods?: ('UPI' | 'CARD' | 'NETBANKING' | 'CASH_AT_DESK')[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'CONFIRMATION' | 'REMINDER' | 'TABLE_READY' | 'KITCHEN_ALERT' | 'LATE_WARNING' | 'CANCELLED' | 'WAITLIST';
  timestamp: string;
  read: boolean;
  bookingId?: string;
}

export interface ActionCardData {
  restaurantId?: string;
  restaurantName?: string;
  date?: string;
  timeSlot?: string;
  guestCount?: number;
  preference?: TableSection;
  items?: MenuItem[];
  alternativeSlots?: string[];
  alternativeTimeSlots?: string[];
  token?: QueueToken;
  booking?: Reservation;
  assignedTable?: Table;
  estimatedWaitMinutes?: number;
  waitingCount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actionCard?: {
    type: 'BOOKING_PROPOSAL' | 'ALTERNATIVE_SLOTS' | 'PRE_ORDER_PROMPT' | 'BOOKING_SUMMARY' | 'QUEUE_TOKEN' | 'MENU_RECOMMENDATION';
    data: ActionCardData;
  };
}

export type AppViewRole = 'CUSTOMER' | 'ADMIN' | 'KITCHEN' | 'SCANNER';

export interface JobRole {
  id: string;
  name: string;
  code: string; // e.g. "ADMIN", "KITCHEN", "SCANNER", "MANAGER", "WAITER"
  description: string;
  permissions: ('DASHBOARD' | 'KITCHEN' | 'SCANNER' | 'STAFF_MANAGEMENT')[];
  createdAt: string;
}

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string; // References JobRole.code
}
