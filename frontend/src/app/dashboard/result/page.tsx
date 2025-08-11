'use client';
import { useSearchParams } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import React from 'react';


const COLORS = ['#00C49F', '#FF8042'];

export default function PredictionDashboard() {
  const searchParams = useSearchParams();

  const plate = searchParams.get('plate');
  const rawResult = searchParams.get('result');
  const scrapImage = searchParams.get('scrap'); // optional: pass filename from backend if you saved it

  // Safe parsing of the result
  let parsed = null;
  if (rawResult) {
    try {
      parsed = JSON.parse(decodeURIComponent(rawResult));
    } catch (error) {
      console.error("Error parsing prediction data", error);
    }
  }

  const prediction = parsed?.predictions?.[0];

  const chartData = prediction
    ? [
        { name: prediction.class, value: prediction.confidence * 100 },
        { name: 'Others', value: 100 - prediction.confidence * 100 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-100 px-8 py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 flex items-center gap-2">
        📊 Prediction Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Truck Plate Info */}
     


        {/* Truck Plate */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">🚛 Truck Plate</h2>
          <p className="text-lg text-gray-700">{plate || 'N/A'}</p>
        </div>

        {/* Scrap Prediction */}
        {prediction ? (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">🔍 Scrap Detected</h2>
            <p><strong>Type:</strong> {prediction.class}</p>
            <p><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(2)}%</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold">No prediction available</h2>
          </div>
        )}

        {/* Confidence Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 rounded shadow flex justify-center items-center">
            <PieChart width={250} height={250}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        )}

        {/* Scrap Image Preview */}
        {scrapImage && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">🖼️ Scrap Image</h2>
            <img
              src={`http://localhost:5000/static/${scrapImage}`}
              alt="Uploaded Scrap"
              className="rounded max-h-64 object-contain border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
