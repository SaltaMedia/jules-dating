'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Activity,
  TrendingUp,
  Eye
} from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Jules Dating Admin</h1>
        <p className="text-gray-600">
          Monitor user engagement, track analytics, and manage your dating app from this centralized dashboard.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Available</div>
            <p className="text-xs text-gray-500">Comprehensive analytics dashboard</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">User Management</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Active</div>
            <p className="text-xs text-gray-500">User analytics and management</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chat Analytics</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Monitoring</div>
            <p className="text-xs text-gray-500">Real-time chat insights</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Performance</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">Optimal</div>
            <p className="text-xs text-gray-500">System performance tracking</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Access comprehensive analytics including user behavior, conversion funnels, chat analytics, 
              and performance metrics.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="h-4 w-4 mr-2" />
                Page views and session tracking
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                Conversion funnel analysis
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat sentiment and performance
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/admin/analytics">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  View Analytics Dashboard
                </Button>
              </Link>
              <Link href="/admin/analytics-v2">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  View New Analytics Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Monitor user activity, manage user accounts, and track user engagement patterns 
              across the platform.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                User registration and activity
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Activity className="h-4 w-4 mr-2" />
                Session and engagement tracking
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                User growth and retention
              </div>
            </div>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled
            >
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/analytics">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-sm text-gray-600">View detailed analytics and metrics</p>
              </div>
            </Link>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-500 mb-2">User Management</h3>
              <p className="text-sm text-gray-400">Coming soon - manage user accounts</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-500 mb-2">System Settings</h3>
              <p className="text-sm text-gray-400">Coming soon - configure system settings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
