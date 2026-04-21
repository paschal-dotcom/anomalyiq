import React,{useState,useEffect,useRef} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

var BASE='http://localhost:8000';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
var STAGES=[
  {key:'preprocessing',label:'Preprocessing',desc:'Scaling and feature engineering'},
  {key:'autoencoder',label:'Autoencoder (Stage 1)',desc:'Training deep neural network'},
  {key:'isolationForest',label:'Isolation Forest (Stage 2)',desc:'Building isolation trees'},
  {key:'lightgbm',label:'LightGBM + SMOTE (Stage 3)',desc:'Training gradient boosting'},
  {key:'results',label:'Results Ready',desc:'Detection complete'},
];

export default function Train({uploadedDataset,onResultsReady,setPipelineStatus}){
  var nav=useNavigate();
  var [running,setRunning]=useState(false);
  var [stagesDone,setStagesDone]=useState({});
  var [currentStage,setCurrentStage]=useState(-1);
  var [done,setDone]=useState(false);
  var [error,setError]=useState('');
  var [pct,setPct]=useState(0);
  var timerRef=useRef(null);

  function startDetection(){
    if(!uploadedDataset){setError('Please upload a dataset first from Load Data page.');return;}
    setRunning(true);setDone(false);setStagesDone({});setCurrentStage(0);setError('');setPct(5);

    // Animate stages every 8 seconds while backend processes
    var i=0;
    timerRef.current=setInterval(function(){
      if(i<STAGES.length-1){
        setCurrentStage(i);
        setPct(Math.round(((i+1)/(STAGES.length))*90));
        setStagesDone(function(p){
          var n=Object.assign({},p);
          n[STAGES[i].key]=true;
          return n;
        });
        setPipelineStatus&&setPipelineStatus(function(p){
          var n=Object.assign({},p);
          n[STAGES[i].key]=true;
          return n;
        });
        i++;
      }
    },8000);

    // Call real backend
    var token=localStorage.getItem('anomalyiq_token');
    axios.post(BASE+'/api/train',
      {dataset_type:uploadedDataset.dataset_type||'creditcard',file_path:uploadedDataset.file_path},
      {headers:{'Authorization':'Bearer '+token},timeout:600000}
    )
    .then(function(res){
      clearInterval(timerRef.current);
      // Mark all stages done
      var allDone={};
      STAGES.forEach(function(s){allDone[s.key]=true;});
      setStagesDone(allDone);
      setPipelineStatus&&setPipelineStatus(allDone);
      setCurrentStage(STAGES.length-1);
      setPct(100);
      setRunning(false);
      setDone(true);
      // Pass results to parent
      onResultsReady&&onResultsReady(res.data, uploadedDataset.dataset_type||'creditcard');
      // Auto navigate to results after 2 seconds
      setTimeout(function(){nav('/results');},2000);
    })
    .catch(function(err){
      clearInterval(timerRef.current);
      setError(err.response?.data?.detail||'Detection failed: '+err.message);
      setRunning(false);
    });
  }

  useEffect(function(){return function(){clearInterval(timerRef.current);};}, []);

  return(<div style={pg}>
    <div style={{position:'absolute',top:'-80px',right:'-80px',width:'350px',height:'350px',borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)',pointerEvents:'none'}}></div>

    <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px',letterSpacing:'-0.5px'}}>Run Detection</div>
    <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'28px'}}>Execute the three-stage hybrid fraud detection pipeline on your uploaded dataset</div>

    {/* Dataset Status */}
    {!uploadedDataset?(
      <div style={{background:'rgba(251,146,60,0.08)',border:'1px solid rgba(251,146,60,0.2)',borderRadius:'12px',padding:'16px 20px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <span style={{fontSize:'24px'}}>⚠️</span>
        <div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#fb923c',marginBottom:'2px'}}>No Dataset Loaded</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>Please go to <strong style={{color:'#38bdf8'}}>Load Data</strong> first and upload your CSV file.</div>
        </div>
      </div>
    ):(
      <div style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:'12px',padding:'16px 20px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <span style={{fontSize:'24px'}}>✅</span>
        <div>
          <div style={{fontSize:'14px',fontWeight:700,color:'#34d399',marginBottom:'2px'}}>Dataset Ready — {uploadedDataset.dataset_type==='creditcard'?'Credit Card (MLG-ULB)':'PaySim (African)'}</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.45)'}}>
            {uploadedDataset.rows?.toLocaleString()||'—'} rows · {uploadedDataset.filename||uploadedDataset.file_path||'uploaded file'}
          </div>
        </div>
      </div>
    )}

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',marginBottom:'28px'}}>

      {/* Pipeline Stages */}
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
        <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'18px'}}>Pipeline Stages</div>
        {STAGES.map(function(s,idx){
          var isDone=stagesDone[s.key];
          var isActive=running&&currentStage===idx&&!isDone;
          return(
            <div key={s.key} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',transition:'all 0.3s',
                background:isDone?'rgba(52,211,153,0.2)':isActive?'rgba(14,165,233,0.2)':'rgba(255,255,255,0.05)',
                border:isDone?'1px solid rgba(52,211,153,0.5)':isActive?'1px solid rgba(14,165,233,0.5)':'1px solid rgba(255,255,255,0.1)'}}>
                {isDone?'✓':isActive?'⟳':idx+1}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'13px',fontWeight:600,transition:'color 0.3s',
                  color:isDone?'#34d399':isActive?'#38bdf8':'rgba(255,255,255,0.4)'}}>{s.label}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',marginTop:'2px'}}>{s.desc}</div>
              </div>
              {isDone&&<span style={{fontSize:'11px',color:'#34d399',fontWeight:700}}>Done ✓</span>}
              {isActive&&<span style={{fontSize:'11px',color:'#38bdf8',fontWeight:700}}>Running...</span>}
            </div>
          );
        })}
      </div>

      {/* Progress + Status */}
      <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

        {/* Progress Bar */}
        {(running||done)&&(
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'16px'}}>Progress</div>
            <div style={{fontSize:'15px',fontWeight:700,color:'white',marginBottom:'14px'}}>
              {done?'🎉 Complete!':STAGES[currentStage]?.label||'Starting...'}
            </div>
            <div style={{height:'10px',background:'rgba(255,255,255,0.08)',borderRadius:'5px',overflow:'hidden',marginBottom:'10px'}}>
              <div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#0ea5e9,#8b5cf6)',borderRadius:'5px',transition:'width 0.8s ease'}}></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>
              <span>{done?'Detection complete — redirecting to Results...':'Processing your dataset...'}</span>
              <span style={{fontWeight:700,color:'#38bdf8'}}>{pct}%</span>
            </div>
          </div>
        )}

        {/* Success */}
        {done&&(
          <div style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:'16px',padding:'24px',textAlign:'center'}}>
            <div style={{fontSize:'40px',marginBottom:'10px'}}>🎉</div>
            <div style={{fontSize:'18px',fontWeight:900,color:'#34d399',marginBottom:'8px'}}>Detection Complete!</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginBottom:'16px'}}>Redirecting you to Results in 2 seconds...</div>
            <button onClick={function(){nav('/results');}} style={{padding:'10px 24px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:700,background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',color:'white'}}>
              Go to Results Now →
            </button>
          </div>
        )}

        {/* Error */}
        {error&&(
          <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'16px',padding:'20px'}}>
            <div style={{fontSize:'14px',fontWeight:700,color:'#f87171',marginBottom:'8px'}}>⚠️ Detection Failed</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',lineHeight:1.6}}>{error}</div>
          </div>
        )}

        {/* Expected Results */}
        {!running&&!done&&(
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
            <div style={{fontSize:'13px',fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'14px'}}>Expected Results</div>
            {[['Credit Card','99.80%','Precision · Recall · F1','100%','AUC-ROC','#a78bfa'],
              ['PaySim','99.26%','Precision','99.93%','AUC-ROC','#0ea5e9']].map(function(d){return(
              <div key={d[0]} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',fontWeight:600}}>{d[0]}</span>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'12px',fontWeight:700,color:d[5]}}>{d[1]} {d[2]}</div>
                  <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{d[3]} {d[4]}</div>
                </div>
              </div>
            );})}
          </div>
        )}

        {/* Time estimate */}
        {running&&(
          <div style={{background:'rgba(14,165,233,0.06)',border:'1px solid rgba(14,165,233,0.15)',borderRadius:'12px',padding:'16px'}}>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',lineHeight:1.7}}>
              <div style={{fontWeight:700,color:'#38bdf8',marginBottom:'4px'}}>⏱ Estimated Time</div>
              <div>Credit Card (284K rows): ~5-10 minutes</div>
              <div>PaySim (6.3M rows): ~20-40 minutes</div>
              <div style={{marginTop:'6px',color:'rgba(255,255,255,0.3)'}}>Please keep this page open while detection runs.</div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Start Button */}
    {!done&&(
      <button onClick={startDetection} disabled={running||!uploadedDataset}
        style={{padding:'16px 48px',borderRadius:'14px',border:'none',
          cursor:running||!uploadedDataset?'not-allowed':'pointer',
          fontSize:'16px',fontWeight:800,transition:'all 0.2s',
          background:running||!uploadedDataset?'rgba(255,255,255,0.08)':'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
          color:running||!uploadedDataset?'rgba(255,255,255,0.3)':'white',
          boxShadow:running||!uploadedDataset?'none':'0 6px 24px rgba(14,165,233,0.35)'}}>
        {running?'⟳ Running Detection...':'▶ Start Detection Pipeline'}
      </button>
    )}
  </div>);
}