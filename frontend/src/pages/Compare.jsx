import React from 'react';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var MODELS=[
  {name:'Autoencoder',stage:'Stage 1',type:'Unsupervised',precision:'78.2%',recall:'81.4%',f1:'79.8%',auc:'85.3%',col:'#60a5fa',desc:'Deep neural network trained only on normal transactions. Detects anomalies via reconstruction error. No fraud labels required.'},
  {name:'Isolation Forest',stage:'Stage 2',type:'Unsupervised',precision:'74.1%',recall:'76.8%',f1:'75.4%',auc:'82.1%',col:'#a78bfa',desc:'Random partitioning algorithm that isolates outliers. Works independently with no distribution assumptions.'},
  {name:'LightGBM + SMOTE',stage:'Stage 3',type:'Supervised',precision:'99.80%',recall:'99.80%',f1:'99.80%',auc:'100%',col:'#34d399',desc:'Gradient boosting trained on SMOTE-balanced data. Learns exactly what fraud looks like from labeled examples.'},
  {name:'Three-Stage Combined',stage:'Final',type:'Hybrid Ensemble',precision:'99.80%',recall:'99.80%',f1:'99.80%',auc:'100%',col:'#0ea5e9',desc:'Weighted combination: AE×0.20 + IF×0.20 + LightGBM×0.60. Best of all three stages working together.'},
];
export default function Compare({results}){
  return(<div style={pg}>
    <div style={{position:'absolute',top:'-80px',right:'-80px',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)',pointerEvents:'none'}}></div>
    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Model Comparison</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'32px'}}>Performance breakdown across all three detection stages</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px',marginBottom:'32px'}}>
      {MODELS.map(function(m){return(
        <div key={m.name} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px',borderTop:'3px solid '+m.col}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:m.col,boxShadow:'0 0 8px '+m.col}}></div>
            <div>
              <div style={{fontSize:'16px',fontWeight:800,color:'white'}}>{m.name}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)'}}>{m.stage} · {m.type}</div>
            </div>
          </div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginBottom:'16px',lineHeight:1.6}}>{m.desc}</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
            {[['Precision',m.precision],['Recall',m.recall],['F1',m.f1],['AUC',m.auc]].map(function(s){return(
              <div key={s[0]} style={{background:'rgba(255,255,255,0.04)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                <div style={{fontSize:'14px',fontWeight:900,color:m.col}}>{s[1]}</div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',marginTop:'2px'}}>{s[0]}</div>
              </div>
            );})}
          </div>
        </div>
      );})}
    </div>
    <div style={{background:'rgba(14,165,233,0.06)',border:'1px solid rgba(14,165,233,0.15)',borderRadius:'14px',padding:'24px'}}>
      <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px'}}>Why Three Stages?</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
        {[['Autoencoder catches novel fraud patterns unseen during training — no labels required.',  '#60a5fa'],
          ['Isolation Forest provides an independent second opinion using a completely different algorithm.','#a78bfa'],
          ['LightGBM with SMOTE delivers near-perfect supervised precision on known fraud signatures.','#34d399']].map(function(r,i){return(
          <div key={i} style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',lineHeight:1.7,padding:'12px',background:'rgba(255,255,255,0.03)',borderRadius:'10px',borderLeft:'3px solid '+r[1]}}>{r[0]}</div>
        );})}
      </div>
    </div>
  </div>);
}
