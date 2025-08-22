'use client';
import React, { useEffect, useMemo, useState } from 'react';
import NavbarWrapper from "@/components/NavabarWrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import axios from 'axios';
import { AnalysisRecord } from '@/components/columns';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, Cell } from 'recharts';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#a855f7', '#ef4444', '#14b8a6', '#f59e0b'];

// Mock data for scrap type details - in real app this would come from backend
const SCRAP_TYPE_DETAILS = {
  'CRC': {
    price: 52000, // INR per ton
    rawMaterials: ['Cold Rolled Coil', 'Zinc Coating', 'Chromium', 'Nickel'],
    processingSteps: ['Inspection', 'Cleaning', 'Coating Removal', 'Melting', 'Alloying'],
    energyRequired: '2.8 MWh/ton',
    carbonFootprint: '0.9 tons CO2/ton',
    description: 'Cold Rolled Coil scrap with high quality surface finish'
  },
  'Burada': {
    price: 38000,
    rawMaterials: ['Iron Ore', 'Coke', 'Limestone', 'Dolomite'],
    processingSteps: ['Sorting', 'Crushing', 'Screening', 'Blending', 'Sintering'],
    energyRequired: '3.2 MWh/ton',
    carbonFootprint: '1.1 tons CO2/ton',
    description: 'Iron ore fines and sinter feed material'
  },
  'K2': {
    price: 65000,
    rawMaterials: ['High Carbon Steel', 'Manganese', 'Silicon', 'Chromium'],
    processingSteps: ['Grading', 'Cleaning', 'Melting', 'Alloying', 'Refining'],
    energyRequired: '3.5 MWh/ton',
    carbonFootprint: '1.3 tons CO2/ton',
    description: 'High-grade steel scrap with specific alloy composition'
  },
  'Selected': {
    price: 75000,
    rawMaterials: ['Premium Steel', 'Alloy Elements', 'Clean Scrap'],
    processingSteps: ['Quality Check', 'Sorting', 'Cleaning', 'Melting', 'Refining'],
    energyRequired: '2.2 MWh/ton',
    carbonFootprint: '0.7 tons CO2/ton',
    description: 'Premium quality selected steel scrap'
  },
  'Piece to Piece': {
    price: 42000,
    rawMaterials: ['Mixed Steel', 'Iron', 'Alloy Elements'],
    processingSteps: ['Manual Sorting', 'Size Classification', 'Cleaning', 'Melting'],
    energyRequired: '2.8 MWh/ton',
    carbonFootprint: '0.9 tons CO2/ton',
    description: 'Individual pieces of steel scrap requiring manual handling'
  },
  'Melting': {
    price: 35000,
    rawMaterials: ['Low Grade Steel', 'Iron', 'Carbon'],
    processingSteps: ['Preheating', 'Melting', 'Basic Refining', 'Casting'],
    energyRequired: '4.0 MWh/ton',
    carbonFootprint: '1.5 tons CO2/ton',
    description: 'Low-grade scrap suitable for basic melting processes'
  },
  'Sponge Iron': {
    price: 28000,
    rawMaterials: ['Iron Ore', 'Coal', 'Natural Gas'],
    processingSteps: ['Reduction', 'Cooling', 'Screening', 'Briquetting'],
    energyRequired: '5.5 MWh/ton',
    carbonFootprint: '2.0 tons CO2/ton',
    description: 'Direct reduced iron with high porosity structure'
  }
};

// Generate mock data for one year
const generateMockYearData = () => {
  const data = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    
    // Generate random daily counts for each scrap type
    const dailyData: any = { date: dateStr };
    
    Object.keys(SCRAP_TYPE_DETAILS).forEach(type => {
      // Generate realistic daily variations (weekends have less activity)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const baseCount = isWeekend ? 2 : 8; // Base count per day
      const variation = Math.floor(Math.random() * 6) - 2; // -2 to +3 variation
      dailyData[type] = Math.max(0, baseCount + variation);
    });
    
    data.push(dailyData);
  }
  
  return data;
};

const MOCK_YEAR_DATA = generateMockYearData();

