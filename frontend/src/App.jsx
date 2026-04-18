// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar  from './components/Sidebar';
import Home     from './pages/Home';
import Upload   from './pages/Upload';
import Train    from './pages/Train';
import Results  from './pages/Results';
import Compare  from './pages/Compare';
import Score    from './pages/Score';
import Export   from './pages/Export';

export default function App() {
  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [results,         setResults]         = useState(null);
  const [datasetType,     setDatasetType]     = useState('creditcard');
  const [pipelineStatus,  setPipelineStatus]  = useState({});

  const handleDatasetLoaded = (data) => {
    setUploadedDataset(data);
    setDatasetType(data.dataset_type);
    setPipelineStatus(p => ({ ...p, dataLoaded: true }));
  };

  const handleResultsReady = (data, dtype) => {
    setResults(data);
    setDatasetType(dtype);
  };

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Cabinet Grotesk, sans-serif', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#0ABFBC', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar pipelineStatus={pipelineStatus} />

        {/* Main content */}
        <main className="flex-1 ml-64 min-h-screen">
          {/* Top bar */}
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-400 font-medium">
              {datasetType && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                  ${datasetType === 'creditcard'
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                  {datasetType === 'creditcard' ? '💳 Credit Card Dataset' : '📱 PaySim Dataset (African)'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              AnomalyIQ v2.0 · Three-Stage Hybrid
            </div>
          </div>

          {/* Page content */}
          <div className="px-8 py-8 max-w-6xl">
            <Routes>
              <Route path="/"        element={<Home />} />
              <Route path="/upload"  element={<Upload  onDatasetLoaded={handleDatasetLoaded} />} />
              <Route path="/train"   element={
                <Train
                  uploadedDataset={uploadedDataset}
                  onResultsReady={handleResultsReady}
                  setPipelineStatus={setPipelineStatus}
                />
              } />
              <Route path="/results" element={<Results results={results} datasetType={datasetType} />} />
              <Route path="/compare" element={<Compare results={results} />} />
              <Route path="/score"   element={<Score   datasetType={datasetType} />} />
              <Route path="/export"  element={<Export  results={results} datasetType={datasetType} />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
