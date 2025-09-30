'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  Download,
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface DashboardMetrics {
  // General Metrics
  totalUsers: number;
  activeUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  totalSessions: number;
  totalPageViews: number;
  totalChatMessages: number;
  bounceRate: number;
  averageSessionDuration: number;
  errors: number;
  
  // Conversion Funnel
  landingPageVisits: number;
  meetJulesClicks: number;
  accountCreations: number;
  onboardingCompletions: number;
  conversionRate: string;
  
  // Onboarding Analytics
  onboardingSteps: Array<{ step: string; completed: number; skipped: number; total: number; completionRate: number }>;
  onboardingBounces: number;
  
  // Chat Analytics
  chatAnalytics: {
    totalConversations: number;
    averageResponseTime: number;
    topIntents: Array<{ _id: string; count: number }>;
    sentimentDistribution: { positive: string; neutral: string; negative: string };
    productCalls: number;
    productLinksClicked: number;
    wishlistAdds: number;
  };
  
  // Fit Check Analytics
  fitCheckAnalytics: {
    fitCheckVisits: number;
    fitCheckCompletions: number;
    completionRate: number | string;
    averageRating: number;
  };
  
  // Profile Pic Review Analytics
  profilePicReviewAnalytics: {
    profilePicReviewVisits: number;
    profilePicReviewCompletions: number;
    profilePicReviewsSaved: number;
    completionRate: string;
    averageRating: string;
  };
  
  // Tips Analytics
  tipsAnalytics: {
    tipPageViews: number;
    tipsRead: number;
    engagementRate: string;
  };
  
  // Closet Analytics
  closetAnalytics: {
    usersWithItems: Array<{ itemCount: number; userCount: number }>;
    wishlistAccessRate: number | string;
    wishlistCTR: number | string;
    wishlistClickThroughs: number;
  };
  
  // User Analytics
  userAnalytics: {
    userEmails: Array<{ email: string; lastActive: string }>;
    repeatVisitors: number;
    repeatVisitorRate: number | string;
  };
  
  // Page Analytics
  topPages: Array<{ _id: string; count: number }>;
  topFeatures: Array<{ feature: string; count: number; uniqueUsers: number }>;
  
  // Chat Logs
  chatLogs: {
    totalLogs: number;
    totalConversations: number;
    logs: Array<{ 
      userId: string; 
      role: string;
      message: string; 
      timestamp: string; 
      sentiment: string;
      conversationId: string;
    }>;
  };
  
  // Free Experience Analytics
  freeExperienceSessions: number;
  freeExperienceUniqueVisitors: number;
  freeExperienceFitCheckClicks: number;
  freeExperienceGetStartedClicks: number;
  freeExperienceRegistrations: number;
  freeExperienceFitCheckSessions: number;
  freeExperienceFitCheckCompletions: number;
  freeExperienceSignupClicks: number;
  freeExperienceFitCheckRegistrations: number;
  
  // Additional Free Experience Properties
  tryFreeFitCheckClicks: number;
  getStartedForFreeClicks: number;
  registrationsFromLanding: number;
  fitCheckSessions: number;
  fitCheckUniqueVisitors: number;
  fitChecksStarted: number;
  fitChecksCompleted: number;
  signupForFullExperienceClicks: number;
  registrationsFromFitCheck: number;
}

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);

  // CSV Export function
  const exportToCSV = async (dataType: string) => {
    setExporting(true);
    try {
      let endpoint = '';
      let filename = '';
      
      switch (dataType) {
        case 'dashboard':
          endpoint = `/api/analytics/dashboard?timeRange=${timeRange}`;
          filename = `jules-dating-analytics-dashboard-${timeRange}.csv`;
          break;
        case 'chat-logs':
          endpoint = `/api/analytics/chat-logs?timeRange=${timeRange}`;
          filename = `jules-dating-chat-logs-${timeRange}.csv`;
          break;
        case 'users':
          endpoint = `/api/analytics/users?timeRange=${timeRange}`;
          filename = `jules-dating-users-${timeRange}.csv`;
          break;
        default:
          endpoint = `/api/analytics/dashboard?timeRange=${timeRange}`;
          filename = `jules-dating-analytics-${timeRange}.csv`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      
      // Convert to CSV
      const csvContent = convertToCSV(data);
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: any) => {
    if (!data) return '';
    
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).map(value => 
      typeof value === 'object' ? JSON.stringify(value) : value
    ).join(',');
    
    return `${headers}\n${values}`;
  };

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/analytics/dashboard?timeRange=${timeRange}`;
      
      if (useCustomDateRange && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const data = await response.json();
      setMetrics(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [timeRange, useCustomDateRange, startDate, endDate]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '0s';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatPercentage = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '0%';
    // If it's already a string (formatted percentage), return as-is
    if (typeof value === 'string') return value;
    // If it's a number, format it
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jules Dating Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor user engagement and app performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useCustomDateRange}
                onChange={(e) => setUseCustomDateRange(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Custom Range</span>
            </label>
          </div>

          {useCustomDateRange ? (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
              />
              <Button
                onClick={() => {
                  fetchDashboardMetrics();
                }}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply
              </Button>
            </div>
          ) : (
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-white text-gray-900 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-300">
                <SelectItem value="1d" className="text-gray-900 hover:bg-gray-100">Last 24h</SelectItem>
                <SelectItem value="7d" className="text-gray-900 hover:bg-gray-100">Last 7 days</SelectItem>
                <SelectItem value="30d" className="text-gray-900 hover:bg-gray-100">Last 30 days</SelectItem>
                <SelectItem value="90d" className="text-gray-900 hover:bg-gray-100">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => exportToCSV('dashboard')}
              disabled={exporting}
              className="text-gray-900 border-gray-300 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics?.totalUsers)}</div>
            <p className="text-xs text-gray-500">{formatNumber(metrics?.activeUsers)} active users</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics?.totalPageViews)}</div>
            <p className="text-xs text-gray-500">{formatNumber(metrics?.totalSessions)} sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chat Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(metrics?.totalChatMessages)}</div>
            <p className="text-xs text-gray-500">{formatNumber(metrics?.chatAnalytics?.totalConversations)} conversations</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatDuration(metrics?.averageSessionDuration)}</div>
            <p className="text-xs text-gray-500">{formatPercentage(metrics?.bounceRate)} bounce rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="conversions" className="space-y-6">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="conversions" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Conversions</TabsTrigger>
          <TabsTrigger value="onboarding" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Onboarding</TabsTrigger>
          <TabsTrigger value="chat" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Chat Analytics</TabsTrigger>
          <TabsTrigger value="fit-check" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Fit Check</TabsTrigger>
          <TabsTrigger value="profile-pic-review" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Profile Pic Reviews</TabsTrigger>
          <TabsTrigger value="tips" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Tips</TabsTrigger>
          <TabsTrigger value="closet" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Closet</TabsTrigger>
          <TabsTrigger value="users" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Users</TabsTrigger>
          <TabsTrigger value="errors" className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">Errors</TabsTrigger>
        </TabsList>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Free Experience Landing Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Sessions</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.freeExperienceSessions)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Unique Visitors</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.freeExperienceUniqueVisitors)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-gray-700">"Try Free Fit Check" Clicks</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.tryFreeFitCheckClicks)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">"Get Started for Free" Clicks</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.getStartedForFreeClicks)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <span className="text-gray-700 font-medium">Registrations from Landing</span>
                  <span className="font-bold text-gray-900 text-lg">{formatNumber(metrics?.registrationsFromLanding)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Free Fit Check Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Sessions</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.fitCheckSessions)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Unique Visitors</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.fitCheckUniqueVisitors)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-gray-700">Fit Checks Started</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.fitChecksStarted)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">Fit Checks Completed</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.fitChecksCompleted)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700">"Sign-up for full experience" Clicks</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.signupForFullExperienceClicks)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                  <span className="text-gray-700 font-medium">Registrations from Fit Check</span>
                  <span className="font-bold text-gray-900 text-lg">{formatNumber(metrics?.registrationsFromFitCheck)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Top Features Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.topFeatures?.map((feature, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-gray-900 font-medium">{feature.feature}</span>
                        <p className="text-sm text-gray-600">{formatNumber(feature.uniqueUsers)} unique users</p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {formatNumber(feature.count)} uses
                      </Badge>
                    </div>
                  )) || <p className="text-gray-500">No feature data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Onboarding Step Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.onboardingSteps?.map((step, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{step.step.replace('_', ' ').toUpperCase()}</h4>
                      <Badge className="bg-green-100 text-green-800">{step.completionRate}% completion</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formatNumber(step.completed)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Skipped:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formatNumber(step.skipped)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formatNumber(step.total)}</span>
                      </div>
                    </div>
                  </div>
                )) || <p className="text-gray-500">No onboarding data available</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Analytics Tab */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Chat Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Conversations</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.chatAnalytics?.totalConversations)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Average Response Time</span>
                  <span className="font-semibold text-gray-900">{formatDuration(metrics?.chatAnalytics?.averageResponseTime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Product Calls</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.chatAnalytics?.productCalls)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Product Links Clicked</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.chatAnalytics?.productLinksClicked)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Wishlist Adds</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.chatAnalytics?.wishlistAdds)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Chat Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Positive</span>
                    <span className="font-semibold text-green-800">{metrics?.chatAnalytics?.sentimentDistribution?.positive || '0% (0/0)'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700">Neutral</span>
                    <span className="font-semibold text-yellow-800">{metrics?.chatAnalytics?.sentimentDistribution?.neutral || '0% (0/0)'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-700">Negative</span>
                    <span className="font-semibold text-red-800">{metrics?.chatAnalytics?.sentimentDistribution?.negative || '0% (0/0)'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900">Recent Chat Logs</CardTitle>
              <Button
                variant="outline"
                onClick={() => exportToCSV('chat-logs')}
                disabled={exporting}
                className="text-gray-900 border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Chat Logs
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4 text-sm text-gray-600">
                <span>Total Messages: <strong className="text-gray-900">{formatNumber(metrics?.chatLogs?.totalLogs)}</strong></span>
                <span>Total Conversations: <strong className="text-gray-900">{formatNumber(metrics?.chatLogs?.totalConversations)}</strong></span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {metrics?.chatLogs?.logs?.slice(0, 20).map((log, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    log.role === 'user' 
                      ? 'bg-blue-50 border-l-blue-400' 
                      : 'bg-green-50 border-l-green-400'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          log.role === 'user' 
                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                            : 'bg-green-100 text-green-800 border-green-300'
                        }>
                          {log.role === 'user' ? '👤 User' : '🤖 Jules'}
                        </Badge>
                        <span className="text-xs text-gray-500">ID: {log.userId?.slice(-8) || 'anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={
                            log.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            log.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {log.sentiment}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-900 leading-relaxed">{log.message}</p>
                  </div>
                )) || <p className="text-gray-500 text-center py-8">No chat logs available</p>}
              </div>
              
              {metrics?.chatLogs?.logs && metrics.chatLogs.logs.length > 20 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Showing 20 of {formatNumber(metrics.chatLogs.totalLogs)} messages
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fit Check Tab */}
        <TabsContent value="fit-check" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Fit Check Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Fit Check Visits</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.fitCheckAnalytics?.fitCheckVisits)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Completions</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.fitCheckAnalytics?.fitCheckCompletions)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Completion Rate</span>
                  <span className="font-semibold text-gray-900">{formatPercentage(metrics?.fitCheckAnalytics?.completionRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Average Jules Rating</span>
                  <span className="font-semibold text-gray-900">{metrics?.fitCheckAnalytics?.averageRating?.toFixed(1) || '0.0'}/5.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Pic Review Tab */}
        <TabsContent value="profile-pic-review" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Profile Pic Review Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Profile Pic Reviews</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.profilePicReviewAnalytics?.profilePicReviewVisits)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Completions</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.profilePicReviewAnalytics?.profilePicReviewCompletions)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Reviews Saved</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.profilePicReviewAnalytics?.profilePicReviewsSaved)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Completion Rate</span>
                  <span className="font-semibold text-gray-900">{metrics?.profilePicReviewAnalytics?.completionRate || '0%'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Average Jules Rating</span>
                  <span className="font-semibold text-gray-900">{metrics?.profilePicReviewAnalytics?.averageRating || '0.0'}/5.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Daily Tips Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tip Page Views</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.tipsAnalytics?.tipPageViews)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tips Read</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.tipsAnalytics?.tipsRead)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Engagement Rate</span>
                  <span className="font-semibold text-gray-900">{metrics?.tipsAnalytics?.engagementRate || '0%'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Closet Tab */}
        <TabsContent value="closet" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Closet Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.closetAnalytics?.usersWithItems?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{item.itemCount} item{item.itemCount !== 1 ? 's' : ''}</span>
                      <span className="font-semibold text-gray-900">{formatNumber(item.userCount)} users</span>
                    </div>
                  )) || <p className="text-gray-500">No closet data available</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Wishlist Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Wishlist Access Rate</span>
                  <span className="font-semibold text-gray-900">{formatPercentage(metrics?.closetAnalytics?.wishlistAccessRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Wishlist CTR</span>
                  <span className="font-semibold text-gray-900">{formatPercentage(metrics?.closetAnalytics?.wishlistCTR)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Click Throughs</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.closetAnalytics?.wishlistClickThroughs)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">User Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Users</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.totalUsers)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Daily Active Users</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.dailyActiveUsers)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Weekly Active Users</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.weeklyActiveUsers)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Repeat Visitors</span>
                  <span className="font-semibold text-gray-900">{formatNumber(metrics?.userAnalytics?.repeatVisitors)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Repeat Visitor Rate</span>
                  <span className="font-semibold text-gray-900">{formatPercentage(Number(metrics?.userAnalytics?.repeatVisitorRate))}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-900">User Email List</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => exportToCSV('users')}
                  disabled={exporting}
                  className="text-gray-900 border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Users
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {metrics?.userAnalytics?.userEmails?.slice(0, 10).map((user, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{user.email}</span>
                      <span className="text-xs text-gray-500">{new Date(user.lastActive).toLocaleDateString()}</span>
                    </div>
                  )) || <p className="text-gray-500">No user data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Error Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <span className="text-gray-700">Total Errors</span>
                  <span className="font-semibold text-red-800">{formatNumber(metrics?.errors)}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Error tracking includes JavaScript errors, unhandled promise rejections, and other client-side issues.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
