// src/pages/Results.jsx
import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { MetricCard, SectionHeader, Card, RiskBadge, DatasetTypeBadge } from '../components/UI';

const TABS = ['Metrics','Training Loss','Risk Distribution','Feature Importance','Flagged Transactions'];
const RISK_COLORS = { High:'#EF4444', Medium:'#F59E0B', Low:'#3B82F6', Normal:'#0ABFBC' };

export default function Results({ results, datasetType }) {
  const [tab, setTab] = useState('Metrics');
  const [riskFilter, setRiskFilter] = useState(['High','Medium','Low']);

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="font-display text-xl font-bold text-slate-700 mb-2">No Results Yet</h2>
        <p className="text-slate-400">Run the detection pipeline first to see results here.</p>
      </div>
    );
  }

  const m = results.metrics;
  const lossData = results.loss_history?.train?.map((v, i) => ({
    epoch: i + 1,
    training: +v.toFixed(5),
    validation: +(results.loss_history.val[i] || 0).toFixed(5),
  })) || [];

  const riskData = Object.entries(results.risk_distribution || {}).map(([name, value]) => ({
    name, value, fill: RISK_COLORS[name] || '#94A3B8',
  }));

  const featData = (results.feature_importance || []).slice(0, 12);

  const flagged = (results.results || [])
    .filter(r => r.is_anomaly === 1)
    .filter(r => riskFilter.includes(r.risk_level));

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-800">Results and Evaluation</h1>
          <p className="text-slate-500 mt-1">
            Three-stage hybrid model performance on {results.total_records?.toLocaleString()} records
          </p>
        </div>
        {datasetType && <DatasetTypeBadge type={datasetType} />}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                    ${tab === t
                      ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Metrics tab */}
      {tab === 'Metrics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Precision"       value={`${(m.precision*100).toFixed(2)}%`}  color="teal"   icon="🎯" />
            <MetricCard label="Recall"          value={`${(m.recall*100).toFixed(2)}%`}      color="coral"  icon="🔍" />
            <MetricCard label="F1-Score"        value={`${(m.f1_score*100).toFixed(2)}%`}    color="amber"  icon="⚖️" />
            <MetricCard label="AUC-ROC"         value={`${(m.auc_roc*100).toFixed(2)}%`}     color="violet" icon="📈" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="True Positives"  value={m.true_positives?.toLocaleString()}   color="green"  icon="✅" />
            <MetricCard label="True Negatives"  value={m.true_negatives?.toLocaleString()}   color="teal"   icon="✓" />
            <MetricCard label="False Positives" value={m.false_positives?.toLocaleString()}  color="amber"  icon="⚠️" />
            <MetricCard label="False Negatives" value={m.false_negatives?.toLocaleString()}  color="red"    icon="❌" />
          </div>
          <Card>
            <SectionHeader title="Detection Summary" icon="🏆" />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                <div className="text-xs text-teal-600 font-bold uppercase tracking-wide mb-1">Total Processed</div>
                <div className="font-display text-3xl font-bold text-teal-700">{results.total_records?.toLocaleString()}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <div className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Flagged Anomalies</div>
                <div className="font-display text-3xl font-bold text-red-600">{results.flagged_count?.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Training Loss tab */}
      {tab === 'Training Loss' && (
        <Card>
          <SectionHeader title="Autoencoder Training & Validation Loss" icon="📉" />
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={lossData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#94A3B8' }} label={{ value: 'Epoch', position: 'insideBottom', offset: -2, fill:'#94A3B8', fontSize:11 }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius:'12px', border:'1px solid #E2EBF0', fontSize:'12px' }} />
              <Legend />
              <Line type="monotone" dataKey="training"   stroke="#0ABFBC" strokeWidth={2.5} dot={false} name="Training Loss" />
              <Line type="monotone" dataKey="validation" stroke="#FC5C7D" strokeWidth={2.5} dot={false} strokeDasharray="5 5" name="Validation Loss" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Convergence confirms the Autoencoder successfully learned normal transaction patterns.
          </p>
        </Card>
      )}

      {/* Risk Distribution tab */}
      {tab === 'Risk Distribution' && (
        <Card>
          <SectionHeader title="Risk Level Distribution" icon="🎯" />
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius:'12px', border:'1px solid #E2EBF0', fontSize:'12px' }}
                       formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="value" radius={[6,6,0,0]} name="Transactions">
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Feature Importance tab */}
      {tab === 'Feature Importance' && (
        <Card>
          <SectionHeader title="LightGBM Feature Importance (Top 12)" icon="🔬" />
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={featData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: '#64748B' }} width={80} />
              <Tooltip contentStyle={{ borderRadius:'12px', border:'1px solid #E2EBF0', fontSize:'12px' }} />
              <Bar dataKey="importance" fill="#0ABFBC" radius={[0,4,4,0]} name="Importance" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Shows which transaction attributes most influenced the LightGBM fraud classification.
          </p>
        </Card>
      )}

      {/* Flagged Transactions tab */}
      {tab === 'Flagged Transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-slate-500">
              <span className="font-bold text-red-500 text-lg">{flagged.length.toLocaleString()}</span> transactions flagged
            </div>
            <div className="flex gap-2">
              {['High','Medium','Low'].map(r => (
                <button key={r}
                        onClick={() => setRiskFilter(f => f.includes(r) ? f.filter(x=>x!==r) : [...f,r])}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                          ${riskFilter.includes(r)
                            ? r==='High'   ? 'bg-red-100 text-red-700 border-red-200'
                            : r==='Medium' ? 'bg-amber-100 text-amber-700 border-amber-200'
                            :                'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-white text-slate-400 border-slate-200'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Txn ID','AE Error','IF Score','LGBM Prob','Combined','Risk','True Label'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flagged.slice(0, 100).map((row, i) => (
                    <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors
                                            ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                      <td className="px-4 py-3 font-mono text-slate-600">{row.transaction_id || i+1}</td>
                      <td className="px-4 py-3 font-mono">{Number(row.reconstruction_error).toFixed(4)}</td>
                      <td className="px-4 py-3 font-mono">{Number(row.isolation_score).toFixed(4)}</td>
                      <td className="px-4 py-3 font-mono text-violet-600 font-bold">{Number(row.lgbm_fraud_probability).toFixed(4)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{Number(row.combined_anomaly_score).toFixed(4)}</td>
                      <td className="px-4 py-3"><RiskBadge level={row.risk_level} /></td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${row.true_label === 1 ? 'text-red-500' : 'text-green-500'}`}>
                          {row.true_label === 1 ? '🚨 Fraud' : '✅ Normal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {flagged.length > 100 && (
              <div className="p-4 text-center text-sm text-slate-400 border-t border-slate-100">
                Showing 100 of {flagged.length.toLocaleString()} flagged transactions.
                Download full results from Export page.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
