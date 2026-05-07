import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const API = 'http://localhost:8000';

const DATASET_TYPES = [
  { value: 'creditcard', label: 'Credit Card',      desc: 'Kaggle credit card fraud',       icon: '💳' },
  { value: 'paysim',     label: 'PaySim Mobile',    desc: 'PaySim mobile money simulation', icon: '📱' },
  { value: 'ecommerce',  label: 'E-commerce',       desc: 'Financial / e-commerce fraud',   icon: '🛍' },
];

const STEPS = ['Upload', 'Train', 'Detect'];

function logActivity(icon, message, type = 'info') {
  const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
  log.push({ icon, message, type, time: new Date().toLocaleString() });
  localStorage.setItem('activityLog', JSON.stringify(log.slice(-50)));
}

export default function Upload() {
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');

  const [datasetType, setDatasetType] = useState('creditcard');
  const [file, setFile]               = useState(null);
  const [step, setStep]               = useState(0);   // 0=idle 1=uploading 2=training 3=detecting 4=done
  const [stepStatus, setStepStatus]   = useState(['idle', 'idle', 'idle']);
  const [uploadResult, setUploadResult] = useState(null);
  const [trainResult,  setTrainResult]  = useState(null);
  const [, setDetectResult] = useState(null);
  const [error, setError]             = useState('');
  const [progress, setProgress]       = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const updateStep = (idx, status) => {
    setStepStatus(prev => { const n = [...prev]; n[idx] = status; return n; });
  };

  const handleRun = async () => {
    if (!file) { setError('Please select a CSV file first'); return; }
    setError('');
    setStep(1);

    // ── Step 1: Upload ─────────────────────────────────────────────────────
    updateStep(0, 'running');
    setProgress('Uploading dataset...');
    logActivity('⬆', `Uploading ${file.name}`, 'info');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', datasetType);

    let filePath;
    try {
      const res  = await fetch(`${API}/api/upload`, { method: 'POST', headers, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      filePath = data.data.file_path;
      setUploadResult(data.data);
      localStorage.setItem('lastUpload', JSON.stringify(data.data));
      updateStep(0, 'done');
      logActivity('✅', `Uploaded ${file.name} — ${data.data.rows?.toLocaleString()} rows`, 'success');
    } catch (e) {
      updateStep(0, 'error');
      setError(`Upload failed: ${e.message}`);
      setStep(0);
      return;
    }

    // ── Step 2: Train ──────────────────────────────────────────────────────
    updateStep(1, 'running');
    setProgress('Training Autoencoder + IsolationForest + LightGBM (80/20 split)…');
    logActivity('🔄', 'Training three-stage ensemble models', 'info');

    try {
      const res  = await fetch(`${API}/api/train`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath, dataset_type: datasetType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Training failed');
      setTrainResult(data.data);
      updateStep(1, 'done');
      logActivity('✅', `Training complete — train: ${data.data.train_size} / test: ${data.data.test_size}`, 'success');
    } catch (e) {
      updateStep(1, 'error');
      setError(`Training failed: ${e.message}`);
      setStep(0);
      return;
    }

    // ── Step 3: Detect ─────────────────────────────────────────────────────
    updateStep(2, 'running');
    setProgress('Running fraud detection with SHAP explanations…');
    logActivity('🔍', 'Running fraud detection on full dataset', 'info');

    try {
      const res  = await fetch(`${API}/api/detect`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath, dataset_type: datasetType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Detection failed');
      setDetectResult(data.data);
      localStorage.setItem('lastDetection', JSON.stringify(data.data));
      updateStep(2, 'done');
      setStep(4);
      logActivity('🚨', `Detection complete — ${data.data.total_flagged} frauds flagged (Precision: ${(data.data.metrics.precision*100).toFixed(2)}%)`, 'success');
    } catch (e) {
      updateStep(2, 'error');
      setError(`Detection failed: ${e.message}`);
      setStep(0);
      return;
    }
  };

  const stepIcon = (status) => {
    if (status === 'running') return <span className="spinner" />;
    if (status === 'done')    return <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>;
    if (status === 'error')   return <span style={{ color: 'var(--red)',   fontSize: 16 }}>✗</span>;
    return <span style={{ color: 'var(--muted)', fontSize: 14 }}>○</span>;
  };

  const isRunning = step > 0 && step < 4;

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="page">
          <div className="page-head">
            <div>
              <h1>Upload &amp; Analyze</h1>
              <p>Upload a transaction dataset — the system will train and detect automatically</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: step > 0 ? '1fr 1fr' : '1fr', gap: 24 }}>
            {/* ── Left panel: config ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Dataset type */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}>Dataset Type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {DATASET_TYPES.map(d => (
                    <label key={d.value} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', borderRadius: 10,
                      background: datasetType === d.value ? 'rgba(59,130,246,.1)' : 'var(--bg3)',
                      border: `1px solid ${datasetType === d.value ? 'rgba(59,130,246,.4)' : 'var(--border)'}`,
                      cursor: 'pointer', transition: 'all .15s',
                    }}>
                      <input type="radio" name="dstype" value={d.value} checked={datasetType === d.value}
                        onChange={e => setDatasetType(e.target.value)}
                        style={{ accentColor: 'var(--accent)' }} disabled={isRunning} />
                      <span style={{ fontSize: 20 }}>{d.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{d.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}>CSV File</div>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '28px 20px',
                  border: `2px dashed ${file ? 'var(--accent)' : 'var(--border2)'}`,
                  borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
                  background: file ? 'rgba(59,130,246,.05)' : 'var(--bg3)',
                }}>
                  <span style={{ fontSize: 32 }}>{file ? '📄' : '📁'}</span>
                  <span style={{ fontSize: 13, color: file ? 'var(--text)' : 'var(--muted)', fontWeight: file ? 600 : 400 }}>
                    {file ? file.name : 'Click to choose CSV file'}
                  </span>
                  {file && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                  <input type="file" accept=".csv" style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files[0])} disabled={isRunning} />
                </label>
              </div>

              <button className="btn btn-primary" onClick={handleRun} disabled={isRunning || !file}
                style={{ fontSize: 14, padding: '14px', justifyContent: 'center' }}>
                {isRunning ? <><span className="spinner" /> Processing…</> : '⚡ Upload, Train & Detect'}
              </button>
            </div>

            {/* ── Right panel: pipeline progress ── */}
            {(step > 0 || stepStatus.some(s => s !== 'idle')) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Pipeline steps */}
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Pipeline Progress</div>
                  {STEPS.map((s, i) => (
                    <div key={s} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 0',
                      borderBottom: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: stepStatus[i] === 'done' ? 'rgba(16,185,129,.15)' :
                                    stepStatus[i] === 'running' ? 'rgba(59,130,246,.15)' :
                                    stepStatus[i] === 'error' ? 'rgba(239,68,68,.15)' : 'var(--surface)',
                        border: `1px solid ${
                          stepStatus[i] === 'done'    ? 'rgba(16,185,129,.3)' :
                          stepStatus[i] === 'running' ? 'rgba(59,130,246,.3)' :
                          stepStatus[i] === 'error'   ? 'rgba(239,68,68,.3)'  : 'var(--border)'
                        }`,
                      }}>
                        {stepIcon(stepStatus[i])}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Step {i+1}: {s}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {stepStatus[i] === 'running' ? progress :
                           stepStatus[i] === 'done'    ? 'Completed successfully' :
                           stepStatus[i] === 'error'   ? 'Failed' : 'Waiting…'}
                        </div>
                      </div>
                      <span className={`badge badge-${
                        stepStatus[i] === 'done'    ? 'green' :
                        stepStatus[i] === 'running' ? 'blue'  :
                        stepStatus[i] === 'error'   ? 'red'   : 'gray'
                      }`}>{stepStatus[i]}</span>
                    </div>
                  ))}
                </div>

                {/* Upload summary */}
                {uploadResult && (
                  <div className="card">
                    <div className="card-title" style={{ marginBottom: 12 }}>Dataset Summary</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        ['Rows',       uploadResult.rows?.toLocaleString()],
                        ['Columns',    uploadResult.columns],
                        ['Fraud count',uploadResult.fraud_count?.toLocaleString()],
                        ['Fraud ratio',`${uploadResult.fraud_ratio}%`],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', marginTop: 2 }}>{v ?? '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Train summary */}
                {trainResult && (
                  <div className="card">
                    <div className="card-title" style={{ marginBottom: 12 }}>Training Split (80/20)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        ['Train samples', trainResult.train_size?.toLocaleString()],
                        ['Test samples',  trainResult.test_size?.toLocaleString()],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', marginTop: 2 }}>{v ?? '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Done — navigate */}
                {step === 4 && (
                  <button className="btn btn-success"
                    onClick={() => navigate('/results')}
                    style={{ justifyContent: 'center', padding: '14px' }}>
                    ◈ View Full Results &amp; Charts →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}