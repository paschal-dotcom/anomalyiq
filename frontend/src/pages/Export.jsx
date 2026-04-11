// src/pages/Export.jsx
import React from 'react';
import { Download, FileText, AlertOctagon } from 'lucide-react';
import { Button, Card, SectionHeader, DatasetTypeBadge } from '../components/UI';
import { exportCSV } from '../utils/api';

export default function Export({ results, datasetType }) {
  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="text-6xl mb-4">📁</div>
        <h2 className="font-display text-xl font-bold text-slate-700 mb-2">No Results to Export</h2>
        <p className="text-slate-400">Run the pipeline first to generate downloadable reports.</p>
      </div>
    );
  }

  const m = results.metrics || {};

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-800">Export Report</h1>
        <p className="text-slate-500 mt-1">
          Download results for compliance reporting and external analysis.
        </p>
        {datasetType && <div className="mt-2"><DatasetTypeBadge type={datasetType} /></div>}
      </div>

      {/* Summary */}
      <Card>
        <SectionHeader title="Report Summary" icon="📋" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label:'Total Processed', value: results.total_records?.toLocaleString(),  color:'text-teal-600'  },
            { label:'Flagged',         value: results.flagged_count?.toLocaleString(),   color:'text-red-500'   },
            { label:'Precision',       value: ((m.precision||0)*100).toFixed(2)+'%',     color:'text-violet-600'},
            { label:'AUC-ROC',         value: ((m.auc_roc||0)*100).toFixed(2)+'%',       color:'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Model Metrics</div>
            {[
              ['Precision', ((m.precision||0)*100).toFixed(4)+'%'],
              ['Recall',    ((m.recall||0)*100).toFixed(4)+'%'],
              ['F1-Score',  ((m.f1_score||0)*100).toFixed(4)+'%'],
              ['AUC-ROC',   ((m.auc_roc||0)*100).toFixed(4)+'%'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-200 last:border-0">
                <span className="text-sm text-slate-500">{k}</span>
                <span className="text-sm font-mono font-bold text-teal-600">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Confusion Matrix</div>
            {[
              ['True Positives',  m.true_positives?.toLocaleString(),  'text-green-600'],
              ['True Negatives',  m.true_negatives?.toLocaleString(),  'text-teal-600' ],
              ['False Positives', m.false_positives?.toLocaleString(), 'text-amber-600'],
              ['False Negatives', m.false_negatives?.toLocaleString(), 'text-red-500'  ],
            ].map(([k,v,c]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-200 last:border-0">
                <span className="text-sm text-slate-500">{k}</span>
                <span className={`text-sm font-mono font-bold ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Download buttons */}
      <Card>
        <SectionHeader title="Download Files" icon="⬇️" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border-2 border-teal-200 rounded-2xl p-6 bg-teal-50/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-teal-600" />
              </div>
              <div>
                <div className="font-display font-bold text-slate-800">Full Results CSV</div>
                <div className="text-xs text-slate-400">All {results.total_records?.toLocaleString()} transactions</div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Complete results with AE error, IF score, LightGBM probability,
              combined score, and risk level for every transaction.
            </p>
            <Button onClick={() => exportCSV(datasetType, false)} className="w-full justify-center">
              <Download size={16} /> Download Full CSV
            </Button>
          </div>

          <div className="border-2 border-red-200 rounded-2xl p-6 bg-red-50/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertOctagon size={20} className="text-red-500" />
              </div>
              <div>
                <div className="font-display font-bold text-slate-800">Flagged Transactions</div>
                <div className="text-xs text-slate-400">{results.flagged_count?.toLocaleString()} anomalous records</div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Only the flagged anomalous transactions — ready for immediate
              use in compliance review and regulatory reporting.
            </p>
            <Button variant="coral" onClick={() => exportCSV(datasetType, true)} className="w-full justify-center">
              <Download size={16} /> Download Flagged Only
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
