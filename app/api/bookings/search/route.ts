import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createApiResponse, handleApiError } from '@/lib/middleware';

// Simple in-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIdentifier(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `search:${ip}`;
}

// GET /api/bookings/search?admission_number=XXXXXXX - Search bookings by admission number
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request);
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const admissionNumber = searchParams.get('admission_number');

    // Validate admission number format
    if (!admissionNumber) {
      return NextResponse.json(
        { error: 'Admission number is required' },
        { status: 400 }
      );
    }

    // Validate admission number format: 7 characters, first 2 digits, next 2 alphabets, last 3 digits
    const admissionNumberRegex = /^\d{2}[A-Za-z]{2}\d{3}$/;
    if (!admissionNumberRegex.test(admissionNumber)) {
      return NextResponse.json(
        { error: 'Invalid admission number format. Expected format: XXAA000 (2 digits, 2 letters, 3 digits)' },
        { status: 400 }
      );
    }

    // Sanitize input (convert to uppercase for consistency)
    const sanitizedAdmissionNumber = admissionNumber.toUpperCase();

    // Query bookings with proper error handling
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('admission_number', sanitizedAdmissionNumber)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Return bookings or empty array
    return createApiResponse({
      bookings: bookings || [],
      count: bookings?.length || 0
    });

  } catch (error) {
    return handleApiError(error, 'Failed to search bookings');
  }
} 