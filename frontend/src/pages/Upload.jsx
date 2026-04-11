// src/pages/Upload.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload as UploadIcon, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button, Card, SectionHeader, DatasetTypeBadge } from '../components/UI';
import { uploadDataset } from '../utils/api';

export default function Upload({ onDatasetLoaded }) {
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);
  const [error,   setError]     = useState(null);
  const nav = useNavigate();

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const file = accepted[0];
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await uploadDataset(file);
      setResult(res.data);
      onDatasetLoaded && onDatasetLoaded(res.data);
      toast.success(`Dataset loaded — ${res.data.summary.total_records.toLocaleString()} records`);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message;
      setError(msg);
      toast.error('Upload failed: ' + msg);
    } finally {
      setLoading(false);
    }
  }, [onDatasetLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-800">Load Dataset</h1>
        <p className="text-slate-500 mt-1">
          Upload a CSV file. The system automatically detects whether it is a
          CreditCard or PaySim dataset.
        </p>
      </div>

      {/* Dropzone */}
      <Card>
        <SectionHeader title="Upload Transaction Data" icon="📂" />
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer
                      transition-all duration-200
                      ${isDragActive
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'}
                      ${loading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <UploadIcon size={28} className="text-teal-500" strokeWidth={1.5} />
          </div>
          {isDragActive ? (
            <p className="text-teal-600 font-semibold text-lg">Drop your CSV here</p>
          ) : loading ? (
            <p className="text-slate-500 font-semibold">Processing dataset...</p>
          ) : (
            <>
              <p className="text-slate-700 font-semibold text-lg mb-2">
                Drag & drop your CSV file here
              </p>
              <p className="text-slate-400 text-sm">or click to browse files</p>
              <p className="text-slate-300 text-xs mt-3">
                Supports: creditcard.csv (MLG-ULB) or paysim.csv (PaySim)
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Supported formats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-violet-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💳</span>
            <div>
              <div className="font-display font-bold text-slate-800">CreditCard Dataset</div>
              <div className="text-xs text-slate-400">MLG-ULB · Kaggle</div>
            </div>
          </div>
          <div className="text-sm text-slate-500 space-y-1">
            <div>✓ Columns: <span className="font-mono text-xs">Time, V1–V28, Amount, Class</span></div>
            <div>✓ 284,807 transactions · 492 fraud cases</div>
            <div>✓ 0.172% fraud rate</div>
          </div>
        </Card>
        <Card className="border-teal-100">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📱</span>
            <div>
              <div className="font-display font-bold text-slate-800">PaySim Dataset</div>
              <div className="text-xs text-slate-400">African Mobile Money · Kaggle</div>
            </div>
          </div>
          <div className="text-sm text-slate-500 space-y-1">
            <div>✓ Columns: <span className="font-mono text-xs">step, type, amount, nameOrig, isFraud...</span></div>
            <div>✓ 6.3M+ transactions · Real African data</div>
            <div>✓ Most relevant to Nigerian fintech</div>
          </div>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-red-700 text-sm">Upload Failed</div>
            <div className="text-red-500 text-sm mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Success result */}
      {result && (
        <Card className="border-teal-200 bg-teal-50/30">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle size={22} className="text-teal-500" />
            <div>
              <div className="font-display font-bold text-slate-800">Dataset Loaded Successfully</div>
              <DatasetTypeBadge type={result.dataset_type} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Records',  value: result.summary.total_records.toLocaleString(),  color: 'text-teal-600'  },
              { label: 'Normal',         value: result.summary.normal_records.toLocaleString(), color: 'text-green-600' },
              { label: 'Fraudulent',     value: result.summary.fraud_records.toLocaleString(),  color: 'text-red-500'   },
              { label: 'Missing Values', value: result.summary.missing_values,                  color: 'text-slate-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 text-center">
                <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mb-5 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
            ⚠️ Class imbalance: <strong>{result.summary.fraud_pct}%</strong> of transactions are fraudulent.
            SMOTE will balance this during LightGBM training.
          </div>

          {/* Preview table */}
          <SectionHeader title="Data Preview (first 5 rows)" icon="👁" />
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {result.columns.slice(0, 8).map(c => (
                    <th key={c} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                  {result.columns.length > 8 && (
                    <th className="px-3 py-2 text-slate-400">+{result.columns.length - 8} more</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {result.preview.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    {result.columns.slice(0, 8).map(c => (
                      <td key={c} className="px-3 py-2 text-slate-600 font-mono whitespace-nowrap">
                        {String(row[c]).slice(0, 12)}
                      </td>
                    ))}
                    {result.columns.length > 8 && <td className="px-3 py-2 text-slate-300">...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={() => nav('/train')}>
              Proceed to Run Detection →
            </Button>
            <Button variant="outline" onClick={() => { setResult(null); }}>
              Upload Different File
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
