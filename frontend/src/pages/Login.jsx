import { useState } from 'react';
import axios from 'axios';
var BASE=window.location.hostname==='localhost'?'http://localhost:8000':'https://anomalyiq-api.onrender.com';
export default function Login({onLogin}){
  var [tab,setTab]=useState('login');
  var [email,setEmail]=useState('');
  var [pw,setPw]=useState('');
  var [name,setName]=useState('');
  var [role,setRole]=useState('analyst');
  var [err,setErr]=useState('');
  var [busy,setBusy]=useState(false);
  function submit(e){
    e.preventDefault();setErr('');setBusy(true);
    var url=tab==='login'?'/api/auth/login':'/api/auth/register';
    var body=tab==='login'?{email:email,password:pw}:{email:email,password:pw,full_name:name,role:role};
    axios.post(BASE+url,body)
      .then(function(r){var d=r.data;localStorage.setItem('anomalyiq_token',d.token);localStorage.setItem('anomalyiq_user',JSON.stringify({email:d.email,full_name:d.full_name,role:d.role}));onLogin(d);})
      .catch(function(e){setErr(e.response&&e.response.data&&e.response.data.detail?e.response.data.detail:'Something went wrong.');})
      .finally(function(){setBusy(false);});
  }
  var page={minHeight:'100vh',display:'flex',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#0f172a 100%)',position:'relative',overflow:'hidden'};
  var blob1={position:'absolute',top:'-80px',left:'-80px',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,0.3) 0%,transparent 70%)',pointerEvents:'none'};
  var blob2={position:'absolute',bottom:'-100px',right:'-100px',width:'500px',height:'500px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.25) 0%,transparent 70%)',pointerEvents:'none'};
  var blob3={position:'absolute',top:'40%',left:'55%',width:'300px',height:'300px',borderRadius:'50%',background:'radial-gradient(circle,rgba(20,184,166,0.2) 0%,transparent 70%)',pointerEvents:'none'};
  var left={flex:1,display:'flex',flexDirection:'column',justifyContent:'center',padding:'60px',position:'relative',zIndex:1};
  var right={width:'460px',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',position:'relative',zIndex:1};
  var card={background:'rgba(255,255,255,0.05)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'24px',padding:'40px',boxShadow:'0 25px 50px rgba(0,0,0,0.5)',width:'100%'};
  var inp={width:'100%',padding:'13px 16px',borderRadius:'12px',border:'1.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'white',fontSize:'14px',outline:'none',boxSizing:'border-box',marginBottom:'14px'};
  var lbl={display:'block',fontSize:'11px',fontWeight:'700',color:'rgba(255,255,255,0.5)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'};
  var btn={width:'100%',padding:'14px',borderRadius:'12px',border:'none',cursor:'pointer',fontSize:'15px',fontWeight:'700',background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',color:'white',boxShadow:'0 4px 20px rgba(14,165,233,0.4)'};
  function tabStyle(t){return{flex:1,padding:'13px',background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:'600',color:tab===t?'white':'rgba(255,255,255,0.4)',borderBottom:tab===t?'2px solid #0ea5e9':'2px solid transparent',transition:'all 0.2s'};}
  return(
    <div style={page}>
      <div style={blob1}></div><div style={blob2}></div><div style={blob3}></div>
      <div style={left}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'40px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'16px',background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:'900',color:'white',boxShadow:'0 8px 20px rgba(14,165,233,0.4)'}}>A</div>
          <div>
            <div style={{fontSize:'26px',fontWeight:'900',color:'white',letterSpacing:'-0.5px'}}>AnomalyIQ</div>
            <div style={{fontSize:'12px',color:'rgba(14,165,233,0.9)',fontWeight:'600'}}>v2.0 Three-Stage Hybrid</div>
          </div>
        </div>
        <div style={{display:'inline-block',background:'rgba(14,165,233,0.15)',border:'1px solid rgba(14,165,233,0.3)',borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:'#0ea5e9',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'20px'}}>Final Year Project 2024/2025</div>
        <h1 style={{fontSize:'42px',fontWeight:'900',color:'white',lineHeight:'1.1',margin:'0 0 20px',letterSpacing:'-1px'}}>
          Catch Financial<br/>
          <span style={{background:'linear-gradient(135deg,#0ea5e9,#14b8a6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Fraud</span> Before<br/>It Happens
        </h1>
        <p style={{color:'rgba(255,255,255,0.5)',fontSize:'15px',lineHeight:'1.7',margin:'0 0 36px',maxWidth:'400px'}}>Three-stage hybrid AI using Autoencoder, Isolation Forest, and LightGBM achieving near-perfect precision on financial transactions.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',maxWidth:'440px',marginBottom:'40px'}}>
          {[['99.80%','Precision'],['99.80%','Recall'],['99.80%','F1-Score'],['100%','AUC-ROC']].map(function(s){return(
            <div key={s[1]} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:'18px',fontWeight:'800',background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s[0]}</div>
              <div style={{fontSize:'9px',color:'rgba(255,255,255,0.4)',fontWeight:'600',marginTop:'2px',letterSpacing:'0.5px'}}>{s[1]}</div>
            </div>
          );})}
        </div>
        <div style={{paddingTop:'28px',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',marginBottom:'12px'}}>Godfrey Okoye University - Dept. of Computer Science</div>
          <div style={{display:'flex',gap:'20px',flexWrap:'wrap'}}>
            {['AE+IF+LightGBM','SMOTE Balanced','SHAP Explainability','Live on Vercel'].map(function(t){return <span key={t} style={{fontSize:'10px',color:'rgba(14,165,233,0.8)',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'}}>{t}</span>;})}
          </div>
        </div>
      </div>
      <div style={right}>
        <div style={{width:'100%'}}>
          <div style={card}>
            <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.1)',marginBottom:'28px'}}>
              <button style={tabStyle('login')} onClick={function(){setTab('login');setErr('');}}>Sign In</button>
              <button style={tabStyle('register')} onClick={function(){setTab('register');setErr('');}}>Create Account</button>
            </div>
            <div style={{textAlign:'center',marginBottom:'24px'}}>
              <h2 style={{color:'white',fontSize:'22px',fontWeight:'800',margin:'0 0 6px'}}>{tab==='login'?'Welcome back':'Join AnomalyIQ'}</h2>
              <p style={{color:'rgba(255,255,255,0.4)',fontSize:'13px',margin:0}}>{tab==='login'?'Sign in to the detection dashboard':'Create your account to get started'}</p>
            </div>
            <form onSubmit={submit}>
              {tab==='register'&&<div><label style={lbl}>Full Name</label><input style={inp} value={name} onChange={function(e){setName(e.target.value);}} required placeholder="Your full name"/></div>}
              <label style={lbl}>Email Address</label>
              <input style={inp} type="email" value={email} onChange={function(e){setEmail(e.target.value);}} required placeholder="you@example.com"/>
              <label style={lbl}>Password</label>
              <input style={inp} type="password" value={pw} onChange={function(e){setPw(e.target.value);}} required placeholder="Enter password"/>
              {tab==='register'&&<div><label style={lbl}>Role</label><select style={inp} value={role} onChange={function(e){setRole(e.target.value);}}><option value="analyst">Data Analyst</option><option value="compliance">Compliance Officer</option><option value="admin">Administrator</option></select></div>}
              {err&&<div style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'10px',padding:'11px 14px',marginBottom:'14px',color:'#fca5a5',fontSize:'13px'}}>{err}</div>}
              {tab==='login'&&<div style={{background:'linear-gradient(135deg,rgba(14,165,233,0.1),rgba(139,92,246,0.1))',border:'1px solid rgba(14,165,233,0.2)',borderRadius:'10px',padding:'11px 14px',marginBottom:'16px'}}>
                <div style={{fontSize:'10px',fontWeight:'700',color:'#0ea5e9',letterSpacing:'0.5px',marginBottom:'3px'}}>DEFAULT ADMIN CREDENTIALS</div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.6)'}}>admin@anomalyiq.com / Admin@1234</div>
              </div>}
              <button type="submit" style={btn} disabled={busy}>{busy?'Please wait...':(tab==='login'?'Sign In to Dashboard':'Create Account')}</button>
            </form>
            <div style={{textAlign:'center',marginTop:'18px',fontSize:'13px',color:'rgba(255,255,255,0.35)'}}>
              {tab==='login'?"Don't have an account? ":"Already have an account? "}
              <button onClick={function(){setTab(tab==='login'?'register':'login');setErr('');}} style={{background:'none',border:'none',cursor:'pointer',color:'#0ea5e9',fontWeight:'700',fontSize:'13px'}}>{tab==='login'?'Create one':'Sign in'}</button>
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:'16px',fontSize:'11px',color:'rgba(255,255,255,0.2)'}}>AnomalyIQ v2.0 - Three-Stage Hybrid AI</div>
        </div>
      </div>
    </div>
  );
}
