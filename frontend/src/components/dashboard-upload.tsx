'use client'
import React, { useState } from 'react';
import { Upload, Truck, Image as ImageIcon } from 'lucide-react';

interface DashboardUploadProps {
  scrapImage: File | null;
  setScrapImage: (file: File | null) => void;
  truckImage: File | null;
  setTruckImage: (file: File | null) => void;
  onSubmit: () => void;
}

export default function DashboardUpload({
  scrapImage,
  setScrapImage,
  truckImage,
  setTruckImage,
  onSubmit
}: DashboardUploadProps) {
  const [scrapPreview, setScrapPreview] = useState<string | null>(null);
  const [truckPreview, setTruckPreview] = useState<string | null>(null);

  const handleScrapImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScrapImage(file);
      setScrapPreview(URL.createObjectURL(file));
    }
  };

  const handleTruckImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTruckImage(file);
      setTruckPreview(URL.createObjectURL(file));
    }
  };

  const removeScrapImage = () => {
    setScrapImage(null);
    setScrapPreview(null);
  };

  const removeTruckImage = () => {
    setTruckImage(null);
    setTruckPreview(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Scrap Image Upload */}
        <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-xl p-6 hover:border-orange-400 transition-colors">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Scrap Image</h3>
            <p className="text-orange-600 text-sm mb-4">Upload image of steel scrap for analysis</p>
            
            {scrapPreview ? (
              <div className="relative">
                <img 
                  src={scrapPreview} 
                  alt="Scrap preview" 
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <button
                  onClick={removeScrapImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition">
                <Upload className="w-4 h-4 mr-2" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScrapImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Truck Image Upload */}
        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
          <div className="text-center">
            <Truck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Truck Image</h3>
            <p className="text-blue-600 text-sm mb-4">Upload image of truck plate number</p>
            
            {truckPreview ? (
              <div className="relative">
                <img 
                  src={truckPreview} 
                  alt="Truck preview" 
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <button
                  onClick={removeTruckImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition">
                <Upload className="w-4 h-4 mr-2" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTruckImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={onSubmit}
          disabled={!scrapImage || !truckImage}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
        >
          Analyze Images
        </button>
        {(!scrapImage || !truckImage) && (
          <p className="text-gray-500 text-sm mt-2">
            Please upload both images to proceed
          </p>
        )}
      </div>
    </div>
  );
}
