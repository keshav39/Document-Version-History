
import React, { useState } from 'react';
import { DocumentSummary } from '../types';
import { Search, ExternalLink, Calendar, Hash, Globe, CheckCircle2, XCircle, FileClock, CloudUpload } from 'lucide-react';

interface DashboardProps {
  summaries: DocumentSummary[];
  onAddClick: () => void;
  onUpdateStatus: (id: string, status: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ summaries, onAddClick, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = summaries.filter(s => 
    s.FSNAME.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.RICEFWID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.TransactionID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lastRelease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by RICEFW ID, FS Name or T-Code..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={onAddClick}
          className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-200 flex items-center justify-center gap-2"
        >
          Append Version Update
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Functional Object (RICEFW)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Context & Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lifecycle</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Hash size={48} className="opacity-10" />
                    <p>No documentation objects registered yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.RICEFWID} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 text-sm">{item.FSNAME}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase font-bold">{item.RICEFWID}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Hash size={10}/> {item.TransactionID || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                          <Globe size={10} /> {item.Region}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200">
                          v{item.currentVersion}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-medium">
                        {item.Status ? (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> SharePoint Uploaded</span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1"><XCircle size={12}/> Pending Upload</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} className="text-indigo-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-700">{new Date(item.documentDate).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><FileClock size={8}/> Iter: {item.historyCount}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onUpdateStatus(item.latestEntryId, !item.Status)}
                        className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight ${
                          item.Status 
                          ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={item.Status ? "Mark as Pending Upload" : "Mark as Uploaded to SharePoint"}
                      >
                        <CloudUpload size={14} />
                        {item.Status ? "Revert Status" : "Mark Uploaded"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
