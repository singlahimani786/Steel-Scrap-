'use client';
import React, { useState, useEffect } from 'react';
import DaataTable from "@/components/datatable";
import NavbarWrapper from "@/components/NavabarWrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import { useAuth } from "@/lib/auth-context";
import axios from 'axios';
import { AnalysisRecord } from '@/components/columns';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

export default function HistoryPage() {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<AnalysisRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTruck, setSelectedTruck] = useState('');

  // Fetch analysis history on component mount
  useEffect(() => {
    if (user?.role === 'admin' || user?.factory_id) {
      fetchHistory();
    } else if (user && (user.role === 'owner' || user.role === 'labourer')) {
      // For non-admin users without factory_id, show loading state
      console.log("Waiting for factory_id for user:", user);
    }
  }, [user]);

  // Filter data when search term or truck filter changes
  useEffect(() => {
    let filtered = historyData;

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.truck_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.scrap_predictions && Array.isArray(record.scrap_predictions) && 
         record.scrap_predictions[0]?.class?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedTruck) {
      filtered = filtered.filter(record => record.truck_number === selectedTruck);
    }

    setFilteredData(filtered);
  }, [historyData, searchTerm, selectedTruck]);

  const fetchHistory = async () => {
    // Admin can see all data, others need factory_id
    if (user?.role !== 'admin' && !user?.factory_id) {
      console.error("No factory ID available");
      return;
    }

    try {
      setLoading(true);
      const url = user?.role === 'admin' 
        ? "http://localhost:5001/history"
        : `http://localhost:5001/history?factory_id=${user.factory_id}`;
      
      const response = await axios.get(url);
      const data = response.data as { status: string; history: AnalysisRecord[] };
      if (data.status === "success") {
        setHistoryData(data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueTrucks = () => {
    const trucks = historyData.map(record => record.truck_number);
    return [...new Set(trucks)];
  };

  const exportHistory = () => {
    const csvContent = [
      ['Date & Time', 'Truck Number', 'Scrap Type', 'Confidence', 'Scrap Image', 'Analysis ID'].join(','),
      ...filteredData.map(record => {
        const predictions = record.scrap_predictions;
        const scrapType = predictions && Array.isArray(predictions) && predictions[0]?.class ? predictions[0].class : 'Unknown';
        const confidence = predictions && Array.isArray(predictions) && predictions[0]?.confidence ? Math.round(predictions[0].confidence * 100) : 0;
        const timestamp = new Date(record.timestamp).toLocaleString();
        
        return [timestamp, record.truck_number, scrapType, `${confidence}%`, record.scrap_image, record.analysis_id].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scrap-analysis-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute requiredRole={['admin', 'owner']}>
      <LayoutWrapper>
        <NavbarWrapper />
        <div className="w-full min-h-screen bg-gray-50">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 pt-32 pb-16">
            <div className="container mx-auto px-6">
              <div className="flex justify-center items-center pt-8 pb-8">
                <div className="text-center">
                  <h1 className="text-white text-5xl font-bold mb-4 drop-shadow-lg">
                    Analysis History
                  </h1>
                  <p className="text-blue-100 text-lg font-medium max-w-2xl mx-auto">
                    Comprehensive view of all scrap analysis results and truck identification records
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-12">
            {/* Statistics Dashboard */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                <div className="bg-blue-50 border-b-2 border-blue-500 p-4">
                  <h3 className="text-blue-600 font-semibold text-lg">Total Analyses</h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{historyData.length}</div>
                  <p className="text-gray-600 text-sm">Records</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
                <div className="bg-green-50 border-b-2 border-green-500 p-4">
                  <h3 className="text-green-600 font-semibold text-lg">Unique Trucks</h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{getUniqueTrucks().length}</div>
                  <p className="text-gray-600 text-sm">Trucks</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                <div className="bg-purple-50 border-b-2 border-purple-500 p-4">
                  <h3 className="text-purple-600 font-semibold text-lg">Today's Analyses</h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {historyData.filter(record => {
                      const today = new Date().toDateString();
                      const recordDate = new Date(record.timestamp).toDateString();
                      return today === recordDate;
                    }).length}
                  </div>
                  <p className="text-gray-600 text-sm">Today</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
                <div className="bg-orange-50 border-b-2 border-orange-500 p-4">
                  <h3 className="text-orange-600 font-semibold text-lg">Success Rate</h3>
                </div>
                <div className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {historyData.length > 0 ? 
                      Math.round((historyData.filter(record => 
                        record.scrap_predictions && 
                        Array.isArray(record.scrap_predictions) && 
                        record.scrap_predictions[0]?.confidence > 0.7
                      ).length / historyData.length) * 100) : 0}%
                  </div>
                  <p className="text-gray-600 text-sm">High Confidence</p>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by truck number or scrap type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <select
                        value={selectedTruck}
                        onChange={(e) => setSelectedTruck(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Trucks</option>
                        {getUniqueTrucks().map(truck => (
                          <option key={truck} value={truck}>{truck}</option>
                        ))}
                      </select>
                    </div>
                    
                    <button
                      onClick={exportHistory}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </button>
                    
                    <button
                      onClick={fetchHistory}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Analysis History</h3>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredData.length > 0 ? (
                  <DaataTable data={filteredData} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || selectedTruck ? 'No results match your search criteria' : 'No analysis history found'}
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
