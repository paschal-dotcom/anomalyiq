import { useState } from 'react';
import axios from 'axios';

var BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://anomalyiq-api.onrender.com';

export default function Login({ onLogin }) {
  var [tab, setTab] = useState('login');
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [fullName, setFullName] = useState('');
  var [role, setRole] = useState('analyst');
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);

  function handle(e) {
<<<<<<< HEAD
    e.preventDefault();
    setError('');
    setLoading(true);
    var url = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    var body = tab === 'login'
      ? { email: email, password: password }
      : { email: email, password: password, full_name: fullName, role: role };
    axios.post(BASE + url, body)
      .then(function(res) {
        var data = res.data;
        localStorage.setItem('anomalyiq_token', data.token);
        localStorage.setItem('anomalyiq_user', JSON.stringify({ email: data.email, full_name: data.full_name, role: data.role }));
        onLogin(data);
      })
      .catch(function(err) {
        setError(err.response && err.response.data && err.response.data.detail ? err.response.data.detail : 'Something went wrong. Please try again.');
      })
      .finally(function() { setLoading(false); });
  }

  var styles = {
    page: { minHeight:'100vh', display:'flex', background:'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)', position:'relative', overflow:'hidden' },
    blob1: { position:'absolute', top:'-80px', left:'-80px', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.3) 0%, transparent 70%)', pointerEvents:'none' },
    blob2: { position:'absolute', bottom:'-100px', right:'-100px', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', pointerEvents:'none' },
    blob3: { position:'absolute', top:'50%', left:'55%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)', pointerEvents:'none' },
    left: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px', position:'relative', zIndex:1 },
    logoWrap: { display:'flex', alignItems:'center', gap:'16px', marginBottom:'48px' },
    logoBox: { width:'52px', height:'52px', borderRadius:'16px', background:'linear-gradient(135deg, #0ea5e9, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:'900', color:'white' },
    logoName: { fontSize:'28px', fontWeight:'900', color:'white', letterSpacing:'-0.5px', lineHeight:'1' },
    logoSub: { fontSize:'13px', color:'rgba(14,165,233,0.9)', fontWeight:'600' },
    badge: { display:'inline-block', background:'rgba(14,165,233,0.15)', border:'1px solid rgba(14,165,233,0.3)', borderRadius:'20px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', color:'#0ea5e9', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'16px' },
    h1: { fontSize:'44px', fontWeight:'900', color:'white', lineHeight:'1.1', margin:'0 0 20px', letterSpacing:'-1px' },
    grad: { background:'linear-gradient(135deg, #0ea5e9, #14b8a6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
    desc: { color:'rgba(255,255,255,0.55)', fontSize:'16px', lineHeight:'1.7', margin:'0 0 40px', maxWidth:'420px' },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', maxWidth:'480px' },
    statCard: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'14px 18px', textAlign:'center' },
    statVal: { fontSize:'22px', fontWeight:'800', background:'linear-gradient(135deg, #0ea5e9, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
    statLabel: { fontSize:'10px', color:'rgba(255,255,255,0.4)', fontWeight:'600', marginTop:'2px', letterSpacing:'0.5px' },
    footer: { marginTop:'48px', paddingTop:'32px', borderTop:'1px solid rgba(255,255,255,0.1)' },
    footerText: { fontSize:'13px', color:'rgba(255,255,255,0.4)' },
    tagRow: { display:'flex', gap:'24px', marginTop:'16px', flexWrap:'wrap' },
    tag: { fontSize:'11px', color:'rgba(14,165,233,0.8)', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' },
    right: { width:'480px', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', position:'relative', zIndex:1 },
    card: { background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'24px', padding:'40px', boxShadow:'0 25px 50px rgba(0,0,0,0.5)', width:'100%' },
    tabRow: { display:'flex', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:'32px' },
    cardTitle: { color:'white', fontSize:'22px', fontWeight:'800', margin:'0 0 6px', textAlign:'center' },
    cardSub: { color:'rgba(255,255,255,0.4)', fontSize:'13px', margin:'0 0 28px', textAlign:'center' },
    label: { display:'block', fontSize:'12px', fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px' },
    input: { width:'100%', padding:'14px 16px', borderRadius:'12px', border:'1.5px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.07)', color:'white', fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'16px' },
    credBox: { background:'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(139,92,246,0.1))', border:'1px solid rgba(14,165,233,0.2)', borderRadius:'10px', padding:'12px 14px', marginBottom:'20px' },
    credTitle: { fontSize:'11px', fontWeight:'700', color:'#0ea5e9', letterSpacing:'0.5px', marginBottom:'4px' },
    credText: { fontSize:'12px', color:'rgba(255,255,255,0.6)' },
    btn: { width:'100%', padding:'14px', borderRadius:'12px', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:'700', background:'linear-gradient(135deg, #0ea5e9, #8b5cf6)', color:'white', boxShadow:'0 4px 20px rgba(14,165,233,0.4)' },
    switchRow: { textAlign:'center', marginTop:'20px', fontSize:'13px', color:'rgba(255,255,255,0.35)' },
    switchBtn: { background:'none', border:'none', cursor:'pointer', color:'#0ea5e9', fontWeight:'700', fontSize:'13px' },
    errBox: { background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'10px', padding:'12px 14px', marginBottom:'16px', color:'#fca5a5', fontSize:'13px' },
    bottomNote: { textAlign:'center', marginTop:'20px', fontSize:'11px', color:'rgba(255,255,255,0.25)' },
  };

  function tabStyle(t) {
    return { flex:1, padding:'14px', background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'600', color: tab===t ? 'white' : 'rgba(255,255,255,0.4)', borderBottom: tab===t ? '2px solid #0ea5e9' : '2px solid transparent', transition:'all 0.2s' };
  }

  return (
    <div style={styles.page}>
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>
      <div style={styles.blob3}></div>

      <div style={styles.left}>
        <div style={styles.logoWrap}>
          <div style={styles.logoBox}>A</div>
          <div>
            <div style={styles.logoName}>AnomalyIQ</div>
            <div style={styles.logoSub}>v2.0 Three-Stage Hybrid</div>
          </div>
        </div>
        <div style={styles.badge}>Final Year Project 2024/2025</div>
        <h1 style={styles.h1}>
          Catch Financial<br/>
          <span style={styles.grad}>Fraud</span> Before<br/>
          It Happens
        </h1>
        <p style={styles.desc}>
          Intelligent anomaly detection using Autoencoder, Isolation Forest, and LightGBM achieving 99.80% precision on financial transactions.
        </p>
        <div style={styles.statsGrid}>
          {[['99.80%','Precision'],['99.80%','Recall'],['99.80%','F1-Score'],['100%','AUC-ROC']].map(function(s) {
            return (
              <div key={s[1]} style={styles.statCard}>
                <div style={styles.statVal}>{s[0]}</div>
                <div style={styles.statLabel}>{s[1]}</div>
              </div>
            );
          })}
        </div>
        <div style={styles.footer}>
          <div style={styles.footerText}>Godfrey Okoye University - Dept. of Computer Science</div>
          <div style={styles.tagRow}>
            {['AE+IF+LightGBM','SMOTE Balanced','SHAP Explainability','Live Deployed'].map(function(tag) {
              return <span key={tag} style={styles.tag}>{tag}</span>;
            })}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={{ width:'100%' }}>
          <div style={styles.card}>
            <div style={styles.tabRow}>
              <button style={tabStyle('login')} onClick={function(){setTab('login');setError('');}}>Sign In</button>
              <button style={tabStyle('register')} onClick={function(){setTab('register');setError('');}}>Create Account</button>
            </div>
            <div style={styles.cardTitle}>{tab==='login'?'Welcome back':'Join AnomalyIQ'}</div>
            <div style={styles.cardSub}>{tab==='login'?'Sign in to access the detection dashboard':'Create your account to get started'}</div>
            <form onSubmit={handle}>
              {tab==='register' && (
                <div>
                  <label style={styles.label}>Full Name</label>
                  <input style={styles.input} value={fullName} onChange={function(e){setFullName(e.target.value);}} required placeholder="Your full name" />
                </div>
              )}
              <label style={styles.label}>Email Address</label>
              <input style={styles.input} type="email" value={email} onChange={function(e){setEmail(e.target.value);}} required placeholder="you@example.com" />
              <label style={styles.label}>Password</label>
              <input style={styles.input} type="password" value={password} onChange={function(e){setPassword(e.target.value);}} required placeholder="Enter password" />
              {tab==='register' && (
                <div>
                  <label style={styles.label}>Role</label>
                  <select style={styles.input} value={role} onChange={function(e){setRole(e.target.value);}}>
                    <option value="analyst">Data Analyst</option>
                    <option value="compliance">Compliance Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              )}
              {error && <div style={styles.errBox}>{error}</div>}
              {tab==='login' && (
                <div style={styles.credBox}>
                  <div style={styles.credTitle}>DEFAULT ADMIN CREDENTIALS</div>
                  <div style={styles.credText}>admin@anomalyiq.com / Admin@1234</div>
                </div>
              )}
              <button type="submit" style={styles.btn} disabled={loading}>
                {loading ? 'Please wait...' : (tab==='login' ? 'Sign In to Dashboard' : 'Create Account')}
              </button>
            </form>
            <div style={styles.switchRow}>
              {tab==='login' ? "Don't have an account? " : 'Already have an account? '}
              <button style={styles.switchBtn} onClick={function(){setTab(tab==='login'?'register':'login');setError('');}}>
                {tab==='login' ? 'Create one' : 'Sign in'}
              </button>
            </div>
          </div>
          <div style={styles.bottomNote}>AnomalyIQ v2.0 - Powered by Three-Stage Hybrid AI</div>
=======
    e.preventDefault(); setError(''); setLoading(true);
    var url = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
    var body = tab === 'login' ? { email: email, password: password } : { email: email, password: password, full_name: fullName, role: role };
    axios.post(BASE + url, body)
      .then(function(res) {
        var d = res.data;
        localStorage.setItem('anomalyiq_token', d.token);
        localStorage.setItem('anomalyiq_user', JSON.stringify({ email: d.email, full_name: d.full_name, role: d.role }));
        onLogin(d);
      })
      .catch(function(err) { setError(err.response && err.response.data && err.response.data.detail ? err.response.data.detail : 'Something went wrong.'); })
      .finally(function() { setLoading(false); });
  }

  var s = {
    page: { minHeight:'100vh', display:'flex', background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 45%,#0f172a 100%)', position:'relative', overflow:'hidden', fontFamily:'sans-serif' },
    b1: { position:'absolute', top:'-100px', left:'-100px', width:'450px', height:'450px', borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.28) 0%,transparent 70%)', pointerEvents:'none' },
    b2: { position:'absolute', bottom:'-120px', right:'-120px', width:'550px', height:'550px', borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.22) 0%,transparent 70%)', pointerEvents:'none' },
    b3: { position:'absolute', top:'40%', left:'52%', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle,rgba(20,184,166,0.18) 0%,transparent 70%)', pointerEvents:'none' },
    left: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 70px', zIndex:1 },
    logoWrap: { display:'flex', alignItems:'center', gap:'16px', marginBottom:'44px' },
    logoBox: { width:'54px', height:'54px', borderRadius:'16px', background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', fontWeight:'900', color:'white', boxShadow:'0 8px 24px rgba(14,165,233,0.45)' },
    logoName: { fontSize:'30px', fontWeight:'900', color:'white', letterSpacing:'-1px', lineHeight:'1.1' },
    logoSub: { fontSize:'13px', color:'rgba(14,165,233,0.9)', fontWeight:'700', marginTop:'2px' },
    badge: { display:'inline-block', background:'rgba(14,165,233,0.12)', border:'1px solid rgba(14,165,233,0.35)', borderRadius:'20px', padding:'6px 16px', fontSize:'11px', fontWeight:'800', color:'#38bdf8', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'20px' },
    h1: { fontSize:'46px', fontWeight:'900', color:'white', lineHeight:'1.08', margin:'0 0 22px', letterSpacing:'-1.5px' },
    grad: { background:'linear-gradient(135deg,#0ea5e9,#14b8a6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
    desc: { color:'rgba(255,255,255,0.5)', fontSize:'16px', lineHeight:'1.75', margin:'0 0 44px', maxWidth:'400px' },
    statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', maxWidth:'460px', marginBottom:'48px' },
    statCard: { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', padding:'16px 10px', textAlign:'center' },
    statVal: { fontSize:'20px', fontWeight:'900', background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
    statLabel: { fontSize:'9px', color:'rgba(255,255,255,0.38)', fontWeight:'700', marginTop:'4px', letterSpacing:'0.8px', textTransform:'uppercase' },
    divider: { borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'32px' },
    footerText: { fontSize:'13px', color:'rgba(255,255,255,0.35)', marginBottom:'14px' },
    tags: { display:'flex', gap:'20px', flexWrap:'wrap' },
    tag: { fontSize:'10px', color:'rgba(56,189,248,0.75)', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px' },
    right: { width:'500px', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', zIndex:1 },
    card: { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'28px', padding:'44px 40px', boxShadow:'0 32px 64px rgba(0,0,0,0.6)', width:'100%' },
    tabRow: { display:'flex', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:'32px' },
    cardTitle: { color:'white', fontSize:'24px', fontWeight:'900', margin:'0 0 8px', textAlign:'center', letterSpacing:'-0.5px' },
    cardSub: { color:'rgba(255,255,255,0.35)', fontSize:'13px', margin:'0 0 28px', textAlign:'center' },
    lbl: { display:'block', fontSize:'11px', fontWeight:'800', color:'rgba(255,255,255,0.4)', letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:'8px' },
    inp: { width:'100%', padding:'14px 16px', borderRadius:'12px', border:'1.5px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'white', fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'18px' },
    credBox: { background:'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(139,92,246,0.08))', border:'1px solid rgba(14,165,233,0.18)', borderRadius:'12px', padding:'14px 16px', marginBottom:'22px' },
    credLabel: { fontSize:'10px', fontWeight:'800', color:'#38bdf8', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'5px' },
    credText: { fontSize:'12px', color:'rgba(255,255,255,0.55)' },
    btn: { width:'100%', padding:'15px', borderRadius:'14px', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:'800', background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', color:'white', boxShadow:'0 6px 24px rgba(14,165,233,0.38)', letterSpacing:'0.3px', transition:'opacity 0.2s' },
    switchRow: { textAlign:'center', marginTop:'22px', fontSize:'13px', color:'rgba(255,255,255,0.3)' },
    switchBtn: { background:'none', border:'none', cursor:'pointer', color:'#38bdf8', fontWeight:'800', fontSize:'13px' },
    errBox: { background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'12px 16px', marginBottom:'18px', color:'#fca5a5', fontSize:'13px' },
    note: { textAlign:'center', marginTop:'22px', fontSize:'11px', color:'rgba(255,255,255,0.18)', letterSpacing:'0.3px' },
  };

  function tabBtn(t) {
    return { flex:1, padding:'14px', background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:'700', transition:'all 0.2s',
      color: tab===t ? 'white' : 'rgba(255,255,255,0.3)',
      borderBottom: tab===t ? '2px solid #0ea5e9' : '2px solid transparent' };
  }

  return (
    <div style={s.page}>
      <div style={s.b1}></div><div style={s.b2}></div><div style={s.b3}></div>

      <div style={s.left}>
        <div style={s.logoWrap}>
          <div style={s.logoBox}>A</div>
          <div><div style={s.logoName}>AnomalyIQ</div><div style={s.logoSub}>v2.0 Three-Stage Hybrid</div></div>
        </div>
        <div style={s.badge}>Final Year Project 2024 / 2025</div>
        <h1 style={s.h1}>Catch Financial<br/><span style={s.grad}>Fraud</span> Before<br/>It Happens</h1>
        <p style={s.desc}>Three-stage hybrid AI — Autoencoder, Isolation Forest, and LightGBM — achieving near-perfect precision on financial fraud detection.</p>
        <div style={s.statsGrid}>
          {[['99.80%','Precision'],['99.80%','Recall'],['99.80%','F1-Score'],['100%','AUC-ROC']].map(function(m) {
            return <div key={m[1]} style={s.statCard}><div style={s.statVal}>{m[0]}</div><div style={s.statLabel}>{m[1]}</div></div>;
          })}
        </div>
        <div style={s.divider}>
          <div style={s.footerText}>Godfrey Okoye University &nbsp;·&nbsp; Dept. of Computer Science</div>
          <div style={s.tags}>{['AE + IF + LightGBM','SMOTE','SHAP','Live on Vercel'].map(function(t){return <span key={t} style={s.tag}>{t}</span>;})}</div>
        </div>
      </div>

      <div style={s.right}>
        <div style={{width:'100%'}}>
          <div style={s.card}>
            <div style={s.tabRow}>
              <button style={tabBtn('login')} onClick={function(){setTab('login');setError('');}}>Sign In</button>
              <button style={tabBtn('register')} onClick={function(){setTab('register');setError('');}}>Create Account</button>
            </div>
            <div style={s.cardTitle}>{tab==='login'?'Welcome back':'Join AnomalyIQ'}</div>
            <div style={s.cardSub}>{tab==='login'?'Sign in to access the detection dashboard':'Create your analyst account'}</div>
            <form onSubmit={handle}>
              {tab==='register'&&<div><label style={s.lbl}>Full Name</label><input style={s.inp} value={fullName} onChange={function(e){setFullName(e.target.value);}} required placeholder="Your full name"/></div>}
              <label style={s.lbl}>Email Address</label>
              <input style={s.inp} type="email" value={email} onChange={function(e){setEmail(e.target.value);}} required placeholder="you@example.com"/>
              <label style={s.lbl}>Password</label>
              <input style={s.inp} type="password" value={password} onChange={function(e){setPassword(e.target.value);}} required placeholder="Enter password"/>
              {tab==='register'&&<div><label style={s.lbl}>Role</label><select style={s.inp} value={role} onChange={function(e){setRole(e.target.value);}}><option value="analyst">Data Analyst</option><option value="compliance">Compliance Officer</option><option value="admin">Administrator</option></select></div>}
              {error&&<div style={s.errBox}>{error}</div>}
              {tab==='login'&&<div style={s.credBox}><div style={s.credLabel}>Default Admin Credentials</div><div style={s.credText}>admin@anomalyiq.com &nbsp;/&nbsp; Admin@1234</div></div>}
              <button type="submit" style={s.btn} disabled={loading}>{loading?'Please wait...':(tab==='login'?'Sign In to Dashboard':'Create Account')}</button>
            </form>
            <div style={s.switchRow}>
              {tab==='login'?"Don't have an account? ":"Already have an account? "}
              <button style={s.switchBtn} onClick={function(){setTab(tab==='login'?'register':'login');setError('');}}>{tab==='login'?'Create one':'Sign in'}</button>
            </div>
          </div>
          <div style={s.note}>AnomalyIQ v2.0 &nbsp;·&nbsp; Powered by Three-Stage Hybrid AI</div>
>>>>>>> c551ccf293641dbe365186b47049f57604b74116
        </div>
      </div>
    </div>
  );
}
