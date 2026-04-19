import React,{useState} from 'react';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var SHAP=[
  {f:'V14',v:-1.21,d:'Principal component 14 - strongest fraud indicator'},
  {f:'V4',v:0.84,d:'Principal component 4 - elevated beyond normal range'},
  {f:'Amount',v:0.79,d:'Transaction amount unusually high'},
  {f:'V1',v:-0.61,d:'Principal component 1 - anomalous deviation'},
  {f:'V2',v:-0.43,d:'Principal component 2 - negative influence'},
  {f:'V17',v:-0.31,d:'Principal component 17 - minor contribution'},
  {f:'V3',v:0.18,d:'Principal component 3 - small positive push'},
];
function SBar({f,v,d}){
  var pos=v>=0,abs=Math.abs(v),pct=Math.min((abs/1.3)*45,45);
  return(<div style={{marginBottom:'16px'}}>
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
      <span style={{width:'60px',fontSize:'12px',color:'rgba(255,255,255,0.6)',textAlign:'right',flexShrink:0,fontFamily:'monospace',fontWeight:700}}>{f}</span>
      <div style={{flex:1,height:'24px',position:'relative',background:'rgba(255,255,255,0.03)',borderRadius:'4px'}}>
        <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:'1px',background:'rgba(255,255,255,0.15)'}}></div>
        <div style={{position:'absolute',left:pos?'50%':'auto',right:pos?'auto':'50%',width:pct+'%',height:'100%',borderRadius:pos?'0 4px 4px 0':'4px 0 0 4px',background:pos?'linear-gradient(90deg,rgba(248,113,113,0.7),rgba(239,68,68,0.9))':'linear-gradient(270deg,rgba(96,165,250,0.7),rgba(59,130,246,0.9))'}}></div>
      </div>
      <span style={{width:'50px',fontSize:'12px',color:pos?'#f87171':'#60a5fa',fontWeight:800,flexShrink:0}}>{pos?'+':''}{v.toFixed(2)}</span>
    </div>
    <div style={{paddingLeft:'68px',fontSize:'11px',color:'rgba(255,255,255,0.3)',lineHeight:1.5}}>{d}</div>
  </div>);
}
export default function Explain({results}){
  var [tab,setTab]=useState('shap');
  var shap=results&&results.shap_values?results.shap_values:SHAP;
  var isDemo=!results;
  function ts(t){return{padding:'9px 20px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,background:tab===t?'linear-gradient(135deg,rgba(14,165,233,0.25),rgba(139,92,246,0.2))':'transparent',color:tab===t?'white':'rgba(255,255,255,0.35)',outline:tab===t?'1px solid rgba(14,165,233,0.25)':'none'};}
  return(<div style={pg}>
    <div style={{position:'absolute',top:'-80px',right:'-80px',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)',pointerEvents:'none'}}></div>
    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Explainability</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'24px'}}>Understand why transactions were flagged using SHAP values</div>
    {isDemo&&<div style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'10px',padding:'10px 16px',marginBottom:'20px',fontSize:'13px',color:'#fb923c'}}>Demo explanation shown. Run detection first to see real SHAP values.</div>}
    <div style={{display:'flex',gap:'4px',marginBottom:'24px',background:'rgba(255,255,255,0.03)',padding:'4px',borderRadius:'12px',width:'fit-content',border:'1px solid rgba(255,255,255,0.07)'}}>
      {[['shap','SHAP Values'],['method','How It Works'],['about','About SHAP']].map(function(t){return <button key={t[0]} style={ts(t[0])} onClick={function(){setTab(t[0]);}}>{t[1]}</button>;})}
    </div>
    {tab==='shap'&&(
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
          <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Feature Impact</div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',marginBottom:'20px'}}>Red = pushes toward fraud. Blue = reduces fraud score.</div>
          {shap.map(function(s,i){return <SBar key={i} f={s.f||s.feature} v={s.v!==undefined?s.v:s.value} d={s.d||s.desc||''}/>;  })}
        </div>
        <div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px',marginBottom:'16px'}}>
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'16px'}}>Top 3 Drivers</div>
            {shap.slice(0,3).map(function(s,i){
              var key=s.f||s.feature;var val=s.v!==undefined?s.v:s.value;var pos=val>=0;
              return(<div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div style={{width:'24px',height:'24px',borderRadius:'50%',background:pos?'rgba(248,113,113,0.2)':'rgba(96,165,250,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,color:pos?'#f87171':'#60a5fa',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:'white',fontFamily:'monospace'}}>{key}</div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'2px'}}>{pos?'Increases':'Reduces'} fraud probability</div>
                </div>
                <div style={{fontSize:'14px',fontWeight:800,color:pos?'#f87171':'#60a5fa'}}>{pos?'+':''}{val.toFixed(2)}</div>
              </div>);
            })}
          </div>
          <div style={{background:'rgba(14,165,233,0.06)',border:'1px solid rgba(14,165,233,0.15)',borderRadius:'14px',padding:'20px'}}>
            <div style={{fontSize:'12px',fontWeight:800,color:'#38bdf8',marginBottom:'8px'}}>INTERPRETATION</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',lineHeight:1.7}}>
              The strongest indicator is <strong style={{color:'#f87171'}}>{shap[0]&&(shap[0].f||shap[0].feature)}</strong> with impact <strong style={{color:'#f87171'}}>{shap[0]&&(shap[0].v!==undefined?shap[0].v:shap[0].value)&&(shap[0].v||shap[0].value).toFixed(2)}</strong>.
            </div>
          </div>
        </div>
      </div>
    )}
    {tab==='method'&&(
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
        <div style={{fontSize:'16px',fontWeight:800,color:'white',marginBottom:'20px'}}>How SHAP Explainability Works</div>
        {[['1. Run Detection','The three-stage pipeline scores each transaction and produces a combined fraud probability.'],
          ['2. Compute SHAP','SHAP calculates each feature contribution using game theory principles.'],
          ['3. Interpret','Positive values push toward fraud. Negative values push toward normal.'],
          ['4. Compliance','Every flagged transaction can be explained to auditors with feature-level justification.'],
        ].map(function(s){return(<div key={s[0]} style={{display:'flex',gap:'16px',marginBottom:'20px'}}>
          <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:800,color:'white',flexShrink:0}}>{s[0].charAt(0)}</div>
          <div><div style={{fontSize:'14px',fontWeight:700,color:'white',marginBottom:'4px'}}>{s[0]}</div><div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>{s[1]}</div></div>
        </div>);})}
      </div>
    )}
    {tab==='about'&&(
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
        <div style={{fontSize:'16px',fontWeight:800,color:'white',marginBottom:'16px'}}>About SHAP in AnomalyIQ</div>
        <div style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',lineHeight:1.8,marginBottom:'20px'}}>SHAP values provide a unified measure of feature importance. In AnomalyIQ, SHAP explains each fraud detection decision at the individual transaction level using the LightGBM stage.</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
          {[['Model-Agnostic','Works with our hybrid ensemble','#0ea5e9'],['Locally Accurate','Exact for each prediction','#a78bfa'],['Consistent','Important features get higher values','#34d399']].map(function(m){return(
            <div key={m[0]} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'18px',borderTop:'2px solid '+m[2]}}>
              <div style={{fontSize:'13px',fontWeight:800,color:'white',marginBottom:'6px'}}>{m[0]}</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>{m[1]}</div>
            </div>
          );})}
        </div>
      </div>
    )}
  </div>);
}
