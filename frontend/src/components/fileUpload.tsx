'use client'
import React, { useState } from 'react';

export default function PhotoUpload({
  text,
  onFileSelect
}: {
  text: string;
  onFileSelect: (file: File) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onFileSelect(file);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded-xl shadow-md flex flex-col items-center border border-dashed border-orange-400">
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className="rounded-md max-h-48 object-contain" />
      ) : (
        <label
          htmlFor={`upload-${text}`}
          className="cursor-pointer inline-flex items-center px-4 py-2 bg-orange-500 text-white font-semibold rounded-md shadow hover:bg-orange-400 transition"
        >
          <input
            id={`upload-${text}`}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {text}
        </label>
      )}
    </div>
  );
}
