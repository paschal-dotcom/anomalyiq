import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/dashboard',      icon: '⬡', label: 'Dashboard'       },
  { to: '/upload',         icon: '⬆', label: 'Upload & Analyze' },
  { to: '/results',        icon: '◈', label: 'Results'          },
  { to: '/users',          icon: '◉', label: 'Users'            },
  { to: '/live-scoring',   icon: '◎', label: 'Live Scoring'     },
  { to: '/activity-logs',  icon: '≡', label: 'Activity Logs'    },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const role      = user.role || '';
  const isAdmin   = role === 'admin';
  // const isAnalyst = role === 'data_analyst';
  const isComply  = role === 'compliance_officer';

  // Filter nav by role
  const visible = NAV.filter(n => {
    if (n.to === '/users' && !isAdmin) return false;
    if (n.to === '/upload' && isComply) return false;
    return true;
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">A</div>
        <div className="brand-name">AnomalyIQ</div>
        <div className="brand-sub">Fraud Detection System</div>
      </div>

      {visible.map(n => (
        <NavLink key={n.to} to={n.to} className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
          <span className="nav-icon">{n.icon}</span>
          {n.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
          <div style={{ color: 'var(--text)', fontWeight: 600 }}>{user.full_name || 'User'}</div>
          <div style={{ marginTop: 2 }}>
            <span className={`badge badge-${role === 'admin' ? 'purple' : role === 'compliance_officer' ? 'teal' : 'amber'}`} style={{ fontSize: 10 }}>
              {role === 'admin' ? 'Admin' : role === 'compliance_officer' ? 'Compliance' : 'Analyst'}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
          Sign out
        </button>
        <div className="status-dot" style={{ marginTop: 12 }}>
          <div className="dot" />
          System Online
        </div>
      </div>
    </aside>
  );
}