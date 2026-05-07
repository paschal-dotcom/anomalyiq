import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const TYPE_BADGE = { success: 'green', error: 'red', info: 'blue', warn: 'amber' };
const TYPE_ICON  = { success: '✅', error: '❌', info: 'ℹ', warn: '⚠' };

export default function ActivityLogs() {
  const [logs,   setLogs]   = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('activityLog') || '[]');
    setLogs(stored.reverse()); // newest first
  }, []);

  const clearLogs = () => {
    if (!window.confirm('Clear all activity logs?')) return;
    localStorage.removeItem('activityLog');
    setLogs([]);
  };

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.type !== filter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = logs.reduce((a, l) => { a[l.type] = (a[l.type] || 0) + 1; return a; }, {});

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <div className="page">
          <div className="page-head">
            <div>
              <h1>Activity Logs</h1>
              <p>System activity and audit trail — {logs.length} events recorded</p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={clearLogs}>Clear logs</button>
          </div>

          {/* Summary row */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {[
              { label: 'Total Events',    val: logs.length,            color: 'var(--accent)' },
              { label: 'Success',         val: counts.success || 0,    color: 'var(--green)'  },
              { label: 'Errors',          val: counts.error || 0,      color: 'var(--red)'    },
              { label: 'Info',            val: counts.info || 0,       color: 'var(--cyan)'   },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            {['all', 'success', 'error', 'info', 'warn'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search logs…"
              style={{
                marginLeft: 'auto', padding: '7px 14px', background: 'var(--bg3)',
                border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: 220,
              }}
            />
          </div>

          {/* Log entries */}
          <div className="card">
            {filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <div style={{ fontWeight: 600 }}>{logs.length === 0 ? 'No activity yet' : 'No matching logs'}</div>
                <div style={{ fontSize: 12 }}>
                  {logs.length === 0 ? 'Activities will appear here once you start using the system' : 'Try adjusting your filter or search'}
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Message</th>
                      <th style={{ width: 80 }}>Type</th>
                      <th style={{ width: 180 }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: 'center', fontSize: 16 }}>{log.icon || TYPE_ICON[log.type] || 'ℹ'}</td>
                        <td style={{ fontSize: 13 }}>{log.message}</td>
                        <td><span className={`badge badge-${TYPE_BADGE[log.type] || 'gray'}`}>{log.type}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}