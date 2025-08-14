import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import type { RevenueApiResponse } from '@/types/reports';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Get revenue data from analytics_revenue table
      const { data: revenueData, error: revenueError } = await supabaseAdmin
        .from('analytics_revenue')
        .select('bus_route, bus_name, total_revenue, booking_count')
        .order('total_revenue', { ascending: false });

      if (revenueError) {
        console.error('Error fetching revenue data:', revenueError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch revenue data',
          data: null
        }, { status: 500 });
      }

      // Calculate total revenue
      const totalRevenue = revenueData?.reduce((sum, route) => sum + Number(route.total_revenue), 0) || 0;

      // Transform data and calculate revenue per booking
      const routes = revenueData?.map(route => ({
        busRoute: route.bus_route,
        busName: route.bus_name,
        totalRevenue: Number(route.total_revenue),
        bookingCount: route.booking_count,
        revenuePerBooking: route.booking_count > 0 ? Number(route.total_revenue) / route.booking_count : 0
      })) || [];

      const response: RevenueApiResponse = {
        success: true,
        data: {
          totalRevenue,
          routes
        }
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'max-age=300', // 5-minute cache
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Unexpected error in revenue endpoint:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        data: null
      }, { status: 500 });
    }
  });
}
