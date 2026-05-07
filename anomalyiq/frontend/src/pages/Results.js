import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function Results() {
  const [data,        setData]        = useState(null);
  const [activeChart, setActiveChart] = useState('confusion_matrix');
  const [showShap,    setShowShap]    = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('lastDetection');
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) {
    return (
      <div className="shell">
        <Sidebar />
        <div className="main">
          <div className="page">
            <div className="page-head"><div><h1>Detection Results</h1><p>No results yet</p></div></div>
            <div className="empty">
              <div className="empty-icon">◈</div>
              <div style={{ fontWeight: 600 }}>No detection run yet</div>
              <div style={{ fontSize: 13 }}>Go to Upload &amp; Analyze to process a dataset</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const m  = data.metrics;
  const ch = data.charts || {};

  const CHART_TABS = [
    { key: 'confusion_matrix',   label: 'Confusion Matrix'  },
    { key: 'roc_curve',          label: 'ROC Curve'         },
    { key: 'pr_curve',           label: 'PR Curve'          },
    { key: 'feature_importance', label: 'Feature Importance'},
    { key: 'metrics_comparison', label: 'Metrics Bar'       },
  ];

  const pct  = v => `${(v * 100).toFixed(2)}%`;
  const good = v => v >= 0.99 ? 'var(--green)' : v >= 0.95 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="page">
          <div className="page-head">
            <div>
              <h1>Detection Results</h1>
              <p>Analysis completed for {data.total_transactions?.toLocaleString()} transactions</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {m.all_metrics_99_plus && (
                <span className="badge badge-green" style={{ fontSize: 12 }}>🎉 All metrics ≥ 99%</span>
              )}
              {m.smote_applied && (
                <span className="badge badge-blue" style={{ fontSize: 12 }}>SMOTE applied</span>
              )}
            </div>
          </div>

          {/* ── KPI row ── */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Precision',  val: m.precision,  color: good(m.precision)  },
              { label: 'Recall',     val: m.recall,     color: good(m.recall)     },
              { label: 'F1-Score',   val: m.f1_score,   color: good(m.f1_score)   },
              { label: 'AUC-ROC',    val: m.auc_roc,    color: good(m.auc_roc)    },
              { label: 'Accuracy',   val: m.accuracy,   color: good(m.accuracy)   },
            ].map(k => (
              <div key={k.label} className="stat-card" style={{ '--accent-color': k.color }}>
                <div className="stat-label">{k.label}</div>
                <div className="stat-value" style={{ fontSize: 24, color: k.color }}>{pct(k.val)}</div>
                <div className="progress" style={{ marginTop: 10 }}>
                  <div className="progress-fill" style={{ width: `${k.val * 100}%`, background: k.color }} />
                </div>
                <div className="stat-sub" style={{ marginTop: 6 }}>{k.val >= .99 ? '✓ Target met' : `Target: 99%`}</div>
              </div>
            ))}
          </div>

          {/* ── Secondary metrics ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'True Positives',  val: m.confusion_matrix.tp, color: 'var(--accent)' },
              { label: 'True Negatives',  val: m.confusion_matrix.tn, color: 'var(--green)'  },
              { label: 'False Positives', val: m.confusion_matrix.fp, color: 'var(--amber)'  },
              { label: 'False Negatives', val: m.confusion_matrix.fn, color: 'var(--red)'    },
            ].map(c => (
              <div key={c.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: c.color, fontFamily: 'var(--mono)' }}>
                  {c.val?.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Evaluation Charts</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {CHART_TABS.map(t => (
                <button key={t.key}
                  className={`btn btn-sm ${activeChart === t.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveChart(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
            {ch[activeChart] ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={`data:image/png;base64,${ch[activeChart]}`}
                  alt={activeChart}
                  style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </div>
            ) : (
              <div className="empty">
                <div className="empty-icon">📊</div>
                <div>Chart not available</div>
              </div>
            )}
          </div>

          {/* ── Flagged transactions table ── */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 4 }}>Flagged Transactions</div>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16 }}>
              Showing up to 50 of {data.total_flagged?.toLocaleString()} flagged transactions
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Fraud Probability</th>
                    <th>Actual Label</th>
                    <th>Risk Level</th>
                    <th>SHAP</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.flagged_transactions || []).map(tx => {
                    const prob = tx.fraud_probability;
                    const risk = prob >= .9 ? 'Critical' : prob >= .75 ? 'High' : 'Medium';
                    const riskBadge = prob >= .9 ? 'red' : prob >= .75 ? 'amber' : 'blue';
                    return (
                      <tr key={tx.id}>
                        <td><code>#{tx.id}</code></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="progress" style={{ width: 80 }}>
                              <div className="progress-fill" style={{
                                width: `${prob * 100}%`,
                                background: prob >= .9 ? 'var(--red)' : prob >= .75 ? 'var(--amber)' : 'var(--accent)',
                              }} />
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{(prob * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${tx.actual_label === 1 ? 'red' : 'green'}`}>
                            {tx.actual_label === 1 ? 'Fraud' : 'Normal'}
                          </span>
                        </td>
                        <td><span className={`badge badge-${riskBadge}`}>{risk}</span></td>
                        <td>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => setShowShap(showShap === tx.id ? null : tx.id)}>
                            {showShap === tx.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SHAP detail panel ── */}
          {showShap !== null && (
            <div className="overlay" onClick={() => setShowShap(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
                <div className="modal-head">
                  <h2>SHAP Explanation — Transaction #{showShap}</h2>
                  <button className="modal-close" onClick={() => setShowShap(null)}>×</button>
                </div>
                <div className="modal-body">
                  {(() => {
                    const tx = data.flagged_transactions.find(t => t.id === showShap);
                    if (!tx) return null;
                    const shap = tx.shap_explanation;
                    return (
                      <>
                        <div className="alert alert-warn" style={{ marginBottom: 16 }}>
                          Fraud probability: <strong style={{ fontFamily: 'var(--mono)' }}>{(tx.fraud_probability * 100).toFixed(2)}%</strong>
                        </div>
                        {tx.explanation_text && (
                          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
                            {tx.explanation_text}
                          </p>
                        )}
                        {shap?.top_features && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 4 }}>
                              Top contributing features
                            </div>
                            {shap.top_features.slice(0, 8).map((f, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                                <div style={{ flex: 1, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{f.feature}</div>
                                <div style={{ width: 100 }}>
                                  <div className="progress">
                                    <div className="progress-fill" style={{
                                      width: `${Math.min(Math.abs(f.shap_value) * 200, 100)}%`,
                                      background: f.shap_value > 0 ? 'var(--red)' : 'var(--green)',
                                    }} />
                                  </div>
                                </div>
                                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', width: 60, textAlign: 'right', color: f.shap_value > 0 ? 'var(--red)' : 'var(--green)' }}>
                                  {f.shap_value > 0 ? '+' : ''}{f.shap_value?.toFixed(4)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}