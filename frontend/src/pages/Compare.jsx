// src/pages/Compare.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, SectionHeader } from '../components/UI';

export default function Compare({ results }) {
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="font-display text-xl font-bold text-slate-700 mb-2">No Data Yet</h2>
        <p className="text-slate-400">Run the pipeline first to compare model stages.</p>
      </div>
    );
  }

  const models = ['Autoencoder', 'Isolation Forest', 'Three-Stage Hybrid'];
  const mAe = results.metrics_ae || {};
  const mIf = results.metrics_if || {};
  const mHy = results.metrics   || {};

  const chartData = [
    { metric: 'Precision', ae: +(mAe.precision||0).toFixed(3), if: +(mIf.precision||0).toFixed(3), hybrid: +(mHy.precision||0).toFixed(3) },
    { metric: 'Recall',    ae: +(mAe.recall||0).toFixed(3),    if: +(mIf.recall||0).toFixed(3),    hybrid: +(mHy.recall||0).toFixed(3)    },
    { metric: 'F1-Score',  ae: +(mAe.f1_score||0).toFixed(3),  if: +(mIf.f1_score||0).toFixed(3),  hybrid: +(mHy.f1_score||0).toFixed(3)  },
    { metric: 'AUC-ROC',   ae: +(mAe.auc_roc||0).toFixed(3),   if: +(mIf.auc_roc||0).toFixed(3),   hybrid: +(mHy.auc_roc||0).toFixed(3)   },
  ];

  const tableRows = [
    { name: '🧠 Autoencoder (Standalone)',            ...mAe },
    { name: '🌲 Isolation Forest (Standalone)',        ...mIf },
    { name: '⚡ Three-Stage Hybrid (AE + IF + LGBM)', ...mHy },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-800">Model Comparison</h1>
        <p className="text-slate-500 mt-1">
          Performance of each model stage versus the full three-stage hybrid.
        </p>
      </div>

      <Card>
        <SectionHeader title="Side-by-Side Performance Chart" icon="📈" />
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis domain={[0, 1.1]} tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => (v*100).toFixed(0)+'%'} />
            <Tooltip contentStyle={{ borderRadius:'12px', border:'1px solid #E2EBF0', fontSize:'12px' }}
                     formatter={(v) => (v*100).toFixed(2)+'%'} />
            <Legend />
            <Bar dataKey="ae"     name="Autoencoder"         fill="#38B2F4" radius={[4,4,0,0]} />
            <Bar dataKey="if"     name="Isolation Forest"    fill="#F7B731" radius={[4,4,0,0]} />
            <Bar dataKey="hybrid" name="Three-Stage Hybrid"  fill="#0ABFBC" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="p-6 border-b border-slate-100">
          <SectionHeader title="Metrics Table" icon="📋" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Model','Precision','Recall','F1-Score','AUC-ROC','TP','FP'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wide text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={i} className={`border-b border-slate-100 ${i === 2 ? 'bg-teal-50 font-semibold' : ''}`}>
                  <td className="px-5 py-4 font-medium text-slate-700 whitespace-nowrap">{r.name}</td>
                  <td className="px-5 py-4 font-mono text-teal-600">{((r.precision||0)*100).toFixed(2)}%</td>
                  <td className="px-5 py-4 font-mono text-pink-600">{((r.recall||0)*100).toFixed(2)}%</td>
                  <td className="px-5 py-4 font-mono text-amber-600">{((r.f1_score||0)*100).toFixed(2)}%</td>
                  <td className="px-5 py-4 font-mono text-violet-600">{((r.auc_roc||0)*100).toFixed(2)}%</td>
                  <td className="px-5 py-4 font-mono text-green-600">{(r.true_positives||0).toLocaleString()}</td>
                  <td className="px-5 py-4 font-mono text-red-500">{(r.false_positives||0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-teal-50 border-t border-teal-100 text-xs text-teal-700">
          💡 The Three-Stage Hybrid delivers the strongest performance across all metrics by adding
          a supervised LightGBM layer trained on SMOTE-balanced data on top of the two unsupervised stages.
        </div>
      </Card>
    </div>
  );
}
