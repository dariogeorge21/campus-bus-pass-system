export interface Bus {
  id: number;
  name: string;
  route: string;
}

export interface RouteStop {
  id: number;
  name: string;
  fare: number;
}

export interface Booking {
  studentName: string;
  admissionNumber: string;
  busRoute: string;
  destination: string;
  paymentStatus: boolean;
  timestamp: string;
  goDate?: string | null;
  returnDate?: string | null;
  fare?: number | null;
  busName?: string | null;
}

export interface AdminSettings {
  bookingEnabled: boolean;
  goDate: string | null;
  returnDate: string | null;
  busAvailability: { [busRoute: string]: number };
}

export interface NewBookingStats {
  totalBuses: number;
  totalBookings: number;
  currentBookings: number;
  paidBookings: number;
  unpaidBookings: number;
  currentRevenue: number;
  availableSeats: number;
  totalCapacity: number;
  occupancyRate: string;
}