import React from 'react';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var DEMO_RESULTS={precision:99.80,recall:99.80,f1:99.80,auc:100.0,total:57355,fraud:491,normal:56862,flagged:[
  {id:1,time:'2024-01-15 09:23:41',amount:284.95,risk:'High',score:0.94},{id:2,time:'2024-01-15 11:47:22',amount:1452.30,risk:'High',score:0.91},
  {id:3,time:'2024-01-15 14:05:09',amount:67.50,risk:'Medium',score:0.72},{id:4,time:'2024-01-15 16:33:58',amount:5890.00,risk:'High',score:0.97},
]};
function downloadCSV(data,filename){
  var rows=[['ID','Timestamp','Amount','Risk Level','Combined Score']];
  data.forEach(function(t){rows.push([t.id,t.time,t.amount,t.risk,t.score]);});
  var csv=rows.map(function(r){return r.join(',');}).join('\n');
  var blob=new Blob([csv],{type:'text/csv'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
function downloadJSON(data,filename){
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
export default function Export({results,datasetType}){
  var r=results||DEMO_RESULTS;
  var flagged=r.flagged||DEMO_RESULTS.flagged;
  var isDemo=!results;
  var card={background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px',marginBottom:'16px'};
  var btn={padding:'12px 24px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',color:'white',marginRight:'10px',marginTop:'10px'};
  return(<div style={pg}>
    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Export Results</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'24px'}}>Download your detection results and reports</div>
    {isDemo&&<div style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'10px',padding:'10px 16px',marginBottom:'20px',fontSize:'13px',color:'#fb923c'}}>Showing demo data — run a detection first to export your actual results.</div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}}>
      {[['Total',r.total?.toLocaleString()||'57,355','rgba(255,255,255,0.8)'],['Flagged',flagged.length,'#f87171'],['Precision',(r.precision||99.80).toFixed(2)+'%','#0ea5e9'],['AUC-ROC',(r.auc||100.0).toFixed(2)+'%','#34d399']].map(function(m){return(
        <div key={m[0]} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px',textAlign:'center'}}>
          <div style={{fontSize:'22px',fontWeight:900,color:m[2]}}>{m[1]}</div>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',marginTop:'4px',textTransform:'uppercase',letterSpacing:'0.8px'}}>{m[0]}</div>
        </div>
      );})}
    </div>
    <div style={card}>
      <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Flagged Transactions</div>
      <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'16px'}}>{flagged.length} transactions flagged as suspicious</div>
      <button style={btn} onClick={function(){downloadCSV(flagged,'anomalyiq_flagged_transactions.csv');}}>Download CSV</button>
      <button style={{...btn,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)'}} onClick={function(){downloadJSON(flagged,'anomalyiq_flagged_transactions.json');}}>Download JSON</button>
    </div>
    <div style={card}>
      <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Full Report</div>
      <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'16px'}}>Complete detection metrics and summary</div>
      <button style={btn} onClick={function(){downloadJSON({metrics:{precision:r.precision||99.80,recall:r.recall||99.80,f1:r.f1||99.80,auc:r.auc||100},summary:{total:r.total||57355,fraud_detected:flagged.length,normal_passed:r.normal||56862},dataset:datasetType||'creditcard',flagged:flagged},'anomalyiq_full_report.json');}}>Download Full Report</button>
    </div>
    <div style={card}>
      <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'10px'}}>Performance Summary</div>
      {[['Precision',(r.precision||99.80).toFixed(2)+'%','#0ea5e9'],['Recall',(r.recall||99.80).toFixed(2)+'%','#a78bfa'],['F1-Score',(r.f1||99.80).toFixed(2)+'%','#34d399'],['AUC-ROC',(r.auc||100).toFixed(2)+'%','#fb923c']].map(function(m){return(
        <div key={m[0]} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
          <span style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>{m[0]}</span>
          <span style={{fontSize:'14px',fontWeight:800,color:m[2]}}>{m[1]}</span>
        </div>
      );})}
    </div>
  </div>);
}
