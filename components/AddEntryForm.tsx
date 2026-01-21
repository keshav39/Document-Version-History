
import React, { useState, useEffect } from 'react';
import { HistoryEntry, DocumentSummary } from '../types';
import { suggestVersionAndReleaseNotes } from '../geminiService';
import { Sparkles, Loader2, Save, AlertCircle, Info, Hash, Globe, CheckCircle, Calendar } from 'lucide-react';

interface AddEntryFormProps {
  onAdd: (entry: HistoryEntry) => void;
  existingSummaries: DocumentSummary[];
}

const AddEntryForm: React.FC<AddEntryFormProps> = ({ onAdd, existingSummaries }) => {
  const [isNewDoc, setIsNewDoc] = useState(false);
  const [selectedRICEFWID, setSelectedRICEFWID] = useState('');
  
  // Form fields
  const [fsName, setFsName] = useState('');
  const [ricefwId, setRicefwId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState(false);
  const [version, setVersion] = useState('1.0.0');
  const [releaseRef, setReleaseRef] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionData, setSuggestionData] = useState<any>(null);

  // Auto-fill fields if existing doc selected
  useEffect(() => {
    if (!isNewDoc && selectedRICEFWID) {
      const summary = existingSummaries.find(s => s.RICEFWID === selectedRICEFWID);
      if (summary) {
        setFsName(summary.FSNAME);
        setRicefwId(summary.RICEFWID);
        setTransactionId(summary.TransactionID);
        setRegion(summary.Region);
        setStatus(summary.Status);
        setVersion(summary.currentVersion);
      }
    }
  }, [selectedRICEFWID, isNewDoc, existingSummaries]);

  const handleAISuggest = async () => {
    if (!description) return;
    setIsSuggesting(true);
    const result = await suggestVersionAndReleaseNotes(version, description);
    if (result) {
      setSuggestionData(result);
    }
    setIsSuggesting(false);
  };

  const applySuggestion = () => {
    if (suggestionData) {
      setVersion(suggestionData.suggestedVersion);
      setDescription(suggestionData.formalDescription);
      setSuggestionData(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalRICEFWID = isNewDoc ? ricefwId.toUpperCase().replace(/\s+/g, '_') : selectedRICEFWID;
    const finalFSNAME = isNewDoc ? fsName : existingSummaries.find(s => s.RICEFWID === selectedRICEFWID)?.FSNAME || '';

    if (!finalRICEFWID || !finalFSNAME || !version || !releaseRef || !author || !description) {
      alert("Please fill all required fields.");
      return;
    }

    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      RICEFWID: finalRICEFWID,
      FSNAME: finalFSNAME,
      TransactionID: transactionId,
      Region: region,
      Status: status,
      version,
      releaseReference: releaseRef,
      author,
      changeDescription: description,
      timestamp: Date.now(),
      documentDate: new Date(docDate).getTime()
    };

    onAdd(newEntry);
  };

  return (
    <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-300 pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Version Lifecycle Update</h2>
          <p className="text-sm text-slate-500 mt-1">Register a version bump or new functional document object.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Object Selection */}
            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Functional Object (RICEFW ID)</label>
                <button 
                  type="button"
                  onClick={() => {
                    setIsNewDoc(!isNewDoc);
                    if (!isNewDoc) setSelectedRICEFWID('');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {isNewDoc ? "Select Existing" : "+ Register New Object"}
                </button>
              </div>
              
              {isNewDoc ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                  <input 
                    type="text"
                    placeholder="RICEFW ID (e.g. R-102)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono uppercase"
                    value={ricefwId}
                    onChange={e => setRicefwId(e.target.value)}
                  />
                  <input 
                    type="text"
                    placeholder="FS Name (Document Title)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={fsName}
                    onChange={e => setFsName(e.target.value)}
                  />
                </div>
              ) : (
                <select 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  value={selectedRICEFWID}
                  onChange={e => setSelectedRICEFWID(e.target.value)}
                >
                  <option value="">-- Choose existing RICEFW object --</option>
                  {existingSummaries.map(s => (
                    <option key={s.RICEFWID} value={s.RICEFWID}>{s.FSNAME} [{s.RICEFWID}]</option>
                  ))}
                </select>
              )}
            </div>

            {/* Document Update Date */}
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12}/> Document Update Date
              </label>
              <input 
                type="date"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={docDate}
                onChange={e => setDocDate(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 italic">Specify the actual date the modifications were finalized in the document.</p>
            </div>

            {/* Transaction and Region */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Hash size={12}/> Transaction ID (T-Code)</label>
              <input 
                type="text"
                placeholder="e.g. ME21N"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Globe size={12}/> Region / Location</label>
              <input 
                type="text"
                placeholder="e.g. EMEA, USA, GLOBAL"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={region}
                onChange={e => setRegion(e.target.value)}
              />
            </div>

            {/* Version and Release */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Version</label>
              <input 
                type="text"
                placeholder="e.g. 1.2.0"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={version}
                onChange={e => setVersion(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Release Reference</label>
              <input 
                type="text"
                placeholder="e.g. SAP-ROLLOUT-2025"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={releaseRef}
                onChange={e => setReleaseRef(e.target.value)}
              />
            </div>

            {/* Status (SharePoint) */}
            <div className="col-span-2 py-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={status}
                  onChange={e => setStatus(e.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                  Document uploaded on SharePoint
                </span>
              </label>
            </div>

            {/* Author */}
            <div className="space-y-2 col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Author / Responsible Party</label>
              <input 
                type="text"
                placeholder="Full Name"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={author}
                onChange={e => setAuthor(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Change Details</label>
                <button 
                  type="button"
                  onClick={handleAISuggest}
                  disabled={isSuggesting || !description}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-100 disabled:opacity-50 transition-all border border-indigo-100"
                >
                  {isSuggesting ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                  Assistant Suggestion
                </button>
              </div>
              <textarea 
                rows={4}
                placeholder="Detailed explanation of modifications in this version..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* AI Suggestion Box */}
          {suggestionData && (
            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Sparkles className="text-indigo-600" size={20} />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Gemini Assistant Suggestions</h4>
                    <p className="text-xs text-indigo-700">Recommended versioning and formalization.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Suggested Version</p>
                      <p className="text-sm font-mono font-bold text-indigo-600">{suggestionData.suggestedVersion}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Impact Level</p>
                      <p className="text-sm font-bold text-slate-800">{suggestionData.impactLevel}</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Formal Description</p>
                    <p className="text-xs text-slate-600 italic leading-relaxed">"{suggestionData.formalDescription}"</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={applySuggestion}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
                    >
                      Apply Recommendations
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSuggestionData(null)}
                      className="px-4 py-2 bg-transparent text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
             <div className="mr-auto flex items-center gap-2 text-amber-600">
               <AlertCircle size={14} />
               <span className="text-[10px] font-bold uppercase tracking-wider">Append-only Record</span>
             </div>
             <button 
              type="submit"
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
            >
              <Save size={18} />
              Commit Version Update
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 flex items-start gap-4 p-6 bg-slate-100 rounded-2xl border border-slate-200">
        <Info className="text-slate-400 shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">Functional Compliance Notice</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every entry is logged immutably with a RICEFW ID, FS Name, Transaction Code, and Region. The SharePoint status should be updated to reflect document availability for cross-team reviews. 
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddEntryForm;
