import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Database, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : 'https://strewn-plant-frequent.ngrok-free.dev';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [datasetType, setDatasetType] = useState('creditcard');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedInfo, setUploadedInfo] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(null);
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('error');
      setErrorMessage('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    setErrorMessage('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataset_type', datasetType);

      // Get auth token
      const token = localStorage.getItem('anomalyiq_token');
      
      // Upload to backend
      const response = await axios.post(`${BASE}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        timeout: 60000 // 60 second timeout for large files
      });

      // Save the response data to localStorage
      const uploadData = {
        file_path: response.data.file_path,
        dataset_type: datasetType,
        filename: file.name,
        size: file.size,
        rows: response.data.rows || null,
        columns: response.data.columns || null,
        uploaded_at: new Date().toISOString()
      };

      localStorage.setItem('anomalyiq_dataset', JSON.stringify(uploadData));

      setUploadedInfo(uploadData);
      setUploadStatus('success');
      
      // Clear file input after 3 seconds
      setTimeout(() => {
        setFile(null);
        setUploadStatus(null);
      }, 3000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      
      if (error.response) {
        setErrorMessage(error.response.data.detail || 'Upload failed');
      } else if (error.code === 'ECONNABORTED') {
        setErrorMessage('Upload timeout - file may be too large');
      } else {
        setErrorMessage('Network error - check backend connection');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Upload className="w-10 h-10 text-purple-400" />
            Upload Dataset
          </h1>
          <p className="text-gray-400">
            Upload your transaction dataset for fraud detection analysis
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
          {/* Dataset Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Dataset Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDatasetType('creditcard')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  datasetType === 'creditcard'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <Database className={`w-6 h-6 mb-2 ${datasetType === 'creditcard' ? 'text-purple-400' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold text-white">Credit Card</div>
                  <div className="text-xs text-gray-400">MLG-ULB Dataset</div>
                </div>
              </button>

              <button
                onClick={() => setDatasetType('paysim')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  datasetType === 'paysim'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <Database className={`w-6 h-6 mb-2 ${datasetType === 'paysim' ? 'text-blue-400' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold text-white">PaySim</div>
                  <div className="text-xs text-gray-400">African Mobile Money</div>
                </div>
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select CSV File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full p-8 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-gray-700/30"
              >
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">
                    {file ? file.name : 'Click to select CSV file'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop or click to browse'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
              !file || uploading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/50'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Dataset
              </>
            )}
          </button>

          {/* Status Messages */}
          {uploadStatus === 'success' && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-green-400">Upload Successful!</div>
                <div className="text-sm text-gray-300 mt-1">
                  Dataset saved and ready for detection. You can now proceed to Run Detection.
                </div>
                {uploadedInfo && uploadedInfo.rows && (
                  <div className="text-xs text-gray-400 mt-2">
                    {uploadedInfo.rows.toLocaleString()} rows × {uploadedInfo.columns} columns
                  </div>
                )}
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-400">Upload Failed</div>
                <div className="text-sm text-gray-300 mt-1">{errorMessage}</div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
              <strong className="text-blue-400">Note:</strong> For the MLG-ULB Credit Card dataset (143MB), 
              the backend will load it directly from the server path due to ngrok free tier upload limits. 
              For smaller datasets, upload normally.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
