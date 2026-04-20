import React, { useState, useEffect } from 'react';
var BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://strewn-plant-frequent.ngrok-free.dev';
var pg = { minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)', padding:'32px', fontFamily:'sans-serif' };
var ROLE_COLORS = { admin:'#f87171', analyst:'#34d399', compliance:'#fb923c' };

export default function Users({ user }) {
  var [users, setUsers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');

  useEffect(function() {
    var token = localStorage.getItem('anomalyiq_token');
    fetch(BASE + '/api/auth/users', {
      headers: { 'Authorization': 'Bearer ' + token, 'ngrok-skip-browser-warning': 'true' }
    })
    .then(function(r) { return r.json(); })
    .then(function(d) { setUsers(d.users || []); setLoading(false); })
    .catch(function() { setError('Could not load users.'); setLoading(false); });
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div style={pg}>
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔒</div>
          <div style={{ fontSize:'20px', fontWeight:800, color:'#f87171', marginBottom:'8px' }}>Access Denied</div>
          <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)' }}>Only administrators can manage users.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pg}>
      <div style={{ fontSize:'28px', fontWeight:900, color:'white', marginBottom:'4px' }}>User Management</div>
      <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.35)', marginBottom:'32px' }}>Manage all registered users and their roles</div>
      {loading && <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px' }}>Loading users...</div>}
      {error && <div style={{ color:'#f87171', fontSize:'14px' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 120px 100px', background:'rgba(255,255,255,0.04)', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {['Full Name','Email','Role','Joined'].map(function(h) {
              return <span key={h} style={{ fontSize:'11px', fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{h}</span>;
            })}
          </div>
          {users.length === 0 && (
            <div style={{ padding:'40px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'14px' }}>No users found.</div>
          )}
          {users.map(function(u, i) {
            var rc = ROLE_COLORS[u.role] || '#94a3b8';
            return (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 120px 100px', padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'linear-gradient(135deg,'+rc+',rgba(139,92,246,0.7))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, color:'white', flexShrink:0 }}>
                    {(u.full_name||'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'white' }}>{u.full_name}</span>
                </div>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{u.email}</span>
                <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', background:'rgba(255,255,255,0.06)', color:rc, width:'fit-content' }}>{u.role}</span>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop:'24px', padding:'16px 20px', background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:'12px', fontSize:'13px', color:'rgba(255,255,255,0.4)' }}>
        <strong style={{ color:'#38bdf8' }}>Total users:</strong> {users.length} · New users can register from the login page and select their role.
      </div>
    </div>
  );
}