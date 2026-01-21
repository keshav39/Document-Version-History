
import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, ViewMode, DocumentSummary } from './types';
import Dashboard from './components/Dashboard';
import HistoryLog from './components/HistoryLog';
import AddEntryForm from './components/AddEntryForm';
import Sidebar from './components/Sidebar';
import { Loader2, AlertCircle, Database, ServerCrash } from 'lucide-react';
import { neon } from '@neondatabase/serverless';

const App: React.FC = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Neon SQL client
  const sql = useMemo(() => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return null;
    return neon(dbUrl);
  }, []);

  useEffect(() => {
    if (sql) {
      fetchData();
    } else {
      setErrorMessage("DATABASE_URL environment variable is missing. Please add your Neon connection string.");
      setIsLoading(false);
    }
  }, [sql]);

  const fetchData = async () => {
    if (!sql) return;
    try {
      setIsLoading(true);
      
      // Ensure table exists first (Initialization)
      await sql`
        CREATE TABLE IF NOT EXISTS history_entries (
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
        )
      `;

      const results = await sql`
        SELECT 
          id, 
          ricefw_id as "RICEFWID", 
          fs_name as "FSNAME", 
          transaction_id as "TransactionID", 
          region as "Region", 
          status as "Status", 
          version, 
          release_reference as "releaseReference", 
          author, 
          change_description as "changeDescription", 
          timestamp,
          document_date as "documentDate"
        FROM history_entries 
        ORDER BY timestamp DESC
      `;

      const formatted = results.map((d: any) => ({
        ...d,
        timestamp: Number(d.timestamp),
        documentDate: Number(d.documentDate || d.timestamp),
        Status: Boolean(d.Status)
      }));

      setEntries(formatted);
      setErrorMessage(null);
    } catch (e: any) {
      console.error("Database Fetch error:", e);
      setErrorMessage(`Neon Connection Error: ${e.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (entry: HistoryEntry) => {
    if (!sql) return;
    setErrorMessage(null);
    try {
      await sql`
        INSERT INTO history_entries (
          id, ricefw_id, fs_name, transaction_id, region, status, version, release_reference, author, change_description, timestamp, document_date
        ) VALUES (
          ${entry.id}, 
          ${entry.RICEFWID}, 
          ${entry.FSNAME}, 
          ${entry.TransactionID || ''}, 
          ${entry.Region || ''}, 
          ${entry.Status}, 
          ${entry.version}, 
          ${entry.releaseReference || ''}, 
          ${entry.author || 'Unknown'}, 
          ${entry.changeDescription || ''}, 
          ${BigInt(entry.timestamp)}, 
          ${BigInt(entry.documentDate)}
        )
      `;
      setEntries(prev => [entry, ...prev]);
      setActiveView(ViewMode.DASHBOARD);
    } catch (e: any) {
      console.error("Save error:", e);
      setErrorMessage(`Failed to commit version to Neon: ${e.message}`);
    }
  };

  const updateEntryStatus = async (id: string, newStatus: boolean) => {
    if (!sql) return;
    try {
      await sql`
        UPDATE history_entries 
        SET status = ${newStatus}
        WHERE id = ${id}
      `;
      setEntries(prev => prev.map(e => e.id === id ? { ...e, Status: newStatus } : e));
    } catch (e: any) {
      console.error("Status update error:", e);
      setErrorMessage(`Database Update Error: ${e.message}`);
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
          <p className="text-sm font-bold tracking-widest uppercase opacity-50">Connecting to Neon Cloud...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-800 animate-in fade-in slide-in-from-top-2 shadow-sm">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <div className="text-sm font-medium leading-tight flex-1">
              <span className="block font-bold mb-0.5">Database Registry Error</span>
              {errorMessage}
            </div>
            <button 
              onClick={() => fetchData()} 
              className="px-3 py-1 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Retry Sync
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cloud Database Registry</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Neon Direct</span>
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
