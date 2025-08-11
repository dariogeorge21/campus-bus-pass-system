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

    console.log('Creating booking with data:', {
      studentName,
      admissionNumber,
      busRoute,
      destination,
      paymentStatus,
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