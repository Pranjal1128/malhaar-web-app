import React, {useState, useEffect, useRef} from 'react';
import {
  Profile,
  Performance,
  dbInstance,
  Notice,
  ClubEvent,
  Achievement,
  Merchandise,
  TimetableEntry,
  MonthlyTarget,
  CoreMember,
  Suggestion,
  SiteContent,
  AlumniMessage,
  AttendanceSession,
  AttendanceRecord
} from './db/mockDb';

// Import our modular custom components
import FloatingNotes from './components/FloatingNotes';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import ProfileView from './components/ProfileView';
import AdminView from './components/AdminView';
import SplashView from './components/SplashView';
import RulesView from './components/RulesView';
import SettingsPopup from './components/SettingsPopup';
import MusicLabView from './components/MusicLabView';
import WorkspaceHubView from './components/WorkspaceHubView';
import { getWorkspaceToken, connectGoogleWorkspace, disconnectGoogleWorkspace, getWorkspaceUser } from './lib/workspaceAuth';
import { listCalendarEvents, createCalendarEvent, CalendarEvent } from './lib/workspaceApi';

// Beautiful custom inline Lucide icon mimics for zero import issues, or import directly
import {
  Music,
  Users,
  Trophy,
  History as HistoryIcon,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Lock,
  Settings,
  Search,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  Trash2,
  Check,
  Clock,
  ArrowRight
} from 'lucide-react';

const getWeekdayOfEntry = (dayOrDate: string): string => {
  if (dayOrDate && dayOrDate.includes('-')) {
    const parts = dayOrDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }
  }
  return dayOrDate;
};

const getLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const VoiceNotePlayer = ({ audioUrl }: { audioUrl: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.log("Audio play failed: ", e));
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-[#FAF3F0]/95 border border-[#EBE3DE] p-3 rounded-2xl w-full max-w-[280px] shadow-sm">
      <button 
        onClick={togglePlay}
        className="w-10 h-10 shrink-0 rounded-full bg-[#D98353] hover:bg-[#B35F30] text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
      >
        {isPlaying ? (
          <span className="text-xs font-bold font-sans">⏸</span>
        ) : (
          <span className="text-xs font-bold font-sans">▶</span>
        )}
      </button>
      <div className="flex-1 space-y-1 text-left">
        {/* Animated wave lines */}
        <div className="flex items-end gap-[2px] h-6">
          {[6, 12, 18, 10, 14, 8, 16, 12, 10, 14, 6, 12, 18, 10, 8, 14, 6].map((h, i) => (
            <span 
              key={i} 
              style={{ height: `${h}px` }} 
              className={`w-[2.5px] rounded-full bg-[#D98353] transition-all duration-300 ${
                isPlaying ? 'animate-pulse bg-[#B35F30]' : 'opacity-50'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[8px] font-mono text-stone-500">
          <span>{isPlaying ? "Playing..." : "Voice Note"}</span>
          <span>0:14</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Core navigation view routing
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Active Month (Global operational month)
  const [activeMonth, setActiveMonth] = useState<string>(() => dbInstance.getActiveMonth());

  // Interactive Theme Toggle (Dark theme is DEFAULT)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Custom Toast/Notification state (sonner mimic within safe frame container)
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // Clock state for header
  const [currentTime, setCurrentTime] = useState<string>('');

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global settings Popup & Desktop Simulator Frames
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDesktopFrame, setIsDesktopFrame] = useState(true);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newSugTitle, setNewSugTitle] = useState('');
  const [newSugContent, setNewSugContent] = useState('');
  const [newSugAnon, setNewSugAnon] = useState(false);

  // President Core Control state
  const [isControlUnlocked, setIsControlUnlocked] = useState(false);
  const [controlPassword, setControlPassword] = useState('');
  const [corePerformances, setCorePerformances] = useState<any[]>([]);

  // Master lists for display inside Leaderboard, Core, Timetable etc.
  const [leaderboardUsers, setLeaderboardUsers] = useState<{ profile: Profile; perf: Performance }[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([]);

  // Year filter states
  const [coreTenureFilter, setCoreTenureFilter] = useState<string>('Starred');
  const [timetableFilter, setTimetableFilter] = useState<string>('All');

  // Integrated timetable attendance states
  const [markingTimetableId, setMarkingTimetableId] = useState<string | null>(null);
  const [markingDate, setMarkingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markingRecords, setMarkingRecords] = useState<Record<string, { status: 'present' | 'absent'; excuse: string }>>({});
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<any[]>([]);
  const [activeProfiles, setActiveProfiles] = useState<Profile[]>([]);
  const [showAllMarking, setShowAllMarking] = useState<boolean>(false);
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState<string>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  });
  const [selectedLedgerMonth, setSelectedLedgerMonth] = useState<string | null>('July');
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Alumni connect chat states
  const [alumniMessages, setAlumniMessages] = useState<AlumniMessage[]>([]);
  const [newAlumniMsgText, setNewAlumniMsgText] = useState<string>('');
  const [alumniAttachedImage, setAlumniAttachedImage] = useState<string | null>(null);
  const [alumniAttachedAudio, setAlumniAttachedAudio] = useState<string | null>(null);
  const [alumniIsRecording, setAlumniIsRecording] = useState<boolean>(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeView === 'alumni-connect') {
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [alumniMessages, activeView]);

  // Trigger Sonner mimics
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Data is already loaded by main.tsx bootstrap before App renders.
  // We do NOT re-fetch here to avoid a double-fetch race condition (Bug E fix).
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Synchronous initializations on first view load
  useEffect(() => {
    // Read cached login sessions
    const storedUser = localStorage.getItem('malhaar_session_profile');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Read theme mode
    const storedTheme = localStorage.getItem('malhaar_theme') as any;
    if (storedTheme) {
      setThemeMode(storedTheme);
    }

    setIsAuthLoading(false);

    // Initialize clock
    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Automatically adjust user points and streak for attendance markings
  const updateUserPointsForAttendance = (userId: string, isPresent: boolean, wasPresent: boolean | undefined) => {
    const performances = dbInstance.getPerformance();
    let userPerf = performances.find(p => p.user_id === userId);
    
    if (!userPerf) {
      userPerf = {
        user_id: userId,
        attendance_streak: 0,
        tasks_completed: 0,
        attendance_points: 0,
        task_points: 0,
        contribution_points: 0,
        achievement_points: 0,
        total_points: 0
      };
      performances.push(userPerf);
    }

    const oldStatusPresent = wasPresent === true;
    
    if (isPresent && !oldStatusPresent) {
      userPerf.attendance_points = (userPerf.attendance_points || 0) + 3;
      userPerf.total_points = (userPerf.total_points || 0) + 3;
      userPerf.attendance_streak = (userPerf.attendance_streak || 0) + 1;
    } else if (!isPresent && oldStatusPresent) {
      userPerf.attendance_points = Math.max(0, (userPerf.attendance_points || 0) - 3);
      userPerf.total_points = Math.max(0, (userPerf.total_points || 0) - 3);
      userPerf.attendance_streak = Math.max(0, (userPerf.attendance_streak || 0) - 2);
    }
    
    dbInstance.savePerformance(performances);
  };

  // Fetch / Refresh table dependencies
  const refreshApplicationData = () => {
    const profiles = dbInstance.getProfiles();
    const performance = dbInstance.getPerformance();
    const noticesData = dbInstance.getNotices();
    const achievementsData = dbInstance.getAchievements();
    const eventsData = dbInstance.getEvents();
    const timetableData = dbInstance.getTimetable();
    const targetsData = dbInstance.getMonthlyTargets();
    const suggestionsData = dbInstance.getSuggestions();
    const coreMembersData = dbInstance.getCoreMembers();
    const corePerfData = dbInstance.getCorePerformance();

    // Set sorted leaderboard pairings - ONLY approved non-core, non-presidential standard members!
    const paired = profiles.filter(p => p.role === 'member' && p.approved).map(p => {
      const perf = performance.find(pf => pf.user_id === p.id) || {
        user_id: p.id,
        attendance_points: 0,
        task_points: 0,
        contribution_points: 0,
        achievement_points: 0,
        total_points: 0,
        attendance_streak: 0,
        tasks_completed: 0
      };
      return { profile: p, perf };
    }).sort((a, b) => b.perf.total_points - a.perf.total_points);

    setLeaderboardUsers(paired);
    setNotices(noticesData);
    setAchievements(achievementsData);
    setEvents(eventsData);
    setTimetable(timetableData);
    setTargets(targetsData);
    setSuggestions(suggestionsData);
    setCoreMembers(coreMembersData);
    setCorePerformances(corePerfData);
    setAllSessions(dbInstance.getAttendanceSessions());
    setAllAttendanceRecords(dbInstance.getAttendanceRecords());
    setActiveProfiles(profiles.filter(p => p.approved));
    setAlumniMessages(dbInstance.getAlumniMessages() || []);
    
    const loadedMonth = dbInstance.getActiveMonth();
    setActiveMonth(loadedMonth);

    const siteContent = dbInstance.getSiteContent() || [];
    const customLogoItem = siteContent.find(x => x.content_key === 'custom_logo');
    setCustomLogo(customLogoItem ? customLogoItem.content_value : '');
  };

  const handleLogoClick = () => {
    if (currentUser?.role === 'president') {
      logoInputRef.current?.click();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image/png') && !file.type.match('image/jpeg') && !file.type.match('image/jpg')) {
      triggerToast('Please select a PNG or JPG/JPEG image.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const current = dbInstance.getSiteContent() || [];
        const updated = current.filter(x => x.content_key !== 'custom_logo');
        updated.push({ content_key: 'custom_logo', content_value: base64 });
        dbInstance.saveSiteContent(updated);
        setCustomLogo(base64);
        triggerToast('Malhaar Logo updated successfully!', 'success');
        refreshApplicationData();
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchGoogleCalendarEvents = async () => {
    const token = getWorkspaceToken();
    if (!token) {
      setGoogleEvents([]);
      return;
    }
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const events = await listCalendarEvents();
      setGoogleEvents(events || []);
    } catch (err: any) {
      console.error("Error loading Google Calendar events:", err);
      const errMsg = err.message || "";
      if (
        errMsg.toLowerCase().includes("authentication") ||
        errMsg.toLowerCase().includes("credentials") ||
        errMsg.toLowerCase().includes("unauthorized") ||
        errMsg.toLowerCase().includes("401") ||
        errMsg.toLowerCase().includes("token") ||
        errMsg.toLowerCase().includes("failed to fetch")
      ) {
        disconnectGoogleWorkspace();
        setGoogleEvents([]);
        triggerToast("Google Workspace connection expired or unavailable. Please connect again.", "info");
      } else {
        setGoogleError(errMsg || "Failed to load Google Calendar events.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSyncToGoogleCalendar = async (slot: any, targetDateStr: string) => {
    const token = getWorkspaceToken();
    if (!token) {
      triggerToast("Please connect your Google Workspace Calendar first!", "error");
      return;
    }
    
    const startTimeStr = `${targetDateStr}T${slot.start_time}:00`;
    const endTimeStr = `${targetDateStr}T${slot.end_time}:00`;

    try {
      triggerToast(`Syncing "${slot.title}" rehearsal to Google Calendar...`, "info");
      await createCalendarEvent(
        slot.title,
        `Malhaar Rehearsal Pattern: ${slot.description || 'Practice session'}\nTarget Audience: ${slot.assigned_to || 'All members'}`,
        startTimeStr,
        endTimeStr,
        true
      );
      triggerToast(`Successfully synced "${slot.title}" to Google Calendar with a Google Meet link!`, "success");
      fetchGoogleCalendarEvents();
    } catch (err: any) {
      console.error("Google Calendar Sync error:", err);
      triggerToast(`Sync failed: ${err.message}`, "error");
    }
  };

  const handleLaunchRosterForSlot = (slot: any, dateStr: string) => {
    // 1. Check if a session already exists for this slot on this date
    const existingSession = allSessions.find(s => s.description === slot.id && s.date === dateStr);
    
    let sessionId = "";
    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      // Create new session
      sessionId = `session_${Date.now()}`;
      const newSession = {
        id: sessionId,
        date: dateStr,
        title: slot.title,
        description: slot.id
      };
      
      const updatedSessions = [...allSessions, newSession];
      setAllSessions(updatedSessions);
      dbInstance.saveAttendanceSessions(updatedSessions);
      
      // Select profiles: if slot has assigned_to and it is not 'All', find that specific person by name, otherwise active profiles based on meeting type
      const isCoreMeeting = slot.title.toLowerCase().includes("core team");
      const filteredProfs = isCoreMeeting
        ? activeProfiles.filter(p => p.role === 'core' || p.role === 'president' || p.role === 'admin')
        : activeProfiles.filter(p => p.role === 'member');

      const targetProfiles = (slot.assigned_to && slot.assigned_to !== 'All')
        ? filteredProfs.filter(p => slot.assigned_to!.split(',').map(n => n.trim().toLowerCase()).includes(p.name.toLowerCase()))
        : filteredProfs;
        
      const initialRecords = targetProfiles.map(p => ({
        id: `rec_${sessionId}_${p.id}`,
        session_id: sessionId,
        user_id: p.id,
        status: 'present' as const
      }));
      
      // Auto-award 3 points per present record on session initialization
      targetProfiles.forEach(p => {
        updateUserPointsForAttendance(p.id, true, false);
      });
      
      const updatedRecords = [...allAttendanceRecords, ...initialRecords];
      setAllAttendanceRecords(updatedRecords);
      dbInstance.saveAttendanceRecords(updatedRecords);
    }
    
    // Switch to attendance tab and focus on this editor
    setActiveView('attendance');
    setMarkingTimetableId(sessionId);
    setMarkingDate(dateStr);
    
    // Set marking records state for editor
    const recordsForSession = allAttendanceRecords.filter(r => r.session_id === (existingSession ? existingSession.id : sessionId));
    const mapped: Record<string, { status: 'present' | 'absent', excuse: string }> = {};
    recordsForSession.forEach(r => {
      mapped[r.user_id] = { status: r.status, excuse: r.excuse || '' };
    });
    // Fallback if records are newly initialized
    if (Object.keys(mapped).length === 0) {
      const isCoreMeeting = (existingSession ? existingSession.title : slot.title).toLowerCase().includes("core team");
      const filteredProfs = isCoreMeeting
        ? activeProfiles.filter(p => p.role === 'core' || p.role === 'president' || p.role === 'admin')
        : activeProfiles.filter(p => p.role === 'member');

      const targetProfiles = (slot.assigned_to && slot.assigned_to !== 'All')
        ? filteredProfs.filter(p => slot.assigned_to!.split(',').map(n => n.trim().toLowerCase()).includes(p.name.toLowerCase()))
        : filteredProfs;
      targetProfiles.forEach(p => {
        mapped[p.id] = { status: 'present', excuse: '' };
      });
    }
    setMarkingRecords(mapped);
    
    triggerToast(`Roster sheet loaded for "${slot.title}"!`, 'success');
  };

  useEffect(() => {
    if (activeView === 'timetable' || activeView === 'workspace' || activeView === 'attendance') {
      fetchGoogleCalendarEvents();
    }
  }, [activeView]);

  useEffect(() => {
    refreshApplicationData();
    const handleDbUpdate = () => refreshApplicationData();
    window.addEventListener('malhaar-db-update', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);
    return () => {
      window.removeEventListener('malhaar-db-update', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, [currentUser]);

  // Auth callback
  const handleAuthSuccess = (profile: Profile) => {
    setCurrentUser(profile);
    localStorage.setItem('malhaar_session_profile', JSON.stringify(profile));
    setActiveView('dashboard');
  };

  // Sign out callback
  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('malhaar_session_profile');
    setIsControlUnlocked(false);
    triggerToast('Logged out of Society session. Come jam again soon!', 'info');
  };

  // Suggestions submittal
  const handleAddSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSugTitle.trim() || !newSugContent.trim() || !currentUser) {
      triggerToast('Please complete both title and description.', 'error');
      return;
    }

    const currentSugs = dbInstance.getSuggestions();
    const isAnonChecked = localStorage.getItem(`malhaar_anon_${currentUser.id}`) === 'true' || newSugAnon;

    const newS: Suggestion = {
      id: `sug_${Date.now()}`,
      user_id: currentUser.id,
      user_name: isAnonChecked ? 'Anonymous Member' : currentUser.name,
      title: newSugTitle,
      content: newSugContent,
      is_anonymous: isAnonChecked,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const updated = [newS, ...currentSugs];
    dbInstance.saveSuggestions(updated);
    setSuggestions(updated);
    
    setNewSugTitle('');
    setNewSugContent('');
    triggerToast('Suggestion securely logged inside the college inbox!', 'success');
  };

  // Suggestions interaction reply
  const handleReplySuggestion = (id: string, responseText: string, updatedStatus: Suggestion['status']) => {
    if (!responseText.trim()) {
      triggerToast('Please type a feedback reply text.', 'error');
      return;
    }
    const currentSugs = dbInstance.getSuggestions();
    const updated = currentSugs.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: updatedStatus,
          admin_response: responseText
        };
      }
      return s;
    });
    dbInstance.saveSuggestions(updated);
    setSuggestions(updated);
    triggerToast('Suggestion feedback updated and logged in user inbox!', 'success');
  };

  // Core President unlocking
  const handleControlHallAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPass = controlPassword.trim();
    if (normalizedPass === 'MALHAARCOREGNG' || normalizedPass.toLowerCase() === 'malhaarcoregng' || normalizedPass.toLowerCase() === 'malhaar core gang' || normalizedPass.toLowerCase() === 'malhar core gang' || normalizedPass === 'MALHAARCORERECORD' || normalizedPass.toLowerCase() === 'malhaarcorerecord') {
      setIsControlUnlocked(true);
      triggerToast('President access verified. Control hall systems fully operational!', 'success');
    } else {
      triggerToast('Password incorrect. Restricted presidential access only.', 'error');
    }
  };

  const handleSendAlumniMessage = () => {
    if (!currentUser) return;
    if (!newAlumniMsgText.trim() && !alumniAttachedImage && !alumniAttachedAudio) return;
    
    const newMessage: AlumniMessage = {
      id: `msg_${Date.now()}`,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_role: currentUser.role,
      sender_image: currentUser.profile_image_url,
      text: newAlumniMsgText.trim(),
      timestamp: new Date().toISOString(),
      audio_url: alumniAttachedAudio || undefined,
      image_url: alumniAttachedImage || undefined
    };

    const currentMsgs = dbInstance.getAlumniMessages() || [];
    const updated = [...currentMsgs, newMessage];
    dbInstance.saveAlumniMessages(updated);
    setAlumniMessages(updated);
    
    // Clear all inputs
    setNewAlumniMsgText('');
    setAlumniAttachedImage(null);
    setAlumniAttachedAudio(null);
  };

  const handleDeleteAlumniMessage = (id: string) => {
    if (!currentUser || !['admin', 'president', 'central_core', 'core'].includes(currentUser.role)) return;
    const currentMsgs = dbInstance.getAlumniMessages() || [];
    const updated = currentMsgs.filter(m => m.id !== id);
    dbInstance.saveAlumniMessages(updated);
    setAlumniMessages(updated);
    triggerToast('Alumni chat message deleted by moderator.', 'info');
  };

  const handleUpdateCorePerformance = (coreId: string, deltaAssigned: number, deltaCompleted: number) => {
    const updated = corePerformances.map(cp => {
      if (cp.core_id === coreId) {
        const assigned = Math.max(1, cp.tasks_assigned + deltaAssigned);
        const completed = Math.max(0, cp.tasks_completed + deltaCompleted);
        const progress = Math.round((completed * 100) / assigned);
        return {
          ...cp,
          tasks_assigned: assigned,
          tasks_completed: completed,
          progress,
          efficiency_score: Math.min(100, Math.round(progress * 1.05))
        };
      }
      return cp;
    });
    dbInstance.saveCorePerformance(updated);
    setCorePerformances(updated);
    triggerToast('Core member task assignments updated in real-time!', 'success');
  };

  // Toggle Theme mode
  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    localStorage.setItem('malhaar_theme', nextMode);
    triggerToast(`Theme switched to eye-safe ${nextMode} mode!`);
  };

  // Render proper body content depending on routing view index
  const renderViewContent = () => {
    if (!currentUser) {
      if (activeView === 'dashboard') {
        return (
          <DashboardView 
            currentUser={null} 
            onRequestToast={triggerToast} 
            onRefreshTrigger={refreshApplicationData} 
          />
        );
      }
      return null;
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView 
            currentUser={currentUser} 
            onRequestToast={triggerToast} 
            onRefreshTrigger={refreshApplicationData} 
          />
        );

      case 'music-lab':
        return (
          <MusicLabView 
            currentUser={currentUser} 
            onRequestToast={triggerToast}
          />
        );

      case 'rules':
        return (
          <RulesView 
            currentUser={currentUser} 
            onRequestToast={triggerToast} 
          />
        );

      case 'profile':
        return (
          <ProfileView 
            currentUser={currentUser} 
            onProfileUpdate={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('malhaar_session_profile', JSON.stringify(updated));
            }}
            onRequestToast={triggerToast}
            onNavigateToView={setActiveView}
          />
        );

      case 'leaderboard': {
        const currentPerf = dbInstance.getPerformance().find(p => p.user_id === currentUser.id) || {
          attendance_points: 0,
          task_points: 0,
          contribution_points: 0,
          achievement_points: 0,
          total_points: 0,
          attendance_streak: 0,
          tasks_completed: 0
        };
        const currentUserRankIdx = leaderboardUsers.findIndex(u => u.profile.id === currentUser.id);
        const currentUserRankStr = currentUserRankIdx !== -1 ? `#${String(currentUserRankIdx + 1).padStart(2, '0')}` : 'Cabinet 👑';
        const isCabinet = currentUser.role === 'president' || currentUser.role === 'admin';

        const userLevel = currentPerf.total_points >= 200 ? 'Gold Star 🏆' :
                          currentPerf.total_points >= 100 ? 'Silver Star 🏅' :
                          'Bronze Member 🎖️';

        return (
          <div className="space-y-8 animate-fade-in pb-16 w-full max-w-4xl mx-auto px-4 sm:px-6 text-[#D98353]">
            {/* Header section in high-contrast dark neon theme */}
            <div className="border-b border-[#D98353]/20 pb-4 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-serif text-white font-bold tracking-tight">Society Standing Leaderboard</h1>
                <p className="text-xs text-stone-400">View real-time student rankings calculated by attendance, mandates, and weekly tasks.</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-black/60 border border-[#D98353]/30 rounded-full text-xs font-mono text-[#D98353] font-bold shadow-[0_0_15px_rgba(217,131,83,0.15)]">
                  🏆 {leaderboardUsers.length} Performers Active
                </span>
              </div>
            </div>

            {/* ====== THE TOP 3 PODIUM SECTION ====== */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-8 pb-4 max-w-2xl mx-auto">
              
              {/* 2nd Place: Left column */}
              {leaderboardUsers[1] ? (
                <div className="flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: '100ms' }}>
                  {/* User Avatar with rank badge */}
                  <div className="relative shrink-0 mb-2">
                    <div className="absolute -top-1.5 -right-1.5 bg-[#C0C0C0]/90 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 border-[#A0A0A0] shadow-md">
                      🥈
                    </div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#C0C0C0]/60 overflow-hidden bg-neutral-900 shadow-[0_0_15px_rgba(192,192,192,0.25)]">
                      {leaderboardUsers[1].profile.profile_image_url ? (
                        <img src={leaderboardUsers[1].profile.profile_image_url} alt={leaderboardUsers[1].profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-lg font-serif font-black text-[#D98353]">
                          {leaderboardUsers[1].profile.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white line-clamp-1 max-w-[90px]">{leaderboardUsers[1].profile.name}</span>
                  <span className="text-[10px] font-mono text-[#D98353] font-bold">{leaderboardUsers[1].profile.role === 'president' ? 'NA' : leaderboardUsers[1].perf.total_points} pts</span>
                  
                  {/* Podium vertical bar */}
                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-black via-[#101010] to-[#202020] border border-[#C0C0C0]/30 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-lg shadow-black/80">
                    <span className="text-[#C0C0C0]/90 font-serif font-black text-3xl sm:text-4xl drop-shadow-[0_0_8px_rgba(192,192,192,0.3)]">2</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#C0C0C0]/80 font-bold">Silver</span>
                  </div>
                </div>
              ) : (
                <div className="h-10"></div>
              )}

              {/* 1st Place: Center column (Highest bar with crown) */}
              {leaderboardUsers[0] ? (
                <div className="flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: '0ms' }}>
                  {/* Floating Gold Crown */}
                  <span className="text-2xl animate-bounce mb-1">👑</span>
                  
                  {/* User Avatar with rank badge */}
                  <div className="relative shrink-0 mb-2">
                    <div className="absolute -top-1.5 -right-1.5 bg-[#E6AF2E] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 border-[#E6AF2E] shadow-md">
                      🥇
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#E6AF2E] overflow-hidden bg-neutral-900 shadow-[0_0_25px_rgba(230,175,46,0.5)] relative">
                      {leaderboardUsers[0].profile.profile_image_url ? (
                        <img src={leaderboardUsers[0].profile.profile_image_url} alt={leaderboardUsers[0].profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-xl font-serif font-black text-[#D98353]">
                          {leaderboardUsers[0].profile.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-xs sm:text-base text-white line-clamp-1 max-w-[100px]">{leaderboardUsers[0].profile.name}</span>
                  <span className="text-xs font-mono text-[#D98353] font-extrabold drop-shadow-[0_0_4px_rgba(217,131,83,0.2)]">{leaderboardUsers[0].profile.role === 'president' ? 'NA' : leaderboardUsers[0].perf.total_points} pts</span>
                  
                  {/* Podium vertical bar */}
                  <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-black via-[#1A180F] to-[#2B230F] border border-[#E6AF2E]/40 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-xl shadow-black/90">
                    <span className="text-[#E6AF2E] font-serif font-black text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(230,175,46,0.5)]">1</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#E6AF2E] font-bold">Winner</span>
                  </div>
                </div>
              ) : (
                <div className="h-10"></div>
              )}

              {/* 3rd Place: Right column */}
              {leaderboardUsers[2] ? (
                <div className="flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                  {/* User Avatar with rank badge */}
                  <div className="relative shrink-0 mb-2">
                    <div className="absolute -top-1.5 -right-1.5 bg-[#CD7F32] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 border-[#CD7F32] shadow-md">
                      🥉
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 border-[#CD7F32] overflow-hidden bg-neutral-900 shadow-[0_0_15px_rgba(205,127,50,0.25)]">
                      {leaderboardUsers[2].profile.profile_image_url ? (
                        <img src={leaderboardUsers[2].profile.profile_image_url} alt={leaderboardUsers[2].profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-850 flex items-center justify-center text-md font-serif font-black text-[#CD7F32]">
                          {leaderboardUsers[2].profile.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-white line-clamp-1 max-w-[90px]">{leaderboardUsers[2].profile.name}</span>
                  <span className="text-[10px] font-mono text-[#D98353] font-bold">{leaderboardUsers[2].profile.role === 'president' ? 'NA' : leaderboardUsers[2].perf.total_points} pts</span>
                  
                  {/* Podium vertical bar */}
                  <div className="w-full h-18 sm:h-22 bg-gradient-to-t from-black via-[#0F0A06] to-[#1A120B] border border-[#CD7F32]/30 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-md shadow-black/80">
                    <span className="text-[#CD7F32]/90 font-serif font-black text-2xl sm:text-3xl drop-shadow-[0_0_6px_rgba(205,127,50,0.3)]">3</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#CD7F32]/80 font-bold">Bronze</span>
                  </div>
                </div>
              ) : (
                <div className="h-10"></div>
              )}

            </div>

            {/* ====== HIGHLIGHTED ACTIVE LOGGED-IN USER STANDING CARD ====== */}
            {!isCabinet && (
              <div className="bg-gradient-to-r from-[#D98353] to-[#803816] text-white rounded-3xl p-5 shadow-[0_0_25px_rgba(217,131,83,0.25)] flex items-center justify-between text-left relative overflow-hidden border border-[#D98353]/35 animate-pulse">
                {/* Visual accents */}
                <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="absolute -left-8 -top-8 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full border-2 border-white/60 overflow-hidden bg-white/20 flex items-center justify-center shadow-inner">
                    {currentUser.profile_image_url ? (
                      <img src={currentUser.profile_image_url} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-serif font-black">{currentUser.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                      Your Standing Card
                    </span>
                    <h3 className="text-lg font-bold leading-tight mt-0.5">{currentUser.name}</h3>
                    <p className="text-xs text-white/85 font-mono mt-0.5">
                      {currentUser.role === 'president' ? 'NA' : currentPerf.total_points} Points • {userLevel}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 relative z-10">
                  <span className="text-3xl font-black font-mono block leading-none">{currentUserRankStr}</span>
                  <span className="text-[8px] uppercase tracking-widest font-mono font-medium block mt-1 opacity-90">Society Rank</span>
                </div>
              </div>
            )}

            {/* ====== DETAILED LEADERBOARD LIST ROWS ====== */}
            <div className="space-y-3">
              <h2 className="text-md font-extrabold uppercase font-mono tracking-wider text-[#D98353] text-left">
                📜 Full Performer Roll standings
              </h2>
              
              <div className="bg-black/60 backdrop-blur-md border border-[#D98353]/15 rounded-3xl p-3 sm:p-5 space-y-2 shadow-2xl">
                {leaderboardUsers.map((item, idx) => {
                  const isCurrentUser = item.profile.id === currentUser.id;
                  const rankNum = String(idx + 1).padStart(2, '0');
                  
                  return (
                    <div
                      key={item.profile.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] backdrop-blur-sm ${
                        isCurrentUser 
                          ? 'bg-gradient-to-r from-[#D98353]/15 to-transparent border-[#D98353] shadow-[0_0_15px_rgba(217,131,83,0.2)]' 
                          : 'bg-black/40 border-zinc-850 hover:border-[#D98353]/35'
                      }`}
                    >
                      {/* Left: Serial Number & Identity */}
                      <div className="flex items-center gap-4 text-left">
                        <span className="text-sm font-black font-mono text-[#D98353]/80 w-6">
                          {rankNum}
                        </span>
                        
                        <div className="w-10 h-10 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                          {item.profile.profile_image_url ? (
                            <img src={item.profile.profile_image_url} alt={item.profile.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-md font-serif font-black text-[#D98353]">{item.profile.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white leading-tight">
                              {item.profile.name}
                            </h4>
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono bg-[#D98353] text-black">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400 font-mono block">
                            {item.profile.domain} • {item.profile.year ? `${item.profile.year} Year` : '1st Year'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Points and Crown Overlays */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="block text-sm font-extrabold text-[#D98353] font-mono drop-shadow-[0_0_4px_rgba(217,131,83,0.1)]">
                            {item.profile.role === 'president' ? 'NA' : item.perf.total_points}
                          </span>
                          <span className="text-[9px] text-zinc-500 block font-mono">points</span>
                        </div>
                        
                        {/* Crown icon indicator based on ranking tiers */}
                        <div className="text-lg">
                          {idx === 0 ? (
                            <span title="Gold Standing" className="animate-pulse">👑</span>
                          ) : idx === 1 ? (
                            <span title="Silver Standing">🥈</span>
                          ) : idx === 2 ? (
                            <span title="Bronze Standing">🥉</span>
                          ) : idx < 10 ? (
                            <span title="Top 10 standing">⭐</span>
                          ) : (
                            <span className="text-zinc-700 opacity-60">•</span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}

                {leaderboardUsers.length === 0 && (
                  <div className="p-12 text-center text-zinc-600">
                    <span className="text-2xl">⏳</span>
                    <p className="text-xs font-mono mt-2">No standard student member standings evaluated yet.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      }

      case 'core-team':
        return (
          <div className="space-y-6 animate-fade-in pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 text-left">
              <div>
                <h1 className="text-3xl font-serif text-[#ECE6E1]">Malhaar <span className="text-[#D98353]">Core Members Directory</span></h1>
                <p className="text-xs text-[#AC9E94]">Meet leadership organizers behind timetables, scores, and rehearsals categorized by tenure segments.</p>
              </div>

              <div>
                <select
                  value={coreTenureFilter}
                  onChange={(e) => setCoreTenureFilter(e.target.value)}
                  className="px-4 py-2 bg-black/40 border border-white/10 text-xs text-[#ECE6E1] rounded-xl focus:border-[#D98353] outline-none transition-all cursor-pointer font-serif"
                >
                  <option value="Starred">⭐ Stars Only (First Open)</option>
                  <option value="All">All Tenures</option>
                  <option value="Admin">🛠️ System Administrators</option>
                  <option value="2024-25">Tenure 2024-25</option>
                  <option value="2025-26">Tenure 2025-26</option>
                  <option value="2026-27">Tenure 2026-27</option>
                </select>
              </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coreMembers
                .filter(m => {
                  if (coreTenureFilter === 'Admin') {
                    return m.role_key === 'admin';
                  }
                  // For all other selections (Starred, All, or Tenures), we strictly EXCLUDE admins!
                  if (m.role_key === 'admin') {
                    return false;
                  }

                  if (coreTenureFilter === 'Starred') return m.is_starred;
                  if (coreTenureFilter === 'All') return true;
                  const normM = m.tenure.replace(/\s+/g, '');
                  const normF = coreTenureFilter.replace(/\s+/g, '');
                  return normM.includes(normF) || normF.includes(normM);
                })
                .sort((a, b) => {
                  const roleOrder: Record<string, number> = {
                    'president': 1,
                    'central_core': 2,
                    'core': 3,
                    'admin': 4
                  };
                  const orderA = roleOrder[a.role_key || ''] || roleOrder[a.role?.toLowerCase() || ''] || 99;
                  const orderB = roleOrder[b.role_key || ''] || roleOrder[b.role?.toLowerCase() || ''] || 99;
                  
                  if (orderA !== orderB) return orderA - orderB;
                  return a.name.localeCompare(b.name);
                })
                .map(m => (
                  <div key={m.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 text-center relative overflow-hidden group hover:border-[#D98353]/30 hover:shadow-[0_0_20px_rgba(217,131,83,0.15)] transition-all duration-300">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#D98353] to-[#E6AF2E]" />
                    <div className="w-24 h-24 rounded-full border-4 border-white/5 group-hover:border-[#D98353] transition-colors mx-auto overflow-hidden shadow-md flex items-center justify-center bg-gradient-to-br from-[#2a160f] to-stone-900">
                      {m.image_url ? (
                        <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-serif text-[#D98353] font-bold">
                          {m.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-serif font-bold text-[#ECE6E1]">{m.name}</h3>
                      <p className="text-xs text-[#D98353] font-mono font-bold uppercase tracking-wider">{m.position}</p>
                      <p className="text-[10px] text-[#AC9E94] font-mono">{m.tenure} ({m.tenure_year || '2026'}) • Year {m.year}</p>
                      {m.phone_number && (
                        <p className="text-[10px] text-[#D98353] font-mono bg-[#D98353]/10 py-0.5 px-2 rounded inline-block mt-1">📞 Contact: {m.phone_number}</p>
                      )}
                    </div>
                    <p className="text-xs text-[#AC9E94] leading-relaxed italic">
                      "{m.description}"
                    </p>
                  </div>
                ))}
            </div>

            {/* Removed the nested AdminView duplicate as Admin Panel is accessible as a separate tab/view in the sidebar feed */}
          </div>
        );

      case 'notices':
        return (
          <div className="space-y-6 animate-fade-in pb-16 w-full max-w-4xl mx-auto px-4">
            <div className="border-b border-white/5 pb-4 text-left">
              <h1 className="text-3xl font-serif text-[#ECE6E1]">Official <span className="text-[#D98353]">Bulletin Board</span></h1>
              <p className="text-xs text-[#AC9E94]">Read critical announcements and directives broadcasted by Society leadership.</p>
            </div>

            <div className="space-y-6">
              {notices.map(notice => (
                <div key={notice.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative shadow-xl hover:border-[#D98353]/30 transition-all duration-300">
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-[9px] uppercase font-mono bg-[#D98353]/20 text-[#D98353] border border-[#D98353]/30">
                    pinned
                  </div>
                  <div className="space-y-1 text-left">
                    <h3 className="text-xl font-serif text-[#ECE6E1] font-bold leading-snug">{notice.title}</h3>
                    <p className="text-[10px] text-[#AC9E94] font-mono">{notice.posted_by} • {new Date(notice.posted_at).toLocaleDateString()}</p>
                    <p className="text-sm text-[#AC9E94] leading-relaxed pt-4 whitespace-pre-line border-t border-white/5 mt-3">
                      {notice.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'timetable':
        return (
          <div className="space-y-6 animate-fade-in pb-16 w-full max-w-7xl mx-auto px-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h1 className="text-3xl font-serif text-[#ECE6E1]">Rehearsal & Practice <span className="text-[#D98353]">Schedules</span></h1>
                <p className="text-xs text-[#AC9E94]">
                  Browse dynamic training calendars, view daily slots, and manage rehearsal routines.
                </p>
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-3">
                <select
                  value={timetableFilter}
                  onChange={(e) => setTimetableFilter(e.target.value)}
                  className="px-4 py-2 bg-black/40 border border-white/10 text-xs text-[#ECE6E1] rounded-xl focus:border-[#D98353] outline-none transition-all cursor-pointer font-mono"
                >
                  <option value="All">All Practice Categories</option>
                  <option value="Practice">Practice Session</option>
                  <option value="Workshop">Synths Workshop</option>
                  <option value="Lobby Jam">Open Lobby Jam</option>
                  <option value="Core Meet">Core Review Meets</option>
                </select>
              </div>
            </div>

            {/* Upcoming Today & Tomorrow Timetable Schedule */}
            <div className="space-y-6 mt-8">
              {Array.from({ length: 2 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const dateStr = getLocalDateString(date);
                
                // Filter timetable entries for this day of the week
                const dayEvents = timetable.filter(t => {
                  const typeMatches = timetableFilter === 'All' || t.event_type === timetableFilter;
                  if (!typeMatches) return false;

                  // Only show timetable in the feed of people who are marked for that event
                  if (currentUser) {
                    const isCabinet = ['admin', 'president', 'central_core'].includes(currentUser.role);
                    if (!isCabinet) {
                      const assigned = t.assigned_to;
                      if (assigned && assigned !== 'All') {
                        const assignedLower = assigned.toLowerCase();
                        if (assignedLower === 'core') {
                          if (currentUser.role !== 'core') return false;
                        } else {
                          const list = assignedLower.split(',').map(n => n.trim());
                          const isMarked = list.includes(currentUser.name.toLowerCase()) || list.includes(currentUser.id.toLowerCase());
                          if (!isMarked) return false;
                        }
                      }
                    }
                  }

                  if (t.day_of_week && t.day_of_week.includes('-')) {
                    return t.day_of_week === dateStr;
                  }
                  return t.day_of_week === dayName;
                });

                if (i === 0) {
                  // If there are actual scheduled slots for today, render them!
                  if (dayEvents.length > 0) {
                    return (
                      <div key={dateStr} className="bg-gradient-to-r from-[#1E1411] to-[#0D0A09] border border-orange-500/20 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                        <h3 className="text-xl font-serif font-bold text-[#D98353] border-b border-white/5 pb-2 flex justify-between items-center">
                          <span>Today <span className="text-sm font-mono text-stone-500 ml-2">({dateStr})</span></span>
                          <span className="text-[10px] uppercase font-mono bg-orange-950/40 text-orange-400 border border-orange-900/30 px-2 py-0.5 rounded">Current Day</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dayEvents.map(slot => (
                            <div key={slot.id} className="bg-black/40 border border-[#D98353]/25 p-5 rounded-2xl flex flex-col justify-between hover:border-[#D98353]/60 hover:shadow-[0_0_15px_rgba(217,131,83,0.1)] transition-all text-left space-y-3">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-[#D98353]/20 text-[#D98353]">
                                    {slot.event_type}
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 font-semibold">
                                    {slot.start_time}-{slot.end_time}
                                  </span>
                                </div>
                                <h4 className="font-serif text-sm font-bold text-white mt-1.5">{slot.title}</h4>
                                <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">{slot.description}</p>
                                {slot.assigned_to && (
                                  <p className="text-[9px] font-mono text-[#D98353]/80 mt-2 flex items-center gap-1">
                                    <span>🎯 Target:</span>
                                    <span className="font-bold">{slot.assigned_to}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // Today has no practice scheduled
                  return (
                    <div key={dateStr} className="bg-gradient-to-r from-[#1E1411] to-[#0D0A09] border border-orange-500/20 rounded-3xl p-6 shadow-xl space-y-4">
                      <h3 className="text-xl font-serif font-bold text-[#D98353] border-b border-white/5 pb-2 flex justify-between items-center">
                        <span>Today <span className="text-sm font-mono text-stone-500 ml-2">({dateStr})</span></span>
                        <span className="text-[10px] uppercase font-mono bg-orange-950/40 text-orange-400 border border-orange-900/30 px-2 py-0.5 rounded">Current Day</span>
                      </h3>
                      <div className="bg-black/30 border border-white/5 p-8 rounded-2xl text-center space-y-2">
                        <span className="text-3xl block">🔔</span>
                        <h4 className="text-md font-serif font-bold text-white">Notice: No Practice Scheduled</h4>
                        <p className="text-xs text-stone-400">There are no practice rehearsals or workshops scheduled for today ({date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}).</p>
                      </div>
                    </div>
                  );
                }

                if (i === 1) {
                  // If there are actual scheduled slots for tomorrow, render them!
                  if (dayEvents.length > 0) {
                    return (
                      <div key={dateStr} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                        <h3 className="text-xl font-serif font-bold text-[#D98353] border-b border-white/5 pb-2 flex justify-between items-center">
                          <span>Tomorrow <span className="text-sm font-mono text-stone-500 ml-2">({dateStr})</span></span>
                          <span className="text-[10px] uppercase font-mono bg-stone-900/40 text-stone-400 border border-white/5 px-2 py-0.5 rounded">Upcoming Day</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dayEvents.map(slot => (
                            <div key={slot.id} className="bg-black/40 border border-[#D98353]/20 p-4 rounded-2xl flex flex-col justify-between hover:border-[#D98353]/50 transition-all text-left space-y-3">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-[#D98353]/20 text-[#D98353]">
                                    {slot.event_type}
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400 font-semibold">
                                    {slot.start_time}-{slot.end_time}
                                  </span>
                                </div>
                                <h4 className="font-serif text-sm font-bold text-white mt-1">{slot.title}</h4>
                                <p className="text-[10px] text-stone-400 line-clamp-1">{slot.description}</p>
                                {slot.assigned_to && (
                                  <p className="text-[9px] font-mono text-stone-500 mt-1">🎯 Target: {slot.assigned_to}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // Tomorrow has no practice scheduled
                  return (
                    <div key={dateStr} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                      <h3 className="text-xl font-serif font-bold text-[#D98353] border-b border-white/5 pb-2 flex justify-between items-center">
                        <span>Tomorrow <span className="text-sm font-mono text-stone-500 ml-2">({dateStr})</span></span>
                        <span className="text-[10px] uppercase font-mono bg-stone-900/40 text-stone-400 border border-white/5 px-2 py-0.5 rounded">Upcoming Day</span>
                      </h3>
                      <div className="bg-black/20 border border-white/5 p-8 rounded-2xl text-center space-y-2">
                        <span className="text-3xl block">💤</span>
                        <h4 className="text-md font-serif font-bold text-stone-300">Notice: No Practice Scheduled</h4>
                        <p className="text-xs text-stone-500">There are no practice rehearsals or workshops scheduled for tomorrow ({date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}).</p>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="space-y-6 animate-fade-in pb-16 w-full max-w-7xl mx-auto px-4 text-left">
            <div className="border-b border-white/5 pb-4">
              <h1 className="text-3xl font-serif text-[#ECE6E1]">Society <span className="text-[#D98353]">Attendance Board</span></h1>
              <p className="text-xs text-[#AC9E94]">
                Register, track, and audit rehearsal participations, training sessions, and general workshops.
              </p>
            </div>

            {/* Attendance Roster Board Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: Personal Performance & Metrics Dashboard (Visible to everyone) */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gradient-to-b from-[#1E1411] to-[#0D0A09] border border-[#D98353]/30 rounded-3xl p-6 shadow-xl space-y-6">
                  <div className="text-left">
                    <span className="text-[10px] font-mono text-[#D98353] uppercase tracking-widest font-bold">Your Status Card</span>
                    <h3 className="text-xl font-serif font-bold text-white mt-0.5">My Rehearsal Score</h3>
                  </div>

                  {/* Dynamic Metrics */}
                  {(() => {
                    const myScheduledSessions = allSessions.filter(s => {
                      const slotId = s.description;
                      const slot = timetable.find(t => t.id === slotId);
                      if (!slot) return true;
                      if (slot.assigned_to === 'All' || !slot.assigned_to) return true;
                      const list = slot.assigned_to.toLowerCase().split(',').map(n => n.trim());
                      return list.includes(currentUser.name.toLowerCase()) || 
                             list.includes(currentUser.id.toLowerCase());
                    });

                    const myRecords = allAttendanceRecords.filter(r => r.user_id === currentUser.id && myScheduledSessions.some(s => s.id === r.session_id));
                    const attendedCount = myRecords.filter(r => r.status === 'present').length;
                    const totalScheduled = myScheduledSessions.length;
                    const rate = totalScheduled > 0 ? Math.round((attendedCount / totalScheduled) * 100) : 100;
                    
                    let grade = 'A+';
                    if (rate < 60) grade = 'F';
                    else if (rate < 70) grade = 'D';
                    else if (rate < 80) grade = 'C';
                    else if (rate < 90) grade = 'B';
                    else if (rate < 95) grade = 'A';

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-black/40 p-4 border border-white/5 rounded-2xl">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-mono text-stone-400 font-bold">Attendance Grade</span>
                            <h4 className="text-4xl font-serif font-black text-[#D98353]">{grade}</h4>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-[10px] uppercase font-mono text-stone-400 font-bold">Success Rate</span>
                            <h4 className="text-4xl font-mono font-black text-emerald-400">{rate}%</h4>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-mono text-stone-400 font-bold uppercase">
                            <span>Training Progress Meter</span>
                            <span>{attendedCount} / {totalScheduled} Rehearsals</span>
                          </div>
                          <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                rate >= 85 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                                rate >= 75 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                                'bg-gradient-to-r from-rose-500 to-red-400'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>

                        {/* Detail Stats */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                            <span className="text-[9px] font-mono text-stone-400 uppercase font-bold block">Attended</span>
                            <span className="text-lg font-mono font-bold text-emerald-400">{attendedCount} sessions</span>
                          </div>
                          <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                            <span className="text-[9px] font-mono text-stone-400 uppercase font-bold block">Excused leaves</span>
                            <span className="text-lg font-mono font-bold text-amber-400">
                              {myRecords.filter(r => r.status === 'absent' && r.excuse).length} absences
                            </span>
                          </div>
                        </div>

                        {/* Personal History list inside Status card */}
                        <div className="space-y-2.5 pt-4 border-t border-white/5 text-left">
                          <h5 className="text-[10px] font-mono uppercase font-bold text-[#D98353] tracking-widest">My Training Logs</h5>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {myScheduledSessions.length === 0 ? (
                              <p className="text-[10px] font-mono text-stone-500 italic">No scheduled training logs registered yet.</p>
                            ) : (
                              myScheduledSessions.map(s => {
                                const rec = myRecords.find(r => r.session_id === s.id);
                                const isPresent = rec ? rec.status === 'present' : false;
                                return (
                                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 text-xs">
                                    <div className="truncate max-w-[150px]">
                                      <p className="font-semibold text-stone-300 truncate">{s.title}</p>
                                      <p className="text-[9px] font-mono text-stone-400">{s.date}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold font-mono ${
                                      isPresent ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                                    }`}>
                                      {isPresent ? '✅ Present' : '❌ Absent'}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* RIGHT / MAIN COLUMN: Log, mark and review system-wide sessions (Admin/President role manages) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Weekly Timetable-based Attendance Launcher */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3 gap-3">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xl">📅</span>
                      <div>
                        <h3 className="text-md font-serif font-bold text-white">Weekly Rehearsal, Meet & Workshop Schedule</h3>
                        <p className="text-[10px] text-stone-400">Launch or mark roster sheets directly synced with the official weekly timetable.</p>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Day Selector Tabs */}
                  <div className="flex flex-wrap gap-1 p-1 bg-black/40 border border-white/5 rounded-2xl">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const isActive = selectedWeeklyDay === day;
                      const daySlotsCount = timetable.filter(t => getWeekdayOfEntry(t.day_of_week) === day).length;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedWeeklyDay(day)}
                          className={`flex-1 min-w-[80px] py-2 text-center text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all cursor-pointer font-mono flex flex-col items-center justify-center gap-0.5 ${
                            isActive 
                              ? 'bg-[#D98353] text-black shadow-md shadow-[#D98353]/15 font-black' 
                              : 'bg-transparent text-stone-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{day.substring(0, 3)}</span>
                          <span className={`text-[8px] font-medium ${isActive ? 'text-black/60' : 'text-stone-500'}`}>{daySlotsCount} slot{daySlotsCount !== 1 ? 's' : ''}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const daySlots = timetable.filter(slot => getWeekdayOfEntry(slot.day_of_week) === selectedWeeklyDay);
                      if (daySlots.length === 0) {
                        return (
                          <div className="col-span-1 md:col-span-2 text-center py-8 bg-black/20 border border-white/5 rounded-2xl text-stone-500 font-mono text-xs">
                            No scheduled practices, workshops or meets on {selectedWeeklyDay}.
                          </div>
                        );
                      }
                      return daySlots.map(slot => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        // Find if a session was already launched for this slot today
                        const activeSession = allSessions.find(s => s.description === slot.id && s.date === todayStr);

                        return (
                          <div key={slot.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-[#D98353]/30 transition-all text-left space-y-3">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-[#D98353]/20 text-[#D98353]">
                                  {slot.event_type}
                                </span>
                                <span className="text-[10px] font-mono text-stone-400 font-semibold">
                                  {slot.day_of_week} • {slot.start_time}-{slot.end_time}
                                </span>
                              </div>
                              <h4 className="font-serif text-sm font-bold text-white mt-1">{slot.title}</h4>
                              <p className="text-[10px] text-stone-400 line-clamp-1">{slot.description}</p>
                              {slot.assigned_to && (
                                <p className="text-[9px] font-mono text-stone-500 mt-1">🎯 Target: {slot.assigned_to}</p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                              {activeSession ? (
                                <>
                                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Today
                                  </span>
                                  {currentUser && ['admin', 'president', 'central_core', 'core'].includes(currentUser.role) ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Toggle editing of this active session
                                        if (markingTimetableId === activeSession.id) {
                                          setMarkingTimetableId(null);
                                        } else {
                                          setMarkingTimetableId(activeSession.id);
                                          setMarkingDate(activeSession.date);
                                          const recordsForSession = allAttendanceRecords.filter(r => r.session_id === activeSession.id);
                                          const mapped: Record<string, { status: 'present' | 'absent', excuse: string }> = {};
                                          recordsForSession.forEach(r => {
                                            mapped[r.user_id] = { status: r.status, excuse: r.excuse || '' };
                                          });
                                          setMarkingRecords(mapped);
                                          triggerToast(`Opened roster sheet for "${slot.title}"`, 'info');
                                        }
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black font-mono text-[9px] uppercase font-bold rounded-lg transition-all border border-emerald-500/20 cursor-pointer text-center"
                                    >
                                      {markingTimetableId === activeSession.id ? "Close Editor" : "✏️ Mark Roster"}
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-stone-500 font-mono italic">Awaiting Core/Admin Mark</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-stone-500 font-mono">Not Started Today</span>
                                  {currentUser && ['admin', 'president', 'central_core', 'core'].includes(currentUser.role) ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Launch new session for this slot today
                                        const sessionId = `session_${Date.now()}`;
                                        const newSession = {
                                          id: sessionId,
                                          date: todayStr,
                                          title: slot.title,
                                          description: slot.id
                                        };
                                        
                                        // Save session
                                        const updatedSessions = [...allSessions, newSession];
                                        dbInstance.saveAttendanceSessions(updatedSessions);
                                        setAllSessions(updatedSessions);

                                        // Filter target profiles
                                        const isCoreMeeting = slot.title.toLowerCase().includes("core team") || slot.event_type === 'Core Meet';
                                        
                                        const targetProfiles = isCoreMeeting
                                          ? activeProfiles.filter(p => p.role === 'core' || p.role === 'president' || p.role === 'admin')
                                          : activeProfiles.filter(p => p.role === 'member');

                                        const initialRecords = targetProfiles.map(p => ({
                                          id: `rec_${sessionId}_${p.id}`,
                                          session_id: sessionId,
                                          user_id: p.id,
                                          status: 'present' as const
                                        }));

                                        const updatedRecords = [...allAttendanceRecords, ...initialRecords];
                                        dbInstance.saveAttendanceRecords(updatedRecords);
                                        setAllAttendanceRecords(updatedRecords);

                                        triggerToast(`Launched Today's roster sheet for "${slot.title}"!`, 'success');
                                        refreshApplicationData();

                                        // Auto-open editor
                                        setMarkingTimetableId(sessionId);
                                        setMarkingDate(todayStr);
                                        const mapped: Record<string, { status: 'present' | 'absent', excuse: string }> = {};
                                        initialRecords.forEach(r => {
                                          mapped[r.user_id] = { status: r.status, excuse: '' };
                                        });
                                        setMarkingRecords(mapped);
                                      }}
                                      className="px-2.5 py-1.5 bg-[#D98353]/10 hover:bg-[#D98353] text-[#D98353] hover:text-black font-mono text-[9px] uppercase font-bold rounded-lg transition-all border border-[#D98353]/20 cursor-pointer text-center"
                                    >
                                      🚀 Launch Sheet
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-stone-500 font-mono italic">Core/Admin only</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Directory of Logged Roster Sheets */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-md font-serif font-bold text-white">📋 Registered Roster Sheets Directory</h3>
                    <span className="text-xs font-mono text-[#D98353]">{allSessions.length} sessions logged</span>
                  </div>

                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                    {allSessions.length === 0 ? (
                      <div className="text-center py-12 text-stone-500 font-mono text-xs">
                        No active roster sheets registered yet. Core Members, Cabinet or President can conduct a session above.
                      </div>
                    ) : (
                      allSessions.slice().reverse().map(session => {
                        const recordsForSession = allAttendanceRecords.filter(r => r.session_id === session.id);
                        const presentCount = recordsForSession.filter(r => r.status === 'present').length;
                        const totalRecords = recordsForSession.length;

                        const isEditingThis = markingTimetableId === session.id;

                        return (
                          <div key={session.id} className="bg-black/20 border border-white/5 p-4 rounded-2xl space-y-3 hover:border-white/10 transition-all text-left">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <span className="px-2 py-0.5 rounded text-[8px] uppercase font-mono bg-stone-900 border border-white/5 text-stone-400 font-bold">
                                  {session.date}
                                </span>
                                <h4 className="font-serif text-md font-bold text-[#ECE6E1] mt-1">{session.title}</h4>
                                <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                                  📊 Performance: <span className="text-emerald-400 font-bold">{presentCount} Present</span> / <span className="text-rose-400 font-bold">{totalRecords - presentCount} Absent</span> ({totalRecords} checked)
                                </p>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isEditingThis) {
                                      setMarkingTimetableId(null);
                                    } else {
                                      setMarkingTimetableId(session.id);
                                      setMarkingDate(session.date);
                                      const mapped: Record<string, { status: 'present' | 'absent', excuse: string }> = {};
                                      recordsForSession.forEach(r => {
                                        mapped[r.user_id] = { status: r.status, excuse: r.excuse || '' };
                                      });
                                      setMarkingRecords(mapped);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-[#D98353]/10 hover:bg-[#D98353] text-[#D98353] hover:text-black font-mono text-[9px] uppercase font-bold rounded-lg border border-[#D98353]/20 transition-all cursor-pointer"
                                >
                                  {isEditingThis ? "✕ Close Editor" : "✏️ Mark / Edit Roster"}
                                </button>

                                {currentUser && ['admin', 'president', 'central_core', 'core'].includes(currentUser.role) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Are you absolutely sure you want to permanently delete the roster sheet for "${session.title}"?`)) {
                                        dbInstance.saveAttendanceSessions(allSessions.filter(s => s.id !== session.id));
                                        dbInstance.saveAttendanceRecords(allAttendanceRecords.filter(r => r.session_id !== session.id));
                                        triggerToast(`Deleted roster sheet "${session.title}"!`, 'info');
                                        refreshApplicationData();
                                      }
                                    }}
                                    className="p-1.5 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 border border-white/5 rounded-lg transition-all"
                                    title="Delete sheet"
                                  >
                                    🗑
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Active Editor Inline inside list card! */}
                            {isEditingThis && (
                              <div className="bg-stone-900/40 border border-[#D98353]/20 p-4 rounded-xl space-y-4 animate-fade-in text-xs">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                  <span className="font-mono text-[9px] text-[#D98353] uppercase font-bold">Roster Sheets Editor</span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...markingRecords };
                                        recordsForSession.forEach(r => {
                                          updated[r.user_id] = { status: 'present', excuse: '' };
                                        });
                                        setMarkingRecords(updated);
                                      }}
                                      className="px-2 py-1 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 rounded text-[9px] font-mono font-bold uppercase"
                                    >
                                      All Present
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = { ...markingRecords };
                                        recordsForSession.forEach(r => {
                                          updated[r.user_id] = { status: 'absent', excuse: '' };
                                        });
                                        setMarkingRecords(updated);
                                      }}
                                      className="px-2 py-1 bg-rose-950/20 text-rose-400 border border-rose-900/30 rounded text-[9px] font-mono font-bold uppercase"
                                    >
                                      All Absent
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                  {recordsForSession.length === 0 ? (
                                    <p className="text-[10px] font-mono text-center text-stone-500 italic py-4">No active students on this sheet. Click All Present to add them.</p>
                                  ) : (
                                    recordsForSession.map(record => {
                                      const p = activeProfiles.find(profile => profile.id === record.user_id);
                                      if (!p) return null;
                                      const stateVal = markingRecords[p.id] || { status: 'present', excuse: '' };
                                      return (
                                        <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5 gap-2">
                                          <div className="text-left shrink-0">
                                            <p className="font-semibold text-[#ECE6E1]">{p.name}</p>
                                            <p className="text-[8px] text-stone-400 uppercase font-mono">{p.domain}</p>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            {stateVal.status === 'absent' && (
                                              <input
                                                type="text"
                                                placeholder="Excused Reason..."
                                                value={stateVal.excuse}
                                                onChange={(e) => {
                                                  setMarkingRecords(prev => ({
                                                    ...prev,
                                                    [p.id]: { ...prev[p.id], excuse: e.target.value }
                                                  }));
                                                }}
                                                className="h-7 px-2 bg-black border border-white/10 text-[9px] text-white rounded focus:border-rose-900 outline-none w-32"
                                              />
                                            )}

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMarkingRecords(prev => {
                                                  const curr = prev[p.id] || { status: 'present', excuse: '' };
                                                  return {
                                                    ...prev,
                                                    [p.id]: {
                                                      ...curr,
                                                      status: curr.status === 'present' ? 'absent' : 'present'
                                                    }
                                                  };
                                                });
                                              }}
                                              className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${
                                                stateVal.status === 'present'
                                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                                                  : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                                              }`}
                                            >
                                              {stateVal.status === 'present' ? '✅ Present' : '❌ Absent'}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                                  <button
                                    type="button"
                                    onClick={() => setMarkingTimetableId(null)}
                                    className="px-3 py-1 bg-stone-900 text-stone-300 font-mono font-bold rounded"
                                  >
                                    Close
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Adjust points for modified attendance marks
                                      allAttendanceRecords.forEach(oldR => {
                                        if (oldR.session_id === session.id && markingRecords[oldR.user_id]) {
                                          const newStatus = markingRecords[oldR.user_id].status;
                                          const oldStatus = oldR.status;
                                          if (oldStatus !== newStatus) {
                                            updateUserPointsForAttendance(oldR.user_id, newStatus === 'present', oldStatus === 'present');
                                          }
                                        }
                                      });

                                      const updatedRecords = allAttendanceRecords.map(r => {
                                        if (r.session_id === session.id && markingRecords[r.user_id]) {
                                          return {
                                            ...r,
                                            status: markingRecords[r.user_id].status,
                                            excuse: markingRecords[r.user_id].status === 'absent' ? markingRecords[r.user_id].excuse : undefined
                                          };
                                        }
                                        return r;
                                      });
                                      dbInstance.saveAttendanceRecords(updatedRecords);
                                      triggerToast("Roster updated successfully!", "success");
                                      setMarkingTimetableId(null);
                                      refreshApplicationData();
                                    }}
                                    className="px-4 py-1 bg-emerald-500 text-black font-mono font-bold rounded hover:bg-emerald-400"
                                  >
                                    💾 Save Sheet Changes
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Society Training Metrics Hall of Fame */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="border-b border-white/5 pb-3 text-left">
                    <h3 className="text-md font-serif font-bold text-white">🏆 Society Attendance Leaderboard</h3>
                    <p className="text-[10px] text-stone-400">Total session attendance rate across active student profiles.</p>
                  </div>

                  <div className="divide-y divide-white/5 max-h-80 overflow-y-auto pr-1">
                    {activeProfiles.map(p => {
                      const myScheduledSessions = allSessions.filter(s => {
                        const slotId = s.description;
                        const slot = timetable.find(t => t.id === slotId);
                        if (!slot) return true;
                        if (slot.assigned_to === 'All' || !slot.assigned_to) return true;
                        const list = slot.assigned_to.toLowerCase().split(',').map(n => n.trim());
                        return list.includes(p.name.toLowerCase()) || 
                               list.includes(p.id.toLowerCase());
                      });
                      const myRecords = allAttendanceRecords.filter(r => r.user_id === p.id && myScheduledSessions.some(s => s.id === r.session_id));
                      const attended = myRecords.filter(r => r.status === 'present').length;
                      const total = myScheduledSessions.length;
                      const rate = total > 0 ? Math.round((attended / total) * 100) : 100;

                      return (
                        <div key={p.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#1C120F] border border-[#D98353]/35 flex items-center justify-center text-[10px] font-serif font-bold text-[#D98353]">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left truncate">
                              <h5 className="font-bold text-white truncate">{p.name}</h5>
                              <p className="text-[9px] font-mono text-stone-400 capitalize">{p.domain} • {p.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                            <span className="text-stone-400">{attended}/{total} Attended</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold ${
                              rate >= 85 ? 'bg-emerald-950/40 text-emerald-400' :
                              rate >= 75 ? 'bg-amber-950/40 text-amber-400' :
                              'bg-rose-950/40 text-rose-400'
                            }`}>{rate}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* FULL WIDTH MONTHLY ATTENDANCE AUDIT LEDGER */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 mt-6">
              <div className="border-b border-white/5 pb-3 text-left">
                <span className="text-[10px] font-mono text-[#D98353] uppercase tracking-widest font-bold">Comprehensive Registry Audit</span>
                <h3 className="text-xl font-serif font-bold text-white mt-0.5">🗓️ Monthly Attendance Audit Ledger (Jan - Dec)</h3>
                <p className="text-xs text-stone-400">Click on any month to view detailed historical timetable schedules, check student attendance rosters, and track individual records.</p>
              </div>

              {/* Grid of 12 Months */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-left">
                {[
                  { name: 'January', num: '01' },
                  { name: 'February', num: '02' },
                  { name: 'March', num: '03' },
                  { name: 'April', num: '04' },
                  { name: 'May', num: '05' },
                  { name: 'June', num: '06' },
                  { name: 'July', num: '07' },
                  { name: 'August', num: '08' },
                  { name: 'September', num: '09' },
                  { name: 'October', num: '10' },
                  { name: 'November', num: '11' },
                  { name: 'December', num: '12' }
                ].map((m) => {
                  const isSelected = selectedLedgerMonth === m.name;
                  
                  // Filter sessions in this month
                  const monthSessions = allSessions.filter(s => {
                    const monthPart = s.date.split('-')[1]; // YYYY-MM-DD
                    return monthPart === m.num;
                  });

                  // User's attendance in this month
                  const userRecordsInMonth = allAttendanceRecords.filter(r => 
                    r.user_id === currentUser.id && 
                    monthSessions.some(s => s.id === r.session_id)
                  );
                  const userAttendedCount = userRecordsInMonth.filter(r => r.status === 'present').length;
                  const totalSessionsInMonth = monthSessions.length;

                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setSelectedLedgerMonth(isSelected ? null : m.name)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-[#D98353]/15 border-[#D98353] shadow-[0_0_15px_rgba(217,131,83,0.15)]'
                          : 'bg-black/30 border-white/5 hover:border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-stone-500 font-bold">{m.num}</span>
                        {totalSessionsInMonth > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sessions conducted" />
                        )}
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold font-serif ${isSelected ? 'text-[#D98353]' : 'text-stone-200'}`}>{m.name}</h4>
                        <p className="text-[9px] font-mono text-stone-400 mt-1">
                          {totalSessionsInMonth > 0 
                            ? `Attended: ${userAttendedCount}/${totalSessionsInMonth}` 
                            : 'No sessions'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Month Explorer Detail Panel */}
              {selectedLedgerMonth && (() => {
                const monthNum = [
                  { name: 'January', num: '01' },
                  { name: 'February', num: '02' },
                  { name: 'March', num: '03' },
                  { name: 'April', num: '04' },
                  { name: 'May', num: '05' },
                  { name: 'June', num: '06' },
                  { name: 'July', num: '07' },
                  { name: 'August', num: '08' },
                  { name: 'September', num: '09' },
                  { name: 'October', num: '10' },
                  { name: 'November', num: '11' },
                  { name: 'December', num: '12' }
                ].find(m => m.name === selectedLedgerMonth)?.num;

                const monthSessions = allSessions.filter(s => s.date.split('-')[1] === monthNum);

                return (
                  <div className="bg-black/50 border border-white/10 p-5 rounded-2xl space-y-6 text-left animate-fade-in text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-2.5 gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[#D98353] text-lg">🔍</span>
                        <h4 className="text-sm font-serif font-bold text-white">
                          Roster Sheets & Attendance Explorer — {selectedLedgerMonth} 2026
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        {monthSessions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const headers = ["Date", "Session Title", "Student Name", "Society Role", "Practice Domain", "Attendance Status", "Excuse/Note"];
                              const rows: string[][] = [];

                              monthSessions.forEach(session => {
                                const sessionRecords = allAttendanceRecords.filter(r => r.session_id === session.id);
                                sessionRecords.forEach(r => {
                                  const profile = activeProfiles.find(p => p.id === r.user_id);
                                  rows.push([
                                    session.date,
                                    session.title,
                                    profile ? profile.name : "Unknown Student",
                                    profile ? profile.role : "Unknown Role",
                                    profile ? profile.domain : "N/A",
                                    r.status.toUpperCase(),
                                    r.excuse || ""
                                  ]);
                                });
                              });

                              const csvContent = [
                                headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
                                ...rows.map(row => row.map(val => `"${(val || "").replace(/"/g, '""')}"`).join(","))
                              ].join("\n");

                              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.setAttribute("href", url);
                              link.setAttribute("download", `malhaar_attendance_audit_${selectedLedgerMonth.toLowerCase()}_2026.csv`);
                              link.style.visibility = "hidden";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              triggerToast(`Exported CSV for ${selectedLedgerMonth} successfully!`, "success");
                            }}
                            className="px-3 py-1.5 bg-[#D98353] hover:bg-[#D98353]/80 text-black font-mono text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            📥 Export CSV
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedLedgerMonth(null)}
                          className="text-[10px] font-mono text-[#ECE6E1]/50 hover:text-white transition-all uppercase font-bold cursor-pointer"
                        >
                          ✕ Close Explorer
                        </button>
                      </div>
                    </div>

                    {monthSessions.length === 0 ? (
                      <div className="text-center py-10 text-stone-500 font-mono text-xs">
                        No historical attendance sheets were conduct-logged in the database for {selectedLedgerMonth} 2026.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary of User's Attendance in this month */}
                        <div className="bg-[#120F0E] border border-orange-900/10 p-4 rounded-xl space-y-3">
                          <h5 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D98353]">
                            Your Personal Attendance Breakdown ({selectedLedgerMonth})
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {monthSessions.map(session => {
                              const record = allAttendanceRecords.find(r => r.session_id === session.id && r.user_id === currentUser.id);
                              const isPresent = record ? record.status === 'present' : false;
                              return (
                                <div key={session.id} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs gap-2">
                                  <div className="truncate text-left">
                                    <p className="font-semibold text-stone-200 truncate">{session.title}</p>
                                    <p className="text-[9px] font-mono text-stone-500">{session.date}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold font-mono shrink-0 ${
                                    isPresent 
                                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' 
                                      : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
                                  }`}>
                                    {isPresent ? '✅ Present' : '❌ Absent'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Master Date-by-Date ledger of who is present and who is not */}
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D98353]">
                            👥 Master Society Ledger (Date-by-Date Audit)
                          </h5>
                          <p className="text-[10px] text-stone-400">Select any rehearsal session date below to audit the full list of students who were Present or Absent.</p>
                          
                          <div className="space-y-3">
                            {monthSessions.map(session => {
                              const records = allAttendanceRecords.filter(r => r.session_id === session.id);
                              const presents = records.filter(r => r.status === 'present');
                              const absents = records.filter(r => r.status === 'absent');
                              return (
                                <div key={session.id} className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                                  {/* Header bar of the session */}
                                  <div className="bg-white/[0.02] px-4 py-3 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="text-left">
                                      <span className="text-[9px] font-mono text-[#D98353] font-bold uppercase">{session.date}</span>
                                      <h6 className="text-xs font-bold text-white font-serif">{session.title}</h6>
                                    </div>
                                    <div className="flex gap-2.5 font-mono text-[9px] uppercase tracking-wider">
                                      <span className="text-emerald-400 font-bold">Present: {presents.length}</span>
                                      <span className="text-stone-500">•</span>
                                      <span className="text-rose-400 font-bold">Absent: {absents.length}</span>
                                    </div>
                                  </div>

                                  {/* Roster profiles grids */}
                                  <div className="p-3 bg-black/10">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {activeProfiles.map(p => {
                                        const rec = records.find(r => r.user_id === p.id);
                                        // If this profile wasn't part of this sheet, we can omit or show as N/A
                                        if (!rec) return null;
                                        const isPresent = rec.status === 'present';
                                        return (
                                          <div key={p.id} className="p-2 rounded bg-[#0A0808] border border-white/5 flex items-center justify-between text-[11px] gap-2 text-left">
                                            <div className="truncate">
                                              <p className="font-semibold text-stone-300 truncate">{p.name}</p>
                                              <p className="text-[8px] font-mono text-stone-500 uppercase">{p.domain}</p>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-1.5">
                                              {rec.excuse && (
                                                <span className="text-[8px] font-mono text-amber-500 italic truncate max-w-[80px]" title={rec.excuse}>
                                                  ({rec.excuse})
                                                </span>
                                              )}
                                              <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                                isPresent 
                                                  ? 'bg-emerald-950/40 text-emerald-400' 
                                                  : 'bg-rose-950/40 text-rose-400'
                                              }`}>
                                                {isPresent ? 'Present' : 'Absent'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>
        );

      case 'targets':
        return (
          <div className="space-y-6 animate-fade-in pb-16 w-full max-w-4xl mx-auto px-4">
            <div className="border-b border-white/5 pb-4 text-left">
              <h1 className="text-3xl font-serif text-[#ECE6E1]">Active Monthly <span className="text-[#D98353]">Goal Targets</span></h1>
              <p className="text-xs text-[#AC9E94]">Monitor monthly targets assigned to specific Society specialties.</p>
            </div>

            <div className="space-y-6">
              {targets.map(target => (
                <div key={target.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 hover:border-[#D98353]/30 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="text-left">
                      <span className="text-[10px] font-mono text-[#D98353] uppercase tracking-wider block mb-1">Assigned : {target.assigned_to}</span>
                      <h3 className="font-serif text-xl font-bold text-[#ECE6E1]">{target.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#AC9E94] font-mono">due {target.due_date}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        target.status === 'completed' 
                          ? 'bg-emerald-950/20 text-[#55F2A6] border border-emerald-900/30' 
                          : target.status === 'in-progress' 
                            ? 'bg-amber-950/20 text-[#D98353] border border-[#D98353]/30' 
                            : 'bg-stone-800 text-stone-400'
                      }`}>
                        {target.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#AC9E94] leading-relaxed text-left">
                    {target.description}
                  </p>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-[#AC9E94]">
                      <span>Completion Progress</span>
                      <span className="font-mono font-bold text-orange-400">{target.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#D98353] to-[#E6AF2E] transition-all duration-500"
                        style={{ width: `${target.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'suggestions':
        return (
          <div className="space-y-8 animate-fade-in pb-16 w-full max-w-4xl mx-auto px-4 text-left">
            <div className="border-b border-white/5 pb-4">
              <h1 className="text-3xl font-serif text-[#ECE6E1]">Conversant <span className="text-[#D98353]">Suggestion Box</span></h1>
              <p className="text-xs text-[#AC9E94]">Submit anonymous or named requests directly to the Society leaders cabinet.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Submission Form */}
              <form onSubmit={handleAddSuggestion} className="lg:col-span-2 bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 rounded-2xl space-y-4 max-h-fit shadow-xl">
                <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">Draft Suggestion Proposal</h3>
                
                <div>
                  <label className="block text-xs text-[#AC9E94] mb-1 font-bold">Subject Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Expand rehearsal slots"
                    value={newSugTitle}
                    onChange={(e) => setNewSugTitle(e.target.value)}
                    className="w-full h-10 px-3.5 bg-black/40 border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#AC9E94] mb-1 font-bold">Proposal Information</label>
                  <textarea
                    placeholder="Write detailed recommendations here..."
                    value={newSugContent}
                    onChange={(e) => setNewSugContent(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-black/40 border border-white/10 text-xs text-[#ECE6E1] rounded-xl focus:border-[#D98353] focus:outline-none transition-all leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonSug"
                    checked={newSugAnon}
                    onChange={(e) => setNewSugAnon(e.target.checked)}
                    className="accent-[#D98353] cursor-pointer"
                  />
                  <label htmlFor="anonSug" className="text-xs text-[#AC9E94] cursor-pointer select-none">
                    Submit Proposal Anonymously
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_15px_rgba(217,131,83,0.3)] text-black text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  🚀 Submit Proposal
                </button>
              </form>

              {/* Suggestions feed */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">Logged Proposals ({currentUser.role === 'admin' || currentUser.role === 'president' ? 'All Cabinet' : 'Your Inbox'})</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {suggestions
                    .filter(s => (currentUser.role === 'admin' || currentUser.role === 'president') ? true : s.user_id === currentUser.id)
                    .map(s => (
                      <div key={s.id} className="bg-white/[0.01] border border-white/10 p-5 rounded-2xl space-y-3 hover:border-[#D98353]/30 transition-all duration-300">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] font-mono text-[#D98353] uppercase block mb-1">Author: {s.user_name}</span>
                            <h4 className="font-serif text-base text-[#ECE6E1] font-bold">{s.title}</h4>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                            s.status === 'resolved' 
                              ? 'bg-emerald-950/20 text-[#55F2A6] border border-emerald-900/30' 
                              : s.status === 'reviewed' 
                                ? 'bg-amber-950/20 text-[#D98353] border border-[#D98353]/30' 
                                : 'bg-stone-800 text-stone-400'
                          }`}>
                            {s.status}
                          </span>
                        </div>

                        <p className="text-xs text-[#AC9E94] leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                          "{s.content}"
                        </p>

                        {/* Admin reply section */}
                        {s.admin_response ? (
                          <div className="bg-[#241A16]/60 border border-[#402C23]/60 p-4 rounded-xl space-y-1.5 shadow-inner">
                            <span className="text-[10px] text-[#D98353] font-bold font-mono">Cabinet Officer Feedback :</span>
                            <p className="text-xs text-[#ECE6E1] leading-relaxed italic">
                              "{s.admin_response}"
                            </p>
                          </div>
                        ) : (currentUser.role === 'admin' || currentUser.role === 'president') && (
                          <div className="pt-4 border-t border-white/5 space-y-2.5">
                            <span className="text-[10px] uppercase font-bold text-[#D98353] font-mono block">Send Cabinet Response :</span>
                            <textarea
                              placeholder="Type response feedback..."
                              id={`reply-text-${s.id}`}
                              className="w-full p-3 bg-black/40 border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none transition-all leading-relaxed"
                              rows={2}
                            />
                            
                            <div className="flex justify-between items-center gap-2">
                              {/* Status choice */}
                              <select
                                id={`reply-status-${s.id}`}
                                className="px-3 py-1.5 bg-black/60 text-[10px] border border-white/10 text-stone-300 rounded-lg outline-none focus:border-[#D98353]"
                              >
                                <option value="reviewed">reviewed</option>
                                <option value="resolved">resolved</option>
                              </select>

                              <button
                                onClick={() => {
                                  const textVal = (document.getElementById(`reply-text-${s.id}`) as HTMLTextAreaElement)?.value;
                                  const statusVal = (document.getElementById(`reply-status-${s.id}`) as HTMLSelectElement)?.value as any;
                                  handleReplySuggestion(s.id, textVal, statusVal);
                                }}
                                className="px-4 h-8 bg-white/5 hover:bg-[#D98353] hover:text-black border border-white/10 hover:border-[#D98353] text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'core-control':
        if (currentUser.role !== 'president' && currentUser.role !== 'central_core') {
          return (
            <div className="p-8 text-center bg-[#1E1512]/40 border border-white/10 rounded-2xl max-w-md mx-auto my-12">
              <span className="text-3xl block mb-2">🚫</span>
              <h3 className="text-[#ECE6E1] font-serif font-bold text-lg">Access Denied</h3>
              <p className="text-[#AC9E94] text-xs">Only the President or Central Core of Society can access the Core Control Hall.</p>
            </div>
          );
        }
        return (
          <div className="space-y-6 animate-fade-in pb-16 w-full max-w-4xl mx-auto px-4 text-left">
            <div className="border-b border-white/5 pb-4">
              <h1 className="text-3xl font-serif text-[#ECE6E1]">Central <span className="text-[#D98353]">Control Hall</span></h1>
              <p className="text-xs text-[#AC9E94]">Sensitive performance tracks, task assignments, and efficiency scores of active core. As defined in MALHAARCORERECORD.</p>
            </div>

            {!isControlUnlocked ? (
              <form onSubmit={handleControlHallAccess} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 max-w-md mx-auto p-8 rounded-2xl text-center space-y-4 shadow-xl">
                <span className="text-4xl text-[#D98353] block filter drop-shadow-[0_0_15px_rgba(217,131,83,0.3)]">🔒</span>
                <h3 className="text-lg font-serif font-bold text-[#ECE6E1]">Presidential Clearance Required</h3>
                <p className="text-xs text-[#AC9E94]">Provide the cryptographic cabinet password credentials to proceed.</p>
                
                <input
                  type="password"
                  value={controlPassword}
                  onChange={(e) => setControlPassword(e.target.value)}
                  placeholder="MALHAARCORERECORD"
                  className="w-full h-11 px-4 bg-black/40 border border-white/10 focus:border-[#D98353] text-center text-sm font-mono tracking-wider rounded-xl focus:outline-none text-white focus:shadow-[0_0_15px_rgba(217,131,83,0.15)] transition-all"
                  required
                />

                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_15px_rgba(217,131,83,0.3)] text-black text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  Verify Cabinet Key
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">Core Execution Board</h3>
                    <p className="text-xs text-[#AC9E94]">Active core performance calculations: (completed / assigned * 100).</p>
                  </div>
                  <button 
                    onClick={() => setIsControlUnlocked(false)}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-xs text-stone-300 rounded-xl hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    🔒 Relock Board
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {corePerformances.filter(cp => {
                     const profData = dbInstance.getProfiles().find(p => p.id === cp.core_id);
                     return profData && (profData.role === 'core' || profData.role === 'admin');
                  }).map(cp => {
                     const profData = dbInstance.getProfiles().find(p => p.id === cp.core_id)!;

                     return (
                      <div key={cp.core_id} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 hover:border-[#D98353]/30 transition-all duration-300">
                        <div className="flex items-center gap-4 text-left w-full md:w-auto">
                          {profData.profile_image_url ? (
                            <img src={profData.profile_image_url} alt={profData.name} className="w-14 h-14 rounded-full border border-white/10 object-cover shadow-md" />
                          ) : (
                            <div className="w-14 h-14 rounded-full border border-white/10 bg-[#2A160F] flex items-center justify-center text-lg font-serif font-bold text-[#D98353] shadow-md shrink-0">
                              {profData.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-serif text-lg text-[#ECE6E1] font-bold">{profData.name}</h4>
                            <p className="text-xs text-[#D98353] font-mono font-bold uppercase tracking-wider">{profData.role === 'admin' ? 'core' : profData.role} • {profData.domain}</p>
                            <p className="text-[10px] text-[#AC9E94] mt-1 italic">"{profData.bio.substring(0, 70)}..."</p>
                          </div>
                        </div>

                        {/* Interactive Task Delta adjusting */}
                        <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 w-full md:w-[350px]">
                          <div className="flex justify-between text-xs text-[#AC9E94] font-mono">
                            <span>Tasks: <strong className="text-white">{cp.tasks_completed} / {cp.tasks_assigned}</strong></span>
                            <span>Efficiency: <strong className="text-[#D98353]">{cp.efficiency_score}%</strong></span>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateCorePerformance(cp.core_id, 1, 0)}
                              className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider text-stone-300"
                            >
                              Assign +1
                            </button>
                            <button 
                              onClick={() => handleUpdateCorePerformance(cp.core_id, -1, 0)}
                              className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider text-stone-300"
                            >
                              Assign -1
                            </button>
                            <button 
                              onClick={() => handleUpdateCorePerformance(cp.core_id, 0, -1)}
                              className="flex-1 h-8 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider text-stone-300 disabled:opacity-30 disabled:pointer-events-none"
                              disabled={cp.tasks_completed <= 0}
                            >
                              Complete -1
                            </button>
                            <button 
                              onClick={() => handleUpdateCorePerformance(cp.core_id, 0, 1)}
                              className="flex-1 h-8 bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none"
                              disabled={cp.tasks_completed >= cp.tasks_assigned}
                            >
                              Complete +1
                            </button>
                          </div>

                          <div className="space-y-1">
                            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#D98353] to-[#E6AF2E]" style={{ width: `${cp.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'admin':
        return (
          <AdminView 
            currentUser={currentUser} 
            onRequestToast={triggerToast}
            onRefreshTrigger={refreshApplicationData}
            activeMonth={activeMonth}
          />
        );

      case 'alumni-connect': {
        const isModerator = ['admin', 'president', 'central_core', 'core'].includes(currentUser.role);
        
        // Simulates recording process
        const triggerRecordSimulation = () => {
          if (alumniIsRecording) return;
          setAlumniIsRecording(true);
          triggerToast('🎤 Recording vocal clip... speak now!', 'info');
          
          setTimeout(() => {
            setAlumniIsRecording(false);
            // Simulate a beautiful classical vocal recording
            setAlumniAttachedAudio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3');
            triggerToast('Vocal note captured successfully!', 'success');
          }, 1800);
        };

        // File reader trigger for Base64 image attachment
        const triggerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setAlumniAttachedImage(reader.result as string);
              triggerToast('Recital image attached! 📷', 'success');
            };
            reader.readAsDataURL(file);
          }
        };

        return (
          <div className="space-y-6 animate-fade-in pb-16 w-full max-w-7xl mx-auto px-4 text-left text-stone-800">
            {/* Header section in brown/beige theme */}
            <div className="border-b border-[#EBE3DE] pb-4 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-serif text-stone-950 font-bold">🎓 Musical Minds <span className="text-[#D98353]">Reunion</span></h1>
                <p className="text-xs text-stone-500">
                  A high-fidelity meeting point for our veteran graduates to reunite, share recital tips, and play musical tracks.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#FAF3F0] border border-[#EBE3DE] rounded-full text-xs font-mono text-[#D98353] font-bold">
                  ● Musical Minds Reuniting
                </span>
              </div>
            </div>

            {/* Main Dual-Panel Container (Enforces full screen, resolves scrolling issues) */}
            <div className="flex flex-col lg:flex-row bg-white border border-[#EBE3DE] rounded-[32px] overflow-hidden shadow-sm h-[calc(100vh-14rem)] min-h-[450px] lg:h-[75vh] mb-16 md:mb-0">
              
              {/* LEFT CHANNEL RAIL (Requirement 3 style) */}
              <div className="hidden lg:flex lg:w-80 border-r border-[#EBE3DE] bg-[#FAF8F5] flex-col h-full shrink-0">
                {/* Search / Filter */}
                <div className="p-4 border-b border-[#EBE3DE]">
                  <h3 className="text-xs font-black uppercase font-mono text-stone-400 tracking-wider mb-2">Available lounges</h3>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search topics..." 
                      className="w-full bg-white border border-[#EBE3DE] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#D98353] placeholder-stone-400"
                    />
                  </div>
                </div>

                {/* Lounges mock list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <div className="flex items-center gap-3 p-3 bg-white border border-[#EBE3DE] rounded-2xl cursor-pointer shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-[#FAF3F0] border border-[#EBE3DE] flex items-center justify-center text-lg shrink-0">
                      📌
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-extrabold text-stone-900">Musical Minds Reunion</h4>
                      <p className="text-[10px] text-stone-400 font-mono truncate">Molly Clark: Welcome back!</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-stone-50 rounded-2xl cursor-pointer transition-colors opacity-75">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-lg shrink-0">
                      🎻
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-extrabold text-stone-800">Violin & Sitar Masters</h4>
                      <p className="text-[10px] text-stone-400 truncate">Discuss classical ragas...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-stone-50 rounded-2xl cursor-pointer transition-colors opacity-75">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-lg shrink-0">
                      🎤
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-extrabold text-stone-800">Vocal & Raga Recitals</h4>
                      <p className="text-[10px] text-stone-400 truncate">Vocal tuning feedback...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-stone-50 rounded-2xl cursor-pointer transition-colors opacity-75">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-lg shrink-0">
                      🎵
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-extrabold text-stone-800">Composition Showcases</h4>
                      <p className="text-[10px] text-stone-400 truncate">Listen to original tracks...</p>
                    </div>
                  </div>
                </div>

                {/* Short guidelines card inside rail */}
                <div className="p-4 border-t border-[#EBE3DE] bg-[#FAF3F0]/50 text-[10px] text-stone-500 leading-relaxed italic">
                  "Reuniting musical minds across generations to celebrate the spirit of Malhaarvaayu."
                </div>
              </div>

              {/* RIGHT MESSAGE PANEL */}
              <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">
                
                {/* Channel Header */}
                <div className="p-4 border-b border-[#EBE3DE] bg-[#FAF8F5] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#D98353]/10 text-[#D98353] rounded-full flex items-center justify-center font-bold text-sm">
                      📌
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-extrabold text-stone-900">Musical Minds Reunion</h3>
                    </div>
                  </div>
                </div>

                {/* Scrollable Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFFDFB]">
                  {alumniMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-stone-400">
                      <span className="text-2xl mb-1">📬</span>
                      <p className="text-xs font-mono">No alumni broadcasts registered yet.</p>
                      <p className="text-[10px] text-stone-500 italic">Be the first to share an update or piece of advice!</p>
                    </div>
                  ) : (
                    alumniMessages.map((msg) => {
                      const isCurrentUserMsg = msg.sender_id === currentUser.id;
                      const roleBadgeStyles = 
                        msg.sender_role === 'admin' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        msg.sender_role === 'president' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-[#FAF3F0] text-[#D98353] border-[#EBE3DE]';

                      return (
                        <div 
                          key={msg.id} 
                          className={`flex gap-3 max-w-[85%] items-start animate-fade-in ${
                            isCurrentUserMsg ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'
                          }`}
                        >
                          {/* Sender Avatar */}
                          <div className="shrink-0">
                            {msg.sender_image ? (
                              <img src={msg.sender_image} alt={msg.sender_name} className="w-8 h-8 rounded-full border border-stone-200 object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#FAF3F0] text-[#D98353] font-serif font-black flex items-center justify-center text-xs border border-[#EBE3DE]">
                                {msg.sender_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Message Bubble wrapper */}
                          <div className="space-y-1">
                            <div className={`flex items-center gap-1.5 flex-wrap ${isCurrentUserMsg ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs font-bold text-stone-800">{msg.sender_name}</span>
                              <span className={`px-1 rounded text-[8px] font-mono font-bold uppercase tracking-wide border ${roleBadgeStyles}`}>
                                {msg.sender_role}
                              </span>
                              <span className="text-[8px] font-mono text-stone-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Main Message Bubble */}
                            <div className={`p-3 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                              isCurrentUserMsg 
                                ? 'bg-[#D98353] border-[#D98353] text-white rounded-tr-none text-left shadow-sm' 
                                : 'bg-[#FAF3F0] border-[#EBE3DE] text-stone-800 rounded-tl-none shadow-sm'
                            }`}>
                              {/* Text content if present */}
                              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                              {/* Attached Image container (Requirement 3) */}
                              {msg.image_url && (
                                <div className="rounded-xl overflow-hidden border border-black/10 bg-black/5 mt-1 max-w-xs shadow-inner">
                                  <img 
                                    src={msg.image_url} 
                                    alt="Shared performance asset" 
                                    className="w-full max-h-48 object-cover hover:scale-105 transition-transform duration-300" 
                                  />
                                </div>
                              )}

                              {/* Attached Voice Player (Requirement 3) */}
                              {msg.audio_url && (
                                <div className="mt-1">
                                  <VoiceNotePlayer audioUrl={msg.audio_url} />
                                </div>
                              )}
                            </div>

                            {/* Moderator Deletion Button */}
                            {isModerator && (
                              <div className={`${isCurrentUserMsg ? 'text-left' : 'text-right'}`}>
                                <button
                                  onClick={() => handleDeleteAlumniMessage(msg.id)}
                                  className="text-stone-400 hover:text-rose-600 font-mono text-[9px] uppercase font-bold mt-0.5 transition-colors cursor-pointer"
                                  title="Delete Message"
                                >
                                  ✕ Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Pending Media Attachment Tray */}
                {(alumniAttachedImage || alumniAttachedAudio || alumniIsRecording) && (
                  <div className="px-4 py-2 bg-[#FAF8F5] border-t border-[#EBE3DE] flex flex-wrap gap-3 items-center">
                    
                    {/* Live recording indicator */}
                    {alumniIsRecording && (
                      <div className="flex items-center gap-2 bg-[#FAF3F0] border border-[#EBE3DE] px-3 py-1.5 rounded-full animate-pulse text-xs text-[#D98353] font-bold font-mono">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                        Recording mic audio...
                      </div>
                    )}

                    {/* Image preview indicator */}
                    {alumniAttachedImage && (
                      <div className="relative flex items-center gap-2 bg-white border border-[#EBE3DE] pl-2 pr-3 py-1 rounded-full shadow-sm">
                        <img src={alumniAttachedImage} alt="Attachment thumbnail" className="w-6 h-6 rounded-full object-cover border border-[#EBE3DE]" />
                        <span className="text-[10px] font-mono font-bold text-stone-600">Performance Image.jpg</span>
                        <button 
                          onClick={() => setAlumniAttachedImage(null)}
                          className="w-4 h-4 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center text-[8px] font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Audio preview indicator */}
                    {alumniAttachedAudio && (
                      <div className="relative flex items-center gap-2 bg-white border border-[#EBE3DE] pl-2.5 pr-3 py-1 rounded-full shadow-sm">
                        <span className="text-xs">🎙️</span>
                        <span className="text-[10px] font-mono font-bold text-stone-600">Recorded Vocal Note</span>
                        <button 
                          onClick={() => setAlumniAttachedAudio(null)}
                          className="w-4 h-4 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center text-[8px] font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* Message Input Panel (Requirement 3) */}
                <div className="p-3 border-t border-[#EBE3DE] bg-[#FAF8F5] flex gap-2 items-end">
                  
                  {/* Photo selector trigger */}
                  <label className="w-10 h-10 rounded-full border border-[#EBE3DE] bg-white flex items-center justify-center text-stone-500 hover:bg-[#FAF3F0] hover:text-[#D98353] cursor-pointer transition-all shrink-0 shadow-sm" title="Attach picture">
                    <span className="text-lg">📷</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={triggerImageUpload} 
                      className="hidden" 
                    />
                  </label>

                  {/* Input textbox */}
                  <textarea
                    rows={1}
                    value={newAlumniMsgText}
                    onChange={(e) => setNewAlumniMsgText(e.target.value)}
                    placeholder="Broadcast recital tracks, audition listings, or career feedback..."
                    className="flex-1 bg-white border border-[#EBE3DE] text-xs text-stone-800 outline-none resize-none placeholder-stone-400 font-serif leading-relaxed px-3 py-2.5 rounded-2xl focus:border-[#D98353]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAlumniMessage();
                      }
                    }}
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSendAlumniMessage}
                    disabled={!newAlumniMsgText.trim() && !alumniAttachedImage && !alumniAttachedAudio}
                    className="h-10 px-4 bg-[#D98353] hover:bg-[#B35F30] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0 shadow-sm"
                  >
                    Send 🚀
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      }

      case 'workspace':
        return (
          <WorkspaceHubView 
            currentUser={currentUser} 
            onRequestToast={triggerToast} 
          />
        );

      default:
        return (
          <DashboardView 
            currentUser={currentUser} 
            onRequestToast={triggerToast} 
            onRefreshTrigger={refreshApplicationData} 
          />
        );
    }
  };

  // If application state is performing checks
  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-[#120F0D] flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-[#D98353] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#D98353] font-mono text-xs uppercase tracking-widest font-bold animate-pulse">Initializing Data...</p>
      </div>
    );
  }

  // Render 3-second India Svara Floating startup splash screen
  if (showSplash) {
    return <SplashView onComplete={() => setShowSplash(false)} />;
  }

  const rawNavItems = [
    { id: 'dashboard', label: '🎼 Dashboard', icon: '𝄞' },
    { id: 'music-lab', label: '🎶 Swar, Taal, Vocal and Harmonies', icon: '🎶' },
    { id: 'leaderboard', label: '🏆 Leaderboard', icon: '🏅' },
    { id: 'core-team', label: '👥 Core Team', icon: '🎖' },
    { id: 'timetable', label: '📅 Schedules', icon: '⏱' },
    { id: 'attendance', label: '📋 Attendance Board', icon: '📋' },
    { id: 'rules', label: '📜 Rules & Regs', icon: '📜' },
    { id: 'targets', label: '🎯 Monthly Targets', icon: '📌' },
    { id: 'notices', label: '📢 Notices Feed', icon: '📢' },
    { id: 'suggestions', label: '💬 Suggestion Box', icon: '📬' },
    { id: 'alumni-connect', label: '✨ Alumni Connect', icon: '💬' },
    { id: 'profile', label: '👤 My Profile', icon: '👤' },
  ];

  // Filter based on roles. Alumni can ONLY see Home, Swar Lab, Profile, Dashboard, Core Team, Alumni Chat.
  const coreNavItems = !currentUser
    ? rawNavItems.filter(item => item.id === 'dashboard')
    : rawNavItems.filter(item => {
        if (currentUser.role === 'alumni') {
          return ['dashboard', 'music-lab', 'profile', 'core-team', 'alumni-connect'].includes(item.id);
        }
        // For non-alumni, they see everything except Alumni Connect (unless they are admin or president)
        if (item.id === 'alumni-connect') {
          return ['admin', 'president', 'alumni'].includes(currentUser.role);
        }
        return true;
      });

  // Extra restricted spaces
  const extraNavItems = [
    { id: 'core-control', label: '🔒 Core Control Hall', icon: '🔒', roles: ['president', 'central_core'] },
    { id: 'admin', label: '⚙ Admin Panel', icon: '⚙', roles: ['admin', 'president', 'central_core', 'core'] }
  ];

  const visibleExtraItems = (!currentUser || currentUser.role === 'alumni')
    ? [] 
    : extraNavItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className={`min-h-screen relative flex items-center justify-center overflow-hidden transition-colors ${themeMode === 'light' ? 'bg-[#FAF6F3] text-[#2F211A]' : 'bg-[#050403] text-[#ECE6E1]'}`}>
      
      {/* Settings Dialog Portal */}
      <SettingsPopup 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onRequestToast={triggerToast}
        onRefreshTrigger={refreshApplicationData}
      />

      {/* Decorative Warm Ambient Eclipse Soundstage Background Lights (Immersive theme) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#D98353]/10 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-[#E6AF2E]/5 to-transparent blur-[100px] pointer-events-none z-0" />

      {/* Background Floating particles visual theme */}
      <FloatingNotes />

      {/* Absolute Toast alert portal inside safe limits */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2.5 z-50 w-full max-w-sm pointer-events-none px-4">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border-t-2 shadow-2xl flex items-start gap-3 backdrop-blur-xl animate-slide-up bg-black/80 ${
              toast.type === 'success' 
                ? 'border-[#D98353] text-[#ECE6E1]' 
                : toast.type === 'error' 
                  ? 'border-red-600 text-red-200' 
                  : 'border-white/20 text-[#AC9E94]'
            }`}
          >
            <span className="text-[#D98353] font-bold font-mono">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* DESKTOP SIDE CONTROL BOARD: Only visible on md+ screen sizes when in Desktop Frame view */}
      {isDesktopFrame && (
        <div className="hidden lg:flex flex-col justify-between w-80 h-[844px] mr-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-left relative z-10 animate-fadeIn shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <span className="text-3xl">📱</span>
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Malhaar Live Desk</h3>
                <p className="text-[10px] font-mono text-[#D98353] uppercase tracking-wider">Device Simulator Mode</p>
              </div>
            </div>

            <p className="text-xs text-[#AC9E94] leading-relaxed">
              This desktop environment is simulating a high-fidelity, full-screen mobile application. This gives you a pixel-perfect rendering of the phone layouts with responsive touch heights.
            </p>

            <div className="space-y-3 bg-[#1E1512]/30 border border-[#3C271F]/40 p-4 rounded-2xl">
              <span className="text-[10px] font-mono text-[#D98353] uppercase tracking-wider block font-bold">Cabinet Testing Credentials</span>
              <div className="text-xs space-y-1 text-stone-300 font-mono">
                <p>• <strong className="text-white">Admin Code</strong>: <code>MALHAARCOREGNG</code></p>
                <p>• <strong className="text-white">President Code</strong>: <code>MALHAARCORERECORD</code></p>
                <p className="text-[10px] text-stone-500 pt-1">Type in Core Control Hall or Admin Settings to unlock sensitive sheets.</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Simulator Controls</span>
              <button
                onClick={() => {
                  setIsDesktopFrame(false);
                  triggerToast('Switched to responsive wide layout!', 'info');
                }}
                className="w-full h-10 bg-white/5 border border-white/10 hover:border-[#D98353]/40 hover:bg-white/10 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                🖥️ Responsive Wide View
              </button>

              {currentUser?.role === 'president' && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-full h-10 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_15px_rgba(217,131,83,0.3)] text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  ⚙️ Open Database Status Panel
                </button>
              )}
            </div>
          </div>

          <div className="text-[10px] font-mono text-stone-500 border-t border-white/5 pt-4">
            <p>Malhaar Music Society • Motilal Nehru Morning</p>
            <p className="mt-1">Active Frame: iPhone 15 Pro Max Ratio</p>
          </div>
        </div>
      )}

      {/* APP INTERNET CONTEXT SHELL CONTAINER */}
      <div className={`
        ${isDesktopFrame 
          ? 'w-full h-screen md:h-[844px] md:w-[390px] md:rounded-[50px] md:border-[12px] md:border-[#201816] md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] md:relative md:overflow-hidden md:flex md:flex-col bg-[#0a0807]' 
          : 'w-full min-h-screen flex flex-col md:flex-row bg-[#0a0807]'
        } text-[#ECE6E1] transition-all relative z-10 shrink-0
      `}>

        {/* DEVICE PHYSICS STICKER (Only when desktop simulation is active) */}
        {isDesktopFrame && (
          <>
            {/* Top Speaker Notch bar / Dynamic Island */}
            <div className="hidden md:block absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-2 h-2 bg-stone-900 rounded-full mr-2 shrink-0 border border-stone-800" />
              <div className="w-12 h-1 bg-stone-950 rounded-full shrink-0" />
            </div>

            {/* Simulated Top Mobile Status bar */}
            <div className="hidden md:flex absolute top-0 inset-x-0 h-10 px-8 items-center justify-between text-[11px] font-mono text-stone-400 font-bold tracking-wider z-40 select-none pointer-events-none">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <span>📶</span>
                <span>5G</span>
                <span>🔋 100%</span>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* ==================== ACTUAL INTERACTIVE APP ============= */}
        {/* ========================================================= */}

        {/* ====== 1. DESKTOP LATERAL SIDEBAR ====== */}
        <aside className={`
          ${isDesktopFrame ? 'hidden' : 'hidden md:flex'} 
          flex-col justify-between w-64 bg-black/40 backdrop-blur-2xl border-r border-white/5 shrink-0 p-6 h-screen sticky top-0 z-30
        `}>
          <div className="space-y-8">
            {/* Logo brand */}
            <div className="flex items-center gap-3">
              <div 
                onClick={handleLogoClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-black font-semibold shadow-[0_0_15px_rgba(217,131,83,0.15)] relative group overflow-hidden border-2 ${
                  customLogo 
                    ? 'border-white/10 bg-transparent' 
                    : 'border-dashed border-[#D98353]/40 bg-[#D98353]/5'
                } ${currentUser?.role === 'president' ? 'cursor-pointer hover:border-[#D98353]/80' : ''}`}
                title={currentUser?.role === 'president' ? "President: Click to upload custom PNG/JPG logo" : undefined}
              >
                {customLogo ? (
                  <img src={customLogo} alt="Malhaar Logo" className="w-full h-full object-cover rounded-full" />
                ) : (
                  currentUser?.role === 'president' ? (
                    <span className="text-[10px] text-[#D98353]/70 font-bold font-sans">＋</span>
                  ) : (
                    <span className="text-[10px] text-[#D98353]/30 font-bold font-sans">○</span>
                  )
                )}

                {currentUser?.role === 'president' && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[11px] text-white font-bold">📷</span>
                  </div>
                )}
              </div>
              <div className="text-left leading-none">
                <strong className="font-serif text-lg font-bold tracking-wide text-white block">MALHAAR</strong>
                <span className="text-[9px] uppercase tracking-wider text-[#D98353] font-bold font-mono">The Music Society</span>
              </div>
            </div>

            {/* Hidden Input for Custom Logo (President Only) */}
            {currentUser?.role === 'president' && (
              <input 
                type="file"
                ref={logoInputRef}
                onChange={handleLogoChange}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
            )}

            {/* Navigation Links List */}
            <nav className="space-y-1.5 text-left">
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-bold block mb-2 px-3">General Spaces</span>
              {coreNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (item.id === 'core-control') setIsControlUnlocked(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all pointer-events-auto cursor-pointer ${
                    activeView === item.id 
                      ? 'bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black shadow-[0_0_15px_rgba(217,131,83,0.25)]' 
                      : 'text-[#AC9E94] hover:text-[#ECE6E1] hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}

              {visibleExtraItems.length > 0 && (
                <>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#D98353] font-bold block mb-2 px-3 pt-5">Restricted Spaces</span>
                  {visibleExtraItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        if (item.id === 'core-control') setIsControlUnlocked(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all pointer-events-auto cursor-pointer ${
                        activeView === item.id 
                          ? 'bg-gradient-to-r from-[#E6AF2E] to-[#B8860B] text-black shadow-[0_0_15px_rgba(230,175,46,0.25)]' 
                          : 'text-[#AC9E94] hover:text-[#ECE6E1] hover:bg-white/5'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </>
              )}
            </nav>
          </div>

          {/* Small Profile widget bottom of sidebar or Sign In trigger */}
          {currentUser ? (
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                {currentUser.profile_image_url ? (
                  <img 
                    src={currentUser.profile_image_url} 
                    alt={currentUser.name} 
                    className="w-9 h-9 rounded-full border border-white/10 object-cover shadow-inner" 
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full border border-white/10 bg-[#2A160F] flex items-center justify-center text-xs font-serif font-bold text-[#D98353] shadow-inner shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="leading-none">
                  <strong className="text-xs text-[#ECE6E1] block truncate max-w-[100px]">{currentUser.name}</strong>
                  <span className="text-[9px] text-[#D98353] uppercase font-bold font-mono block mt-0.5">{currentUser.role === 'admin' ? 'core' : currentUser.role}</span>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="text-stone-400 hover:text-white p-1 rounded cursor-pointer transition-colors"
                title="Log Out Session"
              >
                🔌
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-white/5">
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-[#D98353] text-[#D98353] text-xs font-bold uppercase rounded-xl transition-all cursor-pointer text-center font-serif"
              >
                🔑 Sign In / Register
              </button>
            </div>
          )}
        </aside>

        {/* ====== 2. MOBILE HEADER & NAVIGATION DRAWER ====== */}
        <header className={`
          ${isDesktopFrame ? 'flex h-20 pt-8' : 'flex md:hidden h-16'} 
          items-center justify-between px-5 bg-[#191412] border-b border-[#2C1E19] sticky top-0 z-40 w-full shrink-0
        `}>
          <div className="flex items-center gap-2">
            <div 
              onClick={handleLogoClick}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-black font-semibold shadow-[0_0_15px_rgba(217,131,83,0.15)] relative group overflow-hidden border-2 ${
                customLogo 
                  ? 'border-white/10 bg-transparent' 
                  : 'border-dashed border-[#D98353]/40 bg-[#D98353]/5'
              } ${currentUser?.role === 'president' ? 'cursor-pointer hover:border-[#D98353]/80' : ''}`}
              title={currentUser?.role === 'president' ? "President: Click to upload custom PNG/JPG logo" : undefined}
            >
              {customLogo ? (
                <img src={customLogo} alt="Malhaar Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                currentUser?.role === 'president' ? (
                  <span className="text-[9px] text-[#D98353]/70 font-bold font-sans">＋</span>
                ) : (
                  <span className="text-[9px] text-[#D98353]/30 font-bold font-sans">○</span>
                )
              )}

              {currentUser?.role === 'president' && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[9px] text-white font-bold">📷</span>
                </div>
              )}
            </div>
            <strong className="font-serif text-sm tracking-widest text-[#ECE6E1]">MALHAAR</strong>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser?.role === 'president' && (
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-stone-300 hover:text-[#D98353] p-1.5 focus:outline-none transition-colors cursor-pointer text-sm"
                title="Open Settings Desk"
              >
                ⚙️
              </button>
            )}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="text-stone-300 p-1.5 focus:outline-none"
            >
              ☰
            </button>
          </div>
        </header>

        {/* Mobile Menu Backdrop & Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex justify-end md:hidden">
            <div className="w-64 h-full bg-[#191412] p-6 flex flex-col justify-between border-l border-stone-850 relative text-left">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 text-[#D98353] text-sm font-mono"
              >
                [✕ Close]
              </button>

              <div className="space-y-6 pt-6">
                {!currentUser ? (
                  <button
                    onClick={() => {
                      setIsAuthOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-[#D98353] text-black font-extrabold uppercase text-xs tracking-widest rounded-xl transition-all hover:bg-[#D98353]/90 shadow-[0_0_15px_rgba(217,131,83,0.3)] flex items-center justify-center gap-2 cursor-pointer font-serif"
                  >
                    👤 Sign In / Register
                  </button>
                ) : (
                  <div className="flex items-center gap-2 border-b border-stone-900 pb-4">
                    {currentUser.profile_image_url ? (
                      <img src={currentUser.profile_image_url} alt="You" className="w-10 h-10 rounded-full object-cover border border-stone-800 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-stone-800 bg-[#2A160F] flex items-center justify-center text-sm font-serif font-bold text-[#D98353] shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <strong className="text-xs text-white block">{currentUser.name}</strong>
                      <span className="text-[9px] text-[#D98353] uppercase font-bold">{currentUser.role === 'admin' ? 'core' : currentUser.role}</span>
                    </div>
                  </div>
                )}

                <nav className="space-y-1">
                  {coreNavItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setMobileMenuOpen(false);
                        if (item.id === 'core-control') setIsControlUnlocked(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                        activeView === item.id 
                          ? 'bg-[#D98353] text-[#120F0D]' 
                          : 'text-[#AC9E94] hover:text-[#ECE6E1]'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}

                  {visibleExtraItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setMobileMenuOpen(false);
                        if (item.id === 'core-control') setIsControlUnlocked(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                        activeView === item.id 
                          ? 'bg-[#E6AF2E] text-black' 
                          : 'text-[#AC9E94] hover:text-[#ECE6E1]'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full h-10 bg-stone-900 text-stone-300 font-bold text-xs uppercase tracking-wider border border-stone-850 rounded"
              >
                🔌 Sign Out
              </button>
            </div>
          </div>
        )}

        {/* ====== 3. MAIN WORKSPACE CONTENT CONTAINER ====== */}
        <main className={`flex-grow flex flex-col ${isDesktopFrame ? 'h-full max-h-full overflow-hidden' : 'min-h-screen'} max-w-full overflow-x-hidden relative`}>
          
          {/* Global Page Header workspace bar (Only in responsive wide view) */}
          <header className={`
            ${isDesktopFrame ? 'hidden' : 'hidden md:flex'} 
            items-center justify-between px-6 sm:px-8 h-16 border-b border-dashed border-[#231A17] shrink-0 sticky top-0 bg-[#120F0D] bg-opacity-80 z-20 backdrop-blur-md
          `}>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase font-mono tracking-widest text-[#D98353] font-bold">Currently Viewing :</span>
              <span className="text-xs uppercase font-mono font-black text-[#ECE6E1] bg-[#1E1512] border border-[#3C271F] px-2.5 py-1 rounded">
                {activeView.split('-').join(' ')}
              </span>
            </div>

             <div className="flex items-center gap-3 sm:gap-4">
              {/* Real-time ticker clock */}
              <span className="text-xs font-mono text-[#D98353] uppercase tracking-widest bg-stone-950 px-2 py-1 rounded-xl border border-stone-900 select-none">
                🕒 UTC: {currentTime || 'Loading...'}
              </span>

              {/* Toggle Device Simulator Button */}
              <button
                onClick={() => {
                  setIsDesktopFrame(!isDesktopFrame);
                  triggerToast(isDesktopFrame ? 'Simulator deactivated!' : 'Simulator activated!', 'info');
                }}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:border-[#D98353]/35 hover:text-[#D98353] flex items-center justify-center text-sm transition-all cursor-pointer"
                title={isDesktopFrame ? "Switch to Wide Layout" : "Switch to Mobile App Frame"}
              >
                📱
              </button>

              {/* Settings Gear button */}
              {currentUser?.role === 'president' && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:border-[#D98353]/35 hover:text-[#D98353] flex items-center justify-center text-sm transition-all cursor-pointer"
                  title="Open Database Status Panel"
                >
                  ⚙️
                </button>
              )}

              {/* Quick Profile anchor link or guest registration */}
              {!currentUser ? (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-4 h-9 bg-[#D98353] hover:bg-[#D98353]/90 text-black text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(217,131,83,0.2)] font-serif"
                >
                  👤 Sign In
                </button>
              ) : (
                <button
                  onClick={() => setActiveView('profile')}
                  className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
                >
                  {currentUser.profile_image_url ? (
                    <img 
                      src={currentUser.profile_image_url} 
                      alt="Me" 
                      className="w-8 h-8 rounded-full border border-stone-800 object-cover shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-stone-800 bg-[#2A160F] flex items-center justify-center text-xs font-serif font-bold text-[#D98353] shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-[#AC9E94] hover:text-[#ECE6E1] font-bold uppercase tracking-wider">{currentUser.name.split(' ')[0]}</span>
                </button>
              )}
            </div>
          </header>

          {/* Dynamic content rendering frame viewport */}
          <section className={`flex-grow p-4 sm:p-6 overflow-y-auto ${isDesktopFrame ? 'pb-24' : 'pb-20 md:pb-12'}`}>
            {renderViewContent()}
          </section>

          {/* Core footer elements (only shown when not in simulator frame) */}
          {!isDesktopFrame && (
            <footer className="h-14 border-t border-[#231A17] flex items-center justify-between px-8 text-[10px] text-[#AC9E94] font-mono leading-none z-10 shrink-0">
              <span>Malhaar Music Society © 2026</span>
            </footer>
          )}
        </main>

        {/* ====== 4. MOBILE NAVIGATION BOTTOM BAR (BottomNav) ====== */}
        <nav className={`
          ${isDesktopFrame ? 'absolute' : 'fixed md:hidden'} 
          bottom-0 inset-x-0 h-16 bg-[#191412] border-t border-[#2C1E19] flex items-center justify-around z-40 px-2 shadow-xl shrink-0
        `}>
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${activeView === 'dashboard' ? 'text-[#D98353]' : 'text-stone-400'}`}
          >
            {customLogo ? (
              <img src={customLogo} alt="" className="w-5 h-5 object-cover rounded-full" />
            ) : (
              <span className="text-base leading-none">○</span>
            )}
            <span>Home</span>
          </button>
          {currentUser ? (
            <>
              <button 
                onClick={() => setActiveView('leaderboard')}
                className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${activeView === 'leaderboard' ? 'text-[#D98353]' : 'text-stone-400'}`}
              >
                <span className="text-base leading-none">🏆</span>
                <span>Leader</span>
              </button>
              <button 
                onClick={() => setActiveView('timetable')}
                className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${activeView === 'timetable' ? 'text-[#D98353]' : 'text-stone-400'}`}
              >
                <span className="text-base leading-none">📅</span>
                <span>Timetable</span>
              </button>
              <button 
                onClick={() => setActiveView('music-lab')}
                className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${activeView === 'music-lab' ? 'text-[#D98353]' : 'text-stone-400'}`}
              >
                <span className="text-base leading-none">🎶</span>
                <span>Svara Lab</span>
              </button>
              <button 
                onClick={() => setActiveView('profile')}
                className={`flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${activeView === 'profile' ? 'text-[#D98353]' : 'text-stone-400'}`}
              >
                <span className="text-base leading-none">👤</span>
                <span>Profile</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[#D98353]"
            >
              <span className="text-base leading-none">🔑</span>
              <span>Sign In</span>
            </button>
          )}
        </nav>

        {/* Guest Authentication Modal Overlay */}
        {isAuthOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-[#120F0D] rounded-3xl border border-white/10 p-1 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsAuthOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-white font-mono text-base z-50 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center cursor-pointer border border-white/5"
                title="Close Portal"
              >
                ✕
              </button>
              <AuthView 
                onAuthSuccess={(profile) => {
                  handleAuthSuccess(profile);
                  setIsAuthOpen(false);
                }} 
                onRequestToast={triggerToast} 
              />
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
