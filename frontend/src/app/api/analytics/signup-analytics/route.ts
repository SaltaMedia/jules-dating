import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://jules-dating-backend.onrender.com' 
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002');
    
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '7d';
    
    const response = await fetch(`${backendUrl}/api/analytics/signup-analytics?timeRange=${timeRange}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sign-up analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sign-up analytics' },
      { status: 500 }
    );
  }
}
