// src/pages/Explain.jsx
import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Button, Card, SectionHeader, Spinner, DatasetTypeBadge } from '../components/UI';
import { scoreTransaction } from '../utils/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CC_FIELDS = [
  { key: 'Amount', label: 'Amount',     placeholder: '1500.00' },
  { key: 'Time',   label: 'Time (sec)', placeholder: '50000'   },
  { key: 'V1',     label: 'V1',         placeholder: '-1.36'   },
  { key: 'V2',     label: 'V2',         placeholder: '-0.07'   },
  { key: 'V3',     label: 'V3',         placeholder: '2.53'    },
  { key: 'V4',     label: 'V4',         placeholder: '1.38'    },
  { key: 'V14',    label: 'V14',        placeholder: '-0.31'   },
  { key: 'V17',    label: 'V17',        placeholder: '0.40'    },
];

const PS_FIELDS = [
  { key: 'amount',         label: 'Amount',            placeholder: '100000' },
  { key: 'step',           label: 'Step',              placeholder: '1'      },
  { key: 'oldbalanceOrg',  label: 'Old Balance (Org)', placeholder: '180000' },
  { key: 'newbalanceOrig', label: 'New Balance (Org)', placeholder: '0'      },
  { key: 'oldbalanceDest', label: 'Old Balance (Dst)', placeholder: '0'      },
  { key: 'newbalanceDest', label: 'New Balance (Dst)', placeholder: '100000' },
];

const RISK_STYLES = {
  High:   { bg: 'bg-red-50',   border: 'border-red-300',   text: 'text-red-700',   emoji: '🔴' },
  Medium: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', emoji: '🟡' },
  Low:    { bg: 'bg-blue-50',  border: 'border-blue-300',  text: 'text-blue-700',  emoji: '🔵' },
  Normal: { bg: 'bg-teal-50',  border: 'border-teal-300',  text: 'text-teal-700',  emoji: '🟢' },
};

