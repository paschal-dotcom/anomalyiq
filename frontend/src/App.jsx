// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

<<<<<<< HEAD
import Sidebar  from './components/Sidebar';
import Home     from './pages/Home';
import Upload   from './pages/Upload';
import Train    from './pages/Train';
import Results  from './pages/Results';
import Compare  from './pages/Compare';
import Score    from './pages/Score';
import Export   from './pages/Export';
=======
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Train from './pages/Train';
import Results from './pages/Results';
import Compare from './pages/Compare';
import Score from './pages/Score';
import Export from './pages/Export';
import Explain from './pages/Explain';
>>>>>>> c551ccf293641dbe365186b47049f57604b74116

export default function App() {
  const [user, setUser] = React.useState(() => {
    try {
      const stored = localStorage.getItem('anomalyiq_user');
      const token  = localStorage.getItem('anomalyiq_token');
      return stored && token ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [results, setResults] = useState(null);
  const [datasetType, setDatasetType] = useState('creditcard');
  const [pipelineStatus, setPipelineStatus] = useState({});

  const handleLogin = (data) => setUser(data);

  const handleLogout = () => {
    localStorage.removeItem('anomalyiq_token');
    localStorage.removeItem('anomalyiq_user');
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

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
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      <div className="flex min-h-screen">
        <Sidebar pipelineStatus={pipelineStatus} user={user} onLogout={handleLogout} />

        <main className="flex-1 ml-64 min-h-screen">
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-400 font-medium">
              {datasetType && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                  ${datasetType === 'creditcard'
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                  {datasetType === 'creditcard' ? '\u{1F4B3} Credit Card Dataset' : '\u{1F4F1} PaySim Dataset (African)'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              AnomalyIQ v2.0 · Three-Stage Hybrid
              {user && (
                <span className="ml-2 px-2 py-1 bg-teal-50 text-teal-700 rounded-lg font-semibold border border-teal-100">
                  {user.full_name} ({user.role})
                </span>
              )}
            </div>
          </div>

          <div className="px-8 py-8 max-w-6xl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload onDatasetLoaded={handleDatasetLoaded} />} />
              <Route path="/train" element={
                <Train
                  uploadedDataset={uploadedDataset}
                  onResultsReady={handleResultsReady}
                  setPipelineStatus={setPipelineStatus}
                />
              } />
              <Route path="/results" element={<Results results={results} datasetType={datasetType} />} />
              <Route path="/compare" element={<Compare results={results} />} />
<<<<<<< HEAD
              <Route path="/score"   element={<Score   datasetType={datasetType} />} />
              <Route path="/export"  element={<Export  results={results} datasetType={datasetType} />} />
=======
              <Route path="/score" element={<Score datasetType={datasetType} />} />
              <Route path="/export" element={<Export results={results} datasetType={datasetType} />} />
              <Route path="/explain" element={<Explain results={results} datasetType={datasetType} />} />
>>>>>>> c551ccf293641dbe365186b47049f57604b74116
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
