import { useState } from 'react';
import axios from 'axios';
const BASE = process.env.REACT_APP_API_URL || (window.location.hostname==='localhost' ? 'http://localhost:8000' : 'https://anomalyiq-api.onrender.com');
export default function Login({ onLogin }) {
  const [tab,setTab]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPass]=useState('');
  const [fullName,setName]=useState('');
  const [role,setRole]=useState('analyst');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const handle=async(e)=>{
    e.preventDefault(); setError(''); setLoading(true);
    try{
      const url=tab==='login'?'/api/auth/login':'/api/auth/register';
      const body=tab==='login'?{email,password}:{email,password,full_name:fullName,role};
      const{data}=await axios.post(BASE+url,body);
      localStorage.setItem('anomalyiq_token',data.token);
      localStorage.setItem('anomalyiq_user',JSON.stringify({email:data.email,full_name:data.full_name,role:data.role}));
      onLogin(data);
    }catch(err){setError(err.response?.data?.detail||'Something went wrong.');}
    finally{setLoading(false);}
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center"><span className="text-white text-lg font-bold">A</span></div>
            <div className="text-left"><div className="text-white font-bold text-xl">AnomalyIQ</div><div className="text-teal-400 text-xs font-semibold">v2.0 Three-Stage Hybrid</div></div>
          </div>
          <p className="text-slate-400 text-sm">Intelligent Anomaly Detection for Stockbroking</p>
          <p className="text-slate-500 text-xs mt-1">Godfrey Okoye University Final Year Project 2024/2025</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-slate-100">
            {['login','register'].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setError('');}}
                className={"flex-1 py-4 text-sm font-semibold "+(tab===t?'text-teal-600 border-b-2 border-teal-500 bg-teal-50':'text-slate-400')}>
                {t==='login'?'Sign In':'Create Account'}
              </button>
            ))}
          </div>
          <form onSubmit={handle} className="p-8 space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-slate-800 font-bold text-xl">{tab==='login'?'Welcome back':'Create your account'}</h2>
            </div>
            {tab==='register'&&<div><label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label><input value={fullName} onChange={e=>setName(e.target.value)} required placeholder="Your full name" className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-400 outline-none text-slate-800"/></div>}
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-400 outline-none text-slate-800"/></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">Password</label><input type="password" value={password} onChange={e=>setPass(e.target.value)} required placeholder="Password" className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-400 outline-none text-slate-800"/></div>
            {tab==='register'&&<div><label className="block text-xs font-semibold text-slate-600 mb-1">Role</label><select value={role} onChange={e=>setRole(e.target.value)} className="w-full border rounded-xl px-4 py-3 text-sm text-slate-800 bg-white"><option value="analyst">Data Analyst</option><option value="compliance">Compliance Officer</option><option value="admin">Administrator</option></select></div>}
            {error&&<div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
            {tab==='login'&&<div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3"><p className="text-teal-700 text-xs font-semibold mb-1">Default Admin</p><p className="text-teal-600 text-xs">admin@anomalyiq.com / Admin@1234</p></div>}
            <button type="submit" disabled={loading} className={"w-full py-3.5 rounded-xl font-semibold text-sm "+(loading?'bg-slate-200 text-slate-400':'bg-teal-500 hover:bg-teal-600 text-white')}>
              {loading?'Please wait...':(tab==='login'?'Sign In':'Create Account')}
            </button>
            <p className="text-center text-slate-400 text-xs pt-1">
              {tab==='login'?"Don't have an account? ":"Already have an account? "}
              <button type="button" onClick={()=>{setTab(tab==='login'?'register':'login');setError('');}} className="text-teal-500 font-semibold">{tab==='login'?'Create one':'Sign in'}</button>
            </p>
          </form>
        </div>
        <p className="text-center text-slate-600 text-xs mt-6">AnomalyIQ v2.0 Godfrey Okoye University</p>
      </div>
    </div>
  );
}
