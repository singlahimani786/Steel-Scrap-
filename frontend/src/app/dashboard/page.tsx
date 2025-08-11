'use client';
import React, { useState } from 'react';
import DaataTable from "@/components/datatable";
import PhotoUpload from "@/components/fileUpload";
import NavbarWrapper from "@/components/NavabarWrapper";
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [scrapImage, setScrapImage] = useState<File | null>(null);
  const [truckImage, setTruckImage] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [truckData, setTruckData] = useState<any[]>([]); // To store multiple truck-scrap results
  const router = useRouter();

  const handleSubmit = async () => {
    if (!scrapImage || !truckImage) {
      alert("Please upload both images.");
      return;
    }

    const formData = new FormData();
    formData.append("truck_image", scrapImage);  // must match Flask
    formData.append("plate_image", truckImage);  // must match Flask

    try {
      const response: any = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      console.log("Response from server:", response.data);
      setResult(response.data);

      // Add new truck-scrap data to the existing truckData state
      setTruckData((prevTruckData) => [
        ...prevTruckData,
        {
          truck_number: response.data.plate_number,
          scrap_result: response.data.scrap_result,
          scrap_image: response.data.scrap_image,
        }
      ]);

      router.push(`/dashboard/result?plate=${response.data.plate_number}&result=${encodeURIComponent(JSON.stringify(response.data.scrap_result))}&scrap=${response.data.scrap_image}`);

    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <>
      <NavbarWrapper />
      <div className="w-full min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 pt-32 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex justify-center items-center pt-8 pb-8">
              <div className="text-center">
                <h1 className="text-white text-5xl font-bold mb-4 drop-shadow-lg">
                  Steel Scrap Dashboard
                </h1>
                <p className="text-orange-100 text-lg font-medium max-w-2xl mx-auto">
                  AI-powered scrap classification for industrial efficiency. Upload images and get instant analysis.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 bg-gray-50">
          {/* Upload Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Upload Your Images
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Upload images of steel scrap and truck ID to receive accurate classification and sorting recommendations
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Scrap Image Upload */}
                <div className="group">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 overflow-hidden">
                    <div className="bg-orange-50 border-b-2 border-orange-500 p-4">
                      <h3 className="text-orange-600 font-semibold text-lg flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Scrap Image
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 hover:border-orange-400 transition-colors duration-300 bg-orange-50">
                        <PhotoUpload text={"Upload Image of Scrap"} onFileSelect={setScrapImage} />
                      </div>
                      <div className="mt-4 text-sm text-gray-500 text-center">
                        Supported formats: JPG, PNG, JPEG
                      </div>
                    </div>
                  </div>
                </div>

                {/* Truck ID Upload */}
                <div className="group">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 overflow-hidden">
                    <div className="bg-orange-50 border-b-2 border-orange-500 p-4">
                      <h3 className="text-orange-600 font-semibold text-lg flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Truck Identification
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 hover:border-orange-400 transition-colors duration-300 bg-orange-50">
                        <PhotoUpload text={"Upload Truck ID"} onFileSelect={setTruckImage} />
                      </div>
                      <div className="mt-4 text-sm text-gray-500 text-center">
                        Clear image of truck plate number
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={!scrapImage || !truckImage}
                  className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Submit for AI Analysis
                  </span>
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>

            {/* Results Section */}
            {result && (
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                    <h3 className="text-white text-xl font-bold flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Analysis Complete
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Truck Identification</h4>
                        <p className="text-2xl font-bold text-orange-600">{result.plate_number}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Scrap Analysis</h4>
                        <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                          {JSON.stringify(result.scrap_result, null, 2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Data Table Section */}
        <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Historical Data
              </h2>
              <p className="text-gray-600 text-lg">
                Track and manage all your scrap analysis results
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-6">
                <h3 className="text-white text-xl font-semibold flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Scrap Analysis Records
                </h3>
              </div>
              <div className="p-6">
                {truckData.length > 0 ? (
                  <DaataTable data={truckData} />
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-xl font-semibold text-gray-600 mb-2">No Data Yet</h4>
                    <p className="text-gray-500">Upload images to start tracking your scrap analysis results</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Bottom CTA Section */}
        <div className="bg-white border-t border-gray-200 mt-16">
          <div className="container mx-auto px-6 py-12">
            <div className="text-center">
              <h3 className="text-gray-800 text-2xl font-bold mb-4">
                Need Help Getting Started?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We're here to help you integrate this AI system into your workflow and maximize your recycling efficiency.
              </p>
              <button className="bg-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors duration-300 shadow-lg">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}