'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface BookingData {
  studentName: string;
  admissionNumber: string;
  busRoute: string;
  busName: string;
  destination: string;
  fare: number;
  paymentStatus: boolean;
}

interface BookingContextType {
  bookingData: BookingData;
  updateBookingData: (data: Partial<BookingData>) => void;
  resetBookingData: () => void;
}

const initialBookingData: BookingData = {
  studentName: '',
  admissionNumber: '',
  busRoute: '',
  busName: '',
  destination: '',
  fare: 0,
  paymentStatus: false,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);

  const updateBookingData = useCallback((data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  }, []);

  const resetBookingData = useCallback(() => {
    setBookingData(initialBookingData);
  }, []);

  return (
    <BookingContext.Provider value={{ bookingData, updateBookingData, resetBookingData }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}