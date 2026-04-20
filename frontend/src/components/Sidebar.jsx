import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Upload, Cpu, BarChart3, Zap, Download, GitCompare, Microscope, Users, Shield } from 'lucide-react';

var ALL_LINKS = [
  { to:'/', label:'Home', icon:Home, roles:['admin','analyst','compliance'] },
  { to:'/upload', label:'Load Data', icon:Upload, roles:['admin','analyst'] },
  { to:'/train', label:'Run Detection', icon:Cpu, roles:['admin','analyst'] },
  { to:'/results', label:'Results', icon:BarChart3, roles:['admin','analyst','compliance'] },
  { to:'/compare', label:'Model Compare', icon:GitCompare, roles:['admin','analyst','compliance'] },
  { to:'/score', label:'Live Scoring', icon:Zap, roles:['admin','analyst','compliance'] },
  { to:'/export', label:'Export', icon:Download, roles:['admin','analyst','compliance'] },
  { to:'/explain', label:'Explainability', icon:Microscope, roles:['admin','analyst','compliance'] },
  { to:'/audit', label:'Audit Logs', icon:Shield, roles:['admin','compliance'] },
  { to:'/users', label:'User Management', icon:Users, roles:['admin'] },
];

var ROLE_COLORS = { admin:'#f87171', analyst:'#34d399', compliance:'#fb923c' };
var ROLE_BADGES = { admin:'ADMIN', analyst:'ANALYST', compliance:'COMPLIANCE' };

var steps=[
  {label:'Data Loaded',key:'dataLoaded'},
  {label:'Preprocessing',key:'preprocessing'},
  {label:'Autoencoder',key:'autoencoder'},
  {label:'Isolation Forest',key:'isolationForest'},
  {label:'LightGBM + SMOTE',key:'lightgbm'},
  {label:'Results Ready',key:'results'},
];

function navStyle(active){
  return {display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',
    marginBottom:'2px',fontSize:'13px',fontWeight:600,textDecoration:'none',transition:'all 0.15s',
    background:active?'linear-gradient(135deg,rgba(14,165,233,0.18),rgba(139,92,246,0.12))':'transparent',
    color:active?'#38bdf8':'rgba(255,255,255,0.45)',
    border:active?'1px solid rgba(14,165,233,0.22)':'1px solid transparent'};
}

export default function Sidebar({pipelineStatus,user,onLogout}){
  var ps=pipelineStatus||{};
  var role=(user?.role||'analyst').toLowerCase();
  var links=ALL_LINKS.filter(function(l){return l.roles.includes(role);});
  var roleColor=ROLE_COLORS[role]||'#34d399';
  var roleBadge=ROLE_BADGES[role]||role.toUpperCase();

  return(
    <aside style={{position:'fixed',left:0,top:0,height:'100vh',width:'260px',
      background:'linear-gradient(180deg,#0f172a 0%,#1e1b4b 100%)',
      borderRight:'1px solid rgba(255,255,255,0.07)',
      display:'flex',flexDirection:'column',zIndex:50,fontFamily:'sans-serif'}}>

      <div style={{padding:'24px 20px 18px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',
            background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:900,color:'white'}}>A</div>
          <div>
            <div style={{fontSize:'18px',fontWeight:900,color:'white'}}>AnomalyIQ</div>
            <div style={{fontSize:'11px',color:'rgba(14,165,233,0.8)',fontWeight:700}}>v2.0 Three-Stage Hybrid</div>
          </div>
        </div>
      </div>

      <nav style={{flex:1,padding:'14px 12px',overflowY:'auto'}}>
        <div style={{fontSize:'10px',fontWeight:800,color:'rgba(255,255,255,0.22)',
          letterSpacing:'2px',textTransform:'uppercase',padding:'0 8px',marginBottom:'8px'}}>
          My Workspace
        </div>

        {links.map(function(item){
          var Icon=item.icon;
          return(<NavLink key={item.to} to={item.to} end={item.to==='/'} style={function(p){return navStyle(p.isActive);}}>
            <Icon size={15} strokeWidth={2}/>{item.label}
          </NavLink>);
        })}

        {role==='compliance'&&(
          <div style={{margin:'12px 8px 0',padding:'12px',background:'rgba(251,146,60,0.08)',
            border:'1px solid rgba(251,146,60,0.2)',borderRadius:'10px'}}>
            <div style={{fontSize:'10px',fontWeight:800,color:'#fb923c',marginBottom:'4px'}}>READ-ONLY ACCESS</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',lineHeight:1.5}}>
              You can view and export results. Contact an admin to run new detections.
            </div>
          </div>
        )}

        <div style={{marginTop:'18px',paddingTop:'14px',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
          <div style={{fontSize:'10px',fontWeight:800,color:'rgba(255,255,255,0.22)',
            letterSpacing:'2px',textTransform:'uppercase',padding:'0 8px',marginBottom:'10px'}}>
            Pipeline Status
          </div>
          {steps.map(function(step){
            var done=!!ps[step.key];
            return(<div key={step.key} style={{display:'flex',alignItems:'center',gap:'10px',
              padding:'6px 8px',borderRadius:'8px',marginBottom:'1px'}}>
              <div style={{width:'7px',height:'7px',borderRadius:'50%',flexShrink:0,
                background:done?'#0ea5e9':'rgba(255,255,255,0.1)',
                boxShadow:done?'0 0 6px rgba(14,165,233,0.7)':'none'}}></div>
              <span style={{fontSize:'12px',
                color:done?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.22)',
                fontWeight:done?600:400}}>{step.label}</span>
              {done&&<span style={{marginLeft:'auto',fontSize:'10px',color:'#0ea5e9',fontWeight:800}}>Done</span>}
            </div>);
          })}
        </div>
      </nav>

      <div style={{padding:'16px 20px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',lineHeight:1.8,marginBottom:'12px'}}>
          <div style={{fontWeight:600,color:'rgba(255,255,255,0.4)'}}>Godfrey Okoye University</div>
          <div>Dept. of Computer Science</div>
          <div style={{color:'rgba(14,165,233,0.6)',fontWeight:700}}>Final Year Project 2024/25</div>
        </div>
        {user&&(
          <div style={{paddingTop:'12px',borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
              <div style={{width:'34px',height:'34px',borderRadius:'50%',flexShrink:0,
                background:'linear-gradient(135deg,'+roleColor+',rgba(139,92,246,0.8))',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'white',fontSize:'13px',fontWeight:800}}>
                  {(user.full_name||'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'12px',fontWeight:700,color:'white',
                  whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                  {user.full_name}
                </div>
                <div style={{display:'inline-flex',marginTop:'3px',
                  background:'rgba(255,255,255,0.06)',borderRadius:'4px',padding:'2px 6px'}}>
                  <span style={{fontSize:'9px',fontWeight:800,color:roleColor,letterSpacing:'0.5px'}}>
                    {roleBadge}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onLogout} style={{width:'100%',padding:'8px 12px',borderRadius:'8px',
              border:'1px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.06)',
              color:'#f87171',fontSize:'12px',fontWeight:700,cursor:'pointer',textAlign:'left'}}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}