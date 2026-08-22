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

// Convert SVG element to PNG data URL (client-side only)
export async function svgToPngDataUrl(svgElement: SVGElement): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('svgToPngDataUrl must be run in browser');
  }
  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);
  
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL('image/png');
        URL.revokeObjectURL(blobURL);
        resolve(png);
      } else {
        URL.revokeObjectURL(blobURL);
        reject(new Error('Failed to get canvas 2D context'));
      }
    };
    image.onerror = (e) => {
      URL.revokeObjectURL(blobURL);
      reject(e);
    };
    image.src = blobURL;
  });
}

// Download a data URL as a file
export function downloadDataUrl(dataUrl: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate and download PDF pass ticket (client-side only)
export async function downloadPdfPass(
  booking: any, // Reservation or QueueToken
  restaurantName: string,
  address: string,
  qrPngDataUrl: string
): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a6', // 105 x 148 mm
  });

  // Background and border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 105, 148, 'F');
  
  // Outer elegant border
  doc.setDrawColor(228, 228, 231); // border-zinc-200
  doc.setLineWidth(1);
  doc.rect(4, 4, 97, 140);

  // Top header banner (Amber background)
  doc.setFillColor(245, 158, 11); // bg-amber-500
  doc.rect(4, 4, 97, 18, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('QUEUEBITE DIGITAL PASS', 52.5, 11, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Present this pass at the entrance', 52.5, 16, { align: 'center' });

  // Main Content styling
  doc.setTextColor(24, 24, 27); // text-zinc-900

  // Check if it's a reservation or queue token
  const isReservation = 'reservationId' in booking;
  const passId = isReservation ? booking.reservationId : booking.tokenId;
  const passTypeLabel = isReservation ? 'RESERVATION PASS' : 'LIVE QUEUE TOKEN';

  // Pass type title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122); // text-zinc-500
  doc.text(passTypeLabel, 10, 31);

  // Pass ID
  doc.setFontSize(16);
  doc.setTextColor(245, 158, 11); // text-amber-500
  doc.text(passId, 10, 38);

  // Restaurant Name
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27); // text-zinc-900
  doc.text(restaurantName, 10, 46);

  // Draw separator line
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.line(10, 50, 95, 50);

  // Details
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text('GUEST NAME:', 10, 56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text(booking.customerName, 38, 56);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);
  doc.text('PARTY SIZE:', 10, 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 24, 27);
  doc.text(`${booking.guestCount} Guests`, 38, 62);

  if (isReservation) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text('DATE & SLOT:', 10, 68);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(`${formatDate(booking.date)} at ${formatTime12h(booking.startTime)}`, 38, 68);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text('ASSIGNED TABLE:', 10, 74);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(`Table ${booking.tableNumber} (${booking.tablePreference})`, 38, 74);
  } else {
    // Walk-in queue details
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text('JOINED AT:', 10, 68);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    
    // Parse joinedAt time
    let joinedTime = 'Just now';
    if (booking.joinedAt) {
      try {
        joinedTime = new Date(booking.joinedAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } catch {
        joinedTime = booking.joinedAt;
      }
    }
    doc.text(joinedTime, 38, 68);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text('EST. WAIT TIME:', 10, 74);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 158, 11);
    doc.text(`~${booking.estimatedWaitMinutes} mins`, 38, 74);
  }

  // Draw separator line above QR code
  doc.setDrawColor(228, 228, 231);
  doc.line(10, 79, 95, 79);

  // Embed QR Code
  doc.addImage(qrPngDataUrl, 'PNG', 32.5, 83, 40, 40);

  // Bottom Footer styling
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91); // text-zinc-600
  doc.text(address, 52.5, 131, { align: 'center', maxWidth: 85 });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(161, 161, 170); // text-zinc-400
  doc.text('Powered by Queuebite Smart Restaurant Solutions', 52.5, 140, { align: 'center' });

  // Save the document
  doc.save(`queuebite-pass-${passId}.pdf`);
}

