import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const fbclid = url.searchParams.get('fbclid');
  const res = NextResponse.next();
  
  // Set _fbc cookie for click tracking
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    res.cookies.set('_fbc', fbc, { 
      path: '/', 
      maxAge: 60 * 60 * 24 * 90,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
  
  // Set _fbp cookie for browser tracking
  if (!req.cookies.get('_fbp')) {
    const fbp = `fb.1.${Date.now()}.${randomUUID().slice(0,10)}`;
    res.cookies.set('_fbp', fbp, { 
      path: '/', 
      maxAge: 60 * 60 * 24 * 90,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
  
  return res;
}

export const config = { 
  matcher: ['/((?!_next|api|static|favicon.ico).*)'] 
};
