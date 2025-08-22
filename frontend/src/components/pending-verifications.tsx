'use client'

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Clock, User, Calendar, FileText, CheckCircle, XCircle, Edit3, Save, RotateCcw } from "lucide-react";

interface PendingVerification {
  _id: string;
  analysis_id: string;
  timestamp: string;
  submission_timestamp: string;
  truck_number: string;
  scrap_predictions: Array<{
    class: string;
    confidence: number;
  }>;
  plate_predictions: Array<{
    class: string;
    confidence: number;
  }>;
  labourer_name: string;
  labourer_email: string;
  employee_id: string;
  labourer_notes: string;
  scrap_image: string;
  plate_image: string;
}

interface PendingVerificationsProps {
  factoryId: string;
  ownerId: string;
  onVerificationComplete?: () => void;
}

export default function PendingVerifications({
  factoryId,
  ownerId,
  onVerificationComplete
}: PendingVerificationsProps) {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [ownerNotes, setOwnerNotes] = useState('');
  const [isEditingPredictions, setIsEditingPredictions] = useState(false);
  const [editedScrapPredictions, setEditedScrapPredictions] = useState<Array<{class: string; confidence: number}>>([]);
  const [editedPlatePredictions, setEditedPlatePredictions] = useState<Array<{class: string; confidence: number}>>([]);

  // Available scrap types for editing
  const SCRAP_TYPES = ['CRC', 'Burada', 'K2', 'Selected', 'Piece to Piece', 'Melting', 'Sponge Iron'];

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/owner/pending-verifications?factory_id=${factoryId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setVerifications(data.pending_verifications || []);
      } else {
        console.error('Failed to fetch verifications:', data.message);
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (factoryId) {
      fetchVerifications();
    }
  }, [factoryId]);

  // Initialize editing state when verification is selected
  useEffect(() => {
    if (selectedVerification) {
      setEditedScrapPredictions([...selectedVerification.scrap_predictions]);
      setEditedPlatePredictions([...selectedVerification.plate_predictions]);
      setIsEditingPredictions(false);
    }
  }, [selectedVerification]);

  const startEditing = () => {
    setIsEditingPredictions(true);
  };

  const cancelEditing = () => {
    setIsEditingPredictions(false);
    if (selectedVerification) {
      setEditedScrapPredictions([...selectedVerification.scrap_predictions]);
      setEditedPlatePredictions([...selectedVerification.plate_predictions]);
    }
  };

  const saveEdits = () => {
    setIsEditingPredictions(false);
    // Update the local verification object with edited predictions
    if (selectedVerification) {
      setSelectedVerification({
        ...selectedVerification,
        scrap_predictions: editedScrapPredictions,
        plate_predictions: editedPlatePredictions
      });
    }
  };

  const updateScrapPrediction = (index: number, field: 'class' | 'confidence', value: string | number) => {
    const updated = [...editedScrapPredictions];
    if (field === 'class') {
      updated[index] = { ...updated[index], class: value as string };
    } else {
      updated[index] = { ...updated[index], confidence: Number(value) / 100 }; // Convert percentage to decimal
    }
    setEditedScrapPredictions(updated);
  };

  const updatePlatePrediction = (index: number, field: 'class' | 'confidence', value: string | number) => {
    const updated = [...editedPlatePredictions];
    if (field === 'class') {
      updated[index] = { ...updated[index], class: value as string };
    } else {
      updated[index] = { ...updated[index], confidence: Number(value) / 100 }; // Convert percentage to decimal
    }
    setEditedPlatePredictions(updated);
  };

  const handleVerification = async (analysisId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(analysisId);
      
      // Prepare the verification data including any edited predictions
      const verificationData: any = {
        analysis_id: analysisId,
        factory_id: factoryId,
        verification_status: status,
        owner_id: ownerId,
        owner_notes: ownerNotes
      };

      // If predictions were edited, include the corrected predictions
      if (selectedVerification && selectedVerification._id === analysisId) {
        verificationData.corrected_scrap_predictions = editedScrapPredictions;
        verificationData.corrected_plate_predictions = editedPlatePredictions;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/owner/verify-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Remove the verified item from the list
        setVerifications(prev => prev.filter(v => v._id !== analysisId));
        setSelectedVerification(null);
        setOwnerNotes('');
        
        if (onVerificationComplete) {
          onVerificationComplete();
        }
        
        alert(`Analysis ${status} successfully!`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to verify analysis:', error);
      alert('Failed to verify analysis. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Loading pending verifications...</p>
        </div>
      </Card>
    );
  }

  if (verifications.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-gray-500">No pending verifications</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pending Verifications ({verifications.length})</h3>
        <Button onClick={fetchVerifications} size="sm" variant="outline">
          Refresh
        </Button>
      </div>

      {verifications.map((verification) => (
        <Card key={verification._id} className="p-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Quick Image Preview */}
            <div>
              <h4 className="font-medium mb-2">Images</h4>
              <div className="space-y-2">
                {verification.scrap_image && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Scrap:</p>
                    <img
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/static/${verification.scrap_image}`}
                      alt="Scrap preview"
                      className="w-full h-20 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {verification.plate_image && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Truck Plate:</p>
                    <img
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/static/${verification.plate_image}`}
                      alt="Plate preview"
                      className="w-full h-16 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Details */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{verification.labourer_name}</span>
                  <span className="text-gray-500">({verification.employee_id})</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Submitted: {new Date(verification.submission_timestamp).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>Truck: {verification.truck_number}</span>
                </div>
              </div>
              
              {verification.labourer_notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <strong>Laborer Notes:</strong> {verification.labourer_notes}
                </div>
              )}
            </div>
            
            {/* Actions & Results */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Analysis Results</h4>
                {selectedVerification && selectedVerification._id === verification._id && isEditingPredictions && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editing
                  </Badge>
                )}
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div>
                  <span className="font-medium">Scrap Type:</span>
                  {(selectedVerification && selectedVerification._id === verification._id && isEditingPredictions 
                    ? editedScrapPredictions 
                    : verification.scrap_predictions
                  )?.map((pred, idx) => (
                    <div key={idx} className="ml-2 text-xs">
                      {pred.class}: {(pred.confidence * 100).toFixed(1)}%
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedVerification(verification)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Detailed Review
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    onClick={() => handleVerification(verification._id, 'approved')}
                    disabled={processingId === verification._id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleVerification(verification._id, 'rejected')}
                    disabled={processingId === verification._id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Detailed Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Review Analysis</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVerification(null)}
                >
                  Close
                </Button>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Analysis Images */}
                <div>
                  <h4 className="font-medium mb-3">Analysis Images</h4>
                  <div className="space-y-4">
                    {selectedVerification.scrap_image && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Scrap Image:</h5>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/static/${selectedVerification.scrap_image}`}
                            alt="Scrap analysis"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder-image.png';
                              img.alt = 'Image not available';
                              img.className = 'w-full h-48 object-cover bg-gray-100 flex items-center justify-center';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {selectedVerification.plate_image && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Truck Plate Image:</h5>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/static/${selectedVerification.plate_image}`}
                            alt="Truck plate"
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/placeholder-image.png';
                              img.alt = 'Image not available';
                              img.className = 'w-full h-32 object-cover bg-gray-100 flex items-center justify-center';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              
                {/* Analysis Details */}
                <div>
                  <h4 className="font-medium mb-3">Analysis Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Truck Number:</strong> {selectedVerification.truck_number}</p>
                    <p><strong>Analyzed:</strong> {new Date(selectedVerification.timestamp).toLocaleString()}</p>
                    <p><strong>Submitted:</strong> {new Date(selectedVerification.submission_timestamp).toLocaleString()}</p>
                    <p><strong>Laborer:</strong> {selectedVerification.labourer_name} ({selectedVerification.employee_id})</p>
                  </div>
                  
                  {selectedVerification.labourer_notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <strong>Laborer Notes:</strong>
                      <p className="mt-1">{selectedVerification.labourer_notes}</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Owner Notes (Optional)</label>
                    <textarea
                      value={ownerNotes}
                      onChange={(e) => setOwnerNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Add any notes about this verification..."
                    />
                  </div>
                </div>
                
                                {/* Analysis Results */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">AI Analysis Results</h4>
                    {!isEditingPredictions ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={startEditing}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit Predictions
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveEdits}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Scrap Analysis:</h5>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        {(isEditingPredictions ? editedScrapPredictions : selectedVerification.scrap_predictions)?.map((pred, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2">
                            {isEditingPredictions ? (
                              <>
                                <select
                                  value={pred.class}
                                  onChange={(e) => updateScrapPrediction(idx, 'class', e.target.value)}
                                  className="text-sm font-medium bg-white border rounded px-2 py-1 mr-2"
                                >
                                  {SCRAP_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={(pred.confidence * 100).toFixed(1)}
                                    onChange={(e) => updateScrapPrediction(idx, 'confidence', e.target.value)}
                                    className="w-16 text-sm text-center bg-white border rounded px-1 py-1"
                                  />
                                  <span className="text-sm text-gray-600">%</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium">{pred.class}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-600 h-2 rounded-full"
                                      style={{ width: `${pred.confidence * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600 w-12 text-right">
                                    {(pred.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Plate Analysis:</h5>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        {(isEditingPredictions ? editedPlatePredictions : selectedVerification.plate_predictions)?.map((pred, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2">
                            {isEditingPredictions ? (
                              <>
                                <input
                                  type="text"
                                  value={pred.class}
                                  onChange={(e) => updatePlatePrediction(idx, 'class', e.target.value)}
                                  className="text-sm font-medium bg-white border rounded px-2 py-1 mr-2 flex-1"
                                  placeholder="License plate number"
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={(pred.confidence * 100).toFixed(1)}
                                    onChange={(e) => updatePlatePrediction(idx, 'confidence', e.target.value)}
                                    className="w-16 text-sm text-center bg-white border rounded px-1 py-1"
                                  />
                                  <span className="text-sm text-gray-600">%</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium">{pred.class}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${pred.confidence * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-600 w-12 text-right">
                                    {(pred.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {isEditingPredictions && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="bg-yellow-400 rounded-full p-1 mt-0.5">
                            <Edit3 className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Editing Mode</p>
                            <p className="text-xs text-yellow-700">
                              Correct any AI prediction errors. Changes will be saved when you approve/reject this analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={() => handleVerification(selectedVerification._id, 'approved')}
                  disabled={processingId === selectedVerification._id}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {processingId === selectedVerification._id ? 'Processing...' : 'Approve Analysis'}
                </Button>
                
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleVerification(selectedVerification._id, 'rejected')}
                  disabled={processingId === selectedVerification._id}
                >
                  <X className="h-4 w-4 mr-2" />
                  {processingId === selectedVerification._id ? 'Processing...' : 'Reject Analysis'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}