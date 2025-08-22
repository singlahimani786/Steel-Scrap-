'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmissionDetailsProps {
  analysisId: string;
  labourerId: string;
  ownerId: string;
  factoryId: string;
  onSubmit: () => void;
  defaultNotes?: string;
}

export default function SubmissionDetails({
  analysisId,
  labourerId,
  ownerId,
  factoryId,
  onSubmit,
  defaultNotes = ''
}: SubmissionDetailsProps) {
  const [notes, setNotes] = useState(defaultNotes);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const response = await fetch('http://localhost:5001/labourer/submit-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          labourer_id: labourerId,
          factory_id: factoryId,
          notes: notes,
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        onSubmit();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Failed to submit analysis:', error);
      alert('Failed to submit analysis. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Analysis Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          placeholder="Add any notes about this analysis..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit to Owner'
          )}
        </Button>
      </div>
    </div>
  );
}
