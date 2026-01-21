
import React, { useState } from 'react';
import { HistoryEntry } from '../types';
import { Clock, User, ChevronDown, ChevronUp, FileText, Globe, Hash, CheckCircle2, XCircle, Calendar } from 'lucide-react';

interface HistoryLogProps {
  entries: HistoryEntry[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ entries }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      {entries.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 border-dashed">
          <Clock className="mx-auto mb-4 text-slate-200" size={48} />
          <p className="text-slate-500">The audit log is currently empty.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-200" />
          
          <div className="space-y-6">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="relative pl-14">
                {/* Timeline Dot */}
                <div className={`absolute left-[20px] top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${idx === 0 ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`} />
                
                <div 
                  className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all overflow-hidden ${expandedId === entry.id ? 'ring-2 ring-indigo-500/10' : 'hover:border-slate-300'}`}
                >
                  <button 
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">{entry.FSNAME}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded font-bold uppercase">{entry.RICEFWID}</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-mono rounded">v{entry.version}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-500 uppercase tracking-tight">{entry.releaseReference}</span>
                        <span className="flex items-center gap-1"><User size={12} /> {entry.author}</span>
                        <span className="flex items-center gap-1 text-indigo-500 font-semibold"><Calendar size={12} /> Doc: {new Date(entry.documentDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 opacity-60"><Clock size={12} /> Log: {new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {expandedId === entry.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </button>

                  {expandedId === entry.id && (
                    <div className="px-6 pb-5 pt-0 border-t border-slate-50 bg-slate-50/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-4">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">T-Code</p>
                          <p className="text-sm font-mono text-slate-700 flex items-center gap-1"><Hash size={12}/> {entry.TransactionID || 'None'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Region</p>
                          <p className="text-sm text-slate-700 flex items-center gap-1"><Globe size={12}/> {entry.Region || 'Global'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">SharePoint Status</p>
                          {entry.Status ? (
                            <p className="text-sm text-emerald-600 flex items-center gap-1 font-medium"><CheckCircle2 size={12}/> Uploaded</p>
                          ) : (
                            <p className="text-sm text-slate-400 flex items-center gap-1 font-medium"><XCircle size={12}/> Not Uploaded</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <FileText size={12} />
                          Change Analysis
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-lg border border-slate-200 shadow-inner">
                          {entry.changeDescription}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryLog;
