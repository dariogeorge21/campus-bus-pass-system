import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('booking_enabled')
      .single();

    if (error) {
      console.error('Error fetching booking status:', error);
      // SECURITY FIX: Default to disabled if there's an error (fail-safe)
      return NextResponse.json({ enabled: false });
    }

    // SECURITY FIX: Default to disabled if no data or null/undefined (secure by default)
    const bookingEnabled = data?.booking_enabled ?? false;
    console.log('Booking status:', { booking_enabled: bookingEnabled });

    return NextResponse.json({ enabled: bookingEnabled });
  } catch (error) {
    console.error('Unexpected error in booking status check:', error);
    // SECURITY FIX: Default to disabled if there's an unexpected error (fail-safe)
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}