import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    let stats;

    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_detailed_booking_statistics');
        console.log(error);
        console.log(data);

      if (!error && data && data.length > 0) {
        stats = data[0];
        console.log(stats);
      } else {
        throw new Error('Database function not available');
      }
    } catch (functionError) {
      console.warn('Database function not available — returning N/A for all stats');
      stats = {
        total_buses: 'N/A',
        total_bookings: 'N/A',
        current_bookings: 'N/A',
        paid_bookings: 'N/A',
        unpaid_bookings: 'N/A',
        current_revenue: 'N/A',
        available_seats: 'N/A',
        total_capacity: 'N/A',
        occupancy_rate: 'N/A'
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBuses: stats.total_buses,
        totalBookings: stats.total_bookings,
        currentBookings: stats.current_bookings,
        paidBookings: stats.paid_bookings,
        unpaidBookings: stats.unpaid_bookings,
        currentRevenue: stats.current_revenue,
        availableSeats: stats.available_seats,
        totalCapacity: stats.total_capacity,
        occupancyRate: stats.occupancy_rate ?? (
          stats.total_capacity !== 'N/A' && stats.available_seats !== 'N/A'
            ? ((stats.total_capacity - stats.available_seats) / stats.total_capacity * 100).toFixed(1)
            : 'N/A'
        )
      },
      error: null
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=15'
      }
    });

  } catch (error) {
    console.error('Unexpected error fetching detailed booking statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}
