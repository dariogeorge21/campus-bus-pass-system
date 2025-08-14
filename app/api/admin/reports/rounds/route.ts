import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import type { RoundsApiResponse } from '@/types/reports';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Get booking rounds data
      const { data: roundsData, error: roundsError } = await supabaseAdmin
        .from('booking_rounds')
        .select('id, go_date, return_date, total_bookings, total_revenue, reset_date')
        .order('reset_date', { ascending: false });

      if (roundsError) {
        console.error('Error fetching booking rounds:', roundsError);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch booking rounds data',
          data: null
        }, { status: 500 });
      }

      // Transform data to match interface
      const rounds = roundsData?.map((round: any) => ({
        id: round.id,
        goDate: round.go_date,
        returnDate: round.return_date,
        totalBookings: round.total_bookings,
        totalRevenue: Number(round.total_revenue),
        resetDate: round.reset_date
      })) || [];

      const response: RoundsApiResponse = {
        success: true,
        data: {
          rounds
        }
      };

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'max-age=300', // 5-minute cache
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Unexpected error in rounds endpoint:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        data: null
      }, { status: 500 });
    }
  });
}
