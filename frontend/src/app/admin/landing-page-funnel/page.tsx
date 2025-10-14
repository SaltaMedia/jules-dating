'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Eye, MousePointer, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface LandingPageFunnelData {
  landing_source: string;
  landing_page_visits: number;
  profile_pic_review_visits: number;
  profile_pic_review_uploads: number;
  conversion_prompt_clicks: number;
  signups: number;
  logins: number;
  conversion_rates: {
    visit_to_pic_review: string;
    pic_review_visit_to_upload: string;
    upload_to_conversion_click: string;
    conversion_click_to_signup: string;
    signup_to_login: string;
    overall_visit_to_signup: string;
  };
}

export default function LandingPageFunnelPage() {
  const [funnelData, setFunnelData] = useState<LandingPageFunnelData[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFunnelData();
  }, [timeRange]);

  const fetchFunnelData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/analytics/landing-page-funnel?timeRange=${timeRange}`);
      setFunnelData(response.data.data);
    } catch (error: any) {
      console.error('Error fetching landing page funnel data:', error);
      setError(error.response?.data?.error || 'Failed to fetch funnel data');
    } finally {
      setIsLoading(false);
    }
  };

  const getLandingPageName = (source: string) => {
    const names: { [key: string]: string } = {
      '/': 'Main Landing Page',
      '/1': 'Landing Page 1 (Emotional Hook)',
      '/2': 'Landing Page 2 (Curiosity Hook)'
    };
    return names[source] || source;
  };

  const getLandingPageColor = (source: string) => {
    const colors: { [key: string]: string } = {
      '/': 'bg-blue-500',
      '/1': 'bg-purple-500',
      '/2': 'bg-green-500'
    };
    return colors[source] || 'bg-gray-500';
  };

  const FunnelStageCard = ({ 
    title, 
    icon: Icon, 
    value, 
    rate, 
    landingSource 
  }: { 
    title: string; 
    icon: any; 
    value: number; 
    rate?: string; 
    landingSource: string; 
  }) => (
    <div className="bg-white rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: getLandingPageColor(landingSource).replace('bg-', '#') }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Icon className="w-5 h-5 text-gray-600 mr-2" />
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        </div>
        {rate && (
          <Badge variant="outline" className="text-xs">
            {rate}%
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Landing Page Funnel Analytics</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading funnel data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Landing Page Funnel Analytics</h1>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Landing Page Funnel Analytics</h1>
            <p className="text-gray-600 mt-2">Track conversion rates across different landing pages</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="60d">Last 60 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {funnelData.map((data) => (
            <Card key={data.landing_source} className="border-t-4" style={{ borderTopColor: getLandingPageColor(data.landing_source).replace('bg-', '#') }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{getLandingPageName(data.landing_source)}</span>
                  <Badge className={getLandingPageColor(data.landing_source)}>
                    {data.conversion_rates.overall_visit_to_signup}% CVR
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visits</span>
                    <span className="font-semibold">{data.landing_page_visits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Signups</span>
                    <span className="font-semibold">{data.signups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Logins</span>
                    <span className="font-semibold">{data.logins}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Funnel Analysis */}
        {funnelData.map((data) => (
          <Card key={`detail-${data.landing_source}`} className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${getLandingPageColor(data.landing_source)}`}></div>
                {getLandingPageName(data.landing_source)} - Detailed Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Funnel Stages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FunnelStageCard
                    title="Landing Page Visits"
                    icon={Eye}
                    value={data.landing_page_visits}
                    landingSource={data.landing_source}
                  />
                  <FunnelStageCard
                    title="Profile Pic Review Visits"
                    icon={MousePointer}
                    value={data.profile_pic_review_visits}
                    rate={data.conversion_rates.visit_to_pic_review}
                    landingSource={data.landing_source}
                  />
                  <FunnelStageCard
                    title="Profile Pic Review Uploads"
                    icon={TrendingUp}
                    value={data.profile_pic_review_uploads}
                    rate={data.conversion_rates.pic_review_visit_to_upload}
                    landingSource={data.landing_source}
                  />
                  <FunnelStageCard
                    title="Conversion Prompt Clicks"
                    icon={MousePointer}
                    value={data.conversion_prompt_clicks}
                    rate={data.conversion_rates.upload_to_conversion_click}
                    landingSource={data.landing_source}
                  />
                  <FunnelStageCard
                    title="Signups"
                    icon={UserPlus}
                    value={data.signups}
                    rate={data.conversion_rates.conversion_click_to_signup}
                    landingSource={data.landing_source}
                  />
                  <FunnelStageCard
                    title="Logins"
                    icon={LogIn}
                    value={data.logins}
                    rate={data.conversion_rates.signup_to_login}
                    landingSource={data.landing_source}
                  />
                </div>

                {/* Visual Funnel */}
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Conversion Flow</h4>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="bg-blue-200 h-12 flex items-center justify-center rounded" style={{ width: '100%' }}>
                          <span className="text-sm font-semibold text-blue-900">
                            {data.landing_page_visits} Visits
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="mx-2 text-gray-400" />
                      <div className="flex-1">
                        <div className="bg-blue-300 h-12 flex items-center justify-center rounded" style={{ width: `${data.profile_pic_review_visits > 0 ? Math.max(20, (data.profile_pic_review_visits / data.landing_page_visits) * 100) : 0}%` }}>
                          <span className="text-sm font-semibold text-blue-900 whitespace-nowrap">
                            {data.profile_pic_review_visits} Pic Review
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 opacity-0">
                        <div className="h-12"></div>
                      </div>
                      <ArrowRight className="mx-2 text-gray-400" />
                      <div className="flex-1">
                        <div className="bg-blue-400 h-12 flex items-center justify-center rounded" style={{ width: `${data.profile_pic_review_uploads > 0 ? Math.max(20, (data.profile_pic_review_uploads / data.landing_page_visits) * 100) : 0}%` }}>
                          <span className="text-sm font-semibold text-blue-900 whitespace-nowrap">
                            {data.profile_pic_review_uploads} Uploads
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-1 opacity-0">
                        <div className="h-12"></div>
                      </div>
                      <ArrowRight className="mx-2 text-gray-400" />
                      <div className="flex-1">
                        <div className="bg-green-400 h-12 flex items-center justify-center rounded" style={{ width: `${data.signups > 0 ? Math.max(20, (data.signups / data.landing_page_visits) * 100) : 0}%` }}>
                          <span className="text-sm font-semibold text-green-900 whitespace-nowrap">
                            {data.signups} Signups
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Landing Page</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Visits</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Pic Review →</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Upload →</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Signup →</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Login</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Overall CVR</th>
                  </tr>
                </thead>
                <tbody>
                  {funnelData.map((data) => (
                    <tr key={`table-${data.landing_source}`} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${getLandingPageColor(data.landing_source)}`}></div>
                          {getLandingPageName(data.landing_source)}
                        </div>
                      </td>
                      <td className="text-right p-3 font-medium">{data.landing_page_visits}</td>
                      <td className="text-right p-3">
                        <Badge variant="outline">{data.conversion_rates.visit_to_pic_review}%</Badge>
                      </td>
                      <td className="text-right p-3">
                        <Badge variant="outline">{data.conversion_rates.pic_review_visit_to_upload}%</Badge>
                      </td>
                      <td className="text-right p-3">
                        <Badge variant="outline">{data.conversion_rates.upload_to_conversion_click}%</Badge>
                      </td>
                      <td className="text-right p-3">
                        <Badge variant="outline">{data.conversion_rates.signup_to_login}%</Badge>
                      </td>
                      <td className="text-right p-3">
                        <Badge className={getLandingPageColor(data.landing_source)}>
                          {data.conversion_rates.overall_visit_to_signup}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

