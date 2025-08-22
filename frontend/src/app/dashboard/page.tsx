'use client';
import React, { useState, useEffect, useMemo } from 'react';
import DaataTable from "@/components/datatable";
import DashboardUpload from "@/components/dashboard-upload";
import NavbarWrapper from "@/components/NavabarWrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnalysisRecord } from '@/components/columns';
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#a855f7', '#ef4444', '#14b8a6', '#f59e0b'];

export default function Dashboard() {
  const [scrapImage, setScrapImage] = useState<File | null>(null);
  const [truckImage, setTruckImage] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [historyData, setHistoryData] = useState<AnalysisRecord[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d'>('all');
  const router = useRouter();
  const { user } = useAuth();

  // Fetch analysis history on component mount (only for admin/owner)
  useEffect(() => {
    if (user && user.role !== 'labourer') {
      fetchHistory();
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Refetch analytics when time range changes
  useEffect(() => {
    if (user && user.role !== 'labourer') {
      fetchAnalytics();
    }
  }, [timeRange, user]);

  const fetchHistory = async () => {
    try {
      let response;
      
      // Use factory-specific endpoint for owners, general endpoint for admins
      if (user?.role === 'owner' && user?.factory_id) {
        response = await axios.get(`http://localhost:5001/owner/history?factory_id=${user.factory_id}`);
        const data = response.data as { status: string; data: AnalysisRecord[] };
        if (data.status === "success") {
          setHistoryData(data.data);
        }
      } else {
        // Admin sees all data
        response = await axios.get("http://localhost:5001/history");
        const data = response.data as { status: string; history: AnalysisRecord[] };
        if (data.status === "success") {
          setHistoryData(data.history);
        }
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      let response;
      
      // Use factory-specific endpoint for owners, general endpoint for admins
      if (user?.role === 'owner' && user?.factory_id) {
        response = await axios.get(`http://localhost:5001/owner/analytics?factory_id=${user.factory_id}&time_range=${timeRange}`);
        const data = response.data as { status: string; data: any };
        if (data.status === "success") {
          setAnalyticsData(data.data);
        }
      } else {
        // Admin sees all data
        response = await axios.get(`http://localhost:5001/analytics?time_range=${timeRange}`);
        const data = response.data as { status: string; data: any };
        if (data.status === "success") {
          setAnalyticsData(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    }
  };

  const filteredHistory = useMemo(() => {
    if (timeRange === 'all') return historyData;
    const days = timeRange === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return historyData.filter((record) => {
      const t = new Date(record.timestamp).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    });
  }, [historyData, timeRange]);

  const distributionData = useMemo(() => {
    if (analyticsData?.type_counts) {
      // Use analytics data if available
      return analyticsData.type_counts.slice(0, 7).map((type: any, index: number) => ({
        name: type._id,
        value: type.count,
        color: COLORS[index % COLORS.length]
      }));
    } else {
      // Fallback to calculating from history data
      const counts: Record<string, number> = {};
      filteredHistory.forEach((record) => {
        const predictions = record.scrap_predictions;
        const topPrediction = Array.isArray(predictions) ? predictions[0] : null;
        const name = (topPrediction && topPrediction.class) ? topPrediction.class : 'Unknown';
        counts[name] = (counts[name] || 0) + 1;
      });

      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);

      return sorted.map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));
    }
  }, [analyticsData, filteredHistory]);

  const handleSubmit = async () => {
    if (!scrapImage || !truckImage) {
      alert("Please upload both images.");
      return;
    }

    const formData = new FormData();
    formData.append("truck_image", scrapImage);  // must match Flask
    formData.append("plate_image", truckImage);  // must match Flask
    
    // Add user context for proper factory association
    if (user?.factory_id) {
      formData.append("factory_id", user.factory_id);
      console.log("🔍 Adding factory_id to form:", user.factory_id);
    }
    if (user?.id) {
      formData.append("owner_id", user.id);
      console.log("🔍 Adding owner_id to form:", user.id);
    }
    
    // Debug: Log all form data
    console.log("🔍 Form data being sent:");
    for (let [key, value] of formData.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    try {
      const response: any = await axios.post("http://localhost:5001/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      console.log("Response from server:", response.data);
      setResult(response.data);

      // Refresh the history data after successful upload (only for admin/owner)
      if (user && user.role !== 'labourer') {
        await fetchHistory();
      }

      router.push(`/dashboard/result?plate=${response.data.plate_number}&result=${encodeURIComponent(JSON.stringify(response.data.scrap_result))}&scrap=${response.data.scrap_image}&timestamp=${response.data.timestamp}`);

    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // For labourers, redirect to the labourer dashboard
  useEffect(() => {
    if (user && user.role === 'labourer') {
      router.push('/dashboard/labourer');
    }
  }, [user, router]);

  if (user?.role === 'labourer') {
    return null;
  }

  // For admin/owner, show full dashboard
  return (
    <ProtectedRoute requiredRole="owner">
      <LayoutWrapper>
        <NavbarWrapper />
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">Monitor your scrap analysis activities and upload new images</p>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload New Images</h2>
            <DashboardUpload
              scrapImage={scrapImage}
              setScrapImage={setScrapImage}
              truckImage={truckImage}
              setTruckImage={setTruckImage}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Analytics Section */}
          {!loading && (
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Scrap Distribution Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Scrap Type Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distributionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Activity Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredHistory.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="confidence" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* History Table */}
          {!loading && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Analysis History</h3>
                <Link
                  href="/dashboard/history"
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  View All History →
                </Link>
              </div>
              <DaataTable data={filteredHistory.slice(0, 5)} />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          )}
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}