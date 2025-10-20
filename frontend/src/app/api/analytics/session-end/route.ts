import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;
    
    // For now, just log the session end event
    // TODO: Implement server-side Segment tracking for session end
    console.log('Session end event received:', { event, properties });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session end tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

