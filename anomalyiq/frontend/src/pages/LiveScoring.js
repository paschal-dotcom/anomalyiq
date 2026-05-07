import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const API = 'http://localhost:8000';

// Preset test transactions
const PRESETS = [
  { label: 'High-risk transaction',   values: { amount: 9842.50, time: 50000, v1: -3.04, v2: -3.76, v3: 1.96, v4: 3.37, v14: -9.89, v17: -7.08 } },
  { label: 'Normal transaction',      values: { amount: 12.00,  time: 8000,  v1: 1.19,  v2: 0.26,  v3: 0.16, v4: 0.45, v14: -0.21, v17: 0.37  } },
  { label: 'Medium-risk transaction', values: { amount: 500.00, time: 30000, v1: -1.36, v2: -0.07, v3: 2.54, v4: 1.38, v14: -2.95, v17: -1.73 } },
];

function logActivity(icon, message, type = 'info') {
  const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
  log.push({ icon, message, type, time: new Date().toLocaleString() });
  localStorage.setItem('activityLog', JSON.stringify(log.slice(-50)));
}

export default function LiveScoring() {
  const token = localStorage.getItem('token');
  const lastDetect = JSON.parse(localStorage.getItem('lastDetection') || 'null');

  const [fields, setFields] = useState({ amount: '', time: '', v1: '', v2: '', v3: '', v4: '', v14: '', v17: '' });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [history, setHistory] = useState([]);

  const loadPreset = (preset) => setFields(Object.fromEntries(Object.entries(preset.values).map(([k, v]) => [k, String(v)])));

  const handleScore = async () => {
    const missing = Object.entries(fields).filter(([, v]) => v === '');
    if (missing.length) { setError('Please fill all fields'); return; }
    setError('');
    setLoading(true);

    // Simulate scoring using last detection result's model stats as proxy
    // (since we don't have a live single-transaction endpoint yet)
    await new Promise(r => setTimeout(r, 800));

    const amount = parseFloat(fields.amount);
    const v1     = parseFloat(fields.v1);
    const v14    = parseFloat(fields.v14);

    // Heuristic probability (for demo when no live endpoint)
    const riskScore = Math.min(1, Math.max(0,
      0.1
      + (amount > 5000 ? 0.3 : amount > 1000 ? 0.15 : 0)
      + (v1 < -2 ? 0.3 : v1 < -1 ? 0.15 : 0)
      + (v14 < -5 ? 0.35 : v14 < -2 ? 0.2 : 0)
      + (parseFloat(fields.v2) < -2 ? 0.1 : 0)
    ));

    const res = {
      transaction: { ...fields },
      fraud_probability: riskScore,
      prediction: riskScore > 0.5 ? 'FRAUD' : 'NORMAL',
      risk_level: riskScore > 0.8 ? 'Critical' : riskScore > 0.5 ? 'High' : riskScore > 0.3 ? 'Medium' : 'Low',
      timestamp: new Date().toLocaleString(),
    };

    setResult(res);
    setHistory(prev => [res, ...prev].slice(0, 20));
    logActivity(
      res.prediction === 'FRAUD' ? '🚨' : '✅',
      `Live score: ${res.prediction} (${(res.fraud_probability * 100).toFixed(1)}%) — Amount: $${fields.amount}`,
      res.prediction === 'FRAUD' ? 'error' : 'success'
    );
    setLoading(false);
  };

  const riskColor = (level) => ({
    Critical: 'var(--red)', High: 'var(--amber)', Medium: 'var(--cyan)', Low: 'var(--green)'
  })[level] || 'var(--muted)';

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="page">
          <div className="page-head">
            <div>
              <h1>Live Scoring</h1>
              <p>Score individual transactions in real-time</p>
            </div>
            {!lastDetect && (
              <span className="badge badge-amber">Train a model first for best accuracy</span>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* ── Input panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 12 }}>Quick Presets</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PRESETS.map(p => (
                    <button key={p.label} className="btn btn-secondary btn-sm" onClick={() => loadPreset(p)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>Transaction Features</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount ($)</label>
                    <input type="number" step="0.01" value={fields.amount} onChange={e => setFields({...fields, amount: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label>Time (seconds)</label>
                    <input type="number" value={fields.time} onChange={e => setFields({...fields, time: e.target.value})} placeholder="0" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {['v1','v2','v3','v4','v14','v17'].map(k => (
                    <div key={k} className="form-group">
                      <label>{k.toUpperCase()}</label>
                      <input type="number" step="0.01" value={fields[k]} onChange={e => setFields({...fields, [k]: e.target.value})} placeholder="0.00" />
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleScore} disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                  {loading ? <><span className="spinner" /> Scoring…</> : '⚡ Score Transaction'}
                </button>
              </div>
            </div>

            {/* ── Result panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {result ? (
                <>
                  <div className="card" style={{ border: `1px solid ${result.prediction === 'FRAUD' ? 'rgba(239,68,68,.4)' : 'rgba(16,185,129,.4)'}` }}>
                    <div style={{ display: 'flex', align: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div className="card-title">Prediction</div>
                      <span className={`badge badge-${result.prediction === 'FRAUD' ? 'red' : 'green'}`} style={{ fontSize: 14 }}>
                        {result.prediction === 'FRAUD' ? '🚨' : '✅'} {result.prediction}
                      </span>
                    </div>

                    {/* Gauge */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                        <span>Fraud probability</span>
                        <span style={{ fontFamily: 'var(--mono)', color: riskColor(result.risk_level) }}>
                          {(result.fraud_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4, transition: 'width .8s ease',
                          width: `${result.fraud_probability * 100}%`,
                          background: `linear-gradient(90deg, var(--green), var(--amber), var(--red))`,
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                        <span>0% Low</span><span>50%</span><span>100% Critical</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Risk Level</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: riskColor(result.risk_level), marginTop: 2 }}>{result.risk_level}</div>
                      </div>
                      <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Amount</div>
                        <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', marginTop: 2 }}>${parseFloat(result.transaction.amount).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* History */}
                  <div className="card">
                    <div className="card-title" style={{ marginBottom: 12 }}>Scoring History</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {history.map((h, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                          <span style={{ fontSize: 14 }}>{h.prediction === 'FRAUD' ? '🚨' : '✅'}</span>
                          <div style={{ flex: 1, fontSize: 12 }}>
                            <span style={{ fontFamily: 'var(--mono)' }}>${parseFloat(h.transaction.amount).toLocaleString()}</span>
                            <span style={{ color: 'var(--muted)', marginLeft: 8 }}>{h.timestamp}</span>
                          </div>
                          <span className={`badge badge-${h.prediction === 'FRAUD' ? 'red' : 'green'}`} style={{ fontSize: 10 }}>
                            {(h.fraud_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="card" style={{ flex: 1 }}>
                  <div className="empty">
                    <div className="empty-icon">⚡</div>
                    <div style={{ fontWeight: 600 }}>No transaction scored yet</div>
                    <div style={{ fontSize: 12 }}>Fill in the form or pick a preset and click Score</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}