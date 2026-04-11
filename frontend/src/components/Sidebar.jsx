// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Upload, Cpu, BarChart3, Zap, Download,
  GitCompare, Activity, Microscope
} from 'lucide-react';

const links = [
  { to: '/',        label: 'Home',          icon: Home },
  { to: '/upload',  label: 'Load Data',     icon: Upload },
  { to: '/train',   label: 'Run Detection', icon: Cpu },
  { to: '/results', label: 'Results',       icon: BarChart3 },
  { to: '/compare', label: 'Model Compare', icon: GitCompare },
  { to: '/score',   label: 'Live Scoring',  icon: Zap },
  { to: '/export',  label: 'Export',        icon: Download },
  { to: '/explain', label: 'Explainability', icon: Microscope },
];

const pipelineSteps = [
  { label: 'Data Loaded',      key: 'dataLoaded' },
  { label: 'Preprocessing',    key: 'preprocessing' },
  { label: 'Autoencoder',      key: 'autoencoder' },
  { label: 'Isolation Forest', key: 'isolationForest' },
  { label: 'LightGBM + SMOTE', key: 'lightgbm' },
  { label: 'Results Ready',    key: 'results' },
];

export default function Sidebar({ pipelineStatus = {} }) {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600
                          flex items-center justify-center text-white text-lg shadow-md shadow-teal-200">
            🔍
          </div>
          <div>
            <div className="font-display font-bold text-slate-800 text-lg leading-none">
              AnomalyIQ
            </div>
            <div className="text-xs text-slate-400 mt-0.5">v2.0 · Three-Stage Hybrid</div>
          </div>
        </div>
        {/* Version badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-gradient-to-r from-teal-50 to-violet-50 border border-teal-100">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-semibold text-teal-700">
            AE + IF + LightGBM
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-2">
          Navigation
        </div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium
               transition-all duration-150
               ${isActive
                 ? 'bg-teal-50 text-teal-700 border border-teal-100 shadow-sm'
                 : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}

        {/* Pipeline status */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">
            Pipeline Status
          </div>
          {pipelineSteps.map(({ label, key }) => {
            const done = !!pipelineStatus[key];
            return (
              <div key={key}
                   className="flex items-center gap-2.5 px-3 py-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300
                  ${done
                    ? 'bg-teal-400 shadow-sm shadow-teal-200'
                    : 'bg-slate-200'}`}
                />
                <span className={`text-xs font-medium transition-colors duration-300
                  ${done ? 'text-slate-700' : 'text-slate-400'}`}>
                  {label}
                </span>
                {done && (
                  <span className="ml-auto text-xs text-teal-500 font-bold">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <div className="text-xs text-slate-400 leading-relaxed">
          <div className="font-semibold text-slate-500">Godfrey Okoye University</div>
          <div>Dept. of Computer Science</div>
          <div className="text-teal-500 font-semibold mt-0.5">Final Year Project 2024/25</div>
        </div>
      </div>
    </aside>
  );
}
