import { useState } from 'react';
import axios from 'axios';

var BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://strewn-plant-frequent.ngrok-free.dev';

export default function Login({ onLogin }) {
  var [tab, setTab] = useState('login');
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [fullName, setFullName] = useState('');
  var [role, setRole] = useState('analyst');
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);

  function handle(e) {
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
    right: { width:'480px', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px', zIndex:1 },
    card: { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'28px', padding:'44px 40px', boxShadow:'0 32px 64px rgba(0,0,0,0.6)', width:'100%' },
    lbl: { display:'block', fontSize:'11px', fontWeight:800, color:'rgba(255,255,255,0.4)', letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:'8px' },
    inp: { width:'100%', padding:'14px 16px', borderRadius:'12px', border:'1.5px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'white', fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'18px' },
    btn: { width:'100%', padding:'15px', borderRadius:'14px', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:800, background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)', color:'white', boxShadow:'0 6px 24px rgba(14,165,233,0.38)' },
    credBox: { background:'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(139,92,246,0.08))', border:'1px solid rgba(14,165,233,0.18)', borderRadius:'12px', padding:'14px 16px', marginBottom:'22px' },
    errBox: { background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', padding:'12px 16px', marginBottom:'18px', color:'#fca5a5', fontSize:'13px' },
  };

  function tabBtn(t) {
    return { flex:1, padding:'14px', background:'none', border:'none', cursor:'pointer', fontSize:'14px', fontWeight:700, transition:'all 0.2s', color:tab===t?'white':'rgba(255,255,255,0.3)', borderBottom:tab===t?'2px solid #0ea5e9':'2px solid transparent' };
  }

  return (
    <div style={s.page}>
      <div style={s.b1}></div><div style={s.b2}></div><div style={s.b3}></div>
      <div style={s.left}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'44px'}}>
          <div style={{width:'54px',height:'54px',borderRadius:'16px',background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',fontWeight:900,color:'white',boxShadow:'0 8px 24px rgba(14,165,233,0.45)'}}>A</div>
          <div><div style={{fontSize:'30px',fontWeight:900,color:'white',letterSpacing:'-1px'}}>AnomalyIQ</div><div style={{fontSize:'13px',color:'rgba(14,165,233,0.9)',fontWeight:700}}>v2.0 Three-Stage Hybrid</div></div>
        </div>
        <div style={{display:'inline-block',background:'rgba(14,165,233,0.12)',border:'1px solid rgba(14,165,233,0.3)',borderRadius:'20px',padding:'6px 16px',fontSize:'11px',fontWeight:800,color:'#38bdf8',letterSpacing:'1.5px',textTransform:'uppercase',marginBottom:'20px'}}>Final Year Project 2024/2025</div>
        <h1 style={{fontSize:'46px',fontWeight:900,color:'white',lineHeight:1.08,margin:'0 0 22px',letterSpacing:'-1.5px'}}>
          Catch Financial<br/>
          <span style={{background:'linear-gradient(135deg,#0ea5e9,#14b8a6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Fraud</span> Before<br/>
          It Happens
        </h1>
        <p style={{color:'rgba(255,255,255,0.48)',fontSize:'16px',lineHeight:1.75,margin:'0 0 44px',maxWidth:'400px'}}>Three-stage hybrid AI achieving 99.80% precision on financial fraud detection across two datasets.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',maxWidth:'460px'}}>
          {[['99.80%','Precision'],['99.80%','Recall'],['99.80%','F1-Score'],['100%','AUC-ROC']].map(function(m){
            return(<div key={m[1]} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'14px',padding:'16px 10px',textAlign:'center'}}>
              <div style={{fontSize:'20px',fontWeight:900,background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>{m[0]}</div>
              <div style={{fontSize:'9px',color:'rgba(255,255,255,0.38)',fontWeight:700,marginTop:'4px',letterSpacing:'0.8px',textTransform:'uppercase'}}>{m[1]}</div>
            </div>);
          })}
        </div>
        <div style={{marginTop:'48px',paddingTop:'32px',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.35)',marginBottom:'14px'}}>Godfrey Okoye University - Dept. of Computer Science</div>
          <div style={{display:'flex',gap:'20px',flexWrap:'wrap'}}>
            {['AE+IF+LightGBM','SMOTE','SHAP','Live Deployed'].map(function(tag){return <span key={tag} style={{fontSize:'10px',color:'rgba(56,189,248,0.75)',fontWeight:800,textTransform:'uppercase',letterSpacing:'1px'}}>{tag}</span>;})}
          </div>
        </div>
      </div>
      <div style={s.right}>
        <div style={{width:'100%'}}>
          <div style={s.card}>
            <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.08)',marginBottom:'32px'}}>
              <button style={tabBtn('login')} onClick={function(){setTab('login');setError('');}}>Sign In</button>
              <button style={tabBtn('register')} onClick={function(){setTab('register');setError('');}}>Create Account</button>
            </div>
            <div style={{color:'white',fontSize:'22px',fontWeight:900,margin:'0 0 8px',textAlign:'center',letterSpacing:'-0.5px'}}>{tab==='login'?'Welcome back':'Join AnomalyIQ'}</div>
            <div style={{color:'rgba(255,255,255,0.35)',fontSize:'13px',margin:'0 0 28px',textAlign:'center'}}>{tab==='login'?'Sign in to access the detection dashboard':'Create your analyst account'}</div>
            <form onSubmit={handle}>
              {tab==='register'&&<div><label style={s.lbl}>Full Name</label><input style={s.inp} value={fullName} onChange={function(e){setFullName(e.target.value);}} required placeholder="Your full name"/></div>}
              <label style={s.lbl}>Email Address</label>
              <input style={s.inp} type="email" value={email} onChange={function(e){setEmail(e.target.value);}} required placeholder="you@example.com"/>
              <label style={s.lbl}>Password</label>
              <input style={s.inp} type="password" value={password} onChange={function(e){setPassword(e.target.value);}} required placeholder="Enter password"/>
              {tab==='register'&&<div><label style={s.lbl}>Role</label><select style={s.inp} value={role} onChange={function(e){setRole(e.target.value);}}><option value="analyst">Data Analyst</option><option value="compliance">Compliance Officer</option><option value="admin">Administrator</option></select></div>}
              {error&&<div style={s.errBox}>{error}</div>}
              {tab==='login'&&<div style={s.credBox}><div style={{fontSize:'10px',fontWeight:800,color:'#38bdf8',letterSpacing:'1px',marginBottom:'5px'}}>DEFAULT ADMIN CREDENTIALS</div><div style={{fontSize:'12px',color:'rgba(255,255,255,0.55)'}}>admin@anomalyiq.com / Admin@1234</div></div>}
              <button type="submit" style={s.btn} disabled={loading}>{loading?'Please wait...':(tab==='login'?'Sign In to Dashboard':'Create Account')}</button>
            </form>
            <div style={{textAlign:'center',marginTop:'22px',fontSize:'13px',color:'rgba(255,255,255,0.3)'}}>
              {tab==='login'?"Don't have an account? ":"Already have an account? "}
              <button style={{background:'none',border:'none',cursor:'pointer',color:'#38bdf8',fontWeight:800,fontSize:'13px'}} onClick={function(){setTab(tab==='login'?'register':'login');setError('');}}>{tab==='login'?'Create one':'Sign in'}</button>
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:'20px',fontSize:'11px',color:'rgba(255,255,255,0.18)'}}>AnomalyIQ v2.0 - Powered by Three-Stage Hybrid AI</div>
        </div>
      </div>
    </div>
  );
}
