// src/App.jsx v2
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
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
import Users from './pages/Users';
import Audit from './pages/Audit';

export default function App() {
  var storedUser = null;
  try {
    var s = localStorage.getItem('anomalyiq_user');
    var t = localStorage.getItem('anomalyiq_token');
    if (s && t) storedUser = JSON.parse(s);
  } catch(e) {}
  const [user, setUser] = React.useState(storedUser);
  const [uploadedDataset, setUploadedDataset] = useState(function() {
  try {
    var saved = localStorage.getItem('anomalyiq_dataset');
    return saved ? JSON.parse(saved) : null;
  } catch(e) { return null; }
});
  const [results, setResults] = useState(null);
  const [datasetType, setDatasetType] = useState('creditcard');
  const [pipelineStatus, setPipelineStatus] = useState({});
  function handleLogin(data) { setUser(data); }
  function handleLogout() {
    localStorage.removeItem('anomalyiq_token');
    localStorage.removeItem('anomalyiq_user');
    setUser(null);
  }
  if (!user) return <Login onLogin={handleLogin} />;
  function handleDatasetLoaded(data) {
  setUploadedDataset(data);
  setDatasetType(data.dataset_type);
  localStorage.setItem('anomalyiq_dataset', JSON.stringify(data));
  setPipelineStatus(function(p) {
    return Object.assign({}, p, { dataLoaded: true });
  });
}
  function handleResultsReady(data, dtype) { setResults(data); setDatasetType(dtype); }
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'sans-serif', borderRadius: '12px', fontSize: '14px', background: '#1e1b4b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' },
        success: { iconTheme: { primary: '#0ea5e9', secondary: '#fff' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
      }} />
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
        <Sidebar pipelineStatus={pipelineStatus} user={user} onLogout={handleLogout} />
        <main style={{ flex: 1, marginLeft: '260px', minHeight: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 40 }}>
            <div>
              {datasetType && (
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: datasetType === 'creditcard' ? 'rgba(167,139,250,0.12)' : 'rgba(14,165,233,0.12)', color: datasetType === 'creditcard' ? '#a78bfa' : '#38bdf8', border: datasetType === 'creditcard' ? '1px solid rgba(167,139,250,0.25)' : '1px solid rgba(14,165,233,0.25)' }}>
                  {datasetType === 'creditcard' ? 'Credit Card Dataset' : 'PaySim Dataset (African)'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 6px rgba(14,165,233,0.8)', display: 'inline-block' }}></span>
              AnomalyIQ v2.0
              {user && <span style={{ marginLeft: '8px', padding: '4px 10px', background: 'rgba(14,165,233,0.1)', color: '#38bdf8', borderRadius: '8px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(14,165,233,0.2)' }}>{user.full_name} ({user.role})</span>}
            </div>
          </div>
          <div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload onDatasetLoaded={handleDatasetLoaded} />} />
              <Route path="/train" element={<Train uploadedDataset={uploadedDataset} onResultsReady={handleResultsReady} setPipelineStatus={setPipelineStatus} />} />
              <Route path="/results" element={<Results results={results} datasetType={datasetType} />} />
              <Route path="/compare" element={<Compare results={results} />} />
              <Route path="/score" element={<Score datasetType={datasetType} />} />
              <Route path="/export" element={<Export results={results} datasetType={datasetType} />} />
              <Route path="/explain" element={<Explain results={results} datasetType={datasetType} />} />
              <Route path="/users" element={<Users user={user} />} />
              <Route path="/audit" element={<Audit user={user} />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}