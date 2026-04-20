import React,{useState,useEffect,useRef} from 'react';
import axios from 'axios';
var BASE=window.location.hostname==='localhost'?'http://localhost:8000':'https://strewn-plant-frequent.ngrok-free.dev';
var HEADERS={'ngrok-skip-browser-warning':'true'};
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var STAGES=[
  {key:'preprocessing',label:'Preprocessing',desc:'Scaling and feature engineering'},
  {key:'autoencoder',label:'Autoencoder (Stage 1)',desc:'Training deep neural network'},
  {key:'isolationForest',label:'Isolation Forest (Stage 2)',desc:'Building isolation trees'},
  {key:'lightgbm',label:'LightGBM + SMOTE (Stage 3)',desc:'Training gradient boosting'},
];
export default function Train({uploadedDataset,onResultsReady,setPipelineStatus}){
  var [running,setRunning]=useState(false);
  var [stagesDone,setStagesDone]=useState({});
  var [progress,setProgress]=useState(null);
  var [done,setDone]=useState(false);
  var [error,setError]=useState('');
  var timerRef=useRef(null);

  function startDetection(){
    if(!uploadedDataset){setError('Please upload a dataset first.');return;}
    setRunning(true);setDone(false);setStagesDone({});setError('');
    setProgress({label:'Starting pipeline...',pct:5});

    // Animate stages while backend processes
    var i=0;
    timerRef.current=setInterval(function(){
      if(i<STAGES.length){
        var s=STAGES[i];
        setProgress({label:s.label,pct:Math.round(((i+1)/STAGES.length)*85)});
        setStagesDone(function(p){var n=Object.assign({},p);n[s.key]=true;return n;});
        setPipelineStatus&&setPipelineStatus(function(p){var n=Object.assign({},p);n[s.key]=true;return n;});
        i++;
      }
    },4000);

    // Call real backend
    var token=localStorage.getItem('anomalyiq_token');
    axios.post(BASE+'/api/train',
      {dataset_type:uploadedDataset.dataset_type||'creditcard', file_path:uploadedDataset.file_path},
      {headers:Object.assign({},HEADERS,{'Authorization':'Bearer '+token}), timeout:300000}
    )
    .then(function(res){
      clearInterval(timerRef.current);
      setProgress({label:'Complete!',pct:100});
      setRunning(false);setDone(true);
      var r=res.data;
      var dtype=uploadedDataset.dataset_type||'creditcard';
      setPipelineStatus&&setPipelineStatus(function(p){return Object.assign({},p,{results:true});});
      onResultsReady&&onResultsReady(r,dtype);
    })
    .catch(function(err){
      clearInterval(timerRef.current);
      setError(err.response?.data?.detail||'Detection failed. Check backend is running.');
      setRunning(false);setProgress(null);
    });
  }

  useEffect(function(){return function(){clearInterval(timerRef.current);};}, []);

  return(<div style={pg}>
    <div style={{position:'absolute',top:'-80px',right:'-80px',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)',pointerEvents:'none'}}></div>
    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Run Detection</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'24px'}}>Execute the three-stage hybrid fraud detection pipeline on your dataset</div>

    {!uploadedDataset&&(
      <div style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'12px',padding:'16px 20px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <span style={{fontSize:'20px'}}>⚠️</span>
        <div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#fb923c',marginBottom:'2px'}}>No Dataset Loaded</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>Go to Load Data first to upload your CSV, then return here.</div>
        </div>
      </div>
    )}

    {uploadedDataset&&(
      <div style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:'12px',padding:'16px 20px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <span style={{fontSize:'20px'}}>✅</span>
        <div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#34d399',marginBottom:'2px'}}>Dataset Ready</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>{uploadedDataset.dataset_type==='creditcard'?'Credit Card (MLG-ULB)':'PaySim (African)'} · {uploadedDataset.rows?.toLocaleString()||'—'} rows</div>
        </div>
      </div>
    )}

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'28px'}}>
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
        <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'18px'}}>Pipeline Stages</div>
        {STAGES.map(function(s){
          var isDone=stagesDone[s.key];
          var isActive=running&&progress?.label===s.label;
          return(
            <div key={s.key} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',
                background:isDone?'rgba(52,211,153,0.2)':isActive?'rgba(14,165,233,0.2)':'rgba(255,255,255,0.05)',
                border:isDone?'1px solid rgba(52,211,153,0.4)':isActive?'1px solid rgba(14,165,233,0.4)':'1px solid rgba(255,255,255,0.08)'}}>
                {isDone?'✓':isActive?'⟳':'○'}
              </div>
              <div>
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
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px'}}>Progress</div>
            <div style={{fontSize:'14px',fontWeight:700,color:'white',marginBottom:'12px'}}>{progress.label}</div>
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
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Go to Results to see flagged transactions.</div>
          </div>
        )}

        {error&&(
          <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'16px',padding:'20px'}}>
            <div style={{fontSize:'14px',fontWeight:700,color:'#f87171',marginBottom:'6px'}}>Detection Failed</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)',lineHeight:1.6}}>{error}</div>
          </div>
        )}

        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
          <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px'}}>Expected Metrics</div>
          {[['Credit Card','99.80%','Precision · Recall · F1','100%','AUC-ROC','#a78bfa'],
            ['PaySim','99.26%','Precision','99.93%','AUC-ROC','#0ea5e9']].map(function(d){return(
            <div key={d[0]} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{d[0]}</span>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'12px',fontWeight:700,color:d[5]}}>{d[1]} {d[2]}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{d[3]} {d[4]}</div>
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>

    <button onClick={startDetection} disabled={running||!uploadedDataset}
      style={{padding:'15px 40px',borderRadius:'14px',border:'none',
        cursor:running||!uploadedDataset?'not-allowed':'pointer',fontSize:'15px',fontWeight:800,
        background:running||!uploadedDataset?'rgba(255,255,255,0.08)':'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
        color:running||!uploadedDataset?'rgba(255,255,255,0.3)':'white',transition:'all 0.2s'}}>
      {running?'Running Detection...':done?'Run Again':'Start Detection Pipeline'}
    </button>
    {running&&<div style={{marginTop:'12px',fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>
      Detection is running on your local backend. This may take 2-5 minutes for large datasets.
    </div>}
  </div>);
}