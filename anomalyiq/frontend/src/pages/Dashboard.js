import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

// const API = 'http://localhost:8000';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // const token = localStorage.getItem('token');

  // Load last detection results from localStorage (set by Upload page after detect)
  useEffect(() => {
    const lastResult = JSON.parse(localStorage.getItem('lastDetection') || 'null');
    const lastUpload = JSON.parse(localStorage.getItem('lastUpload') || 'null');
    if (lastResult || lastUpload) {
      setSummary({ result: lastResult, upload: lastUpload });
    }
  }, []);

  const metrics = summary?.result?.metrics;
  const upload  = summary?.upload;
  const hasData = !!metrics;

  const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="page">
          <div className="page-head">
            <div>
              <h1>Welcome back, {user.full_name?.split(' ')[0] || 'User'}</h1>
              <p>AnomalyIQ · Three-Stage Hybrid Fraud Detection</p>
            </div>
            <div className="chip">
              <span style={{ color: 'var(--green)' }}>●</span>
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {!hasData && (
            <div className="alert alert-info" style={{ marginBottom: 24 }}>
              No detection run yet. Go to <strong>Upload &amp; Analyze</strong> to process a dataset — results will appear here automatically.
            </div>
          )}

          {/* KPI row */}
          <div className="stat-grid">
            <div className="stat-card" style={{ '--accent-color': 'var(--green)' }}>
              <div className="stat-label">Precision</div>
              <div className={`stat-value ${hasData ? 'good' : ''}`}>
                {hasData ? `${(metrics.precision * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="stat-sub">{hasData ? (metrics.precision >= .99 ? '✓ Target met' : 'Below 99% target') : 'Run a detection'}</div>
            </div>

            <div className="stat-card" style={{ '--accent-color': 'var(--cyan)' }}>
              <div className="stat-label">Recall</div>
              <div className={`stat-value ${hasData ? 'great' : ''}`}>
                {hasData ? `${(metrics.recall * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="stat-sub">{hasData ? (metrics.recall >= .99 ? '✓ Target met' : 'Below 99% target') : 'Run a detection'}</div>
            </div>

            <div className="stat-card" style={{ '--accent-color': 'var(--purple)' }}>
              <div className="stat-label">F1-Score</div>
              <div className={`stat-value ${hasData ? 'great' : ''}`}>
                {hasData ? `${(metrics.f1_score * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="stat-sub">{hasData ? (metrics.f1_score >= .99 ? '✓ Target met' : 'Below 99% target') : 'Run a detection'}</div>
            </div>

            <div className="stat-card" style={{ '--accent-color': 'var(--amber)' }}>
              <div className="stat-label">AUC-ROC</div>
              <div className={`stat-value ${hasData ? 'good' : ''}`}>
                {hasData ? `${(metrics.auc_roc * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="stat-sub">{hasData ? 'Excellent discrimination' : 'Run a detection'}</div>
            </div>

            <div className="stat-card" style={{ '--accent-color': 'var(--red)' }}>
              <div className="stat-label">Fraud Flagged</div>
              <div className="stat-value" style={{ color: hasData ? 'var(--red)' : undefined }}>
                {hasData ? summary.result.total_flagged?.toLocaleString() : '—'}
              </div>
              <div className="stat-sub">{hasData ? `of ${summary.result.total_transactions?.toLocaleString()} transactions` : 'Run a detection'}</div>
            </div>

            <div className="stat-card" style={{ '--accent-color': 'var(--accent)' }}>
              <div className="stat-label">Dataset</div>
              <div className="stat-value" style={{ fontSize: 18, color: 'var(--accent)' }}>
                {upload ? upload.rows?.toLocaleString() : '—'}
              </div>
              <div className="stat-sub">{upload ? `${upload.filename} · ${upload.dataset_type}` : 'No dataset loaded'}</div>
            </div>
          </div>

          {/* Confusion matrix summary */}
          {hasData && metrics.confusion_matrix && (
            <div style={{ marginBottom: 24 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Confusion Matrix Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'True Negatives',  val: metrics.confusion_matrix.tn, color: 'var(--green)'  },
                  { label: 'False Positives', val: metrics.confusion_matrix.fp, color: 'var(--amber)'  },
                  { label: 'False Negatives', val: metrics.confusion_matrix.fn, color: 'var(--amber)'  },
                  { label: 'True Positives',  val: metrics.confusion_matrix.tp, color: 'var(--accent)' },
                ].map(c => (
                  <div key={c.label} className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: c.color, fontFamily: 'var(--mono)' }}>
                      {c.val?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional metrics row */}
          {hasData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
              <div className="card">
                <div className="card-title">Model accuracy</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>
                  {(metrics.accuracy * 100).toFixed(4)}%
                </div>
                <div className="progress" style={{ marginTop: 10 }}>
                  <div className="progress-fill" style={{ width: `${metrics.accuracy * 100}%`, background: 'var(--green)' }} />
                </div>
              </div>
              <div className="card">
                <div className="card-title">False positive rate</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--mono)' }}>
                  {(metrics.fpr * 100).toFixed(4)}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Lower is better</div>
              </div>
              <div className="card">
                <div className="card-title">SMOTE Applied</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: metrics.smote_applied ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  {metrics.smote_applied ? 'Yes' : 'No'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  Threshold: {metrics.threshold_used?.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Activity log */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Recent Activity</div>
            {activityLog.length === 0 ? (
              <div className="empty" style={{ padding: '30px 0' }}>
                <div className="empty-icon">📋</div>
                <div>No activity recorded yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activityLog.slice(-8).reverse().map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                    <span style={{ fontSize: 16 }}>{log.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>{log.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{log.time}</div>
                    </div>
                    <span className={`badge badge-${log.type === 'success' ? 'green' : log.type === 'error' ? 'red' : 'blue'}`}>
                      {log.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}