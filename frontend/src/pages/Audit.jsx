import React, { useState, useEffect } from 'react';
var BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://strewn-plant-frequent.ngrok-free.dev';
var pg = { minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)', padding:'32px', fontFamily:'sans-serif' };

export default function Audit({ user }) {
  var [logs, setLogs] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    var token = localStorage.getItem('anomalyiq_token');
    fetch(BASE + '/api/auth/audit', {
      headers: { 'Authorization': 'Bearer ' + token, 'ngrok-skip-browser-warning': 'true' }
    })
    .then(function(r) { return r.json(); })
    .then(function(d) { setLogs(d.logs || []); setLoading(false); })
    .catch(function() { setLoading(false); });
  }, []);

  var role = user?.role || '';
  if (role !== 'admin' && role !== 'compliance') {
    return (
      <div style={pg}>
        <div style={{ textAlign:'center', padding:'80px 0' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>🔒</div>
          <div style={{ fontSize:'20px', fontWeight:800, color:'#f87171', marginBottom:'8px' }}>Access Denied</div>
          <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.4)' }}>Only admins and compliance officers can view audit logs.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pg}>
      <div style={{ fontSize:'28px', fontWeight:900, color:'white', marginBottom:'4px' }}>Audit Logs</div>
      <div style={{ fontSize:'14px', color:'rgba(255,255,255,0.35)', marginBottom:'32px' }}>System activity and user action history</div>
      {loading && <div style={{ color:'rgba(255,255,255,0.4)' }}>Loading logs...</div>}
      {!loading && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 100px', background:'rgba(255,255,255,0.04)', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {['Timestamp','Action','User'].map(function(h) {
              return <span key={h} style={{ fontSize:'11px', fontWeight:800, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{h}</span>;
            })}
          </div>
          {logs.length === 0 && (
            <div style={{ padding:'40px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'14px' }}>No audit logs found.</div>
          )}
          {logs.map(function(log, i) {
            return (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr 100px', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)', alignItems:'center' }}>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>{log.timestamp || '—'}</span>
                <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)' }}>{log.action || '—'}</span>
                <span style={{ fontSize:'12px', color:'#38bdf8' }}>{log.user || '—'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}