export default function Explain({ results, datasetType = 'creditcard' }) {
  const fields  = datasetType === 'paysim' ? PS_FIELDS : CC_FIELDS;
  const [vals,    setVals]    = useState({});
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState('transaction');

  // Global SHAP from pipeline results
  const shapGlobal = results?.shap_global || [];

  const handleExplain = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE}/api/explain/transaction`, {
        features:     vals,
        dataset_type: datasetType,
      });
      setResult(res.data);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      toast.error('Explanation failed: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const rs = result ? RISK_STYLES[result.risk_level] || RISK_STYLES.Normal : null;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-800">
          Explainability
        </h1>
        <p className="text-slate-500 mt-1">
          SHAP (SHapley Additive exPlanations) — understand exactly why a
          transaction was flagged and which features drove the decision.
        </p>
        {datasetType && <div className="mt-2"><DatasetTypeBadge type={datasetType} /></div>}
      </div>

      {/* What is SHAP info box */}
      <div className="bg-gradient-to-r from-violet-50 to-teal-50 border border-violet-200
                      rounded-2xl p-5 flex gap-4">
        <div className="text-3xl flex-shrink-0">🔬</div>
        <div>
          <div className="font-display font-bold text-slate-800 mb-1">
            What is SHAP Explainability?
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            SHAP values explain the contribution of each transaction attribute to the
            fraud probability score. A positive SHAP value means the feature
            <span className="font-bold text-red-600"> increases</span> fraud risk.
            A negative value means it
            <span className="font-bold text-teal-600"> decreases</span> risk.
            This is critical for regulatory compliance — it shows exactly why the
            system flagged a transaction, not just that it was flagged.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button onClick={() => setTab('transaction')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                  ${tab === 'transaction'
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'}`}>
          ⚡ Explain Single Transaction
        </button>
        <button onClick={() => setTab('global')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                  ${tab === 'global'
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'}`}>
          📊 Global Feature Impact
        </button>
      </div>

      {/* Transaction Explanation tab */}
      {tab === 'transaction' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <SectionHeader title="Transaction Attributes" icon="📝" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-slate-500
                                    uppercase tracking-wide mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    placeholder={f.placeholder}
                    value={vals[f.key] || ''}
                    onChange={e => setVals(p => ({...p, [f.key]: e.target.value}))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5
                               text-sm font-mono focus:outline-none focus:border-teal-400
                               focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleExplain} disabled={loading}
                    size="lg" className="w-full justify-center">
              {loading
                ? <><Spinner size="sm" /> Explaining...</>
                : <>🔬 Explain This Transaction</>}
            </Button>
          </Card>

          {/* Result */}
          <div className="space-y-4">
            {!result && !loading && (
              <Card className="h-64 flex flex-col items-center justify-center
                               text-center border-dashed">
                <div className="text-5xl mb-4">🔬</div>
                <p className="font-display font-bold text-slate-700 mb-2">
                  Ready to Explain
                </p>
                <p className="text-sm text-slate-400">
                  Enter a transaction and click Explain to see which features
                  drove the fraud detection decision.
                </p>
              </Card>
            )}

            {loading && (
              <Card className="h-64 flex flex-col items-center justify-center text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-slate-500 font-medium">
                  Computing SHAP values...
                </p>
              </Card>
            )}

            {result && rs && (
              <>
                {/* Risk result */}
                <div className={`${rs.bg} border-2 ${rs.border} rounded-2xl p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{rs.emoji}</span>
                    <div>
                      <div className={`font-display text-xl font-bold ${rs.text}`}>
                        {result.risk_level} Risk
                      </div>
                      <div className="text-sm text-slate-500">
                        Combined Score: <span className="font-mono font-bold">
                          {result.combined_score}
                        </span>
                      </div>
                    </div>
                  </div>
                  {result.explanation_summary && (
                    <p className={`text-sm ${rs.text} leading-relaxed`}>
                      {result.explanation_summary}
                    </p>
                  )}
                </div>

                {/* Three stage scores */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label:'Autoencoder',      val: result.ae_error,         color:'text-teal-600'  },
                    { label:'Isolation Forest', val: result.isolation_score,  color:'text-sky-600'   },
                    { label:'LightGBM',         val: result.lgbm_probability, color:'text-violet-600'},
                  ].map(s => (
                    <Card key={s.label} className="text-center p-4">
                      <div className={`font-mono text-lg font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                    </Card>
                  ))}
                </div>

                {/* SHAP contributions */}
                {result.shap_contributions && result.shap_contributions.length > 0 && (
                  <Card>
                    <SectionHeader title="SHAP Feature Contributions" icon="📊" />
                    <p className="text-xs text-slate-400 mb-4">
                      Red bars increase fraud risk. Teal bars decrease fraud risk.
                    </p>
                    <div className="space-y-2">
                      {result.shap_contributions.map((c, i) => {
                        const isRisk = c.direction === 'increases_risk';
                        const pct    = Math.min(
                          Math.abs(c.shap_value) * 500, 100
                        );
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-32 text-xs font-mono text-slate-600
                                            truncate flex-shrink-0 text-right">
                              {c.feature}
                            </div>
                            <div className="flex-1 h-6 bg-slate-100 rounded-full
                                            overflow-hidden relative">
                              <div
                                className={`h-full rounded-full transition-all duration-500
                                  ${isRisk
                                    ? 'bg-gradient-to-r from-red-400 to-rose-500'
                                    : 'bg-gradient-to-r from-teal-400 to-teal-500'}`}
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                            <div className={`text-xs font-mono font-bold w-16
                                            flex-shrink-0 text-right
                                            ${isRisk ? 'text-red-600' : 'text-teal-600'}`}>
                              {isRisk ? '+' : ''}{c.shap_value.toFixed(4)}
                            </div>
                            <div className={`text-xs flex-shrink-0 px-2 py-0.5
                                            rounded-full font-bold
                                            ${isRisk
                                              ? 'bg-red-100 text-red-600'
                                              : 'bg-teal-100 text-teal-600'}`}>
                              {isRisk ? '↑ Risk' : '↓ Risk'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* No SHAP fallback */}
                {(!result.shap_contributions || result.shap_contributions.length === 0) && (
                  <Card className="border-amber-200 bg-amber-50">
                    <div className="flex gap-3 items-start">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <div className="font-bold text-amber-700 text-sm mb-1">
                          SHAP Library Not Installed
                        </div>
                        <p className="text-xs text-amber-600">
                          To enable per-transaction explanations, install SHAP in your backend:
                        </p>
                        <div className="mt-2 font-mono text-xs bg-amber-100 p-2 rounded-lg
                                        text-amber-800 border border-amber-200">
                          pip install shap
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          The system works without SHAP — explainability is an optional enhancement.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Global SHAP tab */}
      {tab === 'global' && (
        <Card>
          <SectionHeader title="Global SHAP Feature Impact" icon="🌍" />
          <p className="text-sm text-slate-500 mb-6">
            Shows the average contribution of each feature to fraud detection
            across all analysed transactions. Higher values mean more influence
            on the LightGBM fraud classification.
          </p>
          {shapGlobal && shapGlobal.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={shapGlobal} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number"
                         tick={{ fontSize: 11, fill: '#94A3B8' }}
                         tickFormatter={v => v.toFixed(4)} />
                  <YAxis type="category" dataKey="feature"
                         tick={{ fontSize: 11, fill: '#64748B' }} width={100} />
                  <Tooltip
                    contentStyle={{ borderRadius:'12px', border:'1px solid #E2EBF0', fontSize:'12px' }}
                    formatter={(v) => v.toFixed(6)}
                  />
                  <Bar dataKey="shap_importance" radius={[0,4,4,0]}
                       name="SHAP Importance">
                    {shapGlobal.map((_, i) => (
                      <Cell key={i}
                            fill={i < 3
                              ? '#EF4444'
                              : i < 6
                                ? '#F59E0B'
                                : '#0ABFBC'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
                  Top 3 most critical features
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
                  High importance features
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-teal-400 flex-shrink-0" />
                  Supporting features
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📊</div>
              <p className="font-display font-bold text-slate-700 mb-2">
                No Global SHAP Data Yet
              </p>
              <p className="text-sm text-slate-400 mb-4">
                Install SHAP and run the pipeline to generate global explainability.
              </p>
              <div className="inline-block font-mono text-sm bg-slate-100 px-4 py-2
                              rounded-xl border border-slate-200 text-slate-600">
                pip install shap
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
