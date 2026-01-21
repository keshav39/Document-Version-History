
import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, ViewMode, DocumentSummary } from './types';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';
import AddEntryForm from './components/AddEntryForm';
import Sidebar from './components/Sidebar';
import { Layout, ClipboardList, History, PlusCircle, BarChart3, Info, Loader2, AlertCircle } from 'lucide-react';

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
      } else {
        const clonedResponse = response.clone();
        let errorDetail = `Status ${response.status}`;
        
        if (contentType && contentType.includes('text/html')) {
          errorDetail = "The server returned HTML instead of JSON. This usually means the Netlify function is not running or the path is incorrect. Use 'netlify dev' to run locally.";
        } else {
          try {
            const errorData = await response.json();
            errorDetail = errorData.error || errorData.detail || errorDetail;
          } catch (e) {
            try {
              const text = await clonedResponse.text();
              errorDetail = text.slice(0, 150) || errorDetail;
            } catch (textError) {}
          }
        }
        setErrorMessage(`Registry Sync Error: ${errorDetail}`);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setErrorMessage("Network error: Could not connect to the backend server. Verify your internet and server status.");
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

      const contentType = response.headers.get('content-type');

      if (response.ok) {
        setEntries(prev => [entry, ...prev]);
        setActiveView(ViewMode.DASHBOARD);
      } else {
        const clonedResponse = response.clone();
        let errorMsg = "Database rejection";
        
        if (contentType && contentType.includes('text/html')) {
          errorMsg = "Server endpoint returned HTML. The save function might be crashing or missing.";
        } else {
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorData.detail || errorMsg;
          } catch (e) {
            try {
              const text = await clonedResponse.text();
              errorMsg = text.slice(0, 200);
            } catch (textError) {}
          }
        }
        setErrorMessage(`Save Failed: ${errorMsg}`);
        alert(`Save Failed: ${errorMsg}\n\nCheck your DATABASE_URL and ensure the 'history_entries' table and 'document_date' column exist.`);
      }
    } catch (e: any) {
      console.error("Save error:", e);
      setErrorMessage("Network error: Server unreachable during save attempt.");
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
        const clonedResponse = response.clone();
        let errorMsg = "Update failed";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          try {
            const text = await clonedResponse.text();
            errorMsg = text.slice(0, 100);
          } catch (textError) {}
        }
        alert(`Update Failed: ${errorMsg}`);
      }
    } catch (e) {
      console.error("Status update error:", e);
      alert("Network error updating status.");
    }
  };

  const documentSummaries = useMemo((): DocumentSummary[] => {
    const map = new Map<string, DocumentSummary>();
    
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
        documentDate: entry.documentDate,
        historyCount: (map.get(entry.RICEFWID)?.historyCount || 0) + 1,
        latestEntryId: entry.id
      });
    });

    return Array.from(map.values()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [entries]);

  const renderContent = () => {
    if (isLoading && entries.length === 0) {
      return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm font-medium">Synchronizing with Cloud Registry...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertCircle size={20} className="shrink-0" />
            <div className="text-sm font-medium leading-tight">
              <span className="font-bold block mb-0.5">Connectivity Issue</span>
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
            <BarChart3 size={64} className="mb-4 opacity-20" />
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
