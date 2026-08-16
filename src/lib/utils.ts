// Utility helper functions for Queuebite

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime12h(time24: string): string {
  try {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return time24;
  }
}

export function calculateEndTime(startTime24: string, durationMinutes = 90): string {
  try {
    const [hours, minutes] = startTime24.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  } catch {
    return '21:00';
  }
}

export function calculatePrepStartTime(reservationTime24: string, prepDurationMinutes = 15): string {
  try {
    const [hours, minutes] = reservationTime24.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes - prepDurationMinutes;
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const prepHours = Math.floor(totalMinutes / 60) % 24;
    const prepMinutes = totalMinutes % 60;
    return `${prepHours.toString().padStart(2, '0')}:${prepMinutes.toString().padStart(2, '0')}`;
  } catch {
    return '19:15';
  }
}

export function generateBookingId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `QB-2026-${randomNum}`;
}

export function generateTokenId(currentTokensCount: number): string {
  const nextNum = currentTokensCount + 41;
  return `T-${nextNum.toString().padStart(3, '0')}`;
}

export function generateWaitlistId(): string {
  const randomNum = Math.floor(200 + Math.random() * 800);
  return `WL-${randomNum}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
  const day = tomorrow.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate an ICS calendar export file for download
export function generateIcsFile(reservation: {
  bookingId: string;
  restaurantName: string;
  address: string;
  date: string;
  startTime: string;
  guestCount: number;
  tableNumber: string;
}): void {
  const [year, month, day] = reservation.date.split('-').map(Number);
  const [startH, startM] = reservation.startTime.split(':').map(Number);
  
  const startDt = new Date(year, month - 1, day, startH, startM);
  const endDt = new Date(year, month - 1, day, startH + 1, startM + 30);
  
  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Queuebite//Restaurant Reservation//EN',
    'BEGIN:VEVENT',
    `UID:${reservation.bookingId}@queuebite.app`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDt)}`,
    `DTEND:${formatIcsDate(endDt)}`,
    `SUMMARY:Table at ${reservation.restaurantName} (Table ${reservation.tableNumber})`,
    `DESCRIPTION:Reservation ID: ${reservation.bookingId}\\nGuests: ${reservation.guestCount}\\nTable: ${reservation.tableNumber}\\nBooked via Queuebite.`,
    `LOCATION:${reservation.address}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `queuebite-reservation-${reservation.bookingId}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Web Audio API Chime for alerts
export function playNotificationChime(type: 'success' | 'alert' | 'kitchen' = 'success'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.5);
    } else if (type === 'kitchen') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // AudioContext autoplay restrictions
  }
}
