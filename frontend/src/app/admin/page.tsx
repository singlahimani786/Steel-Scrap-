'use client';
import React, { useState, useEffect } from 'react';
import NavbarWrapper from "@/components/NavabarWrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import ProtectedRoute from "@/components/protected-route";
import axios from 'axios';
import { Plus, Users, Building2, Eye, Edit, Trash2, UserPlus, Shield } from 'lucide-react';

interface FactoryOwner {
  _id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  is_active: boolean;
  factory_details?: {
    name: string;
    address: string;
    gst_number: string;
  };
}

interface SystemStats {
  total_owners: number;
  total_factories: number;
  total_labourers: number;
  total_analyses: number;
}

export default function AdminDashboard() {
  const [owners, setOwners] = useState<FactoryOwner[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    factory_name: '',
    factory_address: '',
    gst_number: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const [ownersResponse, statsResponse] = await Promise.all([
        axios.get(`${backendUrl}/admin/owners`),
        axios.get(`${backendUrl}/admin/stats`)
      ]);
      
      if ((ownersResponse.data as any).status === "success") {
        setOwners((ownersResponse.data as any).owners);
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

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await axios.post(`${backendUrl}/admin/create-owner`, formData);
      if ((response.data as any).status === "success") {
        setShowCreateForm(false);
        setFormData({
          name: '', email: '', phone: '', factory_name: '', 
          factory_address: '', gst_number: '', password: ''
        });
        fetchData(); // Refresh data
        alert("Factory owner created successfully!");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create owner");
    }
  };

  const toggleOwnerStatus = async (ownerId: string, currentStatus: boolean) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await axios.patch(`${backendUrl}/admin/owners/${ownerId}/status`, {
        is_active: !currentStatus
      });
      if ((response.data as any).status === "success") {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <LayoutWrapper>
        <NavbarWrapper />
        
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600 text-lg">Manage factory owners and system overview</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">System Administrator Access</p>
              </div>
              <p className="text-red-700 text-sm mt-1">You have full control over the system, including creating factory owners and monitoring system health.</p>
            </div>
          </div>

          {/* System Stats */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                <div className="bg-blue-50 border-b-2 border-blue-500 p-4">
                  <h3 className="text-blue-600 font-semibold text-lg flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Factory Owners
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total_owners}</div>
                  <p className="text-gray-600 text-sm">Active Owners</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
                <div className="bg-green-50 border-b-2 border-green-500 p-4">
                  <h3 className="text-green-600 font-semibold text-lg flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Factories
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.total_factories}</div>
                  <p className="text-gray-600 text-sm">Registered</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                <div className="bg-purple-50 border-b-2 border-purple-500 p-4">
                  <h3 className="text-purple-600 font-semibold text-lg flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Labourers
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{stats.total_labourers}</div>
                  <p className="text-gray-600 text-sm">Total Workers</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
                <div className="bg-orange-50 border-b-2 border-orange-500 p-4">
                  <h3 className="text-orange-600 font-semibold text-lg flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Analyses
                  </h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">{stats.total_analyses}</div>
                  <p className="text-gray-600 text-sm">Total Scrap</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Factory Owners</h2>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Factory Owner
                </button>
              </div>
            </div>
          </div>

          {/* Create Owner Form */}
          {showCreateForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Factory Owner</h3>
                <form onSubmit={handleCreateOwner} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Factory Name</label>
                      <input
                        type="text"
                        required
                        value={formData.factory_name}
                        onChange={(e) => setFormData({...formData, factory_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input
                        type="text"
                        required
                        value={formData.gst_number}
                        onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Factory Address</label>
                    <textarea
                      required
                      value={formData.factory_address}
                      onChange={(e) => setFormData({...formData, factory_address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Create Owner
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

          {/* Owners List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">All Factory Owners</h3>
              {owners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factory</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {owners.map((owner) => (
                        <tr key={owner._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                              <div className="text-sm text-gray-500">{owner.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {owner.factory_details ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">{owner.factory_details.name}</div>
                                <div className="text-sm text-gray-500">{owner.factory_details.address}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No factory details</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {owner.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              owner.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {owner.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleOwnerStatus(owner._id, owner.is_active)}
                                className={`px-3 py-1 rounded text-xs ${
                                  owner.is_active 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {owner.is_active ? 'Deactivate' : 'Activate'}
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
                  No factory owners found
                </div>
              )}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}
