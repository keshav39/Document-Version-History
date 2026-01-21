
import React from 'react';
import { ViewMode } from '../types';
import { LayoutGrid, History, FilePlus2, PieChart, ShieldCheck, ChevronLeft, ChevronRight, Database } from 'lucide-react';

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, toggleSidebar }) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutGrid },
    { id: ViewMode.HISTORY, label: 'Version Log', icon: History },
    { id: ViewMode.ADD_ENTRY, label: 'New Update', icon: FilePlus2 },
    { id: ViewMode.REPORTS, label: 'Release Reports', icon: PieChart },
  ];

  return (
    <div className={`bg-slate-900 text-white h-screen transition-all duration-300 relative flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        {isOpen && <span className="font-bold text-lg tracking-tight">SpecVer</span>}
      </div>

      <nav className="flex-1 mt-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {isOpen && <span className="font-medium text-sm">{item.label}</span>}
              {isActive && isOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          <Database size={14} className="text-indigo-400" />
          {isOpen && <span className="text-slate-400/80">Neon Registry</span>}
        </div>
      </div>

      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-white text-slate-900 border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 z-20"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
};

export default Sidebar;
