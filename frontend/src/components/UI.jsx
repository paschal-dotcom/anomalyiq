// src/components/UI.jsx
import React from 'react';

export const MetricCard = ({ label, value, color = 'teal', delta, icon }) => {
  const colors = {
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-600',   bar: 'from-teal-400 to-teal-500' },
    coral:  { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-600',   bar: 'from-pink-400 to-rose-500' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-600',  bar: 'from-amber-400 to-orange-500' },
    violet: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', bar: 'from-purple-400 to-violet-500' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600',  bar: 'from-green-400 to-emerald-500' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    bar: 'from-red-400 to-rose-500' },
  };
  const c = colors[color] || colors.teal;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-6 relative overflow-hidden hover:-translate-y-1 transition-transform duration-200`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.bar} rounded-t-2xl`} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`font-display text-3xl font-bold ${c.text}`}>{value}</div>
      {delta && (
        <div className="mt-2 text-xs font-semibold text-green-500 bg-green-50 inline-block px-2 py-0.5 rounded-full">
          {delta}
        </div>
      )}
    </div>
  );
};

export const RiskBadge = ({ level }) => {
  const map = {
    High:   'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low:    'bg-blue-100 text-blue-700 border-blue-200',
    Normal: 'bg-teal-100 text-teal-700 border-teal-200',
  };
  return (
    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border ${map[level] || map.Normal}`}>
      {level}
    </span>
  );
};

export const SectionHeader = ({ title, icon }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-1 h-6 bg-gradient-to-b from-teal-400 to-teal-600 rounded-full" />
    <h2 className="font-display text-lg font-bold text-slate-800">
      {icon && <span className="mr-2">{icon}</span>}{title}
    </h2>
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', type = 'button' }) => {
  const base = 'inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer border-0 outline-none';
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' };
  const variants = {
    primary: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-200',
    coral:   'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200 hover:-translate-y-0.5',
    outline: 'bg-white text-slate-700 border border-slate-200 hover:border-teal-400 hover:text-teal-600',
    ghost:   'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
    {children}
  </div>
);

export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${s} border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin`} />
  );
};

export const ProgressBar = ({ percent, label }) => (
  <div>
    {label && <div className="flex justify-between text-xs text-slate-500 mb-1.5">
      <span>{label}</span><span>{percent}%</span>
    </div>}
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  </div>
);

export const DatasetTypeBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
    ${type === 'creditcard'
      ? 'bg-violet-50 text-violet-700 border-violet-200'
      : 'bg-teal-50 text-teal-700 border-teal-200'}`}
  >
    {type === 'creditcard' ? '💳' : '📱'} {type === 'creditcard' ? 'Credit Card' : 'PaySim (African)'}
  </span>
);
