import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { withAuth, createApiResponse, handleApiError } from '@/lib/middleware';

// GET /api/admin/bookings/stats - Get booking statistics
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Get total bookings
      const { count: totalBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Get paid bookings
      const { count: paidBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', true);

      // Get bookings by route
      const { data: allBookings } = await supabaseAdmin
        .from('bookings')
        .select('bus_route');

      const routeStats: { [key: string]: number } = {};
      allBookings?.forEach((booking: { bus_route: string }) => {
        routeStats[booking.bus_route] = (routeStats[booking.bus_route] || 0) + 1;
      });

      // Get recent bookings (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get daily bookings for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: dailyBookingsData } = await supabaseAdmin
        .from('bookings')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by date
      const dailyStats: { [key: string]: number } = {};
      dailyBookingsData?.forEach((booking: { created_at: string }) => {
        const date = new Date(booking.created_at).toISOString().split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      });

      // Get total revenue from actual fare data
      const { data: paidBookingsWithFare } = await supabaseAdmin
        .from('bookings')
        .select('fare')
        .eq('payment_status', true)
        .not('fare', 'is', null);

      // Calculate actual revenue from stored fare data
      const actualRevenue = paidBookingsWithFare?.reduce((total: number, booking: { fare: number }) => {
        return total + (booking.fare || 0);
      }, 0) || 0;

      // Fallback to estimated revenue if no fare data is available
      const estimatedRevenue = (paidBookings || 0) * 50; // Average fare estimate
      const totalRevenue = actualRevenue > 0 ? actualRevenue : estimatedRevenue;

      return createApiResponse({
        totalBookings: totalBookings || 0,
        paidBookings: paidBookings || 0,
        pendingBookings: (totalBookings || 0) - (paidBookings || 0),
        recentBookings: recentBookings || 0,
        totalRevenue,
        estimatedRevenue,
        routeStats: Object.entries(routeStats).map(([route, count]) => ({ route, count })),
        dailyStats: Object.entries(dailyStats).map(([date, count]) => ({ date, count }))
      });
    } catch (error) {
      return handleApiError(error, 'Failed to fetch booking statistics');
    }
  });
}
