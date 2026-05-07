import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ── Dark theme colour tokens (match the rest of the app) ─────────────────────
const C = {
  bg:        '#0d1117',   // deepest background
  bg2:       '#161b22',   // card / panel background
  bg3:       '#1c2333',   // input / hover background
  border:    '#30363d',   // subtle border
  border2:   '#3d444d',   // slightly visible border
  text:      '#e6edf3',   // primary text
  muted:     '#7d8590',   // secondary / placeholder text
  accent:    '#3b82f6',   // blue accent
  accentHov: '#2563eb',   // blue hover
  green:     '#22c55e',
  red:       '#ef4444',
  orange:    '#f97316',
};

export default function Login({ expiredBanner = false }) {
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (expiredBanner) {
      const url = new URL(window.location.href);
      url.searchParams.delete('reason');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [expiredBanner]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: C.bg,
    }}>

      {/* ── LEFT HERO PANEL ───────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: `linear-gradient(145deg, ${C.bg} 0%, #0e2240 45%, #0c3d5a 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />

        {/* Glowing orbs */}
        <div style={{
          position: 'absolute', width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          top: '8%', left: '5%', filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,116,144,0.2) 0%, transparent 70%)',
          bottom: '12%', right: '10%', filter: 'blur(35px)',
        }} />

        {/* Logo icon */}
        <div style={{
          width: 80, height: 80,
          background: 'rgba(59,130,246,0.1)',
          backdropFilter: 'blur(10px)',
          border: `1px solid rgba(59,130,246,0.3)`,
          borderRadius: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32, position: 'relative', zIndex: 1,
          boxShadow: '0 8px 32px rgba(59,130,246,0.2)',
        }}>
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <circle cx="21" cy="21" r="20"
              stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />
            <path d="M8 26 L14 18 L19 23 L25 14 L34 26"
              stroke="#38bdf8" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="34" cy="26" r="3" fill={C.orange} />
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 36, fontWeight: 800, color: C.text,
          textAlign: 'center', margin: '0 0 12px',
          position: 'relative', zIndex: 1,
          letterSpacing: '-0.5px',
        }}>
          AnomalyIQ
        </h1>

        <p style={{
          fontSize: 15, color: C.muted,
          textAlign: 'center', maxWidth: 340,
          lineHeight: 1.7, margin: '0 0 52px',
          position: 'relative', zIndex: 1,
        }}>
          AI-powered fraud detection using a three-stage hybrid model.
          Near-perfect precision. Real-time SHAP explainability.
        </p>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 40,
          position: 'relative', zIndex: 1,
        }}>
          {[
            { value: '99.9%',   label: 'AUC-ROC'   },
            { value: '98%+',    label: 'Precision'  },
            { value: '3-Stage', label: 'Pipeline'   },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: 11, color: C.muted, marginTop: 6,
                fontWeight: 600, letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ──────────────────────────────────── */}
      <div style={{
        width: 480,
        background: C.bg2,
        borderLeft: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        overflowY: 'auto',
      }}>

        {/* Expired session banner */}
        {expiredBanner && mode === 'login' && (
          <div style={{
            background: '#2a1a0e', border: `1px solid #f59e0b`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            color: '#f59e0b', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⏰ Your session expired. Please sign in again.
          </div>
        )}

        {mode === 'login'
          ? <LoginForm navigate={navigate} onSwitch={() => setMode('register')} />
          : <RegisterForm onSuccess={() => setMode('login')} onSwitch={() => setMode('login')} />
        }
      </div>
    </div>
  );
}


// ── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ navigate, onSwitch }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/login`,
        { username, password });
      if (data.status === 'success') {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user',  JSON.stringify(data.data.user));
        const log = JSON.parse(localStorage.getItem('activityLog') || '[]');
        log.push({
          icon: '🔑', type: 'success',
          message: `${data.data.user.full_name} logged in`,
          time: new Date().toLocaleString(),
        });
        localStorage.setItem('activityLog', JSON.stringify(log.slice(-50)));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 style={{
        fontSize: 28, fontWeight: 800, color: C.text,
        margin: '0 0 8px', letterSpacing: '-0.5px',
      }}>
        Welcome back
      </h2>
      <p style={{ color: C.muted, fontSize: 14, margin: '0 0 36px' }}>
        Sign in to your account to continue
      </p>

      <form onSubmit={handleLogin}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: `1px solid rgba(239,68,68,0.4)`,
            borderRadius: 10, padding: '12px 16px',
            color: '#fca5a5', fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        <DarkField label="USERNAME">
          <input
            type="text" placeholder="e.g. admin"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required autoFocus
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e  => e.target.style.borderColor = C.border2}
          />
        </DarkField>

        <DarkField label="PASSWORD">
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e  => e.target.style.borderColor = C.border2}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: C.muted, fontSize: 16, padding: 0,
              }}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </DarkField>

        <button type="submit" disabled={loading} style={{
          ...btnPrimary,
          marginTop: 4,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <DefaultAccounts onFill={(u, p) => {
        setUsername(u); setPassword(p);
      }} />

      <p style={{
        textAlign: 'center', fontSize: 13,
        color: C.muted, marginTop: 28,
      }}>
        Don't have an account?{' '}
        <button onClick={onSwitch} style={linkBtn}>Create one</button>
      </p>
    </>
  );
}


// ── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSuccess, onSwitch }) {
  const [form, setForm] = useState({
    username: '', full_name: '', email: '', password: '', confirm: '',
  });
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.full_name.trim()) { setError('Please enter your full name.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setError('Username: letters, numbers and underscores only.'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/register`, {
        username:  form.username.trim(),
        full_name: form.full_name.trim(),
        email:     form.email.trim(),
        password:  form.password,
        role:      'data_analyst',
      });
      setSuccess(data.message || 'Account created! You can now sign in.');
      setTimeout(onSuccess, 2000);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Cannot reach the server. Make sure the backend is running on port 8000.');
      } else {
        setError(err.response?.data?.detail
          || 'Registration failed. Try a different username or email.');
      }
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 style={{
        fontSize: 26, fontWeight: 800, color: C.text,
        margin: '0 0 8px', letterSpacing: '-0.5px',
      }}>
        Create account
      </h2>
      <p style={{ color: C.muted, fontSize: 13, margin: '0 0 28px' }}>
        New accounts start as <strong style={{ color: C.text }}>Data Analyst</strong>.
        An admin can promote your role.
      </p>

      <form onSubmit={handleRegister}
        style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: `1px solid rgba(239,68,68,0.4)`,
            borderRadius: 10, padding: '11px 14px',
            color: '#fca5a5', fontSize: 13,
          }}>⚠️ {error}</div>
        )}

        {success && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: `1px solid rgba(34,197,94,0.4)`,
            borderRadius: 10, padding: '11px 14px',
            color: '#86efac', fontSize: 13,
          }}>✅ {success}</div>
        )}

        <DarkField label="FULL NAME">
          <input type="text" placeholder="e.g. Paschal Nwagor"
            value={form.full_name} onChange={set('full_name')}
            required style={inputStyle}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e  => e.target.style.borderColor = C.border2} />
        </DarkField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <DarkField label="USERNAME">
            <input type="text" placeholder="e.g. paschal"
              value={form.username} onChange={set('username')}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e  => e.target.style.borderColor = C.border2} />
          </DarkField>
          <DarkField label="EMAIL">
            <input type="email" placeholder="you@email.com"
              value={form.email} onChange={set('email')}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e  => e.target.style.borderColor = C.border2} />
          </DarkField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <DarkField label="PASSWORD">
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'}
                placeholder="Min. 6 chars"
                value={form.password} onChange={set('password')}
                required style={{ ...inputStyle, paddingRight: 38 }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e  => e.target.style.borderColor = C.border2} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: C.muted, fontSize: 13, padding: 0,
                }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </DarkField>
          <DarkField label="CONFIRM">
            <input type="password" placeholder="Repeat"
              value={form.confirm} onChange={set('confirm')}
              required style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e  => e.target.style.borderColor = C.border2} />
          </DarkField>
        </div>

        <button type="submit" disabled={loading} style={{
          ...btnPrimary, marginTop: 4,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <p style={{
        textAlign: 'center', fontSize: 13,
        color: C.muted, marginTop: 22,
      }}>
        Already have an account?{' '}
        <button onClick={onSwitch} style={linkBtn}>Sign in</button>
      </p>
    </>
  );
}


// ── Default Accounts ─────────────────────────────────────────────────────────
function DefaultAccounts({ onFill }) {
  const [open, setOpen] = useState(false);

  const accounts = [
    { u: 'admin',      p: 'admin123',   r: 'Administrator'      },
    { u: 'compliance', p: 'comply123',  r: 'Compliance Officer'  },
    { u: 'analyst',    p: 'analyst123', r: 'Data Analyst'        },
  ];

  return (
    <div style={{ marginTop: 28 }}>
      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
      }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>
          Default Admin
        </span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Primary admin account */}
      <AccountRow a={accounts[0]} onFill={onFill} />

      {/* Toggle other accounts */}
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.muted, fontSize: 12, width: '100%',
        textAlign: 'center', padding: '6px 0', marginTop: 4,
      }}>
        {open ? '▲ Hide' : '▼ Show all demo accounts'}
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {accounts.slice(1).map(a => (
            <AccountRow key={a.u} a={a} onFill={onFill} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountRow({ a, onFill }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onFill(a.u, a.p)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   hov ? C.bg3 : C.bg,
        border:       `1px solid ${hov ? C.border2 : C.border}`,
        borderRadius: 10, padding: '11px 16px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', cursor: 'pointer',
        transition: 'all 0.15s',
      }}>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: C.accent, fontFamily: 'monospace',
      }}>
        {a.u} / {a.p}
      </span>
      <span style={{
        fontSize: 11, color: C.muted,
        background: C.bg3, borderRadius: 6,
        padding: '2px 8px', border: `1px solid ${C.border}`,
      }}>
        {a.r}
      </span>
    </div>
  );
}


// ── Shared components & styles ────────────────────────────────────────────────
function DarkField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, color: C.muted,
        letterSpacing: '0.8px', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  background: '#0d1117',
  border: `1.5px solid #3d444d`,
  borderRadius: 8,
  fontSize: 14,
  color: '#e6edf3',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

const btnPrimary = {
  width: '100%',
  padding: '13px',
  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  letterSpacing: '0.3px',
  boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
};

const linkBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#3b82f6',
  fontSize: 13,
  fontWeight: 600,
  padding: 0,
  textDecoration: 'underline',
};