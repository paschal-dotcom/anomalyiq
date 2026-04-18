import React from 'react'; 
import { NavLink } from 'react-router-dom';
import { Home, Upload, Cpu, BarChart3, Zap, Download, GitCompare, Microscope } from 'lucide-react';

var links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/upload', label: 'Load Data', icon: Upload },
  { to: '/train', label: 'Run Detection', icon: Cpu },
  { to: '/results', label: 'Results', icon: BarChart3 },
  { to: '/compare', label: 'Model Compare', icon: GitCompare },
  { to: '/score', label: 'Live Scoring', icon: Zap },
  { to: '/export', label: 'Export', icon: Download },
  { to: '/explain', label: 'Explainability', icon: Microscope },
];

var steps = [
  { label: 'Data Loaded', key: 'dataLoaded' },
  { label: 'Preprocessing', key: 'preprocessing' },
  { label: 'Autoencoder', key: 'autoencoder' },
  { label: 'Isolation Forest', key: 'isolationForest' },
  { label: 'LightGBM + SMOTE', key: 'lightgbm' },
  { label: 'Results Ready', key: 'results' },
];

function getNavClass(isActive) {
  var base = 'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium ';
  return base + (isActive ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'text-slate-600 hover:bg-slate-50');
}

export default function Sidebar(props) {
  var pipelineStatus = props.pipelineStatus || {};
  var user = props.user;
  var onLogout = props.onLogout;
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold">A</div>
          <div>
            <div className="font-bold text-slate-800 text-lg">AnomalyIQ</div>
            <div className="text-xs text-slate-400">v2.0 Three-Stage Hybrid</div>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-teal-700">AE + IF + LightGBM</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">Navigation</div>
        {links.map(function(item) {
          var Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={function(p) { return getNavClass(p.isActive); }}>
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">Pipeline Status</div>
          {steps.map(function(s) {
            var done = !!pipelineStatus[s.key];
            return (
              <div key={s.key} className="flex items-center gap-2.5 px-3 py-1.5">
                <div className={done ? 'w-2 h-2 rounded-full bg-teal-400' : 'w-2 h-2 rounded-full bg-slate-200'}></div>
                <span className={done ? 'text-xs text-slate-700' : 'text-xs text-slate-400'}>{s.label}</span>
                {done && <span className="ml-auto text-xs text-teal-500">Done</span>}
              </div>
            );
          })}
        </div>
      </nav>
      <div className="px-6 py-4 border-t border-slate-100">
        <div className="text-xs text-slate-400">
          <div className="font-semibold text-slate-500">Godfrey Okoye University</div>
          <div>Dept. of Computer Science</div>
          <div className="text-teal-500 font-semibold mt-0.5">Final Year Project 2024/25</div>
        </div>
        {user && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{(user.full_name || 'U').charAt(0)}</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">{user.full_name}</div>
                <div className="text-xs text-slate-400">{user.role}</div>
              </div>
            </div>
            <button onClick={onLogout} className="text-xs text-red-400 hover:text-red-600 py-1 px-2 rounded hover:bg-red-50">Sign Out</button>
          </div>
        )}
      </div>
    </aside>
  );
}
