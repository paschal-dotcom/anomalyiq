import React,{useState,useRef} from 'react';
import axios from 'axios';
var BASE=window.location.hostname==='localhost'?'http://localhost:8000':'https://strewn-plant-frequent.ngrok-free.dev';
var pg={minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)',padding:'32px',fontFamily:'sans-serif'};
export default function Upload({onDatasetLoaded}){
  var [file,setFile]=useState(null);
  var [dtype,setDtype]=useState('creditcard');
  var [loading,setLoading]=useState(false);
  var [error,setError]=useState('');
  var [success,setSuccess]=useState('');
  var [dragging,setDragging]=useState(false);
  var inputRef=useRef();
  function handleFile(f){
    if(!f)return;
    if(!f.name.endsWith('.csv')){setError('Please upload a CSV file.');return;}
    setFile(f);setError('');setSuccess('');
  }
  function handleUpload(){
    if(!file){setError('Please select a CSV file first.');return;}
    setLoading(true);setError('');setSuccess('');
    var fd=new FormData();
    fd.append('file',file);
    fd.append('dataset_type',dtype);
    axios.post(BASE+'/api/upload',fd,{headers:{'Content-Type':'multipart/form-data','ngrok-skip-browser-warning':'true'}})
      .then(function(res){
        setSuccess('Dataset uploaded! '+(res.data.rows||'')+' rows loaded.');
        onDatasetLoaded&&onDatasetLoaded({...res.data,dataset_type:dtype});
      })
      .catch(function(err){setError(err.response?.data?.detail||'Upload failed. Make sure backend is running.');})
      .finally(function(){setLoading(false);});
  }
  var card={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'28px'};
  var lbl={display:'block',fontSize:'11px',fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:'1.2px',textTransform:'uppercase',marginBottom:'8px'};
  var btn={padding:'13px 28px',borderRadius:'12px',border:'none',cursor:'pointer',fontSize:'14px',fontWeight:800,background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',color:'white'};
  return(
    <div style={pg}>
      <div style={{fontSize:'28px',fontWeight:900,color:'white',marginBottom:'4px'}}>Load Dataset</div>
      <div style={{fontSize:'14px',color:'rgba(255,255,255,0.35)',marginBottom:'32px'}}>Upload your CSV file to run the three-stage fraud detection pipeline</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
        {[['creditcard','Credit Card (MLG-ULB)','EU','European cardholders · 284,807 transactions','#a78bfa'],
          ['paysim','PaySim (African Mobile Money)','NG','African mobile money logs · 6.3M transactions','#0ea5e9']].map(function(d){
          var active=dtype===d[0];
          return(<div key={d[0]} onClick={function(){setDtype(d[0]);}} style={{background:active?'rgba(14,165,233,0.15)':'rgba(255,255,255,0.03)',border:active?'1px solid rgba(14,165,233,0.35)':'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'20px',cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
              <div style={{width:'34px',height:'34px',borderRadius:'8px',background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:d[4]}}>{d[2]}</div>
              <div style={{fontSize:'14px',fontWeight:800,color:'white'}}>{d[1]}</div>
            </div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.38)'}}>{d[3]}</div>
          </div>);
        })}
      </div>
      <div style={{...card,marginBottom:'24px'}}>
        <label style={lbl}>Upload CSV File</label>
        <div onDragOver={function(e){e.preventDefault();setDragging(true);}} onDragLeave={function(){setDragging(false);}}
          onDrop={function(e){e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={function(){inputRef.current.click();}}
          style={{border:dragging?'2px solid #0ea5e9':'2px dashed rgba(255,255,255,0.15)',borderRadius:'12px',padding:'48px 32px',textAlign:'center',cursor:'pointer'}}>
          <input ref={inputRef} type="file" accept=".csv" style={{display:'none'}} onChange={function(e){handleFile(e.target.files[0]);}}/>
          <div style={{fontSize:'36px',marginBottom:'12px'}}>📂</div>
          {file
            ?<div><div style={{fontSize:'15px',fontWeight:700,color:'#38bdf8'}}>{file.name}</div><div style={{fontSize:'12px',color:'rgba(255,255,255,0.35)'}}>{(file.size/1024/1024).toFixed(2)} MB</div></div>
            :<div><div style={{fontSize:'15px',color:'rgba(255,255,255,0.6)',marginBottom:'6px'}}>Drop CSV here or click to browse</div><div style={{fontSize:'12px',color:'rgba(255,255,255,0.3)'}}>Supports .csv files only</div></div>
          }
        </div>
      </div>
      {error&&<div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',color:'#f87171',fontSize:'13px'}}>{error}</div>}
      {success&&<div style={{background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.25)',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',color:'#34d399',fontSize:'13px'}}>{success}</div>}
      <div style={{display:'flex',gap:'12px'}}>
        <button style={btn} onClick={handleUpload} disabled={loading||!file}>{loading?'Uploading...':'Upload Dataset'}</button>
        {file&&<button onClick={function(){setFile(null);setError('');setSuccess('');}} style={{padding:'13px 20px',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.12)',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:'14px',cursor:'pointer'}}>Clear</button>}
      </div>
    </div>
  );
}