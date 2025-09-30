import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://jules-dating.onrender.com';
    const fullUrl = `${backendUrl}/api/auth/register`;
    
    console.log('Registration route - Backend URL:', backendUrl);
    console.log('Registration route - Full URL:', fullUrl);
    console.log('Registration route - Request body:', body);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Registration route - Response status:', response.status);
    const data = await response.json();
    console.log('Registration route - Response data:', data);
    
    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Registration API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
