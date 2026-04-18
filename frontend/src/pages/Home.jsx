import React from 'react';
import { useNavigate } from 'react-router-dom';
var MCC=[{l:'Precision',v:'99.80%',c:'#0ea5e9'},{l:'Recall',v:'99.80%',c:'#a78bfa'},{l:'F1-Score',v:'99.80%',c:'#34d399'},{l:'AUC-ROC',v:'100.00%',c:'#fb923c'}];
var MPS=[{l:'Precision',v:'99.26%',c:'#0ea5e9'},{l:'Recall',v:'98.05%',c:'#a78bfa'},{l:'F1-Score',v:'98.65%',c:'#34d399'},{l:'AUC-ROC',v:'99.93%',c:'#fb923c'}];
var CM=[{l:'True Negatives',v:'56,862',d:'Correctly passed',c:'#34d399'},{l:'False Positives',v:'1',d:'False alarms',c:'#f87171'},{l:'False Negatives',v:'1',d:'Fraud missed',c:'#fb923c'},{l:'True Positives',v:'491',d:'Fraud caught',c:'#0ea5e9'}];
var FEATS=[
  {ic:'AE',t:'Autoencoder (Stage 1)',d:'Deep neural network trained on normal transactions. Flags anomalies via reconstruction error — no labels needed.',c:'#0ea5e9'},
  {ic:'IF',t:'Isolation Forest (Stage 2)',d:'Random partitioning isolates outliers with no distribution assumptions. Independent second opinion.',c:'#a78bfa'},
  {ic:'LG',t:'LightGBM + SMOTE (Stage 3)',d:'Supervised gradient boosting trained on SMOTE-balanced data. Learns exactly what fraud looks like.',c:'#34d399'},
  {ic:'RS',t:'Risk Scoring',d:'Every flagged transaction receives Low, Medium, or High risk level for compliance officer prioritisation.',c:'#fb923c'},
  {ic:'SH',t:'SHAP Explainability',d:'Feature-level explanation for every flagged transaction — shows exactly why each was flagged.',c:'#f472b6'},
  {ic:'LS',t:'Live Scoring',d:'Score any individual transaction instantly across all three stages with a clear risk recommendation.',c:'#60a5fa'},
];
var DS=[
  {n:'Credit Card (MLG-ULB)',f:'EU',r:'284,807',fr:'492 (0.172%)',ft:'30 + 3 engineered',c:'#a78bfa',d:'European cardholders · September 2013 · International benchmark'},
  {n:'PaySim (African Mobile Money)',f:'NG',r:'6,362,620',fr:'8,213 (0.13%)',ft:'11 + 5 engineered',c:'#0ea5e9',d:'Real African mobile money logs · Most relevant for Nigerian fintech'},
];
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#0f172a 100%)',padding:'36px 40px',fontFamily:'sans-serif',position:'relative',overflow:'hidden'};
export default function Home(){
  var nav=useNavigate();
  var [dt,setDt]=React.useState(0);
  return(
    <div style={pg}>
      <div style={{position:'absolute',top:'-120px',right:'-120px',width:'500px',height:'500px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.14) 0%,transparent 70%)',pointerEvents:'none'}}></div>
      <div style={{position:'absolute',bottom:'-100px',left:'-100px',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(14,165,233,0.11) 0%,transparent 70%)',pointerEvents:'none'}}></div>

      <div style={{textAlign:'center',marginBottom:'52px',position:'relative',zIndex:1}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.22)',borderRadius:'20px',padding:'6px 16px',marginBottom:'20px'}}>
          <div style={{width:'7px',height:'7px',borderRadius:'50%',background:'#0ea5e9',boxShadow:'0 0 8px rgba(14,165,233,0.8)'}}></div>
          <span style={{fontSize:'12px',fontWeight:800,color:'#38bdf8',letterSpacing:'1px',textTransform:'uppercase'}}>Three-Stage Hybrid AI v2.0</span>
        </div>
        <h1 style={{fontSize:'52px',fontWeight:900,color:'white',lineHeight:1.08,margin:'0 0 18px',letterSpacing:'-2px'}}>
          Catch Financial<br/>
          <span style={{background:'linear-gradient(135deg,#0ea5e9,#14b8a6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Fraud</span> Before It Happens
        </h1>
        <p style={{fontSize:'17px',color:'rgba(255,255,255,0.48)',maxWidth:'580px',margin:'0 auto 36px',lineHeight:1.7}}>
          AnomalyIQ uses Autoencoder, Isolation Forest, and LightGBM with SMOTE — achieving 99.80% precision on financial fraud detection across two financial datasets.
        </p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
          <button style={{padding:'14px 32px',borderRadius:'12px',border:'none',cursor:'pointer',fontSize:'15px',fontWeight:800,background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',color:'white',boxShadow:'0 6px 24px rgba(14,165,233,0.4)'}} onClick={function(){nav('/upload');}}>Get Started</button>
          <button style={{padding:'14px 32px',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.14)',cursor:'pointer',fontSize:'15px',fontWeight:700,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.72)'}} onClick={function(){nav('/results');}}>View Demo Results</button>
        </div>
      </div>

      <div style={{marginBottom:'48px',position:'relative',zIndex:1}}>
        <div style={{fontSize:'12px',fontWeight:800,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'16px',textAlign:'center'}}>Performance Results</div>
        <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'18px'}}>
          {['Credit Card (MLG-ULB)','PaySim (African)'].map(function(t,i){
            return <button key={t} onClick={function(){setDt(i);}} style={{padding:'8px 20px',borderRadius:'20px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:700,background:dt===i?'rgba(14,165,233,0.2)':'rgba(255,255,255,0.04)',color:dt===i?'#38bdf8':'rgba(255,255,255,0.38)',outline:dt===i?'1px solid rgba(14,165,233,0.3)':'none'}}>{t}</button>;
          })}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'12px'}}>
          {(dt===0?MCC:MPS).map(function(m){
            return <div key={m.l} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px',textAlign:'center'}}>
              <div style={{fontSize:'32px',fontWeight:900,color:m.c,marginBottom:'6px'}}>{m.v}</div>
              <div style={{fontSize:'11px',fontWeight:800,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.8px'}}>{m.l}</div>
            </div>;
          })}
        </div>
        {dt===0&&<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
          {CM.map(function(c){
            return <div key={c.l} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
              <div style={{fontSize:'22px',fontWeight:900,color:c.c}}>{c.v}</div>
              <div style={{fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.38)',marginTop:'2px'}}>{c.l}</div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.22)',marginTop:'2px'}}>{c.d}</div>
            </div>;
          })}
        </div>}
        <div style={{textAlign:'center',marginTop:'12px',fontSize:'12px',color:'rgba(255,255,255,0.22)'}}>Only 2 mistakes in 57,355 test transactions — error rate of 0.003%</div>
      </div>

      <div style={{marginBottom:'48px',position:'relative',zIndex:1}}>
        <div style={{fontSize:'12px',fontWeight:800,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'18px',textAlign:'center'}}>System Capabilities</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px'}}>
          {FEATS.map(function(f){
            return <div key={f.t} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'24px',transition:'all 0.2s',cursor:'default'}}
              onMouseEnter={function(e){e.currentTarget.style.borderColor='rgba(14,165,233,0.25)';e.currentTarget.style.background='rgba(255,255,255,0.05)';}}
              onMouseLeave={function(e){e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
              <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:900,color:f.c,marginBottom:'14px'}}>{f.ic}</div>
              <div style={{fontSize:'14px',fontWeight:800,color:'white',marginBottom:'8px'}}>{f.t}</div>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.42)',lineHeight:1.65}}>{f.d}</div>
            </div>;
          })}
        </div>
      </div>

      <div style={{position:'relative',zIndex:1}}>
        <div style={{fontSize:'12px',fontWeight:800,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:'2px',marginBottom:'18px',textAlign:'center'}}>Trained on Two Financial Datasets</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'28px'}}>
          {DS.map(function(d){
            return <div key={d.n} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',padding:'28px',borderTop:'3px solid '+d.c}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'10px',background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:900,color:d.c}}>{d.f}</div>
                <div style={{fontSize:'15px',fontWeight:800,color:'white'}}>{d.n}</div>
              </div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.32)',marginBottom:'14px'}}>{d.d}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                {[['Records',d.r],['Fraud',d.fr],['Features',d.ft]].map(function(kv){
                  return <div key={kv[0]} style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px'}}>
                    <div style={{fontSize:'10px',color:'rgba(255,255,255,0.28)',marginBottom:'2px'}}>{kv[0]}</div>
                    <div style={{fontSize:'12px',fontWeight:700,color:'white'}}>{kv[1]}</div>
                  </div>;
                })}
              </div>
            </div>;
          })}
        </div>
        <div style={{textAlign:'center',padding:'20px',background:'rgba(14,165,233,0.05)',border:'1px solid rgba(14,165,233,0.12)',borderRadius:'14px'}}>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.38)',marginBottom:'4px'}}>Godfrey Okoye University · Dept. of Computer Science</div>
          <div style={{fontSize:'12px',color:'rgba(14,165,233,0.55)',fontWeight:700}}>Final Year Project 2024/2025 · AnomalyIQ v2.0</div>
        </div>
      </div>
    </div>
  );
}
