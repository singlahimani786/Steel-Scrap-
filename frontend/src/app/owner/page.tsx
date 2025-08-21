'use client';
import React, { useState, useEffect } from 'react';
import NavbarWrapper from "@/components/NavabarWrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import ProtectedRoute from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import axios from 'axios';
import { Users, UserPlus, Building2, Eye, Edit, Trash2, Activity } from 'lucide-react';

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
      const [labourersResponse, statsResponse] = await Promise.all([
        axios.get(`http://localhost:5001/owner/labourers?factory_id=${user.factory_id}`),
        axios.get(`http://localhost:5001/owner/stats?factory_id=${user.factory_id}`)
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
      const response = await axios.get(`http://localhost:5001/owner/analytics?factory_id=${user.factory_id}&time_range=${range}`);
      
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
      const response = await axios.get(`http://localhost:5001/owner/history?factory_id=${user.factory_id}&page=${page}`);
      
      if ((response.data as any).status === "success") {
        setHistoryData(response.data as any);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoadingHistory(false);
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
      
      const response = await axios.post("http://localhost:5001/owner/create-labourer", labourerData);
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
      const response = await axios.patch(`http://localhost:5001/owner/labourers/${labourerId}/status`, {
        is_active: !currentStatus,
        factory_id: user.factory_id
      });
      if ((response.data as any).status === "success") {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
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
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Weight</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
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
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {record.estimated_weight} tons
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            ₹{record.estimated_price?.toLocaleString()}
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
