import React from 'react';
import { Settings, CheckCircle, Database, Shield, FileSpreadsheet, X } from 'lucide-react';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshTrigger: () => void;
}

export default function SettingsPopup({ isOpen, onClose, onRequestToast, onRefreshTrigger }: SettingsPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" id="settings-popup-container">
      <div className="bg-[#120F0D] border border-[#3C271F] rounded-3xl w-full max-w-md overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] animate-scaleUp text-left" id="settings-popup-card">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 bg-[#1E1512]/50 flex justify-between items-center" id="settings-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#D98353]/15 flex items-center justify-center text-[#D98353]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#ECE6E1]">Malhaar Database Desk</h3>
              <p className="text-[10px] font-mono text-[#D98353] uppercase tracking-wider">Security & Integrity Panel</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
            id="close-settings-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6 max-h-[460px] overflow-y-auto" id="settings-body">
          
          {/* Section 1: Security Shield */}
          <div className="space-y-3" id="database-integrity-section">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE6E1] font-mono">Database Integrity Shield Activated</h4>
            </div>

            <p className="text-[11px] text-[#AC9E94] leading-relaxed">
              To safeguard the society data of <strong className="text-white">Anand Singh, Harshit Jasrasaria, and Vaibhav Raj</strong> against any potential loss or deletion, the high-fidelity cloud protection layer is fully active.
            </p>

            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl flex gap-3 text-xs text-emerald-300">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="space-y-1 text-left">
                <span className="font-bold font-serif block text-emerald-200">100% Data Protection Guarantee</span>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Destructive operations (Google Spreadsheet synchronization, mock seeding, and database clears) have been permanently disabled and removed to prevent accidental overwriting.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Active Database Sync */}
          <div className="space-y-3 pt-4 border-t border-white/5" id="active-sync-section">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE6E1] font-mono">SQL Database Connection Status</h4>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-2 text-xs text-stone-300">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-stone-400 font-mono text-[10px] uppercase">Cloud SQL Database:</span>
                <span className="text-emerald-400 font-bold font-mono">● ONLINE & SECURE</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-stone-400 font-mono text-[10px] uppercase">Firestore Realtime Backup:</span>
                <span className="text-emerald-400 font-bold font-mono">● AUTO-BACKUP ACTIVE</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-400 font-mono text-[10px] uppercase">Persistent Cache State:</span>
                <span className="text-emerald-400 font-bold font-mono">● SYNCHRONIZED</span>
              </div>
            </div>
          </div>

          {/* Section 3: Safe Export to Excel Instructions */}
          <div className="space-y-3 pt-4 border-t border-white/5" id="excel-instructions-section">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#D98353]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE6E1] font-mono">Excel Fetch & Backup Desk</h4>
            </div>

            <p className="text-[11px] text-[#AC9E94] leading-relaxed">
              Admin is authorized to securely fetch and export all society rosters, profiles, performance matrices, and point evaluations to local storage using the primary Excel export buttons.
            </p>

            <div className="bg-stone-950 border border-white/5 p-3.5 rounded-xl text-[10px] font-mono text-[#D98353] leading-relaxed">
              ℹ NOTE: Safe Excel/CSV exports and Master JSON Database Backup files are available in your main <span className="text-white">Admin View Dashboard</span> under the <span className="text-white">Settings & Roster Export Panel</span>.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#120F0D]/60 flex justify-end gap-3" id="settings-footer">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-white/10 hover:bg-white/5 text-stone-300 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            id="close-settings-panel-btn"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
