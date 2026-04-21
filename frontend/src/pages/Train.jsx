import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Loader2, CheckCircle2, AlertCircle, TrendingUp, Database, Zap } from 'lucide-react';

const BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : 'https://strewn-plant-frequent.ngrok-free.dev';

export default function TrainPage() {
  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(null); // null | 'running' | 'success' | 'error'
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Load uploaded dataset info from localStorage
    const datasetInfo = localStorage.getItem('anomalyiq_dataset');
    if (datasetInfo) {
      try {
        setUploadedDataset(JSON.parse(datasetInfo));
      } catch (e) {
        console.error('Failed to parse dataset info:', e);
      }
    }
  }, []);

  const startDetection = async () => {
    if (!uploadedDataset) {
      setStatus('error');
      setErrorMessage('No dataset uploaded. Please upload a dataset first.');
      return;
    }

    setRunning(true);
    setStatus('running');
    setProgress(0);
    setErrorMessage('');
    setResults(null);

    try {
      const token = localStorage.getItem('anomalyiq_token');

      // Simulate progress updates (since backend doesn't send real-time progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 1000);

      // Call backend detection endpoint
      const response = await axios.post(
        `${BASE}/api/detect`,
        {
          file_path: uploadedDataset.file_path,
          dataset_type: uploadedDataset.dataset_type
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          timeout: 300000 // 5 minute timeout for large datasets
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      // Save results to localStorage
      const detectionResults = {
        ...response.data,
        dataset_type: uploadedDataset.dataset_type,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('anomalyiq_results', JSON.stringify(detectionResults));
      setResults(detectionResults);
      setStatus('success');

      // Redirect to results page after 2 seconds
      setTimeout(() => {
        window.location.href = '/results';
      }, 2000);

    } catch (error) {
      console.error('Detection error:', error);
      setStatus('error');
      setProgress(0);

      if (error.response) {
        setErrorMessage(error.response.data.detail || 'Detection failed');
      } else if (error.code === 'ECONNABORTED') {
        setErrorMessage('Detection timeout - dataset may be too large');
      } else {
        setErrorMessage('Network error - check backend connection');
      }
    } finally {
      setRunning(false);
    }
  };

  // Get expected results based on dataset type
  const getExpectedResults = () => {
    if (!uploadedDataset) return [];

    if (uploadedDataset.dataset_type === 'paysim') {
      return [[
        'PaySim (African)',
        '99.26%',
        'Precision',
        '99.93%',
        'AUC-ROC',
        '#0ea5e9'
      ]];
    } else {
      return [[
        'Credit Card (MLG-ULB)',
        '99.80%',
        'Precision · Recall · F1',
        '100%',
        'AUC-ROC',
        '#a78bfa'
      ]];
    }
  };

  const expectedResults = getExpectedResults();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-10 h-10 text-purple-400" />
            Run Detection
          </h1>
          <p className="text-gray-400">
            Execute the three-stage hybrid fraud detection pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Dataset Info Card */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-400" />
              Dataset Information
            </h2>

            {uploadedDataset ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-400">Dataset Type:</span>
                  <span className="text-white font-semibold capitalize">
                    {uploadedDataset.dataset_type === 'paysim' ? 'PaySim (African)' : 'Credit Card (MLG-ULB)'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-400">Filename:</span>
                  <span className="text-white font-mono text-sm">{uploadedDataset.filename}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-400">File Size:</span>
                  <span className="text-white">{(uploadedDataset.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                {uploadedDataset.rows && (
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Rows:</span>
                    <span className="text-white font-semibold">{uploadedDataset.rows.toLocaleString()}</span>
                  </div>
                )}
                {uploadedDataset.columns && (
                  <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Columns:</span>
                    <span className="text-white font-semibold">{uploadedDataset.columns}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-400">Uploaded:</span>
                  <span className="text-white text-sm">
                    {new Date(uploadedDataset.uploaded_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <AlertCircle className="w-8 h-8 text-yellow-400 mb-2" />
                <p className="text-yellow-400 font-semibold">No Dataset Uploaded</p>
                <p className="text-gray-400 text-sm mt-1">
                  Please upload a dataset first before running detection.
                </p>
              </div>
            )}
          </div>

          {/* Expected Results Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Expected Results
            </h2>

            {expectedResults.length > 0 ? (
              <div className="space-y-4">
                {expectedResults.map(([name, metric1, label1, metric2, label2, color], idx) => (
                  <div key={idx} className="p-4 bg-gray-700/50 rounded-xl border-l-4" style={{ borderColor: color }}>
                    <div className="text-sm text-gray-400 mb-2">{name}</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-2xl font-bold text-white">{metric1}</div>
                        <div className="text-xs text-gray-400">{label1}</div>
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-white">{metric2}</div>
                        <div className="text-xs text-gray-400">{label2}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">
                Upload a dataset to see expected performance metrics.
              </div>
            )}
          </div>
        </div>

        {/* Detection Control Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Detection Pipeline</h2>

          {/* Pipeline Stages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="text-purple-400 font-semibold mb-1">Stage 1</div>
              <div className="text-white font-bold text-lg">Autoencoder</div>
              <div className="text-gray-400 text-sm">Unsupervised · 20% weight</div>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="text-blue-400 font-semibold mb-1">Stage 2</div>
              <div className="text-white font-bold text-lg">Isolation Forest</div>
              <div className="text-gray-400 text-sm">Unsupervised · 20% weight</div>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="text-green-400 font-semibold mb-1">Stage 3</div>
              <div className="text-white font-bold text-lg">LightGBM + SMOTE</div>
              <div className="text-gray-400 text-sm">Supervised · 60% weight</div>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={startDetection}
            disabled={!uploadedDataset || running}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
              !uploadedDataset || running
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/50'
            }`}
          >
            {running ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Detection...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Detection
              </>
            )}
          </button>

          {/* Progress Bar */}
          {status === 'running' && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Processing...</span>
                <span className="text-sm text-purple-400 font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Running three-stage hybrid detection pipeline...
              </div>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-green-400">Detection Complete!</div>
                <div className="text-sm text-gray-300 mt-1">
                  Redirecting to results page...
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-400">Detection Failed</div>
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
              <strong className="text-blue-400">Pipeline Info:</strong> The detection runs sequentially through 
              Autoencoder → Isolation Forest → LightGBM with SMOTE, combining scores using weighted ensemble 
              (0.20 + 0.20 + 0.60). Processing time varies based on dataset size.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
