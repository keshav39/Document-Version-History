
export interface HistoryEntry {
  id: string;
  RICEFWID: string;
  FSNAME: string;
  TransactionID: string;
  Region: string;
  Status: boolean; // true if uploaded to SharePoint
  version: string;
  releaseReference: string;
  author: string;
  changeDescription: string;
  timestamp: number;
}

export interface DocumentSummary {
  RICEFWID: string;
  FSNAME: string;
  TransactionID: string;
  Region: string;
  Status: boolean;
  currentVersion: string;
  lastRelease: string;
  lastUpdated: number;
  historyCount: number;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  ADD_ENTRY = 'ADD_ENTRY',
  REPORTS = 'REPORTS'
}
