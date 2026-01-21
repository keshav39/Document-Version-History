
import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, ViewMode, DocumentSummary } from './types';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';
import AddEntryForm from './components/AddEntryForm';
import Sidebar from './components/Sidebar';
import { Loader2, AlertCircle, Save, Database, HardDrive, Share2 } from 'lucide-react';

const STORAGE_KEY = 'specver_history_v1';

const App: React.FC = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial load from localStorage
    const loadData = () => {
      setIsLoading(true);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setEntries(parsed);
        }
      } catch (e) {
        console.error("Failed to load local data", e);
        setErrorMessage("Data Corruption: Could not read local storage.");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Simulate slight delay for "professional" feel
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  // Sync to localStorage whenever entries change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoading]);

  const addEntry = (entry: HistoryEntry) => {
    setEntries(prev => [entry, ...prev]);
    setActiveView(ViewMode.DASHBOARD);
  };

  const updateEntryStatus = (id: string, newStatus: boolean) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, Status: newStatus } : e));
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

  const exportData = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specver-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold tracking-widest uppercase opacity-50">Initializing Browser Database...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <div className="text-sm font-medium leading-tight">
              <span className="block font-bold mb-0.5">Storage Alert</span>
              {errorMessage}
            </div>
          </div>
        )}

        {activeView === ViewMode.DASHBOARD && (
          <Dashboard 
            summaries={documentSummaries} 
            onAddClick={() => setActiveView(ViewMode.ADD_ENTRY)} 
            onUpdateStatus={updateEntryStatus} 
          />
        )}
        {activeView === ViewMode.HISTORY && <HistoryLog entries={entries} />}
        {activeView === ViewMode.ADD_ENTRY && (
          <AddEntryForm 
            onAdd={addEntry} 
            existingSummaries={documentSummaries} 
          />
        )}
        {activeView === ViewMode.REPORTS && (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <Database size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Local Data Management</h2>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">
                Your version history is currently stored locally in your browser. 
                We recommend frequent backups to prevent data loss.
              </p>
            </div>
            <button 
              onClick={exportData}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
            >
              <Save size={18} />
              Export Backup (JSON)
            </button>
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
              SpecVer <span className="text-indigo-600 font-normal">v2.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Local Documentation Vault</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg">
              <HardDrive size={14} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Storage: Local</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
              <Share2 size={14} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">AI Ready</span>
            </div>
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
