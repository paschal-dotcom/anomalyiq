import React,{useState} from 'react';
import axios from 'axios';
var BASE=window.location.hostname==='localhost'?'http://localhost:8000':'https://strewn-plant-frequent.ngrok-free.dev';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var inp={width:'100%',padding:'12px 16px',borderRadius:'10px',border:'1.5px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.06)',color:'white',fontSize:'14px',outline:'none',boxSizing:'border-box',marginBottom:'16px'};
var lbl={display:'block',fontSize:'11px',fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:'8px'};
export default function Score({datasetType}){
  var [fields,setFields]=useState({Amount:'',V1:'',V2:'',V4:'',V14:'',V17:''});
  var [result,setResult]=useState(null);
  var [loading,setLoading]=useState(false);
  var [error,setError]=useState('');
  function handleChange(k,v){setFields(function(f){var n={...f};n[k]=v;return n;});}
  function handleScore(){
    setLoading(true);setError('');setResult(null);
    axios.post(BASE+'/api/score',{features:fields,dataset_type:datasetType||'creditcard'})
      .then(function(r){setResult(r.data);})
      .catch(function(e){setError(e.response?.data?.detail||'Scoring failed.');})
      .finally(function(){setLoading(false);});
  }
  var riskColor=result?{High:'#f87171',Medium:'#fb923c',Low:'#34d399',Normal:'#34d399'}[result.risk_level]||'#38bdf8':'#38bdf8';
  return(<div style={pg}>
    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Live Scoring</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'32px'}}>Score an individual transaction across all three detection stages</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
        <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'20px'}}>Transaction Features</div>
        {Object.keys(fields).map(function(k){return(<div key={k}><label style={lbl}>{k}</label><input style={inp} type="number" step="any" value={fields[k]} onChange={function(e){handleChange(k,e.target.value);}} placeholder={'Enter '+k}/></div>);})}
        {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'10px',padding:'12px',marginBottom:'16px',color:'#f87171',fontSize:'13px'}}>{error}</div>}
        <button onClick={handleScore} disabled={loading} style={{width:'100%',padding:'14px',borderRadius:'12px',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:800,background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',color:'white'}}>
          {loading?'Scoring...':'Score This Transaction'}
        </button>
      </div>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'}}>
        <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'20px'}}>Result</div>
        {result?(
          <div>
            <div style={{textAlign:'center',marginBottom:'28px'}}>
              <div style={{fontSize:'48px',fontWeight:900,color:riskColor,marginBottom:'8px'}}>{result.risk_level||'Normal'}</div>
              <div style={{fontSize:'14px',color:'rgba(255,255,255,0.4)'}}>Combined Score: <span style={{color:'white',fontWeight:800}}>{result.combined_score?(result.combined_score*100).toFixed(1)+'%':'N/A'}</span></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
              {[['Autoencoder',result.ae_score,'#60a5fa'],['Iso Forest',result.if_score,'#a78bfa'],['LightGBM',result.lgbm_score,'#34d399']].map(function(m){return(
                <div key={m[0]} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'14px',textAlign:'center'}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',marginBottom:'6px'}}>{m[0]}</div>
                  <div style={{fontSize:'20px',fontWeight:900,color:m[2]}}>{m[1]?(m[1]*100).toFixed(1)+'%':'—'}</div>
                </div>
              );})}
            </div>
            <div style={{marginTop:'20px',padding:'14px',background:'rgba(14,165,233,0.07)',border:'1px solid rgba(14,165,233,0.15)',borderRadius:'10px',fontSize:'13px',color:'rgba(255,255,255,0.55)'}}>
              {result.recommendation||'Analysis complete.'}
            </div>
          </div>
        ):(
          <div style={{textAlign:'center',padding:'60px 0',color:'rgba(255,255,255,0.2)'}}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🎯</div>
            <div>Enter feature values and click Score to see results</div>
          </div>
        )}
      </div>
    </div>
  </div>);
}
