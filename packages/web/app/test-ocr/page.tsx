'use client';

import { useState, useEffect } from 'react';

type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

interface FileResult {
  id: number;
  status: FileStatus;
  text?: string;
  error?: string;
  tokensUsed?: number;
}

export default function TestOCR() {
  const [fileResult, setFileResult] = useState<FileResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Poll for status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (fileResult?.id && (fileResult.status === 'pending' || fileResult.status === 'processing')) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/file-status?fileId=${fileResult.id}`);
          const data = await response.json();
          
          if (data.error) {
            setFileResult(prev => prev ? { ...prev, status: 'error', error: data.error } : null);
            clearInterval(intervalId);
            return;
          }

          if (data.status === 'completed' || data.status === 'error') {
            setFileResult(prev => prev ? { ...prev, ...data } : null);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Status check failed:', error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fileResult?.id, fileResult?.status]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFileResult(null);

    const formData = new FormData(e.currentTarget);

    try {
      // Step 1: Upload file
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      
      if (uploadData.error) {
        throw new Error(uploadData.error);
      }

      setFileResult({
        id: uploadData.fileId,
        status: uploadData.status,
      });

      // Step 2: Start processing
      const processResponse = await fetch('/api/process-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId: uploadData.fileId }),
      });
      const processData = await processResponse.json();

      if (processData.error) {
        throw new Error(processData.error);
      }

      setFileResult(prev => prev ? {
        ...prev,
        status: 'processing',
      } : null);
    } catch (error) {
      setFileResult({
        id: -1,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to process file',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test OCR</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Upload Image or PDF
          </label>
          <input
            type="file"
            name="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="block w-full text-sm border rounded p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || fileResult?.status === 'processing'}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 
           fileResult?.status === 'processing' ? 'Processing...' : 
           'Upload & Process'}
        </button>
      </form>

      {fileResult && (
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          
          <div className="mb-4">
            <span className="font-medium">Status:</span>{' '}
            <span className={
              fileResult.status === 'completed' ? 'text-green-600' :
              fileResult.status === 'error' ? 'text-red-600' :
              fileResult.status === 'processing' ? 'text-blue-600' :
              'text-gray-600'
            }>
              {fileResult.status.charAt(0).toUpperCase() + fileResult.status.slice(1)}
            </span>
          </div>

          {fileResult.error ? (
            <div className="text-red-500">{fileResult.error}</div>
          ) : (
            <>
              {fileResult.tokensUsed && (
                <div className="mb-2">
                  <span className="font-medium">Tokens Used:</span>{' '}
                  {fileResult.tokensUsed}
                </div>
              )}
              {fileResult.text && (
                <div>
                  <span className="font-medium">Extracted Text:</span>
                  <pre className="mt-2 p-2 bg-gray-100 rounded whitespace-pre-wrap">
                    {fileResult.text}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 