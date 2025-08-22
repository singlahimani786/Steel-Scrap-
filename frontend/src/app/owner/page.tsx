'use client';
import React, { useState, useEffect } from 'react';
import NavbarWrapper from "@/components/NavabarWrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import ProtectedRoute from "@/components/protected-route";
import PendingVerifications from "@/components/pending-verifications";
import { useAuth } from "@/lib/auth-context";
import axios from 'axios';
import { Users, UserPlus, Building2, Eye, Edit, Trash2, Activity, CheckCircle } from 'lucide-react';

interface Labourer {
  _id: string;
  email: string;
  name: string;
  phone: string;
  employee_id: string;
  department: string;
  shift: string;
  created_at: string;
  is_active: boolean;
}

interface FactoryStats {
  total_labourers: number;
  total_analyses: number;
  this_month_analyses: number;
  factory_name: string;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [labourers, setLabourers] = useState<Labourer[]>([]);
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employee_id: '',
    department: 'Scrap Analysis',
    shift: 'Day',
    password: ''
  });
  
  // Analytics and History state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.factory_id) {
      fetchData();
      fetchAnalytics('30d');
      fetchHistory(1);
    } else if (user && user.role === 'owner') {
      // For owners without factory_id, show loading state
      console.log("Waiting for factory_id for owner:", user);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.factory_id) {
      console.error("No factory ID available");
      return;
    }
    
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const [labourersResponse, statsResponse] = await Promise.all([
        axios.get(`${backendUrl}/owner/labourers?factory_id=${user.factory_id}`),
        axios.get(`${backendUrl}/owner/stats?factory_id=${user.factory_id}`)
      ]);
      
      if ((labourersResponse.data as any).status === "success") {
        setLabourers((labourersResponse.data as any).labourers);
      }
      
      if ((statsResponse.data as any).status === "success") {
        setStats((statsResponse.data as any).stats);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (range: '7d' | '30d' | 'all') => {
    if (!user?.factory_id) return;
    
    try {
      setLoadingAnalytics(true);
      setTimeRange(range);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await axios.get(`${backendUrl}/owner/analytics?factory_id=${user.factory_id}&time_range=${range}`);
      
      if ((response.data as any).status === "success") {
        setAnalyticsData((response.data as any).data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchHistory = async (page: number) => {
    if (!user?.factory_id) return;
    
    try {
      setLoadingHistory(true);
      setCurrentPage(page);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await axios.get(`${backendUrl}/owner/history?factory_id=${user.factory_id}&page=${page}`);
      
      if ((response.data as any).status === "success") {
        setHistoryData(response.data as any);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingAnalysisId(analysisId);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/analysis/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.status === 'success') {
        alert('Analysis deleted successfully');
        // Refresh the history data
        fetchHistory(currentPage);
        // Also refresh analytics to reflect the changes
        fetchAnalytics(timeRange);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      alert('Failed to delete analysis. Please try again.');
    } finally {
      setDeletingAnalysisId(null);
    }
  };

  const handleCreateLabourer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.factory_id) {
      alert("Factory ID not available");
      return;
    }
    
    try {
      const labourerData = {
        ...formData,
        factory_id: user.factory_id
      };
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await axios.post(`${backendUrl}/owner/create-labourer`, labourerData);
      if ((response.data as any).status === "success") {
        setShowCreateForm(false);
        setFormData({
          name: '', email: '', phone: '', employee_id: '', 
          department: 'Scrap Analysis', shift: 'Day', password: ''
        });
        fetchData(); // Refresh data
        alert("Labourer created successfully!");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create labourer");
    }
  };

  const toggleLabourerStatus = async (labourerId: string, currentStatus: boolean) => {
    if (!user?.factory_id) {
      alert("Factory ID not available");
      return;
    }
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/owner/labourers/${labourerId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !currentStatus,
          factory_id: user.factory_id
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        alert('Labourer status updated successfully');
        fetchData(); // Refresh data
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to toggle labourer status:', error);
      alert('Failed to update labourer status. Please try again.');
    }
  };

  const generateEmployeeId = () => {
    const nextId = labourers.length + 1;
    setFormData({...formData, employee_id: `EMP${nextId.toString().padStart(3, '0')}`});
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="owner">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show message for owners waiting for factory_id
  if (user && user.role === 'owner' && !user.factory_id) {
    return (
      <ProtectedRoute requiredRole="owner">
        <LayoutWrapper>
          <NavbarWrapper />
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

  return (
    <ProtectedRoute requiredRole="owner">
      <LayoutWrapper>
        <NavbarWrapper />
        
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Owner Dashboard</h1>
                <p className="text-gray-600 text-lg">Manage your factory labourers and monitor operations</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">Factory Management Access</p>
              </div>
              <p className="text-green-700 text-sm mt-1">You can manage labourers, view factory statistics, and monitor scrap analysis activities.</p>
            </div>
          </div>

          {/* Factory Stats */}
          {stats && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                <div className="bg-blue-50 border-b-2 border-blue-500 p-4">
                  <h3 className="text-blue-600 font-semibold text-lg flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Total Labourers
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total_labourers}</div>
                  <p className="text-gray-600 text-sm">Active Workers</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
                <div className="bg-green-50 border-b-2 border-green-500 p-4">
                  <h3 className="text-green-600 font-semibold text-lg flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Total Analyses
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.total_analyses}</div>
                  <p className="text-gray-600 text-sm">All Time</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                <div className="bg-purple-50 border-b-2 border-purple-500 p-4">
                  <h3 className="text-purple-600 font-semibold text-lg flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    This Month
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{stats.this_month_analyses}</div>
                  <p className="text-gray-600 text-sm">Analyses</p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Verifications */}
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden mb-8">
            <div className="bg-orange-50 border-b-2 border-orange-500 p-4">
              <h3 className="text-orange-600 font-semibold text-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Analysis Verifications
              </h3>
              <p className="text-orange-600 text-sm mt-1">Review and approve analysis submissions from your laborers</p>
            </div>
            <div className="p-6">
              {user?.factory_id && user?.id ? (
                <PendingVerifications
                  factoryId={user.factory_id}
                  ownerId={user.id}
                  onVerificationComplete={() => {
                    // Optionally refresh stats or other data
                    fetchData();
                  }}
                />
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Factory information not available
                </div>
              )}
            </div>
          </div>

          {/* Analytics Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Factory Analytics</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchAnalytics('7d')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === '7d' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => fetchAnalytics('30d')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === '30d' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => fetchAnalytics('all')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>
              
              {analyticsData ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Type Distribution Chart */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Scrap Type Distribution</h3>
                    <div className="space-y-3">
                      {analyticsData.type_counts.map((type: any) => (
                        <div key={type._id} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{type._id}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(type.count / analyticsData.total_records) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-800 w-8 text-right">{type.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Daily Activity Chart */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Activity</h3>
                    <div className="space-y-2">
                      {analyticsData.daily_data.slice(-7).map((day: any) => (
                        <div key={day._id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{day._id}</span>
                          <div className="flex gap-1">
                            {day.types.map((type: any, idx: number) => (
                              <div 
                                key={idx}
                                className="w-3 h-3 rounded-full bg-blue-500"
                                title={`${type.type}: ${type.count}`}
                              ></div>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {day.types.reduce((sum: number, type: any) => sum + type.count, 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loadingAnalytics ? 'Loading analytics...' : 'No analytics data available'}
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recent Analysis History</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Total: {historyData?.pagination?.total || 0} records
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchHistory(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-gray-700">
                      Page {currentPage} of {historyData?.pagination?.pages || 1}
                    </span>
                    <button
                      onClick={() => fetchHistory(currentPage + 1)}
                      disabled={!historyData?.pagination || currentPage >= historyData.pagination.pages}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              
              {historyData?.data ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Truck</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.data.map((record: any) => (
                        <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-800">
                            {record.truck_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {record.scrap_predictions?.[0]?.class || 'Unknown'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteAnalysis(record._id)}
                              disabled={deletingAnalysisId === record._id}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete analysis"
                            >
                              {deletingAnalysisId === record._id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loadingHistory ? 'Loading history...' : 'No history data available'}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Labourer Management</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Labourer
                </button>
              </div>
            </div>
          </div>

          {/* Create Labourer Form */}
          {showCreateForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Labourer</h3>
                <form onSubmit={handleCreateLabourer} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={formData.employee_id}
                          onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={generateEmployeeId}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="Scrap Analysis">Scrap Analysis</option>
                        <option value="Quality Control">Quality Control</option>
                        <option value="Operations">Operations</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                      <select
                        value={formData.shift}
                        onChange={(e) => setFormData({...formData, shift: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Rotating">Rotating</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      Create Labourer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Labourers List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">All Labourers</h3>
              {labourers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {labourers.map((labourer) => (
                        <tr key={labourer._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{labourer.name}</div>
                              <div className="text-sm text-gray-500">{labourer.employee_id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{labourer.email}</div>
                              <div className="text-sm text-gray-500">{labourer.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {labourer.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              labourer.shift === 'Day' ? 'bg-yellow-100 text-yellow-800' :
                              labourer.shift === 'Night' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {labourer.shift}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              labourer.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {labourer.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleLabourerStatus(labourer._id, labourer.is_active)}
                                className={`px-3 py-1 rounded text-xs ${
                                  labourer.is_active 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {labourer.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No labourers found
                </div>
              )}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}