interface ScrapTypeDetails {
  name: string;
  price: number;
  rawMaterials: string[];
  processingSteps: string[];
  energyRequired: string;
  carbonFootprint: string;
  description: string;
}

interface AnalyticsData {
  total_records: number;
  unique_trucks: number;
  type_counts: Array<{ _id: string; count: number }>;
  daily_data: Array<{ _id: string; types: Array<{ type: string; count: number }> }>;
  time_range: string;
}

type Range = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('30d');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [scrapTypeDetails, setScrapTypeDetails] = useState<ScrapTypeDetails[] | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    // Admin can always fetch data, others need factory_id
    if (user?.role === 'admin' || user?.factory_id) {
      fetchData(range);
    } else if (user && user.role === 'owner' || user?.role === 'labourer') {
      // For non-admin users without factory_id, show loading state
      console.log("Waiting for factory_id for user:", user);
    }
  }, [user, range]);

  const fetchData = async (range: Range) => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      
      // Fetch scrap type details
      const typesResponse = await axios.get(`${backendUrl}/scrap-types`);
      const typesData = typesResponse.data as { status: string; scrap_types: ScrapTypeDetails[] };
      console.log("Scrap types response:", typesData);
      if (typesData.status === 'success') {
        setScrapTypeDetails(typesData.scrap_types);
      }
      
      // Fetch analytics data with factory filtering (admin sees all, others see their factory only)
      const analyticsUrl = user && user.role === 'owner' && user.factory_id
        ? `${backendUrl}/analytics?range=${range}&factory_id=${user.factory_id}`
        : `${backendUrl}/analytics?range=${range}`;
        
      console.log(`🔍 Fetching analytics from: ${analyticsUrl}`);
      console.log(`👤 User role: ${user?.role}, Factory ID: ${user?.factory_id || 'None'}`);
      
      const analyticsResponse = await axios.get(analyticsUrl);
      const analyticsResponseData = analyticsResponse.data as { status: string; data: AnalyticsData };
      console.log("Analytics response:", analyticsResponseData);
      if (analyticsResponseData.status === 'success') {
        setAnalyticsData(analyticsResponseData.data);
        console.log(`📊 Analytics data loaded: ${analyticsResponseData.data.total_records} records`);
      }
      
      // Fetch history data for filtering
      const historyUrl = user && user.role === 'admin' 
        ? `${backendUrl}/history`
        : `${backendUrl}/history?factory_id=${user?.factory_id}`;
      
      const historyResponse = await axios.get(historyUrl);
      const historyData = historyResponse.data as { status: string; history: AnalysisRecord[] };
      console.log("History response:", historyData);
      if (historyData.status === 'success') {
        setHistoryData(historyData.history);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (range === 'all') return historyData;
    const daysMap: Record<Exclude<Range, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const cutoff = Date.now() - (daysMap[range] * 24 * 60 * 60 * 1000);
    return historyData.filter(r => new Date(r.timestamp).getTime() >= cutoff);
  }, [historyData, range]);

  // Add debugging for computed values
  useEffect(() => {
    console.log("Current analyticsData:", analyticsData);
    console.log("Current historyData:", historyData);
    console.log("Current filtered:", filtered);
  }, [analyticsData, historyData, filtered]);

  const typeCounts = useMemo(() => {
    console.log("Computing typeCounts with:", { analyticsData, filtered });
    
    // Use real analytics data if available
    if (analyticsData?.type_counts) {
      console.log("Using analytics data for typeCounts:", analyticsData.type_counts);
      return analyticsData.type_counts.map((item: any, i: number) => ({
        name: item._id,
        value: item.count,
        color: COLORS[i % COLORS.length]
      }));
    }
    
    // Fallback to mock data
    if (filtered.length === 0) {
      console.log("Using mock data for typeCounts");
      const mockCounts: Record<string, number> = {};
      Object.keys(SCRAP_TYPE_DETAILS).forEach(type => {
        mockCounts[type] = Math.floor(Math.random() * 150) + 50;
      });
      const sorted = Object.entries(mockCounts).sort((a, b) => b[1] - a[1]);
      return sorted.map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
    }
    
    // Use real history data
    console.log("Using history data for typeCounts");
    const counts: Record<string, number> = {};
    filtered.forEach(r => {
      const top = Array.isArray(r.scrap_predictions) ? r.scrap_predictions[0] : null;
      const name = top?.class ?? 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    
    // Ensure all 7 types are represented
    Object.keys(SCRAP_TYPE_DETAILS).forEach(type => {
      if (!counts[type]) counts[type] = 0;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    console.log("Final typeCounts from history:", sorted);
    return sorted.map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [analyticsData, filtered]);

  const dailyTrend = useMemo(() => {
    // Use real analytics data if available
    if (analyticsData?.daily_data) {
      return analyticsData.daily_data.map((day: any) => {
        const dayData: any = { date: day._id };
        day.types.forEach((type: any) => {
          dayData[type.type] = type.count;
        });
        return dayData;
      });
    }
    
    // Fallback to mock data
    if (filtered.length === 0) {
      return MOCK_YEAR_DATA.slice(-30);
    }
    
    // Use real history data
    const byDay: Record<string, Record<string, number>> = {};
    filtered.forEach(r => {
      const dateKey = new Date(r.timestamp).toISOString().slice(0, 10);
      const top = Array.isArray(r.scrap_predictions) ? r.scrap_predictions[0] : null;
      const name = top?.class ?? 'Unknown';
      if (!byDay[dateKey]) byDay[dateKey] = {};
      byDay[dateKey][name] = (byDay[dateKey][name] || 0) + 1;
    });
    const days = Object.keys(byDay).sort();
    const topKeys = Object.entries(
      days.reduce((acc, d) => {
        Object.keys(byDay[d]).forEach(k => { acc[k] = (acc[k] || 0) + byDay[d][k]; });
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k]) => k);

    return days.map(d => ({
      date: d,
      ...topKeys.reduce((obj, k) => ({ ...obj, [k]: byDay[d][k] || 0 }), {})
    }));
  }, [analyticsData, filtered]);



  const selectedTypeData = useMemo(() => {
    if (!selectedType) return null;
    
    // Use real data when available
    if (analyticsData?.type_counts) {
      const typeRecord = analyticsData.type_counts.find((t: any) => t._id === selectedType);
      if (typeRecord) {
        const typeDetails = scrapTypeDetails?.find((t: any) => t.name === selectedType);
        return {
          count: typeRecord.count,
          uniqueTrucks: Math.floor(typeRecord.count * 0.3), // Estimate unique trucks
          details: typeDetails || SCRAP_TYPE_DETAILS[selectedType as keyof typeof SCRAP_TYPE_DETAILS]
        };
      }
    }
    
    // Fallback to mock data
    let typeRecords = filtered.filter(r => {
      const top = Array.isArray(r.scrap_predictions) ? r.scrap_predictions[0] : null;
      return top?.class === selectedType;
    });

    if (typeRecords.length === 0) {
      const mockCount = Math.floor(Math.random() * 150) + 50;
      const mockTrucks = Math.floor(Math.random() * 30) + 10;
      typeRecords = Array(mockCount).fill(null);
      
      const uniqueTrucks = mockTrucks;
      return {
        count: mockCount,
        uniqueTrucks,
        details: SCRAP_TYPE_DETAILS[selectedType as keyof typeof SCRAP_TYPE_DETAILS]
      };
    }

    const uniqueTrucks = new Set(typeRecords.map(r => r.truck_number));
    
    return {
      count: typeRecords.length,
      uniqueTrucks: uniqueTrucks.size,
      details: SCRAP_TYPE_DETAILS[selectedType as keyof typeof SCRAP_TYPE_DETAILS]
    };
  }, [selectedType, filtered, analyticsData, scrapTypeDetails]);

  // Show loading state
  if (loading) {
    return (
      <ProtectedRoute requiredRole={['admin', 'owner']}>
        <NavbarWrapper />
        <LayoutWrapper>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  // Show message for users waiting for factory_id
  if (user && user.role !== 'admin' && !user.factory_id) {
    return (
      <ProtectedRoute requiredRole={['admin', 'owner']}>
        <NavbarWrapper />
        <LayoutWrapper>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-6xl mb-4">🏭</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Setting Up Your Factory</h2>
              <p className="text-lg text-gray-600 mb-6">
                We're configuring your factory settings. This may take a moment.
              </p>
              <div className="animate-pulse text-blue-600">Please wait...</div>
            </div>
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  // Show empty state when no data is available
  if (analyticsData && analyticsData.total_records === 0) {
    return (
      <ProtectedRoute requiredRole={['admin', 'owner']}>
        <NavbarWrapper />
        <LayoutWrapper>
          <div className="w-full min-h-screen bg-gray-50">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 pt-32 pb-16">
              <div className="container mx-auto px-6">
                <div className="flex justify-between items-center pt-8 pb-8">
                  <div className="text-left">
                    <h1 className="text-white text-4xl font-bold mb-2">Analytics</h1>
                    <p className="text-purple-100 text-lg">Deep insights on scrap distributions and trends</p>
                  </div>
                  <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">← Back to Dashboard</Link>
                </div>
              </div>
            </div>

            <div className="container mx-auto px-6 py-12">
              <div className="text-center">
                <div className="text-8xl mb-6">📊</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">No Data Available Yet</h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  {user?.role === 'admin' 
                    ? "There are no analysis records in the system yet. Start by having users upload scrap images."
                    : "Your factory doesn't have any analysis records yet. Start by uploading scrap images for analysis."
                  }
                </p>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </LayoutWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={['admin', 'owner']}>
      <NavbarWrapper />
      <LayoutWrapper>
        <div className="w-full min-h-screen bg-gray-50">
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 pt-32 pb-16">
            <div className="container mx-auto px-6">
              <div className="flex justify-between items-center pt-8 pb-8">
                <div className="text-left">
                  <h1 className="text-white text-4xl font-bold mb-2">Analytics</h1>
                  <p className="text-purple-100 text-lg">Deep insights on scrap distributions and trends</p>
                </div>
                <Link href="/dashboard" className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">← Back to Dashboard</Link>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-12">
            {/* Time Range Filter */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Time Range</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: '7d', label: 'Last 7 Days' },
                    { value: '30d', label: 'Last 30 Days' },
                    { value: '90d', label: 'Last 90 Days' },
                    { value: 'all', label: 'All Time' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRange(option.value as '7d' | '30d' | '90d' | 'all')}
                      className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                        range === option.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Last Days Analysis Summary */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {/* Total Records */}
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                <div className="bg-blue-50 border-b-2 border-blue-500 p-4">
                  <h3 className="text-blue-600 font-semibold text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Total Records
                  </h3>
                </div>
                <div className="p-6 text-center">
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {analyticsData?.total_records || filtered.length}
                      </div>
                      <p className="text-gray-600 text-sm">Analyses</p>
                    </>
                  )}
                </div>
              </div>

              {/* Unique Trucks */}
              <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
                <div className="bg-green-50 border-b-2 border-green-500 p-4">
                  <h3 className="text-green-600 font-semibold text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Unique Trucks
                  </h3>
                </div>
                <div className="p-6 text-center">
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {analyticsData?.unique_trucks || new Set(filtered.map(r => r.truck_number)).size}
                      </div>
                      <p className="text-gray-600 text-sm">Trucks</p>
                    </>
                  )}
                </div>
              </div>

              {/* Scrap Types */}
              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                <div className="bg-purple-50 border-b-2 border-purple-500 p-4">
                  <h3 className="text-purple-600 font-semibold text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Scrap Types
                  </h3>
                </div>
                <div className="p-6 text-center">
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {analyticsData?.type_counts?.length || typeCounts.length}
                      </div>
                      <p className="text-gray-600 text-sm">Types</p>
                    </>
                  )}
                </div>
              </div>

              {/* Average Daily */}
              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
                <div className="bg-orange-50 border-b-2 border-orange-500 p-4">
                  <h3 className="text-orange-600 font-semibold text-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Avg Daily
                  </h3>
                </div>
                <div className="p-6 text-center">
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {(() => {
                          const total = analyticsData?.total_records || filtered.length;
                          const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
                          return Math.round(total / days);
                        })()}
                      </div>
                      <p className="text-gray-600 text-sm">Per Day</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Section */}
            {/* Scrap Type Selection Menu */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Select Scrap Type for Detailed Analysis</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {typeCounts.map((type) => (
                    <button
                      key={type.name}
                      onClick={() => setSelectedType(selectedType === type.name ? null : type.name)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedType === type.name
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">{type.name}</div>
                      <div className="text-lg font-bold" style={{ color: type.color as string }}>
                        {type.value}
                      </div>
                      <div className="text-xs text-gray-500">analyses</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Type Details */}
            {selectedTypeData && (
              <div className="bg-white rounded-2xl shadow-lg border border-purple-200 overflow-hidden mb-8">
                <div className="p-4 border-b bg-purple-50">
                  <h3 className="font-semibold text-purple-800">📊 {selectedType} - Detailed Analysis</h3>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Key Metrics */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4">Key Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Total Analyses:</span>
                          <span className="font-semibold">{selectedTypeData.count}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">Unique Trucks:</span>
                          <span className="font-semibold">{selectedTypeData.uniqueTrucks}</span>
                        </div>

                      </div>
                    </div>

                    {/* Processing Details */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4">Processing Information</h4>
                      <div className="space-y-3">

                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Energy Required</div>
                          <div className="text-lg font-bold text-green-700">{selectedTypeData.details?.energyRequired}</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Carbon Footprint</div>
                          <div className="text-lg font-bold text-orange-700">{selectedTypeData.details?.carbonFootprint}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Raw Materials and Processing Steps */}
                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Raw Materials Required</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTypeData.details?.rawMaterials?.map((material: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Processing Steps</h4>
                      <div className="space-y-2">
                        {selectedTypeData.details?.processingSteps?.map((step: string, index: number) => (
                          <div key={index} className="flex items-center">
                            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Top 7 Scrap Types (Totals)</h3>
                </div>
                <div className="p-6 h-[380px]">
                  {typeCounts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeCounts}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value">
                          {typeCounts.map((d, i) => (
                            <Cell key={`cell-${i}`} fill={d.color as string} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">No data</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Daily Trend by Top Types</h3>
                </div>
                <div className="p-6 h-[380px]">
                  {dailyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        {Object.keys(dailyTrend[0]).filter(k => k !== 'date').slice(0, 7).map((key, i) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">No data</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Daily Stacked Distribution (Top 7 Types)</h3>
              </div>
              <div className="p-6 h-[420px]">
                {dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      {Object.keys(dailyTrend[0]).filter(k => k !== 'date').slice(0, 7).map((key, i) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[i % COLORS.length]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">No data</div>
                )}
              </div>
            </div>



            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-800">Totals</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-4 bg-purple-50 rounded">
                    <div className="text-xs text-gray-600">Total Analyses</div>
                    <div className="text-2xl font-bold text-purple-700">{filtered.length}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded">
                    <div className="text-xs text-gray-600">Unique Trucks</div>
                    <div className="text-2xl font-bold text-blue-700">{new Set(filtered.map(r => r.truck_number)).size}</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded">
                    <div className="text-xs text-gray-600">Top Type Count</div>
                    <div className="text-2xl font-bold text-orange-700">{typeCounts[0]?.value ?? 0}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded">
                    <div className="text-xs text-gray-600">Top Type</div>
                    <div className="text-lg font-semibold text-green-700">{typeCounts[0]?.name ?? '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Activity (Last 15 Analyses)
                </h3>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
                  </div>
                ) : filtered.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scrap Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (tons)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.slice(0, 15).map((record, index) => {
                          const predictions = record.scrap_predictions;
                          const topPrediction = Array.isArray(predictions) ? predictions[0] : null;
                          const scrapType = topPrediction?.class || 'Unknown';
                          const confidence = topPrediction?.confidence || 0;
                          const weight = record.estimated_weight || 0;
                          const value = record.estimated_price || 0;
                          
                          return (
                            <tr key={record._id || index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(record.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {record.truck_number || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {scrapType}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <span className={`font-medium ${confidence >= 0.9 ? 'text-green-600' : confidence >= 0.8 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {(confidence * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {weight.toFixed(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                ₹{value.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity to display
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}


