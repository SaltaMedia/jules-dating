'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  Eye, 
  Clock, 
  TrendingUp, 
  Download,
  Activity,
  BarChart3,
  Camera,
  CheckCircle,
  UserPlus,
  MousePointer
} from 'lucide-react';

interface DashboardMetrics {
  // Core Metrics
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  
  // Landing Page Metrics
  landingPage: {
    sessions: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgTimeOnPage: number;
    getFreePicReviewClicks: number;
    getStartedClicks: number;
    conversionRate: number;
  };
  
  // Onboarding Funnel
  onboarding: {
    signupClicks: number;
    signupStarted: number;
    signupCompleted: number;
    firstLogin: number;
    conversionRates: {
      clickToStarted: number;
      startedToCompleted: number;
      completedToLogin: number;
      overall: number;
    };
  };
  
  // Feature Usage (per session)
  chatAnalytics: {
    activeUsers: number;
    totalConversations: number;
    messagesPerSession: number;
    sessionsWithChat: number;
  };
  
  profilePicReview: {
    activeUsers: number;
    totalReviews: number;
    averageRating: number;
    usersWithMultipleReviews: number;
  };
  
  fitCheck: {
    activeUsers: number;
    totalCompletions: number;
    averageRating: number;
    usersWithMultipleChecks: number;
  };
  
  // User Quality
  userQuality: {
    totalRegistered: number;
    verifiedEmails: number;
    engagedUsers: number; // users with 2+ meaningful actions
    returnUsers: {
      day1: number;
      day7: number;
      day30: number;
    };
  };
}

const AnalyticsDashboardV2 = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/analytics-v2/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const exportToCSV = async (dataType: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analytics-v2/export/${dataType}?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jules-dating-${dataType}-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={fetchMetrics} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jules Dating Analytics</h1>
          <p className="text-gray-600">User engagement and app performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => exportToCSV('dashboard')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-gray-500">
              {metrics.dailyActiveUsers} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.averageSessionDuration / 60000)}m
            </div>
            <p className="text-xs text-gray-500">
              {Math.round(metrics.averageSessionDuration / 1000)}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chat Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.chatAnalytics.totalConversations}</div>
            <p className="text-xs text-gray-500">
              {metrics.chatAnalytics.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Profile Pic Reviews</CardTitle>
            <Camera className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profilePicReview.totalReviews}</div>
            <p className="text-xs text-gray-500">
              {metrics.profilePicReview.averageRating.toFixed(1)} avg rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="landing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="landing">Landing Page</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="profile-pic">Profile Pic</TabsTrigger>
          <TabsTrigger value="fit-check">Fit Check</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Landing Page Tab */}
        <TabsContent value="landing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Landing Page Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Sessions</span>
                  <span className="font-semibold">{metrics.landingPage.sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unique Visitors</span>
                  <span className="font-semibold">{metrics.landingPage.uniqueVisitors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bounce Rate</span>
                  <span className="font-semibold">{metrics.landingPage.bounceRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Time on Page</span>
                  <span className="font-semibold">{Math.round(metrics.landingPage.avgTimeOnPage / 60)}m</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>"Get FREE profile pic review" Clicks</span>
                  <span className="font-semibold">{metrics.landingPage.getFreePicReviewClicks}</span>
                </div>
                <div className="flex justify-between">
                  <span>"Get started for free" Clicks</span>
                  <span className="font-semibold">{metrics.landingPage.getStartedClicks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overall Conversion Rate</span>
                  <span className="font-semibold text-green-600">{metrics.landingPage.conversionRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign-up Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Sign-up Clicks</span>
                  <span className="font-semibold">{metrics.onboarding.signupClicks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sign-up Started</span>
                  <span className="font-semibold">{metrics.onboarding.signupStarted}</span>
                  <Badge variant="outline">
                    {metrics.onboarding.conversionRates.clickToStarted.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sign-up Completed</span>
                  <span className="font-semibold">{metrics.onboarding.signupCompleted}</span>
                  <Badge variant="outline">
                    {metrics.onboarding.conversionRates.startedToCompleted.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>First Login</span>
                  <span className="font-semibold">{metrics.onboarding.firstLogin}</span>
                  <Badge variant="outline">
                    {metrics.onboarding.conversionRates.completedToLogin.toFixed(1)}%
                  </Badge>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Overall Conversion</span>
                    <Badge className="bg-green-100 text-green-800">
                      {metrics.onboarding.conversionRates.overall.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Chat Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="font-semibold">{metrics.chatAnalytics.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Conversations</span>
                  <span className="font-semibold">{metrics.chatAnalytics.totalConversations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sessions with Chat</span>
                  <span className="font-semibold">{metrics.chatAnalytics.sessionsWithChat}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages per Session</span>
                  <span className="font-semibold">{metrics.chatAnalytics.messagesPerSession.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Pic Review Tab */}
        <TabsContent value="profile-pic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Pic Review Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="font-semibold">{metrics.profilePicReview.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Reviews</span>
                  <span className="font-semibold">{metrics.profilePicReview.totalReviews}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Rating</span>
                  <span className="font-semibold">{metrics.profilePicReview.averageRating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Users with 2+ Reviews</span>
                  <span className="font-semibold">{metrics.profilePicReview.usersWithMultipleReviews}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fit Check Tab */}
        <TabsContent value="fit-check" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fit Check Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Users</span>
                  <span className="font-semibold">{metrics.fitCheck.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Completions</span>
                  <span className="font-semibold">{metrics.fitCheck.totalCompletions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Rating</span>
                  <span className="font-semibold">{metrics.fitCheck.averageRating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Users with 2+ Checks</span>
                  <span className="font-semibold">{metrics.fitCheck.usersWithMultipleChecks}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Registered</span>
                  <span className="font-semibold">{metrics.userQuality.totalRegistered}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified Emails</span>
                  <span className="font-semibold">{metrics.userQuality.verifiedEmails}</span>
                </div>
                <div className="flex justify-between">
                  <span>Engaged Users (2+ actions)</span>
                  <span className="font-semibold">{metrics.userQuality.engagedUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Return User Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Returned after 1 day</span>
                  <span className="font-semibold">{metrics.userQuality.returnUsers.day1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Returned after 7 days</span>
                  <span className="font-semibold">{metrics.userQuality.returnUsers.day7}</span>
                </div>
                <div className="flex justify-between">
                  <span>Returned after 30 days</span>
                  <span className="font-semibold">{metrics.userQuality.returnUsers.day30}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboardV2;
