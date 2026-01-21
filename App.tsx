
import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, ViewMode, DocumentSummary } from './types';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';
import AddEntryForm from './components/AddEntryForm';
import Sidebar from './components/Sidebar';
import { Loader2, AlertCircle, Database, Terminal, CheckCircle2, Copy } from 'lucide-react';

const App: React.FC = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHtmlError, setIsHtmlError] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/.netlify/functions/history');
      const clonedResponse = response.clone();
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const formatted = data.map((d: any) => ({
          ...d,
          timestamp: Number(d.timestamp),
          documentDate: Number(d.documentDate || d.timestamp),
          Status: Boolean(d.Status)
        }));
        setEntries(formatted);
        setErrorMessage(null);
        setIsHtmlError(false);
      } else {
        if (contentType && contentType.includes('text/html')) {
          setIsHtmlError(true);
          setErrorMessage("Environment Mismatch: The fetch call hit a static HTML file instead of the Neon API function.");
        } else {
          try {
            const errorData = await response.json();
            setErrorMessage(errorData.error || errorData.detail || `Server Error ${response.status}`);
          } catch (e) {
            const text = await clonedResponse.text();
            setErrorMessage(text.slice(0, 100) || "Unknown backend error");
          }
        }
      }
    } catch (e) {
      console.error("Connection error:", e);
      setErrorMessage("Network Failure: Cannot connect to Neon. Verify your internet and DATABASE_URL variable.");
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entry: HistoryEntry) => {
    setErrorMessage(null);
    try {
      const response = await fetch('/.netlify/functions/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (response.ok) {
        setEntries(prev => [entry, ...prev]);
        setActiveView(ViewMode.DASHBOARD);
      } else {
        const errorData = await response.json();
        setErrorMessage(`Save Failed: ${errorData.error || "Check database schema"}`);
      }
    } catch (e: any) {
      setErrorMessage("Sync Error: Failed to push update to Neon.");
    }
  };

  const updateEntryStatus = async (id: string, newStatus: boolean) => {
    try {
      const response = await fetch('/.netlify/functions/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, Status: newStatus } : e));
      } else {
        setErrorMessage("Status Update Failed: Check your database connection.");
      }
    } catch (e) {
      setErrorMessage("Network Error: Could not reach the database.");
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

  const SQL_SCHEMA = `CREATE TABLE IF NOT EXISTS history_entries (
  id UUID PRIMARY KEY,
  ricefw_id TEXT NOT NULL,
  fs_name TEXT NOT NULL,
  transaction_id TEXT,
  region TEXT,
  status BOOLEAN DEFAULT FALSE,
  version TEXT NOT NULL,
  release_reference TEXT,
  author TEXT,
  change_description TEXT,
  timestamp BIGINT,
  document_date BIGINT
);`;

  const renderConfigurationGuide = () => (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 py-12">
      <div className="bg-white rounded-2xl border border-red-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-red-50 bg-red-50/30 flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <AlertCircle size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Neon Database Sync Failed</h2>
            <p className="text-slate-500 mt-1">The application is running in a static mode and cannot reach your Neon database.</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Terminal size={16} /> Step 1: Fix Local Environment
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              You are likely using <code className="bg-slate-100 px-1 rounded text-pink-600">npm run dev</code>. 
              To use the Neon Database, you <strong>must</strong> run the app via the Netlify CLI so it can proxy the functions:
            </p>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs leading-relaxed shadow-inner">
              # Install Netlify CLI if you haven't<br/>
              npm install -g netlify-cli<br/><br/>
              # Run dev with functions enabled<br/>
              netlify dev
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database size={16} /> Step 2: Initialize Neon Schema
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ensure your Neon Database has the correct table structure. Copy this SQL and run it in your <strong>Neon Console SQL Editor</strong>:
            </p>
            <div className="relative group">
              <pre className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-xs text-slate-700 overflow-x-auto">
                {SQL_SCHEMA}
              </pre>
              <button 
                onClick={() => navigator.clipboard.writeText(SQL_SCHEMA)}
                className="absolute top-2 right-2 p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <Copy size={14} />
              </button>
            </div>
          </section>

          <div className="pt-6">
            <button 
              onClick={fetchData}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold tracking-widest uppercase opacity-50">Syncing with Neon Registry...</p>
        </div>
      );
    }

    if (isHtmlError) {
      return renderConfigurationGuide();
    }

    return (
      <div className="space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <div className="text-sm font-medium leading-tight">
              <span className="block font-bold mb-0.5">Sync Alert</span>
              {errorMessage}
            </div>
            <button onClick={() => setErrorMessage(null)} className="ml-auto text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100 p-2">Dismiss</button>
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
              SpecVer <span className="text-indigo-600 font-normal">v1.2</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Documentation Registry</p>
          </div>
          {!isHtmlError && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Neon Live</span>
              </div>
              <button 
                onClick={fetchData}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Force Sync"
              >
                <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </header>

        <div className="max-w-7xl mx-auto p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
