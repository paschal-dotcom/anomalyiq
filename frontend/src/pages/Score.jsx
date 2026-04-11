// src/pages/Score.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Zap, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button, Card, SectionHeader, Spinner, DatasetTypeBadge } from '../components/UI';
import { scoreTransaction } from '../utils/api';

const RISK_STYLES = {
  High:   { bg: 'bg-red-50',    border: 'border-red-300',   text: 'text-red-700',   icon: '🚨', emoji: '🔴' },
  Medium: { bg: 'bg-amber-50',  border: 'border-amber-300', text: 'text-amber-700', icon: '⚠️', emoji: '🟡' },
  Low:    { bg: 'bg-blue-50',   border: 'border-blue-300',  text: 'text-blue-700',  icon: 'ℹ️', emoji: '🔵' },
  Normal: { bg: 'bg-teal-50',   border: 'border-teal-300',  text: 'text-teal-700',  icon: '✅', emoji: '🟢' },
};

const CC_FIELDS = [
  { key:'Amount', label:'Amount',      placeholder:'1500.00',  type:'number' },
  { key:'Time',   label:'Time (sec)',  placeholder:'50000',    type:'number' },
  { key:'V1',     label:'V1',          placeholder:'-1.36',    type:'number' },
  { key:'V2',     label:'V2',          placeholder:'-0.07',    type:'number' },
  { key:'V3',     label:'V3',          placeholder:'2.53',     type:'number' },
  { key:'V4',     label:'V4',          placeholder:'1.38',     type:'number' },
  { key:'V14',    label:'V14',         placeholder:'-0.31',    type:'number' },
  { key:'V17',    label:'V17',         placeholder:'0.40',     type:'number' },
];

const PS_FIELDS = [
  { key:'amount',          label:'Amount',           placeholder:'100000',  type:'number' },
  { key:'step',            label:'Step (hour)',       placeholder:'1',       type:'number' },
  { key:'oldbalanceOrg',   label:'Old Balance (Org)', placeholder:'180000', type:'number' },
  { key:'newbalanceOrig',  label:'New Balance (Org)', placeholder:'0',      type:'number' },
  { key:'oldbalanceDest',  label:'Old Balance (Dst)', placeholder:'0',      type:'number' },
  { key:'newbalanceDest',  label:'New Balance (Dst)', placeholder:'100000', type:'number' },
];

export default function Score({ datasetType = 'creditcard' }) {
  const fields = datasetType === 'paysim' ? PS_FIELDS : CC_FIELDS;
  const [vals, setVals]     = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScore = async () => {
    setLoading(true);
    try {
      const res = await scoreTransaction({ features: vals, dataset_type: datasetType });
      setResult(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const rs = result ? RISK_STYLES[result.risk_level] || RISK_STYLES.Normal : null;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-800">Live Transaction Scoring</h1>
        <p className="text-slate-500 mt-1">
          Enter a single transaction's attributes to get an instant anomaly score from all three stages.
        </p>
        <div className="mt-2"><DatasetTypeBadge type={datasetType} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <Card>
          <SectionHeader title="Transaction Attributes" icon="📝" />
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={vals[f.key] || ''}
                  onChange={e => setVals(p => ({...p, [f.key]: e.target.value}))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm
                             font-mono focus:outline-none focus:border-teal-400 focus:ring-2
                             focus:ring-teal-100 transition-all"
                />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button onClick={handleScore} disabled={loading} size="lg" className="w-full justify-center">
              {loading
                ? <><Spinner size="sm" /> Analysing...</>
                : <><Zap size={18} /> Analyse This Transaction</>}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Leave unused fields at 0. The model handles missing values gracefully.
          </p>
        </Card>

        {/* Result */}
        <div>
          {!result && !loading && (
            <Card className="h-full flex flex-col items-center justify-center text-center border-dashed">
              <div className="text-5xl mb-4">⚡</div>
              <p className="font-display font-bold text-slate-700 mb-2">Ready to Score</p>
              <p className="text-sm text-slate-400">
                Fill in the transaction attributes and click Analyse.
              </p>
            </Card>
          )}
          {loading && (
            <Card className="h-full flex flex-col items-center justify-center text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-slate-500 font-medium">
                Running three-stage analysis...
              </p>
            </Card>
          )}
          {result && rs && (
            <div className={`${rs.bg} border-2 ${rs.border} rounded-2xl p-8 text-center h-full flex flex-col justify-center`}>
              <div className="text-5xl mb-3">{rs.icon}</div>
              <div className={`font-display text-4xl font-bold ${rs.text} mb-1`}>
                {result.risk_level} Risk
              </div>
              <div className="font-mono text-2xl font-bold text-slate-700 mb-6">
                Score: {result.combined_score}
              </div>

              {/* Three stage scores */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/70 rounded-xl p-3 border border-white">
                  <div className="text-xs text-teal-600 font-bold uppercase tracking-wide mb-1">
                    Autoencoder
                  </div>
                  <div className="font-mono text-lg font-bold text-teal-700">
                    {result.ae_error}
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-white">
                  <div className="text-xs text-sky-600 font-bold uppercase tracking-wide mb-1">
                    Isolation Forest
                  </div>
                  <div className="font-mono text-lg font-bold text-sky-700">
                    {result.isolation_score}
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-white">
                  <div className="text-xs text-violet-600 font-bold uppercase tracking-wide mb-1">
                    LightGBM
                  </div>
                  <div className="font-mono text-lg font-bold text-violet-700">
                    {result.lgbm_probability}
                  </div>
                </div>
              </div>

              <div className={`${rs.bg} border ${rs.border} rounded-xl p-4 text-sm ${rs.text} font-medium`}>
                {result.recommendation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
