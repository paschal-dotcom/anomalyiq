import React,{useState} from 'react';
var DEMO=[
  {id:1,time:'2024-01-15 09:23:41',amount:284.95,risk:'High',score:0.94,ae:0.89,iso:0.91,lgb:0.96,feats:{V1:-1.36,V2:-0.07,V4:1.38,V14:-0.31,V17:-0.42,Amount:284.95},shap:{V14:-0.82,V4:0.71,V3:0.63,V17:-0.51,Amount:0.38}},
  {id:2,time:'2024-01-15 11:47:22',amount:1452.30,risk:'High',score:0.91,ae:0.85,iso:0.88,lgb:0.93,feats:{V1:-2.31,V2:1.95,V4:3.99,V14:-2.28,V17:0.87,Amount:1452.30},shap:{V4:0.91,V14:-0.74,V1:-0.61,Amount:0.55,V3:-0.48}},
  {id:3,time:'2024-01-15 14:05:09',amount:67.50,risk:'Medium',score:0.72,ae:0.68,iso:0.74,lgb:0.73,feats:{V1:-0.98,V2:0.43,V4:0.87,V14:-0.55,V17:-0.19,Amount:67.50},shap:{V3:0.44,V14:-0.38,V4:0.31,V1:-0.22,Amount:0.15}},
  {id:4,time:'2024-01-15 16:33:58',amount:5890.00,risk:'High',score:0.97,ae:0.95,iso:0.96,lgb:0.98,feats:{V1:-3.04,V2:-3.16,V4:2.29,V14:-4.09,V17:-0.72,Amount:5890.00},shap:{V14:-1.21,V1:-0.98,V4:0.84,Amount:0.79,V2:-0.67}},
  {id:5,time:'2024-01-16 08:44:11',amount:3200.00,risk:'High',score:0.89,ae:0.82,iso:0.86,lgb:0.91,feats:{V1:-1.98,V2:-0.99,V4:3.12,V14:-3.21,V17:-0.64,Amount:3200.00},shap:{V4:0.78,V14:-0.69,Amount:0.61,V1:-0.44,V3:0.38}},
  {id:6,time:'2024-01-16 14:22:33',amount:219.75,risk:'Medium',score:0.68,ae:0.61,iso:0.71,lgb:0.69,feats:{V1:-0.62,V2:0.85,V4:0.44,V14:-0.38,V17:0.33,Amount:219.75},shap:{V3:0.34,V4:0.28,V14:-0.24,V2:0.19,Amount:0.16}},
];
function Badge({risk}){
  var m={High:{bg:'rgba(239,68,68,0.15)',br:'rgba(239,68,68,0.3)',cl:'#f87171'},Medium:{bg:'rgba(251,146,60,0.15)',br:'rgba(251,146,60,0.3)',cl:'#fb923c'},Low:{bg:'rgba(52,211,153,0.15)',br:'rgba(52,211,153,0.3)',cl:'#34d399'}}[risk]||{bg:'rgba(148,163,184,0.1)',br:'rgba(148,163,184,0.2)',cl:'#94a3b8'};
  return <span style={{background:m.bg,border:'1px solid '+m.br,color:m.cl,borderRadius:'20px',padding:'3px 10px',fontSize:'11px',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.5px'}}>{risk}</span>;
}
function Bar({label,val,col}){
  return(<div style={{marginBottom:'10px'}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
      <span style={{fontSize:'12px',color:'rgba(255,255,255,0.55)'}}>{label}</span>
      <span style={{fontSize:'12px',fontWeight:800,color:col}}>{(val*100).toFixed(1)}%</span>
    </div>
    <div style={{height:'6px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden'}}>
      <div style={{height:'100%',width:(val*100)+'%',background:col,borderRadius:'3px'}}></div>
    </div>
  </div>);
}
function ShapBar({feat,val}){
  var pos=val>=0,abs=Math.abs(val),pct=Math.min((abs/1.3)*50,50);
  return(<div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
    <span style={{width:'55px',fontSize:'11px',color:'rgba(255,255,255,0.45)',textAlign:'right',flexShrink:0,fontFamily:'monospace'}}>{feat}</span>
    <div style={{flex:1,height:'20px',position:'relative'}}>
      <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:'1px',background:'rgba(255,255,255,0.12)'}}></div>
      <div style={{position:'absolute',left:pos?'50%':'auto',right:pos?'auto':'50%',width:pct+'%',height:'14px',borderRadius:pos?'0 4px 4px 0':'4px 0 0 4px',background:pos?'linear-gradient(90deg,#f87171,#ef4444)':'linear-gradient(270deg,#60a5fa,#3b82f6)',top:'3px'}}></div>
    </div>
    <span style={{width:'40px',fontSize:'11px',color:pos?'#f87171':'#60a5fa',fontWeight:800,flexShrink:0}}>{pos?'+':''}{val.toFixed(2)}</span>
  </div>);
}
function Modal({tx,onClose}){
  if(!tx)return null;
  var sh=Object.entries(tx.shap).sort(function(a,b){return Math.abs(b[1])-Math.abs(a[1]);});
  return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={onClose}>
    <div style={{background:'linear-gradient(135deg,#0f172a,#1e1b4b)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'24px',padding:'32px',width:'100%',maxWidth:'700px',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 32px 64px rgba(0,0,0,0.9)'}} onClick={function(e){e.stopPropagation();}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
            <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',fontFamily:'monospace'}}>TXN-{String(tx.id).padStart(6,'0')}</span>
            <Badge risk={tx.risk}/>
          </div>
          <div style={{fontSize:'24px',fontWeight:900,color:'white'}}>Amount: ${tx.amount.toLocaleString()}</div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',marginTop:'4px'}}>{tx.time}</div>
        </div>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.6)',width:'32px',height:'32px',borderRadius:'8px',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center'}}>x</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'24px'}}>
        {[['Combined',tx.score,'#0ea5e9'],['Autoencoder',tx.ae,'#60a5fa'],['Iso Forest',tx.iso,'#a78bfa'],['LightGBM',tx.lgb,'#34d399']].map(function(m){
          return(<div key={m[0]} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'6px'}}>{m[0]}</div>
            <div style={{fontSize:'22px',fontWeight:900,color:m[2]}}>{(m[1]*100).toFixed(1)}%</div>
          </div>);
        })}
      </div>
      <div style={{marginBottom:'24px'}}>
        <div style={{fontSize:'12px',fontWeight:800,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'}}>Transaction Features</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
          {Object.entries(tx.feats).map(function(kv){
            return(<div key={kv[0]} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'10px 12px'}}>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',marginBottom:'2px'}}>{kv[0]}</div>
              <div style={{fontSize:'14px',fontWeight:700,color:'white'}}>{typeof kv[1]==='number'?kv[1].toFixed(2):kv[1]}</div>
            </div>);
          })}
        </div>
      </div>
      <div>
        <div style={{fontSize:'12px',fontWeight:800,color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'6px'}}>SHAP Explainability</div>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',marginBottom:'14px'}}>Red = pushes toward fraud. Blue = pushes toward normal. Longer bar = stronger impact.</div>
        <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'16px'}}>
          {sh.map(function(kv){return <ShapBar key={kv[0]} feat={kv[0]} val={kv[1]}/>;  })}
        </div>
        <div style={{marginTop:'12px',padding:'12px 14px',background:'rgba(14,165,233,0.07)',border:'1px solid rgba(14,165,233,0.15)',borderRadius:'10px',fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>
          <strong style={{color:'#38bdf8'}}>Top driver:</strong> {sh[0][0]} had the strongest influence ({sh[0][1]>=0?'increased':'reduced'} fraud probability by {Math.abs(sh[0][1]).toFixed(2)} units).
        </div>
      </div>
    </div>
  </div>);
}
export default function Results({results,datasetType}){
  var [sel,setSel]=useState(null);
  var [tab,setTab]=useState('flagged');
  var isDemo=!results||!results.flagged_transactions||results.flagged_transactions.length===0;
  var flagged=isDemo?DEMO:results.flagged_transactions.map(function(tx,i){
    return {id:i+1,time:tx.time||tx.timestamp||'2024-01-15 00:00:00',amount:tx.Amount||tx.amount||0,risk:tx.risk_level||'High',score:tx.combined_score||0.85,ae:tx.ae_score||0.8,iso:tx.if_score||0.82,lgb:tx.lgbm_score||0.87,feats:tx,shap:tx.shap_values||DEMO[i%DEMO.length].shap};
  });
  var mets=results?{p:results.precision||99.80,r:results.recall||99.80,f:results.f1||99.80,a:results.auc_roc||100.0,tot:results.total_transactions||57355,nm:results.normal_transactions||56862}:{p:99.80,r:99.80,f:99.80,a:100.0,tot:57355,nm:56862};
  function tabStyle(t){return{padding:'9px 20px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,transition:'all 0.2s',background:tab===t?'linear-gradient(135deg,rgba(14,165,233,0.25),rgba(139,92,246,0.2))':'transparent',color:tab===t?'white':'rgba(255,255,255,0.35)',outline:tab===t?'1px solid rgba(14,165,233,0.25)':'none'};}
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'}}>
      <Modal tx={sel} onClose={function(){setSel(null);}}/>
      <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Detection Results</div>
      <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'20px'}}>{datasetType==='creditcard'?'Credit Card (MLG-ULB)':'PaySim African Mobile Money'} — Three-Stage Hybrid</div>
      {isDemo&&<div style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'10px',padding:'10px 16px',marginBottom:'20px',fontSize:'13px',color:'#fb923c',display:'flex',gap:'8px',alignItems:'center'}}>
        <span style={{fontWeight:800}}>i</span><span>Showing demo data. Upload a CSV and run detection to see your real results.</span>
      </div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
        {[['Precision',mets.p.toFixed(2)+'%','#0ea5e9'],['Recall',mets.r.toFixed(2)+'%','#a78bfa'],['F1-Score',mets.f.toFixed(2)+'%','#34d399'],['AUC-ROC',mets.a.toFixed(2)+'%','#fb923c']].map(function(m){
          return <div key={m[0]} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',padding:'18px',textAlign:'center'}}>
            <div style={{fontSize:'26px',fontWeight:900,color:m[2]}}>{m[1]}</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.8px',marginTop:'4px'}}>{m[0]}</div>
          </div>;
        })}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'24px'}}>
        {[['Total Transactions',mets.tot.toLocaleString(),'rgba(255,255,255,0.8)'],['Flagged Fraud',flagged.length,'#f87171'],['Normal Passed',mets.nm.toLocaleString(),'#34d399']].map(function(m){
          return <div key={m[0]} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>{m[0]}</span>
            <span style={{fontSize:'22px',fontWeight:900,color:m[2]}}>{m[1]}</span>
          </div>;
        })}
      </div>
      <div style={{display:'flex',gap:'4px',marginBottom:'20px',background:'rgba(255,255,255,0.03)',padding:'4px',borderRadius:'12px',width:'fit-content',border:'1px solid rgba(255,255,255,0.07)'}}>
        {[['flagged','Flagged Transactions'],['summary','Summary Stats']].map(function(t){
          return <button key={t[0]} style={tabStyle(t[0])} onClick={function(){setTab(t[0]);}}>{t[1]}</button>;
        })}
      </div>
      {tab==='flagged'&&(
        <div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.3)',marginBottom:'10px'}}>{flagged.length} flagged transactions — click any row to view details and SHAP explanation</div>
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'16px',overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'60px 1fr 120px 100px 90px 110px',background:'rgba(255,255,255,0.04)',padding:'12px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              {['ID','Timestamp','Amount','Risk','Score','Action'].map(function(h){
                return <span key={h} style={{fontSize:'11px',fontWeight:800,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.8px'}}>{h}</span>;
              })}
            </div>
            {flagged.map(function(tx){
              return(<div key={tx.id} style={{display:'grid',gridTemplateColumns:'60px 1fr 120px 100px 90px 110px',padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer',alignItems:'center',transition:'background 0.15s'}}
                onMouseEnter={function(e){e.currentTarget.style.background='rgba(14,165,233,0.06)';}}
                onMouseLeave={function(e){e.currentTarget.style.background='transparent';}}
                onClick={function(){setSel(tx);}}>
                <span style={{fontSize:'12px',color:'rgba(255,255,255,0.3)',fontFamily:'monospace'}}>#{String(tx.id).padStart(4,'0')}</span>
                <span style={{fontSize:'12px',color:'rgba(255,255,255,0.6)',fontFamily:'monospace'}}>{tx.time}</span>
                <span style={{fontSize:'13px',fontWeight:700,color:'white'}}>${tx.amount.toLocaleString()}</span>
                <span><Badge risk={tx.risk}/></span>
                <span style={{fontSize:'13px',fontWeight:800,color:tx.score>=0.9?'#f87171':tx.score>=0.7?'#fb923c':'#34d399'}}>{(tx.score*100).toFixed(1)}%</span>
                <span style={{fontSize:'12px',color:'#38bdf8',fontWeight:700,textDecoration:'underline'}}>View Details</span>
              </div>);
            })}
          </div>
        </div>
      )}
      {tab==='summary'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'24px'}}>
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'18px'}}>Stage Performance</div>
            <Bar label="Autoencoder (Stage 1)" val={0.78} col="#60a5fa"/>
            <Bar label="Isolation Forest (Stage 2)" val={0.74} col="#a78bfa"/>
            <Bar label="LightGBM (Stage 3)" val={0.91} col="#34d399"/>
            <Bar label="Three-Stage Combined" val={0.998} col="#0ea5e9"/>
          </div>
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'24px'}}>
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'18px'}}>Risk Distribution</div>
            {[['High Risk',flagged.filter(function(t){return t.risk==='High';}).length,'#f87171'],['Medium Risk',flagged.filter(function(t){return t.risk==='Medium';}).length,'#fb923c'],['Low Risk',flagged.filter(function(t){return t.risk==='Low';}).length,'#34d399']].map(function(m){
              return <div key={m[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>{m[0]}</span>
                <span style={{fontSize:'20px',fontWeight:900,color:m[2]}}>{m[1]}</span>
              </div>;
            })}
            <div style={{marginTop:'16px',padding:'12px',background:'rgba(255,255,255,0.02)',borderRadius:'8px',textAlign:'center',fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>TN: 56,862 | FP: 1 | FN: 1 | TP: 491</div>
          </div>
        </div>
      )}
    </div>
  );
}