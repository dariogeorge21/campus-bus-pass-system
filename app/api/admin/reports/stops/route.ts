import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import type { StopsApiResponse } from '@/types/reports';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Get bus_route query parameter
      const { searchParams } = new URL(request.url);
      const busRoute = searchParams.get('bus_route');

      if (!busRoute) {
        return NextResponse.json({
          success: false,
          error: 'bus_route parameter is required',
          data: null
        }, { status: 400 });
      }

      // Validate that the bus route exists
      const { data: busData, error: busError } = await supabaseAdmin
        .from('buses')
        .select('name')
        .eq('route_code', busRoute)
        .eq('is_active', true)
        .single();

      if (busError || !busData) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or inactive bus route',
          data: null
        }, { status: 404 });
      }

      // Get total bookings for this route
      const { count: totalRouteBookings, error: totalError } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('bus_route', busRoute);

      if (totalError) {
        console.error('Error fetching total route bookings:', totalError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch route booking data',
          data: null
        }, { status: 500 });
      }

      // Get bookings grouped by destination (stop)
      const { data: stopBookings, error: stopError } = await supabaseAdmin
        .from('bookings')
        .select('destination')
        .eq('bus_route', busRoute);

      if (stopError) {
        console.error('Error fetching stop bookings:', stopError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch stop booking data',
          data: null
        }, { status: 500 });
      }

      // Count bookings per stop
      const stopCounts = stopBookings?.reduce((acc: Record<string, number>, booking: any) => {
        const stop = booking.destination;
        acc[stop] = (acc[stop] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Transform to array and calculate percentages
      const stops = (Object.entries(stopCounts) as [string, number][])
              .map(([stopName, bookingCount]) => ({
                stopName,
                bookingCount,
                percentageOfRoute: totalRouteBookings && totalRouteBookings > 0 
                  ? Math.round((bookingCount / totalRouteBookings) * 100) 
                  : 0
              }))
              .sort((a, b) => b.bookingCount - a.bookingCount); // Sort by booking count descending

      const response: StopsApiResponse = {
        success: true,
        data: {
          busRoute,
          busName: busData.name,
          totalRouteBookings: totalRouteBookings || 0,
          stops
        }
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'max-age=300', // 5-minute cache
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Unexpected error in stops endpoint:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        data: null
      }, { status: 500 });
    }
  });
}
