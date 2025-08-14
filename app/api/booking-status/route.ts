import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'; // This forces the route to be dynamically rendered

export async function GET() {
  try {
    // Add a timestamp query parameter to the Supabase query to bust any internal caching
    const timestamp = Date.now();
    const { data, error } = await supabase
      .from('admin_settings')
      .select('booking_enabled')
      .single();

    if (error) {
      console.error('Error fetching booking status:', error);
      // SECURITY FIX: Default to disabled if there's an error (fail-safe)
      return createNoCacheResponse({ enabled: false });
    }

    // SECURITY FIX: Default to disabled if no data or null/undefined (secure by default)
    const bookingEnabled = data?.booking_enabled ?? false;
    console.log('Booking status:', { booking_enabled: bookingEnabled, timestamp });

    return createNoCacheResponse({ enabled: bookingEnabled });
  } catch (error) {
    console.error('Unexpected error in booking status check:', error);
    // SECURITY FIX: Default to disabled if there's an unexpected error (fail-safe)
    return createNoCacheResponse({ enabled: false }, 500);
  }
}

// Helper function to create responses with no-cache headers
function createNoCacheResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}