import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkBookingStatus } from '@/lib/middleware';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // CRITICAL SECURITY CHECK: Verify booking is enabled before processing any booking
    try {
      await checkBookingStatus(supabaseAdmin);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Booking status check failed';
      console.error('Booking status check failed:', errorMessage);
      return NextResponse.json({ 
        error: errorMessage,
        details: 'Please try again later when booking is enabled'
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      studentName, 
      admissionNumber, 
      busRoute, 
      destination, 
      paymentStatus, 
      timestamp,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = body;

    // Fetch current admin settings to get travel dates
    const { data: adminSettings, error: adminError } = await supabaseAdmin
      .from('admin_settings')
      .select('go_date, return_date')
      .single();

    if (adminError) {
      console.error('Error fetching admin settings:', adminError);
      return NextResponse.json({ 
        error: 'Failed to fetch travel dates',
        details: 'Unable to retrieve current travel dates'
      }, { status: 500 });
    }

    // Fetch fare from route_stops table based on route and destination
    const { data: routeStop, error: fareError } = await supabaseAdmin
      .from('route_stops')
      .select('fare')
      .eq('route_code', busRoute)
      .eq('stop_name', destination)
      .eq('is_active', true)
      .single();

    if (fareError || !routeStop) {
      console.error('Error fetching fare:', fareError);
      return NextResponse.json({ 
        error: 'Failed to fetch fare information',
        details: `No fare found for route ${busRoute} and destination ${destination}`
      }, { status: 400 });
    }

    // Fetch bus name from buses table based on route code
    const { data: busData, error: busError } = await supabaseAdmin
      .from('buses')
      .select('name')
      .eq('route_code', busRoute)
      .eq('is_active', true)
      .single();

    if (busError || !busData) {
      console.error('Error fetching bus name:', busError);
      return NextResponse.json({ 
        error: 'Failed to fetch bus information',
        details: `No bus found for route code ${busRoute}`
      }, { status: 400 });
    }

    console.log('Creating booking with data:', {
      studentName,
      admissionNumber,
      busRoute,
      destination,
      paymentStatus,
      goDate: adminSettings.go_date,
      returnDate: adminSettings.return_date,
      fare: routeStop.fare,
      busName: busData.name,
      hasRazorpayData: !!(razorpay_payment_id || razorpay_order_id || razorpay_signature),
      razorpayFields: {
        payment_id: razorpay_payment_id ? 'present' : 'null',
        order_id: razorpay_order_id ? 'present' : 'null',
        signature: razorpay_signature ? 'present' : 'null'
      }
    });

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        // Database schema order
        admission_number: admissionNumber,
        student_name: studentName,
        bus_route: busRoute,
        destination: destination,
        payment_status: paymentStatus ?? false,
        created_at: timestamp,
        // Travel dates from admin settings
        go_date: adminSettings.go_date,
        return_date: adminSettings.return_date,
        // Fare from route_stops table
        fare: routeStop.fare,
        // Bus name from buses table
        bus_name: busData.name,
        // Razorpay fields - can be null for upfront payments
        razorpay_payment_id: razorpay_payment_id || null,
        razorpay_order_id: razorpay_order_id || null,
        razorpay_signature: razorpay_signature || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase booking error:', error);
      throw error;
    }

    console.log('Booking created successfully:', data.id);
    return NextResponse.json({ success: true, booking: data });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ 
      error: 'Failed to create booking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}