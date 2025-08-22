'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/lib/auth-context";
import NavbarWrapper from "@/components/NavabarWrapper";
import LayoutWrapper from "@/components/layout-wrapper";
import ProtectedRoute from "@/components/protected-route";
import DashboardUpload from "@/components/dashboard-upload";
import PendingSubmissions from "@/components/pending-submissions";
import SubmissionDetails from "@/components/submission-details";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle } from "lucide-react";

export default function LabourerDashboard() {
  const { user } = useAuth();
const router = useRouter();

  // Type assertion for labourer role
  if (user && user.role !== 'labourer') {
    router.push('/dashboard');
    return null;
  }
  const [showSubmission, setShowSubmission] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [scrapImage, setScrapImage] = useState<File | null>(null);
  const [truckImage, setTruckImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');

  const handleSubmit = async () => {
    if (!scrapImage || !truckImage || !user?.factory_id) {
      alert("Please upload both images and ensure factory ID is available");
      return;
    }

    try {
      setUploading(true);
      setAnalysisStage('Preparing images...');
      
      const formData = new FormData();
      formData.append("truck_image", scrapImage);
      formData.append("plate_image", truckImage);
      formData.append("factory_id", user.factory_id);
      formData.append("labourer_id", user.id);

      setAnalysisStage('Uploading to AI servers...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX

      setAnalysisStage('Running AI analysis...');
      const response = await fetch("http://localhost:5001/upload", {
        method: "POST",
        body: formData,
      });

      setAnalysisStage('Processing results...');
      const data = await response.json();

      if (data.status === "success") {
        // Make sure we have the analysis ID from the response
        const analysisId = data.analysis_id || data._id;
        if (!analysisId) {
          throw new Error("No analysis ID returned from server");
        }
        
        setCurrentAnalysis({
          ...data,
          _id: analysisId,
          analysis_id: analysisId // Ensure we have both _id and analysis_id
        });
        setShowSubmission(true);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload and analyze images. Please try again.");
    } finally {
      setUploading(false);
      setAnalysisStage('');
    }
  };

  const handleSubmissionComplete = () => {
    setShowSubmission(false);
    setCurrentAnalysis(null);
    setScrapImage(null);
    setTruckImage(null);
  };

  return (
    <ProtectedRoute requiredRole="labourer">
      <LayoutWrapper>
        <NavbarWrapper />
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Scrap Analysis Dashboard
              </h1>
              <p className="text-gray-600">
                Upload images for analysis and manage your submissions
              </p>
            </div>

            {/* Upload Section */}
            <Card className="mb-8 p-6">
              <h2 className="text-xl font-semibold mb-4">Upload New Analysis</h2>
              <DashboardUpload
                scrapImage={scrapImage}
                setScrapImage={setScrapImage}
                truckImage={truckImage}
                setTruckImage={setTruckImage}
                onSubmit={handleSubmit}
                isAnalyzing={uploading}
                analysisStage={analysisStage}
              />
            </Card>

            {/* Analysis Result & Submission */}
            {showSubmission && currentAnalysis && (
              <Card className="mb-8 p-6">
                <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
                <div className="mb-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Scrap Analysis</h3>
                      <ul className="space-y-2">
                        {currentAnalysis.scrap_result.map((pred: any, index: number) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {pred.class}: {(pred.confidence * 100).toFixed(1)}%
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Vehicle Details</h3>
                      <p>Plate Number: {currentAnalysis.plate_number}</p>
                      <p>Time: {new Date(currentAnalysis.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Submit to Owner</h3>
                  {user && user.factory_id ? (
                    <SubmissionDetails
                      analysisId={currentAnalysis._id}
                      labourerId={user.id}
                      ownerId={user.owner_id || ""}
                      factoryId={user.factory_id}
                      onSubmit={handleSubmissionComplete}
                    />
                  ) : (
                    <p className="text-red-500">Missing required factory information. Please contact your administrator.</p>
                  )}
                </div>
              </Card>
            )}

            {/* Pending Submissions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Submissions</h2>
              {user && user.factory_id ? (
                <PendingSubmissions
                  labourerId={user.id}
                  ownerId={user.owner_id || ""}
                  factoryId={user.factory_id}
                />
              ) : (
                <p className="text-gray-500">Unable to load submissions. Missing required factory information.</p>
              )}
            </Card>
          </div>
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}
