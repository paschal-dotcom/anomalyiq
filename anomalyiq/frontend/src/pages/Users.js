/* eslint-disable */
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const API = 'http://localhost:8000';

const ROLES = [
  { value: 'admin',              label: 'Administrator',      badge: 'purple' },
  { value: 'compliance_officer', label: 'Compliance Officer', badge: 'teal'   },
  { value: 'data_analyst',       label: 'Data Analyst',       badge: 'amber'  },
];

const PERMISSIONS = {
  admin:              ['Manage users', 'Upload datasets', 'Train models', 'Run detection', 'View results', 'View SHAP', 'View logs', 'Export reports'],
  compliance_officer: ['View results', 'View SHAP', 'View logs', 'Export reports'],
  data_analyst:       ['Upload datasets', 'Train models', 'Run detection', 'View results', 'View SHAP'],
};

function logActivity(icon, message, type = 'info') {
  const log = JSON.parse(localStorage.getItem('activityLog') || '[fetchUsers]');
  log.push({ icon, message, type, time: new Date().toLocaleString() });
  localStorage.setItem('activityLog', JSON.stringify(log.slice(-50)));
}

export default function Users() {
  const [users,      setUsers]      = useState([fetchUsers]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editRole,   setEditRole]   = useState(null);
  const [resetUser,  setResetUser]  = useState(null);
  const [newPwd,     setNewPwd]     = useState('');
  const [form,       setForm]       = useState({ username: '', full_name: '', email: '', role: 'data_analyst', password: '' });

  const token = localStorage.getItem('token');
  const me    = JSON.parse(localStorage.getItem('user') || '{}');
  const H     = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const flash = (msg, isError = false) => {
    isError ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users`, { headers: H });
      const data = await res.json();
      if (res.ok) setUsers(data.data.users);
      else flash(data.detail || 'Failed to load users', true);
    } catch { flash('Cannot reach backend', true); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    const res  = await fetch(`${API}/api/users`, { method: 'POST', headers: H, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) {
      flash(`User "${form.username}" created`);
      setShowCreate(false);
      setForm({ username: '', full_name: '', email: '', role: 'data_analyst', password: '' });
      logActivity('👤', `Created user ${form.username} (${form.role})`, 'success');
      fetchUsers();
    } else flash(data.detail || 'Failed', true);
  };

  const updateRole = async (username, new_role) => {
    const res  = await fetch(`${API}/api/users/role`, { method: 'PUT', headers: H, body: JSON.stringify({ username, new_role }) });
    const data = await res.json();
    if (res.ok) { flash(data.message); setEditRole(null); logActivity('✏', `Changed ${username} role to ${new_role}`, 'info'); fetchUsers(); }
    else flash(data.detail || 'Failed', true);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    const res  = await fetch(`${API}/api/users/password`, { method: 'PUT', headers: H, body: JSON.stringify({ username: resetUser.username, new_password: newPwd }) });
    const data = await res.json();
    if (res.ok) { flash(data.message); setResetUser(null); setNewPwd(''); logActivity('🔑', `Password reset for ${resetUser.username}`, 'info'); }
    else flash(data.detail || 'Failed', true);
  };

  const deactivate = async (username) => {
    if (!window.confirm(`Deactivate "${username}"?`)) return;
    const res  = await fetch(`${API}/api/users/${username}`, { method: 'DELETE', headers: H });
    const data = await res.json();
    if (res.ok) { flash(data.message); logActivity('🚫', `Deactivated user ${username}`, 'warn'); fetchUsers(); }
    else flash(data.detail || 'Failed', true);
  };

  const roleBadge = (role) => ROLES.find(r => r.value === role)?.badge || 'gray';
  const roleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="page">
          <div className="page-head">
            <div>
              <h1>User Management</h1>
              <p>Manage system users and role-based access</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add User</button>
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Permissions card */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Role Permissions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {ROLES.map(r => (
                <div key={r.value} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '16px' }}>
                  <span className={`badge badge-${r.badge}`} style={{ marginBottom: 12, display: 'inline-block' }}>{r.label}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {PERMISSIONS[r.value].map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                        <span style={{ color: 'var(--green)', fontSize: 10 }}>✓</span> {p}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users table */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Users ({users.length})</div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><span className="spinner spinner-lg" /></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className={!u.is_active ? 'dim' : ''}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: `linear-gradient(135deg, ${
                                u.role === 'admin' ? '#7c3aed,#a78bfa' : u.role === 'compliance_officer' ? '#0d9488,#5eead4' : '#b45309,#fcd34d'
                              })`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontWeight: 700, fontSize: 14,
                            }}>
                              {u.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><code>{u.username}</code></td>
                        <td>
                          {editRole === u.username ? (
                            <select
                              defaultValue={u.role}
                              onChange={e => updateRole(u.username, e.target.value)}
                              onBlur={() => setEditRole(null)}
                              autoFocus
                              style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 12 }}
                            >
                              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                          ) : (
                            <span className={`badge badge-${roleBadge(u.role)}`}
                              onClick={() => u.username !== me.username && setEditRole(u.username)}
                              style={{ cursor: u.username !== me.username ? 'pointer' : 'default' }}
                              title={u.username !== me.username ? 'Click to change role' : ''}>
                              {roleLabel(u.role)}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${u.is_active ? 'green' : 'gray'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                          {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => { setResetUser(u); setNewPwd(''); }}>
                              Reset pwd
                            </button>
                            {u.username !== me.username && u.is_active && (
                              <button className="btn btn-danger btn-sm" onClick={() => deactivate(u.username)}>
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Create New User</h2>
                <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
              </div>
              <form onSubmit={createUser}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Jane Smith" />
                    </div>
                    <div className="form-group">
                      <label>Username</label>
                      <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="jsmith" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@company.com" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role</label>
                      <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 chars" minLength={6} />
                    </div>
                  </div>
                  {/* Permission preview */}
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>
                      Permissions for {roleLabel(form.role)}:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PERMISSIONS[form.role]?.map(p => (
                        <span key={p} className="badge badge-blue" style={{ fontSize: 10 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-foot">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset password modal */}
        {resetUser && (
          <div className="overlay" onClick={() => setResetUser(null)}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-head">
                <h2>Reset Password</h2>
                <button className="modal-close" onClick={() => setResetUser(null)}>×</button>
              </div>
              <form onSubmit={resetPassword}>
                <div className="modal-body">
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                    Setting new password for <strong style={{ color: 'var(--text)' }}>{resetUser.full_name}</strong>
                  </p>
                  <div className="form-group">
                    <label>New Password</label>
                    <input required type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} autoFocus minLength={6} placeholder="Min 6 characters" />
                  </div>
                </div>
                <div className="modal-foot">
                  <button type="button" className="btn btn-secondary" onClick={() => setResetUser(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}