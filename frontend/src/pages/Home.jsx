// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/UI';
import { ArrowRight, Brain, TreePine, Zap, Shield, BarChart3, Eye } from 'lucide-react';

const metrics = [
  { label: 'Precision',  value: '99.79%', color: 'from-teal-400 to-teal-600',   bg: 'bg-teal-50',   text: 'text-teal-600'   },
  { label: 'Recall',     value: '96.95%', color: 'from-pink-400 to-rose-500',   bg: 'bg-pink-50',   text: 'text-pink-600'   },
  { label: 'F1-Score',   value: '98.35%', color: 'from-amber-400 to-orange-500',bg: 'bg-amber-50',  text: 'text-amber-600'  },
  { label: 'AUC-ROC',   value: '99.98%', color: 'from-violet-400 to-purple-600',bg: 'bg-violet-50', text: 'text-violet-600' },
];

const features = [
  { icon: Brain,    title: 'Deep Learning',     color: 'text-teal-500',   bg: 'bg-teal-50',   desc: 'Autoencoder trained on normal transactions detects anomalies via reconstruction error — no fraud labels needed.' },
  { icon: TreePine, title: 'Isolation Forest',  color: 'text-sky-500',    bg: 'bg-sky-50',    desc: 'Random partitioning algorithm independently isolates outliers with no distribution assumptions required.' },
  { icon: Zap,      title: 'LightGBM + SMOTE',  color: 'text-coral',      bg: 'bg-pink-50',   desc: 'Supervised gradient boosting trained on SMOTE-balanced data. Learns exactly what fraud looks like.' },
  { icon: Shield,   title: 'Risk Scoring',      color: 'text-amber-500',  bg: 'bg-amber-50',  desc: 'Every flagged transaction gets a Low, Medium, or High risk level for compliance prioritisation.' },
  { icon: BarChart3,title: 'Feature Importance',color: 'text-violet-500', bg: 'bg-violet-50', desc: 'LightGBM explains which transaction attributes drove each detection — partial explainability built in.' },
  { icon: Eye,      title: 'Live Scoring',      color: 'text-green-500',  bg: 'bg-green-50',  desc: 'Score any individual transaction instantly across all three stages with a clear risk recommendation.' },
];

const datasets = [
  { icon: '💳', name: 'Credit Card (MLG-ULB)',   records: '284,807', fraud: '0.172%', source: 'Kaggle', tag: 'creditcard' },
  { icon: '📱', name: 'PaySim (African Mobile)', records: '6.3M+',   fraud: '0.13%',  source: 'Kaggle', tag: 'paysim'     },
];

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #E0F7F7 0%, #EEF2FF 40%, #FFF1F5 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-30"
             style={{ background: 'radial-gradient(circle, #0ABFBC44, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 px-10 py-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-white/80 border border-teal-200 text-teal-700
                          text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Three-Stage Hybrid AI · v2.0
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight text-slate-800 mb-4 max-w-xl">
            Catch Financial Fraud{' '}
            <span style={{ background: 'linear-gradient(135deg, #0ABFBC, #FC5C7D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Before It Happens
            </span>
          </h1>
          <p className="text-slate-500 text-lg max-w-lg leading-relaxed mb-8">
            AnomalyIQ uses a three-stage hybrid model trained on two financial datasets —
            credit card transactions and African mobile money — to flag suspicious activity
            with near-perfect precision.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button onClick={() => nav('/upload')} size="lg">
              Get Started <ArrowRight size={18} />
            </Button>
            <Button onClick={() => nav('/results')} variant="outline" size="lg">
              View Demo Results
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label}
               className={`${m.bg} rounded-2xl p-5 border border-white shadow-sm text-center`}>
            <div className={`font-display text-3xl font-bold ${m.text} mb-1`}>{m.value}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-6">
          Everything a Compliance Team Needs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <Card key={f.title} className="hover:-translate-y-1 transition-transform duration-200 cursor-default">
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon size={22} className={f.color} strokeWidth={2} />
              </div>
              <h3 className="font-display font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Datasets */}
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 mb-2">
          Trained on Two Financial Datasets
        </h2>
        <p className="text-slate-500 mb-6">
          The system supports automatic detection of both dataset formats. Upload either one and the correct model is used.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {datasets.map(d => (
            <Card key={d.tag} className="border-2 hover:border-teal-200 transition-colors duration-200">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{d.icon}</span>
                <div>
                  <div className="font-display font-bold text-slate-800">{d.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Source: {d.source}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="font-mono font-bold text-teal-600">{d.records}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Records</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="font-mono font-bold text-pink-600">{d.fraud}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Fraud Rate</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <Card>
        <h2 className="font-display text-xl font-bold text-slate-800 mb-6">
          How the Three-Stage Pipeline Works
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { n:'01', t:'Data Ingestion',  d:'CSV upload + validation', c:'bg-teal-100 text-teal-700' },
            { n:'02', t:'Autoencoder',     d:'Reconstruction error',    c:'bg-sky-100 text-sky-700' },
            { n:'03', t:'Isolation Forest',d:'Outlier isolation score', c:'bg-pink-100 text-pink-700' },
            { n:'04', t:'LightGBM',        d:'Fraud probability',       c:'bg-amber-100 text-amber-700' },
            { n:'05', t:'Risk Score',      d:'Low / Medium / High',     c:'bg-violet-100 text-violet-700' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div className={`flex-1 min-w-28 ${s.c} rounded-xl p-3 text-center`}>
                <div className="font-mono text-xs font-bold opacity-60 mb-1">{s.n}</div>
                <div className="font-bold text-sm">{s.t}</div>
                <div className="text-xs opacity-70 mt-0.5">{s.d}</div>
              </div>
              {i < arr.length - 1 && (
                <span className="text-slate-300 text-xl font-light">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}
