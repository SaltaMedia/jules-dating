import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://jules-dating-backend.onrender.com' 
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002');
    
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '7d';
    const limit = url.searchParams.get('limit') || '50';
    
    const response = await fetch(`${backendUrl}/api/analytics/users?timeRange=${timeRange}&limit=${limit}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match what the frontend expects
    const users = data.data?.map((user: any) => ({
      _id: user._id,
      name: user.userDetails?.name || 'Anonymous',
      email: user.userDetails?.email || 'anonymous@example.com',
      isAdmin: user.userDetails?.isAdmin || false,
      createdAt: user.userDetails?.createdAt || user.lastActive,
      lastLogin: user.lastActive,
      totalSessions: user.totalSessions,
      totalPageViews: user.totalPageViews,
      totalChatMessages: user.totalChatMessages,
      averageSessionDuration: user.averageSessionDuration
    })) || [];

    return NextResponse.json({
      users,
      totalUsers: data.totalUsers || users.length,
      activeUsers: data.activeUsers || users.filter((u: any) => u.lastLogin).length,
      adminUsers: data.adminUsers || users.filter((u: any) => u.isAdmin).length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
