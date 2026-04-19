import React,{useState} from 'react';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var DEMO_SHAP=[
  {feature:'V14',value:-1.21,desc:'Principal component 14 — strongest fraud indicator in this transaction'},
  {feature:'V4',value:0.84,desc:'Principal component 4 — elevated beyond normal range'},
  {feature:'Amount',value:0.79,desc:'Transaction amount unusually high relative to historical patterns'},
  {feature:'V1',value:-0.61,desc:'Principal component 1 — anomalous negative deviation'},
  {feature:'V2',value:-0.43,desc:'Principal component 2 — slight negative influence'},
  {feature:'V17',value:-0.31,desc:'Principal component 17 — minor negative contribution'},
  {feature:'V3',value:0.18,desc:'Principal component 3 — small positive push'},
];
function ShapBar({feat,val,desc}){
  var pos=val>=0,abs=Math.abs(val),pct=Math.min((abs/1.3)*45,45);
  return(<div style={{marginBottom:'16px'}}>
    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
      <span style={{width:'60px',fontSize:'12px',color:'rgba(255,255,255,0.6)',textAlign:'right',flexShrink:0,fontFamily:'monospace',fontWeight:700}}>{feat}</span>
      <div style={{flex:1,height:'24px',position:'relative',background:'rgba(255,255,255,0.03)',borderRadius:'4px'}}>
        <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:'1px',background:'rgba(255,255,255,0.15)'}}></div>
        <div style={{position:'absolute',[pos?'left':'right']:'50%',width:pct+'%',height:'100%',borderRadius:pos?'0 4px 4px 0':'4px 0 0 4px',background:pos?'linear-gradient(90deg,rgba(248,113,113,0.7),rgba(239,68,68,0.9))':'linear-gradient(270deg,rgba(96,165,250,0.7),rgba(59,130,246,0.9))'}}></div>
      </div>
      <span style={{width:'50px',fontSize:'12px',color:pos?'#f87171':'#60a5fa',fontWeight:800,flexShrink:0}}>{pos?'+':''}{val.toFixed(2)}</span>
    </div>
    <div style={{paddingLeft:'68px',fontSize:'11px',color:'rgba(255,255,255,0.3)',lineHeight:1.5}}>{desc}</div>
  </div>);
}
export default function Explain({results}){
  var [tab,setTab]=useState('shap');
  var shap=results?.shap_values||DEMO_SHAP;
  var isDemo=!results;
  function tabStyle(t){return{padding:'9px 20px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,background:tab===t?'linear-gradient(135deg,rgba(14,165,233,0.25),rgba(139,92,246,0.2))':'transparent',color:tab===t?'white':'rgba(255,255,255,0.35)',outline:tab===t?'1px solid rgba(14,165,233,0.25)':'none'};}
  return(<div style={pg}>
    <div style={{position:'absolute',top:'-80px',right:'-80px',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)',pointerEvents:'none'}}></div>
    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Explainability</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'24px'}}>Understand why transactions were flagged using SHAP values</div>
    {isDemo&&<div style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'10px',padding:'10px 16px',marginBottom:'20px',fontSize:'13px',color:'#fb923c'}}>Showing demo explanation. Run a detection to see real SHAP values for your data.</div>}
    <div style={{display:'flex',gap:'4px',marginBottom:'24px',background:'rgba(255,255,255,0.03)',padding:'4px',borderRadius:'12px',width:'fit-content',border:'1px solid rgba(255,255,255,0.07)'}}>
      {[['shap','SHAP Values'],['method','How It Works'],['about','About SHAP']].map(function(t){return <button key={t[0]} style={tabStyle(t[0])} onClick={function(){setTab(t[0]);}}>{t[1]}</button>;})}
    </div>
    {tab==='shap'&&(
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
          <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Feature Impact</div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',marginBottom:'20px'}}>Red = pushes toward fraud. Blue = reduces fraud score.</div>
          {shap.map(function(s){return <ShapBar key={s.feature} feat={s.feature} val={s.value} desc={s.desc||''}/>;  })}
        </div>
        <div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px',marginBottom:'16px'}}>
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'16px'}}>Top Drivers</div>
            {shap.slice(0,3).map(function(s,i){var pos=s.value>=0;return(
              <div key={s.feature} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div style={{width:'24px',height:'24px',borderRadius:'50%',background:pos?'rgba(248,113,113,0.2)':'rgba(96,165,250,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,color:pos?'#f87171':'#60a5fa',flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:700,color:'white',fontFamily:'monospace'}}>{s.feature}</div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'2px'}}>{pos?'Increases':'Reduces'} fraud probability</div>
                </div>
                <div style={{fontSize:'14px',fontWeight:800,color:pos?'#f87171':'#60a5fa'}}>{pos?'+':''}{s.value.toFixed(2)}</div>
              </div>
            );})}
          </div>
          <div style={{background:'rgba(14,165,233,0.06)',border:'1px solid rgba(14,165,233,0.15)',borderRadius:'14px',padding:'20px'}}>
            <div style={{fontSize:'12px',fontWeight:800,color:'#38bdf8',marginBottom:'8px'}}>INTERPRETATION</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',lineHeight:1.7}}>
              The strongest fraud indicator is <strong style={{color:'#f87171'}}>{shap[0]?.feature}</strong> with an impact of <strong style={{color:'#f87171'}}>{shap[0]?.value?.toFixed(2)}</strong>. 
              This feature alone {shap[0]?.value>=0?'pushed':'pulled'} the model {shap[0]?.value>=0?'strongly toward':'away from'} a fraud classification.
            </div>
          </div>
        </div>
      </div>
    )}
    {tab==='method'&&(
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
        <div style={{fontSize:'16px',fontWeight:800,color:'white',marginBottom:'20px'}}>How SHAP Explainability Works</div>
        {[
          ['1. Run Detection','The three-stage pipeline (AE + IF + LightGBM) scores each transaction and produces a combined fraud probability.'],
          ['2. Compute SHAP Values','SHAP (SHapley Additive exPlanations) calculates each feature's contribution to the final prediction using game theory principles.'],
          ['3. Interpret Results','Positive SHAP values push toward fraud classification. Negative values push toward normal. Magnitude indicates importance.'],
          ['4. Compliance Ready','Every flagged transaction can be explained to regulators and auditors with feature-level justification.'],
        ].map(function(s){return(
          <div key={s[0]} style={{display:'flex',gap:'16px',marginBottom:'20px'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'8px',background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:800,color:'white',flexShrink:0}}>{s[0].charAt(0)}</div>
            <div><div style={{fontSize:'14px',fontWeight:700,color:'white',marginBottom:'4px'}}>{s[0]}</div><div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>{s[1]}</div></div>
          </div>
        );})}
      </div>
    )}
    {tab==='about'&&(
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
        <div style={{fontSize:'16px',fontWeight:800,color:'white',marginBottom:'16px'}}>About SHAP in AnomalyIQ</div>
        <div style={{fontSize:'14px',color:'rgba(255,255,255,0.5)',lineHeight:1.8,marginBottom:'20px'}}>
          SHAP values provide a unified measure of feature importance based on cooperative game theory. In AnomalyIQ, SHAP is applied to the LightGBM stage (Stage 3) to explain each fraud detection decision at the individual transaction level.
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
          {[['Model-Agnostic','Works with any ML model including our hybrid ensemble','#0ea5e9'],['Locally Accurate','Exact for each individual prediction, not just global averages','#a78bfa'],['Consistent','More important features always receive higher SHAP magnitude','#34d399']].map(function(m){return(
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
