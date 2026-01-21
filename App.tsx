
import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, ViewMode, DocumentSummary } from './types';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';
import AddEntryForm from './components/AddEntryForm';
import Sidebar from './components/Sidebar';
import { Layout, ClipboardList, History, PlusCircle, BarChart3, Info } from 'lucide-react';

const STORAGE_KEY = 'specver_history_data';

const App: React.FC = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse storage", e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = (entry: HistoryEntry) => {
    setEntries(prev => [entry, ...prev]);
    setActiveView(ViewMode.DASHBOARD);
  };

  const documentSummaries = useMemo((): DocumentSummary[] => {
    const map = new Map<string, DocumentSummary>();
    
    // Process entries from oldest to newest to ensure current values are truly the latest
    [...entries].reverse().forEach(entry => {
      map.set(entry.RICEFWID, {
        RICEFWID: entry.RICEFWID,
        FSNAME: entry.FSNAME,
        TransactionID: entry.TransactionID,
        Region: entry.Region,
        Status: entry.Status,
        currentVersion: entry.version,
        lastRelease: entry.releaseReference,
        lastUpdated: entry.timestamp,
        historyCount: (map.get(entry.RICEFWID)?.historyCount || 0) + 1
      });
    });

    return Array.from(map.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [entries]);

  const renderContent = () => {
    switch (activeView) {
      case ViewMode.DASHBOARD:
        return <Dashboard summaries={documentSummaries} onAddClick={() => setActiveView(ViewMode.ADD_ENTRY)} />;
      case ViewMode.HISTORY:
        return <HistoryLog entries={entries} />;
      case ViewMode.ADD_ENTRY:
        return <AddEntryForm onAdd={addEntry} existingSummaries={documentSummaries} />;
      case ViewMode.REPORTS:
        return (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400 h-full">
            <BarChart3 size={64} className="mb-4 opacity-20" />
            <h2 className="text-xl font-medium">Reporting Module</h2>
            <p>Advanced release analytics coming soon.</p>
          </div>
        );
      default:
        return <Dashboard summaries={documentSummaries} onAddClick={() => setActiveView(ViewMode.ADD_ENTRY)} />;
    }
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
            <h1 className="text-xl font-bold text-slate-800">
              {activeView === ViewMode.DASHBOARD && "Documentation Registry"}
              {activeView === ViewMode.HISTORY && "Audit History Log"}
              {activeView === ViewMode.ADD_ENTRY && "New Version Entry"}
              {activeView === ViewMode.REPORTS && "Release Insights"}
            </h1>
            <p className="text-xs text-slate-500">SpecVer Registry System &bull; Total Objects: {documentSummaries.length}</p>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `specver_backup_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                className="text-xs font-medium px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
             >
               Export Registry
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
