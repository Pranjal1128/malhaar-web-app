import React, { useState, useEffect } from 'react';
import {
  Profile,
  dbInstance
} from '../db/mockDb';
import {
  connectGoogleWorkspace,
  disconnectGoogleWorkspace,
  getWorkspaceToken,
  getWorkspaceUser
} from '../lib/workspaceAuth';
import {
  listCalendarEvents,
  createCalendarEvent,
  createInstantMeetSpace,
  listDriveFiles,
  uploadTextFileToDrive,
  listRecentEmails,
  sendGmailEmail,
  exportToGoogleSheets,
  CalendarEvent,
  DriveFile,
  GmailMessage,
  MeetSpace
} from '../lib/workspaceApi';
import {
  Calendar,
  Video,
  HardDrive,
  Mail,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  Send,
  Copy,
  Check,
  Link2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface WorkspaceHubViewProps {
  currentUser: Profile;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type ActiveTab = 'calendar' | 'drive' | 'gmail' | 'sheets' | 'meet';

export default function WorkspaceHubView({ currentUser, onRequestToast }: WorkspaceHubViewProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [authError, setAuthError] = useState<string | null>(null);

  // API Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string>('');

  // 1. Google Calendar States
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calSummary, setCalSummary] = useState<string>('');
  const [calDesc, setCalDesc] = useState<string>('');
  const [calStart, setCalStart] = useState<string>('');
  const [calEnd, setCalEnd] = useState<string>('');
  const [calMeet, setCalMeet] = useState<boolean>(true);

  // 2. Google Meet States
  const [latestMeetSpace, setLatestMeetSpace] = useState<MeetSpace | null>(null);

  // 3. Google Drive States
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileContent, setUploadFileContent] = useState<string>('');

  // 4. Gmail States
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [mailTo, setMailTo] = useState<string>('');
  const [mailSubject, setMailSubject] = useState<string>('');
  const [mailBody, setMailBody] = useState<string>('');

  // 5. Sheets Export States
  const [exportSource, setExportSource] = useState<'leaderboard' | 'targets'>('leaderboard');
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string>('');

  useEffect(() => {
    const token = getWorkspaceToken();
    if (token) {
      setIsConnected(true);
      setGoogleUser(getWorkspaceUser());
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadTabData();
    }
  }, [isConnected, activeTab]);

  const loadTabData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'calendar') {
        const list = await listCalendarEvents();
        setEvents(list);
      } else if (activeTab === 'drive') {
        const list = await listDriveFiles();
        setFiles(list);
      } else if (activeTab === 'gmail') {
        const list = await listRecentEmails();
        setEmails(list);
      }
    } catch (err: any) {
      console.error('Error fetching workspace data:', err);
      // If unauthorized, token might be expired. Silently disconnect or prompt
      const errMsg = err.message || "";
      if (
        errMsg.toLowerCase().includes("authentication") ||
        errMsg.toLowerCase().includes("credentials") ||
        errMsg.toLowerCase().includes("unauthorized") ||
        errMsg.toLowerCase().includes("401") ||
        errMsg.toLowerCase().includes("token") ||
        errMsg.toLowerCase().includes("failed to fetch")
      ) {
        handleDisconnect();
        onRequestToast('Google Workspace session expired or unavailable. Please connect again.', 'error');
      } else {
        onRequestToast(errMsg || 'Error loading Workspace data.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setAuthError(null);
    try {
      const result = await connectGoogleWorkspace();
      if (result) {
        setIsConnected(true);
        setGoogleUser(result.user);
        onRequestToast(`Connected with Google account: ${result.user.email}!`, 'success');
      }
    } catch (err: any) {
      console.error('Google Workspace Authentication Error:', err);
      
      const errorCode = err.code || '';
      const errorMessage = err.message || '';

      if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('popup-closed-by-user')) {
        setAuthError('popup-closed-by-user');
        onRequestToast('Authorization popup was closed. Please complete the sign-in flow to connect.', 'info');
      } else if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        setAuthError('popup-blocked');
        onRequestToast('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.', 'error');
      } else if (errorCode === 'auth/cancelled-popup-request' || errorMessage.includes('cancelled-popup-request')) {
        setAuthError('cancelled-popup-request');
        onRequestToast('Previous sign-in request was cancelled. Please try again.', 'info');
      } else {
        setAuthError(errorMessage || 'Failed to authenticate with Google Workspace.');
        onRequestToast(errorMessage || 'Failed to authenticate with Google Workspace. Please verify your connection.', 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleWorkspace();
    setIsConnected(false);
    setGoogleUser(null);
    setAuthError(null);
    setEvents([]);
    setFiles([]);
    setEmails([]);
    setLatestMeetSpace(null);
    setExportedSheetUrl('');
    onRequestToast('Disconnected Google Workspace session.', 'info');
  };

  // Google Calendar scheduling
  const handleScheduleEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calSummary.trim() || !calStart || !calEnd) {
      onRequestToast('Event Title, Start Time, and End Time are required.', 'error');
      return;
    }

    const conf = window.confirm(
      `Schedule "${calSummary}" on Google Calendar? ${
        calMeet ? 'This will also generate a Google Meet virtual room.' : ''
      }`
    );
    if (!conf) return;

    setIsLoading(true);
    try {
      const created = await createCalendarEvent(
        calSummary.trim(),
        calDesc.trim(),
        new Date(calStart).toISOString(),
        new Date(calEnd).toISOString(),
        calMeet
      );

      onRequestToast('Event successfully added to your Google Calendar!', 'success');
      setCalSummary('');
      setCalDesc('');
      setCalStart('');
      setCalEnd('');
      
      // Reload events list
      const list = await listCalendarEvents();
      setEvents(list);
    } catch (err: any) {
      onRequestToast(err.message || 'Failed to schedule event.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Meet space generation
  const handleCreateMeet = async () => {
    const conf = window.confirm('Generate a dedicated Google Meet room now?');
    if (!conf) return;

    setIsLoading(true);
    try {
      const space = await createInstantMeetSpace();
      setLatestMeetSpace(space);
      onRequestToast('Instant Google Meet space created successfully!', 'success');
    } catch (err: any) {
      onRequestToast(err.message || 'Failed to create Meet space.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Drive upload
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim() || !uploadFileContent.trim()) {
      onRequestToast('File Name and Content are required.', 'error');
      return;
    }

    const formattedName = uploadFileName.endsWith('.txt') ? uploadFileName : `${uploadFileName}.txt`;
    const conf = window.confirm(`Upload "${formattedName}" directly to your Google Drive?`);
    if (!conf) return;

    setIsLoading(true);
    try {
      const uploaded = await uploadTextFileToDrive(formattedName, uploadFileContent);
      onRequestToast(`Successfully uploaded "${uploaded.name}" to Drive!`, 'success');
      setUploadFileName('');
      setUploadFileContent('');
      
      // Reload files list
      const list = await listDriveFiles();
      setFiles(list);
    } catch (err: any) {
      onRequestToast(err.message || 'Failed to upload file.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Gmail sending
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailTo.trim() || !mailSubject.trim() || !mailBody.trim()) {
      onRequestToast('Recipient Email, Subject, and message body are required.', 'error');
      return;
    }

    const conf = window.confirm(`Send email to ${mailTo.trim()} via your Google account?`);
    if (!conf) return;

    setIsLoading(true);
    try {
      const formattedBody = `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #fafafa;">
          <h2 style="color: #D98353; font-family: serif; border-bottom: 2px solid #D98353; pb: 10px;">Malhaar Society Notification</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #333333;">
            ${mailBody.replace(/\n/g, '<br />')}
          </p>
          <hr style="border: none; border-top: 1px solid #dddddd; margin: 20px 0;" />
          <p style="font-size: 11px; color: #777777; font-style: italic;">
            Sent from Malhaar Music Society Hub using Google Workspace Gmail Integration.
          </p>
        </div>
      `;

      await sendGmailEmail(mailTo.trim(), mailSubject.trim(), formattedBody);
      onRequestToast('Email dispatched successfully!', 'success');
      setMailTo('');
      setMailSubject('');
      setMailBody('');
      
      // Reload emails list after a short delay
      setTimeout(async () => {
        try {
          const list = await listRecentEmails();
          setEmails(list);
        } catch (e) {
          // Ignore
        }
      }, 1500);
    } catch (err: any) {
      onRequestToast(err.message || 'Failed to send email.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sheets export
  const handleExportSheet = async () => {
    const conf = window.confirm(
      `Generate and export the current ${exportSource} data directly to a new Google Sheet?`
    );
    if (!conf) return;

    setIsLoading(true);
    setExportedSheetUrl('');
    try {
      let title = '';
      let headers: string[] = [];
      let rows: string[][] = [];

      if (exportSource === 'leaderboard') {
        title = `Malhaar Music Society Leaderboard - ${new Date().toLocaleDateString()}`;
        headers = ['Rank', 'Name', 'Role', 'Domain', 'Attendance Points', 'Task Points', 'Contribution Points', 'Total Points'];
        
        // Fetch profiles and points to sort
        const profiles = dbInstance.getProfiles() || [];
        const performance = dbInstance.getPerformance() || [];
        
        const sorted = profiles
          .filter(p => p.role === 'member' && p.approved)
          .map(p => {
            const perf = performance.find(pf => pf.user_id === p.id) || {
              attendance_points: 0,
              task_points: 0,
              contribution_points: 0
            };
            const total = perf.attendance_points + perf.task_points + perf.contribution_points;
            return {
              name: p.name,
              role: p.role,
              domain: p.domain || 'N/A',
              attendance: perf.attendance_points,
              task: perf.task_points,
              contribution: perf.contribution_points,
              total
            };
          })
          .sort((a, b) => b.total - a.total);

        rows = sorted.map((p, idx) => [
          String(idx + 1),
          p.name,
          p.role,
          p.domain,
          String(p.attendance),
          String(p.task),
          String(p.contribution),
          String(p.total)
        ]);
      } else {
        title = `Malhaar Monthly Targets Board - ${new Date().toLocaleDateString()}`;
        headers = ['Target ID', 'Title', 'Description', 'Assigned To', 'Deadline', 'Status'];

        const targets = dbInstance.getMonthlyTargets() || [];
        rows = targets.map(t => [
          t.id,
          t.title,
          t.description,
          t.assigned_to,
          t.due_date,
          t.status
        ]);
      }

      const url = await exportToGoogleSheets(title, headers, rows);
      setExportedSheetUrl(url);
      onRequestToast('Spreadsheet successfully assembled and exported!', 'success');
    } catch (err: any) {
      onRequestToast(err.message || 'Failed to export spreadsheet.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    onRequestToast('Link copied to clipboard!', 'info');
    setTimeout(() => setCopiedText(''), 2000);
  };

  // ==========================================
  // UNCONNECTED AUTHENTICATION PANEL
  // ==========================================
  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in pb-16 w-full max-w-4xl mx-auto px-4 text-left">
        <div className="border-b border-white/5 pb-4">
          <h1 className="text-3xl font-serif text-[#ECE6E1]">
            <Globe size={28} className="text-[#D98353] inline-block -mt-1 mr-2"/>Google <span className="text-[#D98353]">Workspace Hub</span>
          </h1>
          <p className="text-xs text-[#AC9E94]">
            Unify your collegiate workflow with Google Calendar, Google Drive, Gmail, Sheets, and Meet.
          </p>
        </div>

        <div className="bg-gradient-to-b from-[#1C120F] to-[#0A0807] border border-[#D98353]/30 p-8 rounded-2xl flex flex-col items-center text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#D98353]/10 flex items-center justify-center border border-[#D98353]/20 animate-pulse">
            <Globe size={32} className="text-white"/>
          </div>
          <div className="space-y-2 max-w-lg">
            <h3 className="text-lg font-serif text-white font-medium">Link Your Google Account</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Authorize secure, read-write access to Calendar Events, Google Drive attachments, email notifications via Gmail, society rosters on Google Sheets, and instant virtual spaces in Google Meet.
            </p>
          </div>

          {/* Upfront Iframe Sandbox Advisory */}
          <div className="bg-[#1C120F]/90 border border-amber-900/40 p-4 rounded-xl text-center max-w-md text-amber-200 text-xs leading-relaxed space-y-1.5 font-sans">
            <span className="font-mono font-black block text-[10px] uppercase tracking-wider text-amber-500"><AlertTriangle size={12} className="inline-block -mt-0.5 mr-1"/> Running inside preview iframe?</span>
            <p className="text-[11px] text-stone-300">
              Because of browser security constraints on third-party cookies inside sandboxed iframes, the Google authorization popup may fail. Please open the application in a new tab first to link your account smoothly.
            </p>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#D98353] font-bold underline hover:text-[#B35F30]"
            >
              Open App in New Tab ↗
            </a>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-6 h-11 bg-white hover:bg-stone-100 text-stone-900 font-semibold text-xs tracking-wider rounded-xl transition-all flex items-center gap-3.5 shadow-lg border border-stone-200 cursor-pointer disabled:opacity-50"
          >
            {isConnecting ? (
              <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            <span className="font-mono uppercase font-bold text-[10px] tracking-widest text-stone-900">
              {isConnecting ? 'Authorizing...' : 'Authorize Google Account'}
            </span>
          </button>

          {authError && (
            <div className="bg-[#1C120F] border border-rose-900/40 p-4 rounded-xl max-w-md space-y-2 text-left animate-slide-up">
              <div className="flex items-start gap-2.5 text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Sign-in Notice</span>
              </div>
              
              <p className="text-[11px] text-stone-300 leading-relaxed font-serif">
                {authError === 'popup-closed-by-user' ? (
                  <>
                    The Google sign-in window was closed before authorization completed. 
                    If this happened automatically or you didn't see the window, it is likely because this application is running inside an <span className="font-bold text-white">iframe sandboxed preview</span>.
                  </>
                ) : authError === 'popup-blocked' ? (
                  <>
                    The sign-in popup was blocked by your browser. Please configure your browser to allow popups for this page or open this app in a new window.
                  </>
                ) : (
                  <>
                    An error occurred: <span className="font-mono text-rose-300">{authError}</span>.
                  </>
                )}
              </p>

              <div className="pt-1.5 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-stone-400 uppercase font-mono font-bold"><Sparkles size={12} className="inline-block -mt-0.5 mr-1"/> Recommended Solution:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono uppercase font-bold text-white flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    Open App in New Tab ↗
                  </a>
                  <button
                    onClick={handleConnect}
                    className="flex-1 h-8 bg-[#D98353]/15 hover:bg-[#D98353]/25 border border-[#D98353]/30 rounded-lg text-[9px] font-mono uppercase font-bold text-[#D98353] transition-all cursor-pointer"
                  >
                    Retry Authorization
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/5 flex flex-wrap justify-center gap-6 text-[10px] text-stone-500 font-mono uppercase">
            <span>● Calendar</span>
            <span>● Drive</span>
            <span>● Gmail</span>
            <span>● Sheets</span>
            <span>● Meet</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CONNECTED HUB DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in pb-16 w-full max-w-5xl mx-auto px-4 text-left">
      {/* Header Info Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#ECE6E1]">
            <Globe size={28} className="text-[#D98353] inline-block -mt-1 mr-2"/>Google <span className="text-[#D98353]">Workspace Hub</span>
          </h1>
          <p className="text-xs text-[#AC9E94]">
            Securely integrating society operations directly with Google Workspace core services.
          </p>
        </div>

        {/* Connected account metadata */}
        <div className="flex items-center gap-3.5 bg-white/[0.02] border border-[#D98353]/20 px-4 py-2.5 rounded-xl self-start md:self-auto shadow-inner">
          {googleUser?.photoURL ? (
            <img src={googleUser.photoURL} alt="Google avatar" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#D98353]/10 text-[#D98353] flex items-center justify-center font-bold text-xs uppercase">
              {googleUser?.email?.charAt(0) || 'G'}
            </div>
          )}
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Connected
            </p>
            <p className="text-[10px] text-stone-300 font-mono truncate max-w-[160px]" title={googleUser?.email}>
              {googleUser?.email}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="ml-2 text-[9px] font-mono uppercase font-bold text-stone-500 hover:text-rose-400 transition-colors border border-white/5 hover:border-rose-900/40 px-2 py-1 rounded bg-white/5 cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 border-b border-white/5 pb-2.5">
        {(
          [
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'meet', label: 'Meet', icon: Video },
            { id: 'drive', label: 'Drive', icon: HardDrive },
            { id: 'gmail', label: 'Gmail', icon: Mail },
            { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setExportedSheetUrl('');
              }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-1 sm:px-3 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#D98353]/15 border border-[#D98353]/30 text-[#D98353] font-bold'
                  : 'bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Primary tab content container */}
      <div className="min-h-[380px] bg-black/10 border border-white/5 p-6 rounded-2xl relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs rounded-2xl z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 bg-[#1C120F] border border-[#D98353]/20 p-5 rounded-xl shadow-2xl">
              <RefreshCw className="w-6 h-6 text-[#D98353] animate-spin" />
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">Synchronizing with Google...</span>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: GOOGLE CALENDAR
            ========================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              {/* Event Creation Form */}
              <form onSubmit={handleScheduleEvent} className="flex-1 space-y-4 max-w-md bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-sm font-mono text-[#D98353] uppercase font-bold tracking-wider">Schedule Rehearsal / Class</h3>
                  <p className="text-[10px] text-stone-500">Insert directly into your authorized primary Google Calendar.</p>
                </div>
                
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Classical Svara Training Room"
                      value={calSummary}
                      onChange={(e) => setCalSummary(e.target.value)}
                      className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder-stone-500 outline-none focus:border-[#D98353]/60 transition-all font-serif"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Description (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Practice on Raga Bhairav vocal compositions and rhythm layouts."
                      value={calDesc}
                      onChange={(e) => setCalDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-stone-500 outline-none focus:border-[#D98353]/60 transition-all font-serif resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Start Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={calStart}
                        onChange={(e) => setCalStart(e.target.value)}
                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-[#D98353]/60 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">End Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={calEnd}
                        onChange={(e) => setCalEnd(e.target.value)}
                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-[#D98353]/60 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Google Meet Toggle */}
                  <div className="flex items-center gap-3 py-1.5 px-3.5 bg-[#D98353]/5 border border-[#D98353]/10 rounded-xl">
                    <input
                      type="checkbox"
                      id="calMeet"
                      checked={calMeet}
                      onChange={(e) => setCalMeet(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 text-[#D98353] focus:ring-0 bg-transparent cursor-pointer"
                    />
                    <label htmlFor="calMeet" className="select-none text-[10px] uppercase font-mono text-stone-300 font-bold cursor-pointer">
                      Auto-generate Google Meet conference
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-[0_0_12px_rgba(217,131,83,0.3)] cursor-pointer"
                  >
                    Schedule Event <Calendar size={16} className="inline-block ml-1"/>
                  </button>
                </div>
              </form>

              {/* Event Listings */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-mono text-[#D98353] uppercase font-bold tracking-wider">Upcoming Calendar Events</h3>
                  <button
                    onClick={loadTabData}
                    className="p-1.5 hover:bg-white/5 text-stone-400 hover:text-white rounded-lg transition-all"
                    title="Refresh feed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                  {events.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 space-y-2">
                      <Calendar className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs font-mono">No upcoming calendar events detected.</p>
                    </div>
                  ) : (
                    events.map((evt) => {
                      const startStr = evt.start?.dateTime 
                        ? new Date(evt.start.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        : 'N/A';

                      return (
                        <div key={evt.id} className="bg-white/[0.01] border border-white/5 hover:border-white/10 p-3.5 rounded-xl space-y-2.5 transition-all">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="text-xs font-bold text-white font-serif">{evt.summary}</h4>
                              <p className="text-[9px] font-mono text-[#D98353] tracking-wide mt-0.5">{startStr}</p>
                            </div>
                            <div className="flex gap-1.5">
                              {evt.htmlLink && (
                                <a
                                  href={evt.htmlLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg border border-white/5 transition-all"
                                  title="View on Google Calendar"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {evt.hangoutLink && (
                                <a
                                  href={evt.hangoutLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-[#4285F4] rounded-lg border border-[#4285F4]/20 transition-all flex items-center gap-1"
                                  title="Join Google Meet"
                                >
                                  <Video className="w-3 h-3" />
                                  <span className="text-[8px] font-mono uppercase font-bold">Join Meet</span>
                                </a>
                              )}
                            </div>
                          </div>
                          {evt.description && (
                            <p className="text-[11px] text-stone-400 font-serif leading-relaxed line-clamp-2">
                              {evt.description}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: GOOGLE MEET
            ========================================== */}
        {activeTab === 'meet' && (
          <div className="space-y-6 animate-fade-in max-w-xl mx-auto text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#4285F4]/10 flex items-center justify-center border border-[#4285F4]/20 mx-auto">
              <Video className="w-7 h-7 text-[#4285F4]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-serif text-white">Instant Society Practice Space</h3>
              <p className="text-xs text-stone-400 leading-relaxed max-w-md mx-auto">
                Assembled on-demand. Instantly spawn a secure Google Meet space for direct rehearsal feeds, vocal critiques, or impromptu core committee debates.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleCreateMeet}
                className="px-6 h-11 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-[0_0_15px_rgba(66,133,244,0.3)] cursor-pointer"
              >
                Create Instant Meet Space <Clapperboard size={16} className="inline-block ml-1"/>
              </button>
            </div>

            {latestMeetSpace && (
              <div className="bg-white/[0.02] border border-[#4285F4]/30 p-5 rounded-2xl mt-8 max-w-md mx-auto space-y-4 animate-slide-up">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-[#4285F4] uppercase font-bold tracking-wider">Meet Space Prepared</span>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">● Active Room</span>
                </div>
                
                <div className="space-y-1">
                  <span className="block text-[9px] uppercase font-mono text-stone-500">Meeting Code</span>
                  <span className="text-sm font-mono text-white font-bold tracking-wide select-all">{latestMeetSpace.meetingCode || 'N/A'}</span>
                </div>

                <div className="flex gap-2 justify-center pt-1.5">
                  <button
                    onClick={() => copyToClipboard(latestMeetSpace.meetingUri)}
                    className="flex-1 h-9 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono uppercase font-bold tracking-wider text-stone-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {copiedText === latestMeetSpace.meetingUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText === latestMeetSpace.meetingUri ? 'Copied' : 'Copy Link'}
                  </button>
                  <a
                    href={latestMeetSpace.meetingUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-9 bg-[#4285F4] hover:bg-[#4285F4]/90 text-white text-[10px] font-mono uppercase font-bold tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Now ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB: GOOGLE DRIVE
            ========================================== */}
        {activeTab === 'drive' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              {/* Document/Lyric uploader */}
              <form onSubmit={handleUploadFile} className="flex-1 space-y-4 max-w-md bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-sm font-mono text-[#D98353] uppercase font-bold tracking-wider">Upload Lyric / Chord Sheet</h3>
                  <p className="text-[10px] text-stone-500">Auto-save text document file to authorized Google Drive.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Raga Bhairavi Lyrics"
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                      className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder-stone-500 outline-none focus:border-[#D98353]/60 transition-all font-serif"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Lyrics / Text Content</label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Type chords, lyrics, or notes here..."
                      value={uploadFileContent}
                      onChange={(e) => setUploadFileContent(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-stone-500 outline-none focus:border-[#D98353]/60 transition-all font-mono resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-[0_0_12px_rgba(217,131,83,0.3)] cursor-pointer"
                  >
                    Upload Document <Send size={16} className="inline-block ml-1"/>
                  </button>
                </div>
              </form>

              {/* Recent Files Listings */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-mono text-[#D98353] uppercase font-bold tracking-wider">Recent Drive Documents</h3>
                  <button
                    onClick={loadTabData}
                    className="p-1.5 hover:bg-white/5 text-stone-400 hover:text-white rounded-lg transition-all"
                    title="Refresh feed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                  {files.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 space-y-2">
                      <HardDrive className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs font-mono">No documents found on Google Drive.</p>
                    </div>
                  ) : (
                    files.map((file) => (
                      <div key={file.id} className="bg-white/[0.01] border border-white/5 hover:border-white/10 p-3 rounded-xl flex items-center justify-between gap-3 transition-all">
                        <div className="flex items-center gap-3 truncate">
                          {file.iconLink ? (
                            <img src={file.iconLink} alt="mime-icon" className="w-4.5 h-4.5 filter opacity-70" />
                          ) : (
                            <HardDrive className="w-4 h-4 text-stone-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="text-xs font-bold text-stone-200 block truncate font-serif">{file.name}</span>
                            <span className="text-[8px] font-mono text-stone-500">
                              {file.mimeType.split('.').pop()?.toUpperCase() || 'FILE'}
                            </span>
                          </div>
                        </div>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-white/5 text-stone-400 hover:text-white rounded-lg border border-white/5 transition-all flex items-center gap-1 shrink-0"
                            title="Open in Drive"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="text-[8px] font-mono uppercase font-bold">Open</span>
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: GMAIL
            ========================================== */}
        {activeTab === 'gmail' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              {/* Mail composer */}
              <form onSubmit={handleSendEmail} className="flex-1 space-y-4 max-w-md bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-sm font-mono text-[#D98353] uppercase font-bold tracking-wider">Send Society Broadcast</h3>
                  <p className="text-[10px] text-stone-500">Dispatches an email notification via authorized Gmail account.</p>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">To (Recipient Email)</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. member@gmail.com"
                      value={mailTo}
                      onChange={(e) => setMailTo(e.target.value)}
                      className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder-stone-500 outline-none focus:border-[#D98353]/60 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Malhaar Audition Announcement / Rehearsal"
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                      className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder-stone-500 outline-none focus:border-[#D98353]/60 transition-all font-serif"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Message Content</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Write your email body here..."
                      value={mailBody}
                      onChange={(e) => setMailBody(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-stone-500 outline-none focus:border-[#D98353]/60 transition-all font-serif resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-[0_0_12px_rgba(217,131,83,0.3)] cursor-pointer"
                  >
                    Send Email <Send size={16} className="inline-block ml-1"/>
                  </button>
                </div>
              </form>

              {/* Recent messages */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-mono text-[#D98353] uppercase font-bold tracking-wider">Recent Dispatched Emails</h3>
                  <button
                    onClick={loadTabData}
                    className="p-1.5 hover:bg-white/5 text-stone-400 hover:text-white rounded-lg transition-all"
                    title="Refresh feed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto scrollbar-thin pr-1">
                  {emails.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 space-y-2">
                      <Mail className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs font-mono">No recent sent messages registered.</p>
                    </div>
                  ) : (
                    emails.map((m) => (
                      <div key={m.id} className="bg-white/[0.01] border border-white/5 p-3 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-stone-200 font-serif line-clamp-1">{m.subject}</h4>
                          <span className="text-[8px] font-mono text-stone-500 shrink-0">{m.date ? new Date(m.date).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="text-[9px] font-mono text-[#D98353]">From: {m.from}</p>
                        {m.snippet && (
                          <p className="text-[10px] text-stone-400 font-serif leading-relaxed line-clamp-2 italic">
                            "{m.snippet}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: GOOGLE SHEETS
            ========================================== */}
        {activeTab === 'sheets' && (
          <div className="space-y-6 animate-fade-in max-w-xl mx-auto text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#34A853]/10 flex items-center justify-center border border-[#34A853]/20 mx-auto">
              <FileSpreadsheet className="w-7 h-7 text-[#34A853]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-serif text-white">Assemble & Export Society Ledger</h3>
              <p className="text-xs text-stone-400 leading-relaxed max-w-md mx-auto">
                Generate beautifully structured Google Sheets containing real-time performance profiles, cumulative leaderboards, or active task schedules.
              </p>
            </div>

            <div className="flex justify-center gap-6 py-4">
              <label className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 px-4 py-3 rounded-xl cursor-pointer select-none">
                <input
                  type="radio"
                  name="exportSource"
                  checked={exportSource === 'leaderboard'}
                  onChange={() => setExportSource('leaderboard')}
                  className="w-4 h-4 text-[#34A853] focus:ring-0 bg-transparent cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-300">Society Leaderboard</span>
              </label>

              <label className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 px-4 py-3 rounded-xl cursor-pointer select-none">
                <input
                  type="radio"
                  name="exportSource"
                  checked={exportSource === 'targets'}
                  onChange={() => setExportSource('targets')}
                  className="w-4 h-4 text-[#34A853] focus:ring-0 bg-transparent cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-300">Monthly Targets</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExportSheet}
                className="px-6 h-11 bg-gradient-to-r from-[#34A853] to-[#2E7D32] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-[0_0_15px_rgba(52,168,83,0.3)] cursor-pointer"
              >
                Assemble & Export Sheet <BarChart size={16} className="inline-block ml-1"/>
              </button>
            </div>

            {exportedSheetUrl && (
              <div className="bg-white/[0.02] border border-[#34A853]/30 p-5 rounded-2xl mt-8 max-w-md mx-auto space-y-4 animate-slide-up">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-[#34A853] uppercase font-bold tracking-wider">Spreadsheet Ready</span>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">● Upload Completed</span>
                </div>

                <p className="text-xs text-stone-300 font-serif leading-relaxed">
                  The spreadsheet has been saved in your Google Drive under the name: <br />
                  <span className="font-bold text-white italic">
                    {exportSource === 'leaderboard' ? 'Malhaar Music Society Leaderboard' : 'Malhaar Monthly Targets Board'}
                  </span>
                </p>

                <div className="pt-2">
                  <a
                    href={exportedSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-10 bg-[#34A853] hover:bg-[#34A853]/90 text-white font-semibold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Sheets ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
