import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Event validation schema
const validateEvent = (event: any) => {
  const required = ['eventType', 'sessionId', 'timestamp'];
  const missing = required.filter(field => !event[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  if (typeof event.eventType !== 'string' || event.eventType.length === 0) {
    return { valid: false, error: 'eventType must be a non-empty string' };
  }
  
  if (typeof event.sessionId !== 'string' || event.sessionId.length === 0) {
    return { valid: false, error: 'sessionId must be a non-empty string' };
  }
  
  if (isNaN(Date.parse(event.timestamp))) {
    return { valid: false, error: 'timestamp must be a valid ISO date string' };
  }
  
  return { valid: true };
};

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    // Validate event data
    const validation = validateEvent(eventData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid event data', details: validation.error },
        { status: 400 }
      );
    }
    
    // Forward the event to the backend analytics endpoint
    const response = await fetch(`${backendUrl}/api/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analytics event forwarding failed:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 500 }
    );
  }
}
