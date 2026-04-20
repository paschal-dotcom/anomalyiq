import React,{useState,useEffect,useRef} from 'react';
import axios from 'axios';
var BASE=window.location.hostname==='localhost'?'http://localhost:8000':'https://strewn-plant-frequent.ngrok-free.dev';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var STAGES=[
  {key:'dataLoaded',label:'Data Loaded',desc:'Dataset uploaded and validated'},
  {key:'preprocessing',label:'Preprocessing',desc:'Scaling and feature engineering'},
  {key:'autoencoder',label:'Autoencoder (Stage 1)',desc:'Training deep neural network'},
  {key:'isolationForest',label:'Isolation Forest (Stage 2)',desc:'Building isolation trees'},
  {key:'lightgbm',label:'LightGBM + SMOTE (Stage 3)',desc:'Training gradient boosting'},
  {key:'results',label:'Results Ready',desc:'Detection complete'},
];
export default function Train({uploadedDataset,onResultsReady,setPipelineStatus}){
  var [running,setRunning]=useState(false);
  var [progress,setProgress]=useState(null);
  var [error,setError]=useState('');
  var [done,setDone]=useState(false);
  var [stagesDone,setStagesDone]=useState({});
  var pollRef=useRef(null);

  function startDetection(){
    if(!uploadedDataset){setError('Please upload a dataset first from the Load Data page.');return;}
    setRunning(true);setError('');setDone(false);setStagesDone({});setProgress({stage:'Starting...',pct:0,message:'Initializing pipeline...'});
    axios.post(BASE+'/api/train',{dataset_type:uploadedDataset.dataset_type||'creditcard',file_path:uploadedDataset.file_path})
      .then(function(res){
        setDone(true);setRunning(false);
        var r=res.data;
        setPipelineStatus&&setPipelineStatus(function(p){return Object.assign({},p,{autoencoder:true,isolationForest:true,lightgbm:true,results:true});});
        onResultsReady&&onResultsReady(r,uploadedDataset.dataset_type||'creditcard');
        setProgress({stage:'Complete',pct:100,message:'Detection finished successfully!'});
      })
      .catch(function(e){
        setError(e.response?.data?.detail||'Detection failed. Make sure a dataset is uploaded and the backend is running.');
        setRunning(false);
        setProgress(null);
      });
    var stages=['preprocessing','autoencoder','isolationForest','lightgbm'];
    var i=0;
    pollRef.current=setInterval(function(){
      if(i<stages.length){
        var pct=Math.round(((i+1)/stages.length)*90);
        setProgress({stage:STAGES.find(function(s){return s.key===stages[i];})?.label||stages[i],pct:pct,message:'Running stage '+(i+1)+' of '+stages.length+'...'});
        setStagesDone(function(prev){var n={...prev};n[stages[i]]=true;return n;});
        setPipelineStatus&&setPipelineStatus(function(p){var n=Object.assign({},p);n[stages[i]]=true;return n;});
        i++;
      } else { clearInterval(pollRef.current); }
    },3000);
  }

  useEffect(function(){return function(){clearInterval(pollRef.current);};}, []);

  return(<div style={pg}>
    <div style={{position:'absolute',top:'-80px',right:'-80px',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)',pointerEvents:'none'}}></div>
    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Run Detection</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'32px'}}>Execute the three-stage hybrid fraud detection pipeline on your dataset</div>

    {!uploadedDataset&&(
      <div style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'12px',padding:'16px 20px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <span style={{fontSize:'20px'}}>⚠️</span>
        <div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#fb923c',marginBottom:'2px'}}>No Dataset Loaded</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>Go to Load Data first to upload your CSV file, then come back here to run detection.</div>
        </div>
      </div>
    )}

    {uploadedDataset&&(
      <div style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:'12px',padding:'16px 20px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <span style={{fontSize:'20px'}}>✅</span>
        <div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#34d399',marginBottom:'2px'}}>Dataset Ready</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>{uploadedDataset.dataset_type==='creditcard'?'Credit Card (MLG-ULB)':'PaySim (African)'} · {uploadedDataset.rows||'Unknown'} rows loaded</div>
        </div>
      </div>
    )}

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'28px'}}>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
        <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'18px'}}>Pipeline Stages</div>
        {STAGES.slice(1).map(function(s){
          var isDone=stagesDone[s.key];
          var isActive=running&&progress?.stage===s.label;
          return(
            <div key={s.key} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:isDone?'rgba(52,211,153,0.2)':isActive?'rgba(14,165,233,0.2)':'rgba(255,255,255,0.05)',border:isDone?'1px solid rgba(52,211,153,0.4)':isActive?'1px solid rgba(14,165,233,0.4)':'1px solid rgba(255,255,255,0.08)'}}>
                <span style={{fontSize:'13px'}}>{isDone?'✓':isActive?'⟳':'○'}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'13px',fontWeight:600,color:isDone?'#34d399':isActive?'#38bdf8':'rgba(255,255,255,0.45)'}}>{s.label}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',marginTop:'1px'}}>{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        {progress&&(
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'16px'}}>Progress</div>
            <div style={{fontSize:'15px',fontWeight:700,color:'white',marginBottom:'6px'}}>{progress.stage}</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'14px'}}>{progress.message}</div>
            <div style={{height:'8px',background:'rgba(255,255,255,0.08)',borderRadius:'4px',overflow:'hidden',marginBottom:'8px'}}>
              <div style={{height:'100%',width:progress.pct+'%',background:'linear-gradient(90deg,#0ea5e9,#8b5cf6)',borderRadius:'4px',transition:'width 0.5s ease'}}></div>
            </div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)',textAlign:'right'}}>{progress.pct}%</div>
          </div>
        )}

        {done&&(
          <div style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:'16px',padding:'24px',textAlign:'center'}}>
            <div style={{fontSize:'32px',marginBottom:'8px'}}>🎉</div>
            <div style={{fontSize:'16px',fontWeight:800,color:'#34d399',marginBottom:'6px'}}>Detection Complete!</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Navigate to Results to see flagged transactions and metrics.</div>
          </div>
        )}

        {error&&(
          <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'16px',padding:'20px'}}>
            <div style={{fontSize:'14px',fontWeight:700,color:'#f87171',marginBottom:'6px'}}>Detection Failed</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>{error}</div>
          </div>
        )}

        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
          <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'16px'}}>Expected Results</div>
          {[['Credit Card','99.80%','Precision/Recall/F1','100%','AUC-ROC','#a78bfa'],['PaySim','99.26%','Precision','99.93%','AUC-ROC','#0ea5e9']].map(function(d){return(
            <div key={d[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{d[0]}</span>
              <div style={{display:'flex',gap:'12px'}}>
                <span style={{fontSize:'12px',fontWeight:700,color:d[5]}}>{d[1]} {d[2]}</span>
                <span style={{fontSize:'12px',fontWeight:700,color:d[5]}}>{d[3]} {d[4]}</span>
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>

    {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',color:'#f87171',fontSize:'13px'}}>{error}</div>}

    <button
      onClick={startDetection}
      disabled={running||!uploadedDataset}
      style={{padding:'15px 40px',borderRadius:'14px',border:'none',cursor:running||!uploadedDataset?'not-allowed':'pointer',fontSize:'15px',fontWeight:800,background:running||!uploadedDataset?'rgba(255,255,255,0.08)':'linear-gradient(135deg,#0ea5e9,#8b5cf6)',color:running||!uploadedDataset?'rgba(255,255,255,0.3)':'white',boxShadow:running||!uploadedDataset?'none':'0 6px 24px rgba(14,165,233,0.38)',transition:'all 0.2s'}}>
      {running?'Running Detection...':done?'Run Again':'Start Detection Pipeline'}
    </button>
    <div style={{marginTop:'12px',fontSize:'12px',color:'rgba(255,255,255,0.25)'}}>
      Note: First run may take 2-3 minutes as the backend wakes up. Visit <span style={{color:'#38bdf8'}}>anomalyiq-api.onrender.com/api/health</span> first to wake it up.
    </div>
  </div>);
}
