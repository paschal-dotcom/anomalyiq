// src/pages/Train.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Cpu, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Button, Card, SectionHeader, ProgressBar, DatasetTypeBadge } from '../components/UI';
import { startTraining, getProgress, getResults } from '../utils/api';

const STAGES = [
  { key: 1, label: 'Loading Dataset',            icon: '📂' },
  { key: 2, label: 'Preprocessing & Engineering',icon: '⚙️' },
  { key: 3, label: 'Training Autoencoder',        icon: '🧠' },
  { key: 4, label: 'Running Isolation Forest',    icon: '🌲' },
  { key: 5, label: 'LightGBM + SMOTE',            icon: '⚡' },
  { key: 6, label: 'Combining Scores',            icon: '🎯' },
  { key: 7, label: 'Saving Models',               icon: '💾' },
  { key: 8, label: 'Complete',                    icon: '✅' },
];

export default function Train({ uploadedDataset, onResultsReady, setPipelineStatus }) {
  const nav = useNavigate();
  const [config, setConfig]   = useState({
    epochs: 50, batch_size: 256,
    w_ae: 0.20, w_if: 0.20, w_lgbm: 0.60,
    threshold_pct: 95, contamination: 0.002,
  });
  const [status,  setStatus]  = useState(null); // null | running | complete | error
  const [prog,    setProg]    = useState({ percent: 0, message: '', stage: 0 });
  const [results, setResults] = useState(null);
  const dtype = uploadedDataset?.dataset_type || 'creditcard';
  const pollRef = useRef(null);

  const handleStart = async () => {
    setStatus('running');
    setResults(null);
    setProg({ percent: 0, message: 'Starting pipeline...', stage: 0 });
    try {
      await startTraining({ ...config, dataset_type: dtype });
      // Poll every 2 seconds
      pollRef.current = setInterval(async () => {
        try {
          const res = await getProgress(dtype);
          const p   = res.data;
          setProg({ percent: p.percent, message: p.message, stage: p.stage });
          if (p.status === 'complete') {
            clearInterval(pollRef.current);
            setStatus('complete');
            const r = await getResults(dtype);
            setResults(r.data);
            onResultsReady && onResultsReady(r.data, dtype);
            setPipelineStatus && setPipelineStatus({
              dataLoaded: true, preprocessing: true, autoencoder: true,
              isolationForest: true, lightgbm: true, results: true,
            });
            toast.success('Pipeline complete! 🎉');
          } else if (p.status === 'error') {
            clearInterval(pollRef.current);
            setStatus('error');
            toast.error('Pipeline error: ' + p.message);
          }
        } catch (e) { /* ignore transient poll errors */ }
      }, 2000);
    } catch (e) {
      setStatus('error');
      toast.error('Failed to start training');
    }
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const wLgbm = Math.max(0, +(1 - config.w_ae - config.w_if).toFixed(2));

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-800">Run Detection Pipeline</h1>
        <p className="text-slate-500 mt-1">
          Configure and launch the three-stage hybrid detection pipeline.
        </p>
        {uploadedDataset && (
          <div className="mt-2">
            <DatasetTypeBadge type={dtype} />
          </div>
        )}
      </div>

      {/* Config */}
      <Card>
        <SectionHeader title="Model Configuration" icon="🔧" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AE config */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-2">
              Autoencoder
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Max Epochs: <span className="font-mono text-teal-600">{config.epochs}</span>
              </label>
              <input type="range" min={10} max={100} step={5} value={config.epochs}
                     onChange={e => setConfig(p => ({...p, epochs: +e.target.value}))}
                     className="w-full accent-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Batch Size
              </label>
              <select value={config.batch_size}
                      onChange={e => setConfig(p => ({...p, batch_size: +e.target.value}))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-teal-400">
                {[64,128,256,512].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* IF config */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-sky-600 mb-2">
              Isolation Forest
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Threshold Percentile: <span className="font-mono text-sky-600">{config.threshold_pct}</span>
              </label>
              <input type="range" min={90} max={99} step={1}
                     value={config.threshold_pct}
                     onChange={e => setConfig(p => ({...p, threshold_pct: +e.target.value}))}
                     className="w-full accent-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Contamination
              </label>
              <input type="number" min={0.001} max={0.01} step={0.001}
                     value={config.contamination}
                     onChange={e => setConfig(p => ({...p, contamination: +e.target.value}))}
                     className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal-400" />
            </div>
          </div>

          {/* Score weights */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">
              Score Weights
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                AE Weight: <span className="font-mono text-teal-600">{config.w_ae}</span>
              </label>
              <input type="range" min={0.1} max={0.4} step={0.05}
                     value={config.w_ae}
                     onChange={e => setConfig(p => ({...p, w_ae: +e.target.value}))}
                     className="w-full accent-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                IF Weight: <span className="font-mono text-sky-600">{config.w_if}</span>
              </label>
              <input type="range" min={0.1} max={0.4} step={0.05}
                     value={config.w_if}
                     onChange={e => setConfig(p => ({...p, w_if: +e.target.value}))}
                     className="w-full accent-sky-500" />
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
              <div className="text-xs text-violet-600 font-medium">LightGBM Weight (auto)</div>
              <div className="font-mono text-2xl font-bold text-violet-700 mt-1">{wLgbm}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <Button
            onClick={handleStart}
            disabled={status === 'running'}
            size="lg"
            className="w-full justify-center"
          >
            {status === 'running'
              ? <>⏳ Pipeline Running...</>
              : <><Cpu size={18} /> 🚀 Run Three-Stage Pipeline</>}
          </Button>
        </div>
      </Card>

      {/* Progress */}
      {status && (
        <Card>
          <SectionHeader title="Pipeline Progress" icon="📊" />
          <div className="mb-6">
            <ProgressBar percent={prog.percent} label={prog.message} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STAGES.map(s => {
              const done    = prog.stage > s.key;
              const current = prog.stage === s.key && status === 'running';
              return (
                <div key={s.key}
                     className={`rounded-xl p-3 border text-center transition-all duration-300
                       ${done    ? 'bg-teal-50 border-teal-200'
                       : current ? 'bg-amber-50 border-amber-200 shadow-md'
                       :           'bg-slate-50 border-slate-100 opacity-40'}`}>
                  <div className="text-xl mb-1">
                    {done ? '✅' : current ? '⏳' : s.icon}
                  </div>
                  <div className={`text-xs font-bold
                    ${done ? 'text-teal-700' : current ? 'text-amber-700' : 'text-slate-400'}`}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Results summary */}
      {status === 'complete' && results && (
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50/50 to-white">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={24} className="text-teal-500" />
            <h2 className="font-display text-xl font-bold text-slate-800">
              Pipeline Complete!
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Precision', value: (results.metrics.precision*100).toFixed(2)+'%', color:'text-teal-600'  },
              { label: 'Recall',    value: (results.metrics.recall*100).toFixed(2)+'%',    color:'text-pink-600'  },
              { label: 'F1-Score',  value: (results.metrics.f1_score*100).toFixed(2)+'%',  color:'text-amber-600' },
              { label: 'AUC-ROC',   value: (results.metrics.auc_roc*100).toFixed(2)+'%',   color:'text-violet-600'},
            ].map(m => (
              <div key={m.label} className="bg-white rounded-xl p-4 border border-slate-100 text-center">
                <div className={`font-display text-2xl font-bold ${m.color}`}>{m.value}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => nav('/results')}>View Full Results →</Button>
            <Button variant="outline" onClick={() => nav('/compare')}>Model Comparison</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
