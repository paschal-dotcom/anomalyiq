import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/dashboard',     icon: '⬡', label: 'Dashboard'        },
  { to: '/upload',        icon: '⬆', label: 'Upload & Analyze'  },
  { to: '/results',       icon: '◈', label: 'Results'           },
  { to: '/users',         icon: '◉', label: 'Users'             },
  { to: '/live-scoring',  icon: '◎', label: 'Live Scoring'      },
  { to: '/activity-logs', icon: '≡', label: 'Activity Logs'     },
];

export default function Sidebar() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [open, setOpen] = useState(false);

  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const role    = user.role || '';
  const isAdmin  = role === 'admin';
  const isComply = role === 'compliance_officer';

  // Close sidebar whenever the route changes (user tapped a nav link)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll when sidebar drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const visible = NAV.filter(n => {
    if (n.to === '/users'  && !isAdmin)  return false;
    if (n.to === '/upload' && isComply)  return false;
    return true;
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const roleBadge = role === 'admin'
    ? 'purple'
    : role === 'compliance_officer'
    ? 'teal'
    : 'amber';

  const roleLabel = role === 'admin'
    ? 'Admin'
    : role === 'compliance_officer'
    ? 'Compliance'
    : 'Analyst';

  return (
    <>
      {/* ── Mobile top bar (hamburger) ───────────────────────── */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            A
          </div>
          AnomalyIQ
        </div>

        <button
          className="hamburger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {/* Animate hamburger → X when open */}
          <span style={{
            transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            transition: 'transform 0.2s',
          }} />
          <span style={{
            opacity: open ? 0 : 1,
            transition: 'opacity 0.2s',
          }} />
          <span style={{
            transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            transition: 'transform 0.2s',
          }} />
        </button>
      </div>

      {/* ── Backdrop overlay (mobile only) ───────────────────── */}
      <div
        className={`sidebar-overlay${open ? ' visible' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">A</div>
          <div className="brand-name">AnomalyIQ</div>
          <div className="brand-sub">Fraud Detection System</div>
        </div>

        {visible.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}

        <div className="sidebar-footer">
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            <div style={{ color: 'var(--text)', fontWeight: 600 }}>
              {user.full_name || 'User'}
            </div>
            <div style={{ marginTop: 4 }}>
              <span
                className={`badge badge-${roleBadge}`}
                style={{ fontSize: 10 }}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            style={{ width: '100%' }}
          >
            Sign out
          </button>

          <div className="status-dot" style={{ marginTop: 12 }}>
            <div className="dot" />
            System Online
          </div>
        </div>
      </aside>
    </>
  );
}