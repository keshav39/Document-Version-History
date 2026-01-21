
import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, ViewMode, DocumentSummary } from './types';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';
import AddEntryForm from './components/AddEntryForm';
import Sidebar from './components/Sidebar';
import { Loader2, AlertCircle, Database } from 'lucide-react';

const App: React.FC = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/.netlify/functions/history');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch history');
      }
      const data = await response.json();
      setEntries(data.map((entry: any) => ({
        ...entry,
        timestamp: Number(entry.timestamp),
        documentDate: Number(entry.documentDate || entry.timestamp)
      })));
      setErrorMessage(null);
    } catch (e: any) {
      console.error("Fetch error:", e);
      setErrorMessage(e.message || "Could not connect to the database function.");
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entry: HistoryEntry) => {
    try {
      setErrorMessage(null);
      const response = await fetch('/.netlify/functions/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) throw new Error('Failed to save version');
      
      setEntries(prev => [entry, ...prev]);
      setActiveView(ViewMode.DASHBOARD);
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const updateEntryStatus = async (id: string, newStatus: boolean) => {
    try {
      const response = await fetch('/.netlify/functions/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      setEntries(prev => prev.map(e => e.id === id ? { ...e, Status: newStatus } : e));
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const documentSummaries = useMemo((): DocumentSummary[] => {
    const map = new Map<string, DocumentSummary>();
    const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedEntries.forEach(entry => {
      map.set(entry.RICEFWID, {
        RICEFWID: entry.RICEFWID,
        FSNAME: entry.FSNAME,
        TransactionID: entry.TransactionID,
        Region: entry.Region,
        Status: entry.Status,
        currentVersion: entry.version,
        lastRelease: entry.releaseReference,
        lastUpdated: entry.timestamp,
        documentDate: entry.documentDate,
        historyCount: (map.get(entry.RICEFWID)?.historyCount || 0) + 1,
        latestEntryId: entry.id
      });
    });

    return Array.from(map.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [entries]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold tracking-widest uppercase opacity-50">Syncing with Registry...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <div className="text-sm font-medium leading-tight flex-1">
              <span className="block font-bold mb-0.5">Function Registry Error</span>
              {errorMessage}
            </div>
            <button 
              onClick={fetchData} 
              className="px-3 py-1 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {activeView === ViewMode.DASHBOARD && <Dashboard summaries={documentSummaries} onAddClick={() => setActiveView(ViewMode.ADD_ENTRY)} onUpdateStatus={updateEntryStatus} />}
        {activeView === ViewMode.HISTORY && <HistoryLog entries={entries} />}
        {activeView === ViewMode.ADD_ENTRY && <AddEntryForm onAdd={addEntry} existingSummaries={documentSummaries} />}
        {activeView === ViewMode.REPORTS && (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400 h-full">
            <Database size={64} className="mb-4 opacity-10" />
            <h2 className="text-xl font-medium">Reporting Module</h2>
            <p>Advanced release analytics coming soon.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
      />
      
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
              SpecVer <span className="text-indigo-600 font-normal">v1.3</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Version Documentation Proxy</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Functions Active</span>
            </div>
            <button 
              onClick={fetchData}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isLoading}
            >
              <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
