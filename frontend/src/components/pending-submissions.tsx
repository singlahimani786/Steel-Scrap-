'use client'

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Clock, X, CheckCircle, XCircle, Edit3, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SubmissionDetails from './submission-details';

interface PendingSubmission {
  _id: string;
  timestamp: string;
  truck_number: string;
  scrap_predictions: Array<{ class: string; confidence: number }>;
  labourer_notes?: string;
  submitted_to_owner?: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected';
  submission_timestamp?: string;
  verification_timestamp?: string;
  owner_notes?: string;
  predictions_corrected?: boolean;
}

interface PendingSubmissionsProps {
  labourerId: string;
  ownerId: string;
  factoryId: string;
}

export default function PendingSubmissions({
  labourerId,
  ownerId,
  factoryId
}: PendingSubmissionsProps) {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(
        `${backendUrl}/labourer/pending-submissions?labourer_id=${labourerId}`
      );
      const data = await response.json();
      
      if (data.status === 'success') {
        setPendingSubmissions(data.pending);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch pending submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/analysis/${submissionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.status === 'success') {
        alert('Analysis deleted successfully');
        // Refresh the submissions list
        fetchPendingSubmissions();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      alert('Failed to delete analysis. Please try again.');
    }
  };

  useEffect(() => {
    fetchPendingSubmissions();
  }, [labourerId]);

  const handleSubmissionComplete = () => {
    setSelectedSubmission(null);
    fetchPendingSubmissions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (pendingSubmissions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No pending submissions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingSubmissions.map((submission) => {
        const getStatusBadge = () => {
          if (!submission.submitted_to_owner) {
            return (
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                Ready to Submit
              </Badge>
            );
          }
          
          switch (submission.verification_status) {
            case 'pending':
              return (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              );
            case 'approved':
              return (
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              );
            case 'rejected':
              return (
                <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              );
            default:
              return (
                <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              );
          }
        };

        return (
          <Card key={submission._id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">
                    Truck: {submission.truck_number}
                  </h3>
                  <div className="flex gap-2">
                    {getStatusBadge()}
                    {submission.predictions_corrected && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Owner Corrected
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-2">
                  Analyzed: {new Date(submission.timestamp).toLocaleString()}
                </p>
                
                {submission.submitted_to_owner && submission.submission_timestamp && (
                  <p className="text-sm text-gray-500 mb-2">
                    Submitted: {new Date(submission.submission_timestamp).toLocaleString()}
                  </p>
                )}
                
                {submission.verification_timestamp && (
                  <p className="text-sm text-gray-500 mb-2">
                    Verified: {new Date(submission.verification_timestamp).toLocaleString()}
                  </p>
                )}
                
                <div className="space-y-1 mb-3">
                  <p className="text-sm font-medium">Analysis Results:</p>
                  {submission.scrap_predictions.map((pred, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      • {pred.class}: {(pred.confidence * 100).toFixed(1)}%
                    </p>
                  ))}
                </div>
                
                {submission.owner_notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Owner Notes:</p>
                    <p className="text-sm text-gray-600">{submission.owner_notes}</p>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex flex-col gap-2">
                {!submission.submitted_to_owner ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedSubmission(submission._id)}
                      className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                    >
                      Submit to Owner
                    </Button>
                    <Button
                      onClick={() => handleDeleteSubmission(submission._id)}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="text-center text-sm text-gray-500">
                      {submission.verification_status === 'pending' && 'Awaiting Review'}
                      {submission.verification_status === 'approved' && 'Analysis Approved'}
                      {submission.verification_status === 'rejected' && 'Analysis Rejected'}
                    </div>
                    {submission.verification_status === 'rejected' && (
                      <Button
                        onClick={() => handleDeleteSubmission(submission._id)}
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedSubmission === submission._id && !submission.submitted_to_owner && (
              <div className="mt-4 pt-4 border-t">
                <SubmissionDetails
                  analysisId={submission._id}
                  labourerId={labourerId}
                  ownerId={ownerId}
                  factoryId={factoryId}
                  onSubmit={handleSubmissionComplete}
                  defaultNotes={submission.labourer_notes}
                />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
