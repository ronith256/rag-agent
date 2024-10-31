import React, { useState, useEffect } from 'react';
import { Upload, File, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';

interface FileUploadSectionProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isAgentCreated: boolean;
  agentId: string | null;
}

interface JobStatus {
  _id: string;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  total_files: number;
  processed_files: number;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  files,
  setFiles,
  isAgentCreated,
  agentId,
}) => {
  const [uploadStatus, setUploadStatus] = useState<JobStatus | null>(null);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const baseURL = import.meta.env.VITE_BACKEND_BASE_URL || '';

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (uploadJobId) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`${baseURL}/api/agents/jobs/${uploadJobId}`);
          setUploadStatus(response.data);
          
          if (['completed', 'failed'].includes(response.data.status)) {
            clearInterval(intervalId);
            if (response.data.status === 'completed') {
              // Wait a brief moment before clearing everything
              setTimeout(() => {
                setFiles([]);
                setUploadStatus(null);
                setUploadJobId(null);
              }, 1000);
            }
          }
        } catch (error) {
          console.error('Error checking job status:', error);
          clearInterval(intervalId);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [uploadJobId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(event.target.files || [])]);
    }
  };

  const submitFiles = async () => {
    if (!agentId || files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${baseURL}/api/agents/${agentId}/documents/bulk`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadJobId(response.data.job_id);
      setUploadStatus({
        _id: response.data.job_id,
        status: 'processing',
        total_files: files.length,
        processed_files: 0
      });
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const renderSubmitButton = () => {
    if (!uploadStatus) {
      return (
        <button
          onClick={submitFiles}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
        >
          Submit Files
        </button>
      );
    }

    if (uploadStatus.status === 'failed') {
      return (
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-md cursor-not-allowed"
          disabled
        >
          Upload Failed
        </button>
      );
    }

    const progress = `${uploadStatus.processed_files}/${uploadStatus.total_files}`;
    const isComplete = uploadStatus.status === 'completed';
    
    return (
      <button
        className={`px-4 py-2 rounded-md text-white flex items-center gap-2 cursor-not-allowed ${
          isComplete ? 'bg-green-600' : 'bg-blue-600'
        }`}
        disabled
      >
        {isComplete ? (
          'Upload Complete'
        ) : (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing {progress}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="w-96 p-8 border-l">
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        
        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-gray-500 mb-4">No files uploaded yet</p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={!isAgentCreated}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md shadow-lg transition-all ${
                isAgentCreated
                  ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700 hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Upload className="w-5 h-5" />
              Select Files
            </label>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4 mb-6">
              {files.map((file, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-gray-400">
                      <File className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{file.name}</h3>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="add-more-files"
                disabled={!!uploadStatus && uploadStatus.status === 'processing'}
              />
              <label
                htmlFor="add-more-files"
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  uploadStatus && uploadStatus.status === 'processing'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer shadow-md hover:shadow-lg'
                }`}
              >
                <Plus className="w-4 h-4" />
                Add Files
              </label>
              {renderSubmitButton()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;