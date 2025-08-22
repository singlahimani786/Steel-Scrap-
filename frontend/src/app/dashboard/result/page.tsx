'use client';
import { useSearchParams } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import React, { Suspense } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/protected-route';

const COLORS = ['#00C49F', '#FF8042', '#0088FE', '#FFBB28'];

function PredictionDashboardContent() {
  const searchParams = useSearchParams();

  const plate = searchParams.get('plate');
  const rawResult = searchParams.get('result');
  const scrapImage = searchParams.get('scrap');
  const timestamp = searchParams.get('timestamp');

  // Safe parsing of the result
  let scrapResults = null;
  if (rawResult) {
    try {
      scrapResults = JSON.parse(decodeURIComponent(rawResult));
    } catch (error) {
      console.error("Error parsing prediction data", error);
    }
  }

  // Handle both old and new data formats
  const predictions = scrapResults?.predictions || scrapResults || [];

  const chartData = predictions.length > 0
    ? predictions.map((pred: any, index: number) => ({
        name: pred.class || 'Unknown',
        value: Math.round((pred.confidence || 0) * 100),
        color: COLORS[index % COLORS.length]
      }))
    : [];

  return (
    <ProtectedRoute requiredRole="owner">
      <div className="min-h-screen bg-slate-100 px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-2">
          📊 Prediction Dashboard
        </h1>
        <Link 
          href="/dashboard" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Truck Plate Info */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">🚛 Truck Plate</h2>
          <p className="text-lg text-gray-700">{plate || 'Not Detected'}</p>
        </div>

        {/* Scrap Prediction */}
        {predictions.length > 0 ? (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">🔍 Scrap Analysis Results</h2>
            <div className="space-y-3">
              {predictions.map((pred: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p><strong>Type:</strong> {pred.class || 'Unknown'}</p>
                  <p><strong>Confidence:</strong> {Math.round((pred.confidence || 0) * 100)}%</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold">No prediction available</h2>
            <p className="text-gray-600">The analysis did not return any results.</p>
          </div>
        )}

        {/* Confidence Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">Confidence Distribution</h2>
            <div className="flex justify-center items-center">
              <PieChart width={300} height={300}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {chartData.map((entry: { name: string; value: number; color: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
        )}

        {/* Scrap Image Preview */}
        {scrapImage && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">🖼️ Scrap Image</h2>
            <div className="text-sm text-gray-500 mb-2">Image: {scrapImage}</div>
            <img
              src={`http://localhost:5001/static/${scrapImage}`}
              alt="Uploaded Scrap"
              className="rounded max-h-64 object-contain border"
              onError={(e) => {
                console.error('Image failed to load:', scrapImage);
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const errorDiv = target.nextElementSibling as HTMLElement;
                if (errorDiv) {
                  errorDiv.style.display = 'block';
                }
              }}
            />
            <div className="hidden text-center py-8 text-gray-500">
              <p>Image could not be loaded</p>
              <p className="text-sm">File: {scrapImage}</p>
            </div>
          </div>
        )}

        {/* Analysis Summary */}
        <div className="bg-white p-6 rounded shadow md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">📊 Analysis Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{predictions.length}</div>
              <div className="text-sm text-gray-600">Detections</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {predictions.length > 0 
                  ? Math.round((predictions[0]?.confidence || 0) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600">Top Confidence</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {timestamp ? (() => {
                  // Parse the timestamp from backend (already in IST)
                  const analysisTime = new Date(timestamp);
                  return analysisTime.toLocaleString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                })() : 'Just now'}
              </div>
              <div className="text-sm text-gray-600">Analysis Time (IST)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

export default function PredictionDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    }>
      <PredictionDashboardContent />
    </Suspense>
  );
}