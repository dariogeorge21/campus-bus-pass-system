import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import type { RoutesApiResponse } from '@/types/reports';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Get booking counts per route
      const { data: bookingData, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('bus_route')
        .order('bus_route');

      if (bookingError) {
        console.error('Error fetching booking data:', bookingError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch booking data',
          data: null
        }, { status: 500 });
      }

      // Get all active buses
      const { data: busData, error: busError } = await supabaseAdmin
        .from('buses')
        .select('route_code, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (busError) {
        console.error('Error fetching bus data:', busError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch bus data',
          data: null
        }, { status: 500 });
      }

      // Count bookings per route
      const bookingCounts = bookingData?.reduce((acc: Record<string, number>, booking: any) => {
        acc[booking.bus_route] = (acc[booking.bus_route] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate total bookings across all routes
      const totalBookings = Object.values(bookingCounts).reduce((sum: number, count: unknown) => sum + (count as number), 0);

      // Transform data and calculate demand percentages
      const routes = busData?.map((bus: any) => {
        const bookingCount = bookingCounts[bus.route_code] || 0;
        const bookingPercentage = totalBookings > 0 ? Math.round((bookingCount / totalBookings) * 100) : 0;

        // Determine demand level based on booking percentage
        let demandLevel: 'High' | 'Medium' | 'Low';
        if (bookingPercentage >= 15) {
          demandLevel = 'High';
        } else if (bookingPercentage >= 5) {
          demandLevel = 'Medium';
        } else {
          demandLevel = 'Low';
        }

        return {
          routeCode: bus.route_code,
          busName: bus.name,
          totalBookings: bookingCount,
          bookingPercentage,
          demandLevel,
          isActive: bus.is_active
        };
      }) || [];

      // Sort by booking count (highest first)
      routes.sort((a, b) => b.totalBookings - a.totalBookings);

      const response: RoutesApiResponse = {
        success: true,
        data: {
          routes,
          totalBookings
        }
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'max-age=300', // 5-minute cache
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Unexpected error in routes endpoint:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        data: null
      }, { status: 500 });
    }
  });
}
