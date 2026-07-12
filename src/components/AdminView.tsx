import React, {useState, useEffect} from 'react';
import {
  Profile,
  Performance,
  Notice,
  ClubEvent,
  Achievement,
  Merchandise,
  MediaFolder,
  TimetableEntry,
  MonthlyTarget,
  CoreMember,
  Alumni,
  CustomSection,
  dbInstance
} from '../db/mockDb';
import { compressImageBase64 } from '../db/imageCompressor';
import { getWorkspaceToken } from '../lib/workspaceAuth';
import { createCalendarEvent } from '../lib/workspaceApi';

interface AdminViewProps {
  currentUser: Profile;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshTrigger?: () => void;
  activeMonth: string;
}

export default function AdminView({currentUser, onRequestToast, onRefreshTrigger, activeMonth}: AdminViewProps) {
  // Tabs definition
  const TABS = [
    { id: 'users', label: '👥 Users & Approval' },
    { id: 'mandates', label: '💵 Mandate Desk' },
    { id: 'site_vision', label: '🎨 Vision & Medals' },
    { id: 'media', label: '🎬 Media Hall' },
    { id: 'merchandise_cms', label: '🛍️ Merchandise CMS' },
    { id: 'core-members', label: '🎺 Core Team CMS' },
    { id: 'alumni', label: '✨ Alumni CMS' },
    { id: 'custom', label: '📌 Dashboard Segs' },
    { id: 'notices', label: '📢 Notices Feed' },
    { id: 'events', label: '📅 Practice Timetable' },
    { id: 'targets', label: '🎯 Monthly Targets' },
    { id: 'settings_backup', label: '⚙️ Settings & Backup' }
  ].filter(tab => {
    if (tab.id === 'settings_backup') {
      return currentUser.role === 'president';
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState('users');

  // Unified state loaded from database
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [customSectionsList, setCustomSectionsList] = useState<CustomSection[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [coreMembersList, setCoreMembersList] = useState<CoreMember[]>([]);

  // Core creation form states
  const [newCoreName, setNewCoreName] = useState('');
  const [newCoreRole, setNewCoreRole] = useState('');
  const [newCorePosition, setNewCorePosition] = useState('');
  const [newCoreTenure, setNewCoreTenure] = useState('2024-25');
  const [newCoreYear, setNewCoreYear] = useState<'1st' | '2nd' | '3rd'>('1st');
  const [newCoreImg, setNewCoreImg] = useState('');
  const [newCoreDesc, setNewCoreDesc] = useState('');
  const [newCorePhone, setNewCorePhone] = useState('');
  const [newCoreTenureYear, setNewCoreTenureYear] = useState('2026');

  // Selected for inline edit
  const [selectedCore, setSelectedCore] = useState<CoreMember | null>(null);
  const [editCoreName, setEditCoreName] = useState('');
  const [editCoreRole, setEditCoreRole] = useState('');
  const [editCorePosition, setEditCorePosition] = useState('');
  const [editCoreTenure, setEditCoreTenure] = useState('');
  const [editCoreYear, setEditCoreYear] = useState<'1st' | '2nd' | '3rd'>('1st');
  const [editCoreImg, setEditCoreImg] = useState('');
  const [editCoreDesc, setEditCoreDesc] = useState('');
  const [editCorePhone, setEditCorePhone] = useState('');
  const [editCoreTenureYear, setEditCoreTenureYear] = useState('2026');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [importJson, setImportJson] = useState('');
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  // Edit User dialog state
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<Profile['role']>('member');
  const [editAttPoints, setEditAttPoints] = useState(0);
  const [editTaskPoints, setEditTaskPoints] = useState(0);
  const [editContribPoints, setEditContribPoints] = useState(0);
  const [editAchPoints, setEditAchPoints] = useState(0);

  const [editAttendanceStreak, setEditAttendanceStreak] = useState(0);
  const [editTasksCompleted, setEditTasksCompleted] = useState(0);

  // Mandate editing states inside dialog
  const [editMandates, setEditMandates] = useState<Record<string, 'given' | 'crossed' | 'pending'>>({});

  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isSavingPoints, setIsSavingPoints] = useState(false);

  // Notices creation
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');

  // Timetable editing state
  const [timetableList, setTimetableList] = useState<TimetableEntry[]>([]);
  const [newTimeTitle, setNewTimeTitle] = useState('');
  const [newTimeDesc, setNewTimeDesc] = useState('');
  const [newTimeType, setNewTimeType] = useState<TimetableEntry['event_type']>('Practice');
  const [newTimeStart, setNewTimeStart] = useState('14:00');
  const [newTimeEnd, setNewTimeEnd] = useState('16:00');
  const [newTimeDay, setNewTimeDay] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTimeAssignedTo, setNewTimeAssignedTo] = useState('All');
  const [timetableAssignType, setTimetableAssignType] = useState<'All' | 'Core' | 'Alumni' | 'Individual'>('All');
  const [selectedTimetableMembers, setSelectedTimetableMembers] = useState<string[]>([]);
  const [newTimeGoogleMeet, setNewTimeGoogleMeet] = useState(false);
  const [newTimeGoogleMeetUrl, setNewTimeGoogleMeetUrl] = useState('');

  // New Alumni Creation Form States
  const [newAlumniName, setNewAlumniName] = useState('');
  const [newAlumniRoleCode, setNewAlumniRoleCode] = useState('');
  const [newAlumniYear, setNewAlumniYear] = useState('2024');
  const [newAlumniBio, setNewAlumniBio] = useState('');
  const [newAlumniImage, setNewAlumniImage] = useState('');

  // New Custom Segment Form States
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecContent, setNewSecContent] = useState('');
  const [newSecImage, setNewSecImage] = useState('');
  const [newSecDriveLink, setNewSecDriveLink] = useState('');
  const [newSecMeetLink, setNewSecMeetLink] = useState('');
  const [newSecFormLink, setNewSecFormLink] = useState('');
  const [selectedSec, setSelectedSec] = useState<CustomSection | null>(null);
  const [editSecTitle, setEditSecTitle] = useState('');
  const [editSecContent, setEditSecContent] = useState('');
  const [editSecImage, setEditSecImage] = useState('');
  const [editSecDriveLink, setEditSecDriveLink] = useState('');
  const [editSecMeetLink, setEditSecMeetLink] = useState('');
  const [editSecFormLink, setEditSecFormLink] = useState('');
  const [isDraggingSec, setIsDraggingSec] = useState(false);
  const [isDraggingEditSec, setIsDraggingEditSec] = useState(false);

  // Targets creation
  const [newTargTitle, setNewTargTitle] = useState('');
  const [newTargDesc, setNewTargDesc] = useState('');
  const [newTargAssign, setNewTargAssign] = useState('');
  const [newTargDate, setNewTargDate] = useState('2026-06-30');

  // Selected Focus Month for Mandate Board
  const [selectedMandateMonth, setSelectedMandateMonth] = useState<string>(() => dbInstance.getActiveMonth());

  // Site general content and achievements
  const [siteVision, setSiteVision] = useState('');
  const [liveStatusText, setLiveStatusText] = useState('Season Auditions Live');
  const [siteMission, setSiteMission] = useState('');
  const [siteAbout, setSiteAbout] = useState('');
  const [siteAboutDeveloper, setSiteAboutDeveloper] = useState('');
  const [siteWhyJoin, setSiteWhyJoin] = useState('');
  const [siteDevName, setSiteDevName] = useState('');
  const [siteDevChapter, setSiteDevChapter] = useState('');
  const [siteDevPicture, setSiteDevPicture] = useState('');
  const [achievementsList, setAchievementsList] = useState<Achievement[]>([]);

  // Add Achievement inputs
  const [newAchYear, setNewAchYear] = useState('2026');
  const [newAchTitle, setNewAchTitle] = useState('');
  const [newAchDesc, setNewAchDesc] = useState('');
  const [newAchImg, setNewAchImg] = useState('');

  // Selected Achievement for Inline Edits
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);
  const [editAchYear, setEditAchYear] = useState('');
  const [editAchTitle, setEditAchTitle] = useState('');
  const [editAchDesc, setEditAchDesc] = useState('');
  const [editAchImg, setEditAchImg] = useState('');

  // Merchandise custom states
  const [merchandiseList, setMerchandiseList] = useState<Merchandise[]>([]);
  const [newMerchYear, setNewMerchYear] = useState('2026');
  const [newMerchItemName, setNewMerchItemName] = useState('');
  const [newMerchDescription, setNewMerchDescription] = useState('');
  const [newMerchPrice, setNewMerchPrice] = useState<string>('15');
  const [newMerchImageUrl, setNewMerchImageUrl] = useState('');

  const [selectedMerch, setSelectedMerch] = useState<Merchandise | null>(null);
  const [editMerchYear, setEditMerchYear] = useState('');
  const [editMerchItemName, setEditMerchItemName] = useState('');
  const [editMerchDescription, setEditMerchDescription] = useState('');
  const [editMerchPrice, setEditMerchPrice] = useState<string>('15');
  const [editMerchImageUrl, setEditMerchImageUrl] = useState('');

  // Repurposed Media folders states - Linked dynamically with events (ClubEvent) on dashboard
  const [newMediaFolderName, setNewMediaFolderName] = useState('');
  const [newMediaFolderDesc, setNewMediaFolderDesc] = useState('');
  const [newMediaFolderDriveLink, setNewMediaFolderDriveLink] = useState('');
  const [newMediaFolderImagesText, setNewMediaFolderImagesText] = useState('');
  const [newMediaFolderDate, setNewMediaFolderDate] = useState('2026-06-21');
  const [newMediaFolderCategory, setNewMediaFolderCategory] = useState<'Classical' | 'Western' | 'Fusion' | 'Production' | 'Jam'>('Classical');
  const [newMediaFolderYear, setNewMediaFolderYear] = useState('2025-26');

  const [selectedMediaFolder, setSelectedMediaFolder] = useState<ClubEvent | null>(null);
  const [editMediaFolderName, setEditMediaFolderName] = useState('');
  const [editMediaFolderDesc, setEditMediaFolderDesc] = useState('');
  const [editMediaFolderDriveLink, setEditMediaFolderDriveLink] = useState('');
  const [editMediaFolderImagesText, setEditMediaFolderImagesText] = useState('');
  const [editMediaFolderDate, setEditMediaFolderDate] = useState('2026-06-21');
  const [editMediaFolderCategory, setEditMediaFolderCategory] = useState<'Classical' | 'Western' | 'Fusion' | 'Production' | 'Jam'>('Classical');
  const [editMediaFolderYear, setEditMediaFolderYear] = useState('2025-26');

  // custom delete dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'user' | 'core_member' | 'achievement' | 'merchandise' | 'media' | 'timetable' | 'db_reset' | 'decline_member';
    id: string;
    name: string;
    extraAction?: () => void;
  } | null>(null);

  // Load all tables
  const loadAllData = async () => {
    setIsFetchingUsers(true);
    try {
      // Pull freshest data from cloud server before populating state
      await dbInstance.fetchLatestFromServer();

      const [pData, perfData, alData, csData] = await Promise.all([
        Promise.resolve(dbInstance.getProfiles()),
        Promise.resolve(dbInstance.getPerformance()),
        Promise.resolve(dbInstance.getAlumni() || []),
        Promise.resolve(dbInstance.getCustomSections() || [])
      ]);
      setProfiles(pData.filter(p => p.role !== 'alumni'));
      setPerformances(perfData);
      setAlumniList(alData);
      setCustomSectionsList(csData);
    } catch {
      onRequestToast('Failed to load database records in parallel.', 'error');
    } finally {
      setTimeout(() => setIsFetchingUsers(false), 300);
    }

    setNotices(dbInstance.getNotices());
    setEvents(dbInstance.getEvents());
    setTimetableList(dbInstance.getTimetable() || []);
    setTargets(dbInstance.getMonthlyTargets());
    setCoreMembersList(dbInstance.getCoreMembers() || []);

    const sContent = dbInstance.getSiteContent() || [];
    const contentMap: Record<string, string> = {};
    sContent.forEach(item => {
      contentMap[item.content_key] = item.content_value;
    });
    setSiteVision(contentMap.our_vision || '');
    setLiveStatusText(contentMap.live_status_text || 'Season Auditions Live');
    setSiteMission(contentMap.our_mission || '');
    setSiteAbout(contentMap.about_malhaar || '');
    setSiteAboutDeveloper(contentMap.about_developer || '');
    setSiteWhyJoin(contentMap.why_join || '');
    setSiteDevName(contentMap.developer_name || '');
    setSiteDevChapter(contentMap.developer_chapter || '');
    setSiteDevPicture(contentMap.developer_picture || '');
    setAchievementsList(dbInstance.getAchievements() || []);
    setMerchandiseList(dbInstance.getMerchandise() || []);
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  useEffect(() => {
    if (activeMonth) {
      setSelectedMandateMonth(activeMonth);
    }
  }, [activeMonth]);

  // Performance Records Map
  const performanceMap: Record<string, Performance> = React.useMemo(() => {
    const map: Record<string, Performance> = {};
    performances.forEach((p) => {
      map[p.user_id] = p;
    });
    return map;
  }, [performances]);

  const realTimeTotal = editAttPoints + editTaskPoints + editContribPoints + editAchPoints;

  // Click card to open edit
  const handleEditUserClick = (u: Profile) => {
    setSelectedUser(u);
    setEditRole(u.role);
    
    // Mandates status prefill
    setEditMandates(u.mandates || {});

    const pRecord = performanceMap[u.id];
    if (pRecord) {
      setEditAttPoints(pRecord.attendance_points);
      setEditTaskPoints(pRecord.task_points);
      setEditContribPoints(pRecord.contribution_points);
      setEditAchPoints(pRecord.achievement_points);
      setEditAttendanceStreak(pRecord.attendance_streak || 0);
      setEditTasksCompleted(pRecord.tasks_completed || 0);
    } else {
      setEditAttPoints(0);
      setEditTaskPoints(0);
      setEditContribPoints(0);
      setEditAchPoints(0);
      setEditAttendanceStreak(0);
      setEditTasksCompleted(0);
    }
  };

  // DIAGNOSTIC RESET DB
  const executeResetDiagnosticDb = () => {
    dbInstance.resetToDefaults();
    onRequestToast("Database restored to pre-seeded default matrices successfully!", "success");
    loadAllData();
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleResetDiagnosticDb = () => {
    setDeleteConfirmation({
      type: 'db_reset',
      id: 'db',
      name: 'All Custom Society Data',
      extraAction: () => executeResetDiagnosticDb()
    });
  };

  const handleExportToExcel = () => {
    try {
      const headers = [
        'Name',
        'Year',
        'Status (President, VP, Coordinator, Members)',
        'Aug 2026 Mandate',
        'Sep 2026 Mandate',
        'Oct 2026 Mandate',
        'Nov 2026 Mandate',
        'Dec 2026 Mandate',
        'Jan 2027 Mandate',
        'Feb 2027 Mandate',
        'Mar 2027 Mandate',
        'Apr 2027 Mandate',
        'Overall points',
        'Number of tasks'
      ];

      const rows = profiles.map(profile => {
        const perf = performances.find(p => p.user_id === profile.id) || {
          attendance_points: 0,
          task_points: 0,
          contribution_points: 0,
          achievement_points: 0,
          total_points: 0,
          attendance_streak: 0,
          tasks_completed: 0
        };

        const escapeCSV = (val: any) => {
          if (val === undefined || val === null) return '""';
          let str = String(val).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
          return `"${str}"`;
        };

        const getRoleString = (role: string) => {
          if (role === 'president') return 'President';
          if (role === 'vp') return 'VP';
          if (role === 'core') return 'Coordinator'; // 'core' maps to Coordinator
          return 'Members';
        };

        return [
          escapeCSV(profile.name),
          escapeCSV(profile.year),
          escapeCSV(getRoleString(profile.role)),
          escapeCSV(profile.mandates?.August || 'N/A'),
          escapeCSV(profile.mandates?.September || 'N/A'),
          escapeCSV(profile.mandates?.October || 'N/A'),
          escapeCSV(profile.mandates?.November || 'N/A'),
          escapeCSV(profile.mandates?.December || 'N/A'),
          escapeCSV(profile.mandates?.January || 'N/A'),
          escapeCSV(profile.mandates?.February || 'N/A'),
          escapeCSV(profile.mandates?.March || 'N/A'),
          escapeCSV(profile.mandates?.April || 'N/A'),
          escapeCSV(perf.total_points),
          escapeCSV(perf.tasks_completed)
        ];
      });

      const csvContent = "\ufeff" + [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `malhaar_society_roster_excel_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onRequestToast("Excel / CSV roster data exported successfully!", "success");
    } catch (error: any) {
      console.error(error);
      onRequestToast("Failed to generate Excel export: " + error.message, "error");
    }
  };

  const handleExportMandatesCSV = () => {
    try {
      const headers = [
        'Name',
        'Role',
        'Domain',
        'August Mandate',
        'September Mandate',
        'October Mandate',
        'November Mandate',
        'December Mandate',
        'January Mandate',
        'February Mandate',
        'March Mandate',
        'April Mandate',
        'Consecutive Missed Months'
      ];

      const months = ['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'];

      const rows = profiles.filter(p => p.approved && p.role === 'member').map(p => {
        let maxStreak = 0;
        let currentStreak = 0;
        months.forEach(month => {
          const status = p.mandates?.[month] || 'pending';
          if (status === 'crossed') {
            currentStreak++;
            if (currentStreak > maxStreak) {
              maxStreak = currentStreak;
            }
          } else {
            currentStreak = 0;
          }
        });

        const escapeCSV = (val: any) => {
          if (val === undefined || val === null) return '""';
          let str = String(val).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
          return `"${str}"`;
        };

        const getStatusLabel = (val: string) => {
          if (val === 'given') return 'Paid';
          if (val === 'crossed') return 'Missed/Crossed';
          return 'Pending';
        };

        return [
          escapeCSV(p.name),
          escapeCSV(p.role),
          escapeCSV(p.domain),
          escapeCSV(getStatusLabel(p.mandates?.August || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.September || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.October || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.November || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.December || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.January || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.February || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.March || 'pending')),
          escapeCSV(getStatusLabel(p.mandates?.April || 'pending')),
          escapeCSV(maxStreak)
        ];
      });

      const csvContent = "\ufeff" + [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `malhaar_mandates_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onRequestToast("Mandates ledger exported successfully!", "success");
    } catch (error: any) {
      console.error(error);
      onRequestToast("Failed to generate Mandates CSV: " + error.message, "error");
    }
  };

  const handleExportTasksCSV = () => {
    try {
      const headers = [
        'Task ID',
        'Task Title',
        'Assigned Student Member',
        'Due Date',
        'Status',
        'Progress %',
        'Task Specifications'
      ];

      const rows = targets.map(t => {
        const escapeCSV = (val: any) => {
          if (val === undefined || val === null) return '""';
          let str = String(val).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
          return `"${str}"`;
        };

        return [
          escapeCSV(t.id),
          escapeCSV(t.title),
          escapeCSV(t.assigned_to),
          escapeCSV(t.due_date),
          escapeCSV(t.status),
          escapeCSV(`${t.progress || 0}%`),
          escapeCSV(t.description || '')
        ];
      });

      const csvContent = "\ufeff" + [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `malhaar_tasks_dispatch_queue_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onRequestToast("Tasks queue CSV exported successfully!", "success");
    } catch (error: any) {
      console.error(error);
      onRequestToast("Failed to generate Tasks CSV: " + error.message, "error");
    }
  };

  const handleExportSettingsCSV = () => {
    try {
      const headers = [
        'Name',
        'Role',
        'Year',
        'Bio',
        'Course',
        'Points',
        'Leader Ranking'
      ];

      const profilesWithPoints = profiles.map(p => {
        const perf = performances.find(pf => pf.user_id === p.id);
        const points = perf ? (perf.total_points || 0) : 0;
        return {
          profile: p,
          points
        };
      });

      const sortedByPoints = [...profilesWithPoints].sort((a, b) => b.points - a.points);

      const rankMap: Record<string, number> = {};
      sortedByPoints.forEach((item, index) => {
        rankMap[item.profile.id] = index + 1;
      });

      const rows = profiles.map(p => {
        const perf = performances.find(pf => pf.user_id === p.id);
        const points = perf ? (perf.total_points || 0) : 0;
        const rank = rankMap[p.id] || sortedByPoints.length;

        const escapeCSV = (val: any) => {
          if (val === undefined || val === null) return '""';
          let str = String(val).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
          return `"${str}"`;
        };

        return [
          escapeCSV(p.name),
          escapeCSV(p.role),
          escapeCSV(p.year),
          escapeCSV(p.bio || ''),
          escapeCSV(p.course || 'N/A'),
          escapeCSV(points),
          escapeCSV(rank)
        ];
      });

      const csvContent = "\ufeff" + [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `malhaar_settings_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onRequestToast("Settings CSV exported successfully!", "success");
    } catch (error: any) {
      console.error(error);
      onRequestToast("Failed to generate Settings CSV: " + error.message, "error");
    }
  };

  // Signups acceptance approval
  const handleAcceptMember = (id: string, name: string) => {
    const updated = profiles.map(p => {
      if (p.id === id) return { ...p, approved: true };
      return p;
    });
    dbInstance.saveProfiles(updated);
    setProfiles(updated);
    setCoreMembersList(dbInstance.getCoreMembers() || []);
    onRequestToast(`New registration for ${name} successfully approved and activated!`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const executeDeclineMember = (id: string, name: string) => {
    const updated = profiles.filter(p => p.id !== id);
    dbInstance.saveProfiles(updated);
    setProfiles(updated);
    setCoreMembersList(dbInstance.getCoreMembers() || []);
    onRequestToast(`Enrollment request for ${name} has been declined.`, 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeclineMember = (id: string, name: string) => {
    setDeleteConfirmation({
      type: 'decline_member',
      id: id,
      name: name,
      extraAction: () => executeDeclineMember(id, name)
    });
  };

  // Save changes inside dialog (Points + Role + Mandates)
  const handleSaveModalRecord = () => {
    if (!selectedUser) return;
    setIsSavingRole(true);

    setTimeout(() => {
      // 1. Save Profiles (Role + Mandate checklist values)
      const updatedProfiles = profiles.map(p => {
        if (p.id === selectedUser.id) {
          const isCoreOrExec = editRole === 'core' || editRole === 'central_core' || editRole === 'admin' || editRole === 'president' || editRole === 'alumni';
          return {
            ...p,
            role: editRole,
            approved: isCoreOrExec ? true : p.approved,
            mandates: editMandates
          };
        }
        return p;
      });
      dbInstance.saveProfiles(updatedProfiles);
      setProfiles(updatedProfiles);

      // 2. Save Performance points
      const isLeadership = editRole === 'president' || editRole === 'central_core' || editRole === 'admin' || editRole === 'core' || editRole === 'alumni';
      const actualAtt = isLeadership ? 0 : editAttPoints;
      const actualTask = isLeadership ? 0 : editTaskPoints;
      const actualCont = isLeadership ? 0 : editContribPoints;
      const actualAch = isLeadership ? 0 : editAchPoints;
      const actualTotal = isLeadership ? 1000 : (actualAtt + actualTask + actualCont + actualAch); // Non-points leadership can enjoy default baseline or 0
      const actualStreak = isLeadership ? 0 : editAttendanceStreak;
      const actualTasksComp = isLeadership ? 0 : editTasksCompleted;

      const updatedPerformance = performances.map(p => {
        if (p.user_id === selectedUser.id) {
          return {
            ...p,
            attendance_points: actualAtt,
            task_points: actualTask,
            contribution_points: actualCont,
            achievement_points: actualAch,
            total_points: actualTotal,
            attendance_streak: actualStreak,
            tasks_completed: actualTasksComp
          };
        }
        return p;
      });

      const exists = performances.find(p => p.user_id === selectedUser.id);
      if (!exists) {
        updatedPerformance.push({
          user_id: selectedUser.id,
          attendance_points: actualAtt,
          task_points: actualTask,
          contribution_points: actualCont,
          achievement_points: actualAch,
          total_points: actualTotal,
          attendance_streak: actualStreak,
          tasks_completed: actualTasksComp
        });
      }

      dbInstance.savePerformance(updatedPerformance);
      setPerformances(updatedPerformance);
      setCoreMembersList(dbInstance.getCoreMembers() || []);

      setIsSavingRole(false);
      setSelectedUser(null);
      onRequestToast(`Standing record for ${selectedUser.name} modified successfully!`, 'success');
      if (onRefreshTrigger) onRefreshTrigger();
    }, 400);
  };

  const executeDeleteUser = (targetId: string, name: string) => {
    const filteredProfs = profiles.filter(p => p.id !== targetId);
    const filteredPerfs = performances.filter(p => p.user_id !== targetId);
    
    dbInstance.saveProfiles(filteredProfs);
    dbInstance.savePerformance(filteredPerfs);
    setProfiles(filteredProfs);
    setPerformances(filteredPerfs);
    setCoreMembersList(dbInstance.getCoreMembers() || []);

    onRequestToast(`User account "${name}" removed from registers successfully.`, 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Delete profile
  const handleDeleteUser = (targetId: string, name: string) => {
    if (targetId === currentUser.id) {
       onRequestToast('Action denied: Leadership accounts cannot self-delete.', 'error');
       return;
    }
    const targetUser = profiles.find(p => p.id === targetId);
    if (targetUser && (targetUser.role === 'president' || targetUser.role === 'admin')) {
       onRequestToast('Action denied: President and Admin accounts cannot be deleted.', 'error');
       return;
    }
    setDeleteConfirmation({
      type: 'user',
      id: targetId,
      name: name,
      extraAction: () => executeDeleteUser(targetId, name)
    });
  };

  // Direct fast streak update
  const handleUpdateStreak = (userId: string, newStreak: number) => {
    const safeStreak = Math.max(0, newStreak);
    const updatedPerfs = performances.map(p => {
      if (p.user_id === userId) {
        return { ...p, attendance_streak: safeStreak };
      }
      return p;
    });
    const exists = performances.find(p => p.user_id === userId);
    if (!exists) {
      updatedPerfs.push({
        user_id: userId,
        attendance_streak: safeStreak,
        tasks_completed: 0,
        attendance_points: 0,
        task_points: 0,
        contribution_points: 0,
        achievement_points: 0,
        total_points: 0
      });
    }
    dbInstance.savePerformance(updatedPerfs);
    setPerformances(updatedPerfs);
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Direct fast finished tasks tick update
  const handleUpdateTasksCompleted = (userId: string, newTasks: number) => {
    const safeTasks = Math.max(0, newTasks);
    const oldPerf = performances.find(p => p.user_id === userId);
    const oldTasks = oldPerf ? (oldPerf.tasks_completed || 0) : 0;
    const deltaTasks = safeTasks - oldTasks;

    const updatedPerfs = performances.map(p => {
      if (p.user_id === userId) {
        const newTaskPoints = Math.max(0, (p.task_points || 0) + deltaTasks * 2);
        const newTotalPoints = Math.max(0, (p.total_points || 0) + deltaTasks * 2);
        return { 
          ...p, 
          tasks_completed: safeTasks,
          task_points: newTaskPoints,
          total_points: newTotalPoints
        };
      }
      return p;
    });
    const exists = performances.find(p => p.user_id === userId);
    if (!exists) {
      updatedPerfs.push({
        user_id: userId,
        attendance_streak: 0,
        tasks_completed: safeTasks,
        attendance_points: 0,
        task_points: safeTasks * 2,
        contribution_points: 0,
        achievement_points: 0,
        total_points: safeTasks * 2
      });
    }
    dbInstance.savePerformance(updatedPerfs);
    setPerformances(updatedPerfs);
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Toggle user mandate directly in list (supports all 12 months with rotation: pending -> given -> crossed)
  const handleToggleMandateStatus = (userId: string, month: string, currentVal: string) => {
    const targetStatus = currentVal === 'given' ? 'crossed' : currentVal === 'crossed' ? 'pending' : 'given';
    
    const updated = profiles.map(p => {
      if (p.id === userId) {
        const mandates = p.mandates || {} as any;
        return {
          ...p,
          mandates: {
            ...mandates,
            [month]: targetStatus
          } as any
        };
      }
      return p;
    });
    dbInstance.saveProfiles(updated);
    setProfiles(updated);

    // Google Calendar integration
    if (targetStatus === 'given') {
      const token = getWorkspaceToken();
      if (token) {
        createCalendarEvent(
          `Mandate Paid: ${profiles.find(p => p.id === userId)?.name}`,
          `Mandate payment for ${month} received.`,
          new Date().toISOString(),
          new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
          false
        ).catch(console.error);
      }
    }

    onRequestToast(`Updated mandate status for ${month} to: ${targetStatus === 'given' ? '✅ Paid' : targetStatus === 'crossed' ? '❌ Crossed' : '⏳ Pending'}`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleSetMandateStatus = (userId: string, month: string, newStatus: 'given' | 'crossed' | 'pending') => {
    const updated = profiles.map(p => {
      if (p.id === userId) {
        const mandates = p.mandates || {} as any;
        return {
          ...p,
          mandates: {
            ...mandates,
            [month]: newStatus
          } as any
        };
      }
      return p;
    });
    dbInstance.saveProfiles(updated);
    setProfiles(updated);
    
    // Google Calendar integration
    if (newStatus === 'given') {
      const token = getWorkspaceToken();
      if (token) {
        createCalendarEvent(
          `Mandate Paid: ${profiles.find(p => p.id === userId)?.name}`,
          `Mandate payment for ${month} received.`,
          new Date().toISOString(),
          new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
          false
        ).catch(console.error);
      }
    }

    onRequestToast(`Updated mandate status for ${month} to: ${newStatus === 'given' ? '✅ Paid' : newStatus === 'crossed' ? '❌ Crossed' : '⏳ Pending'}`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Publish bullet notice
  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      onRequestToast('Please write both title and bulletin content.', 'error');
      return;
    }

    const nId = `notice_${Date.now()}`;
    const newN: Notice = {
      id: nId,
      title: newNoticeTitle,
      content: newNoticeContent,
      posted_by: `${currentUser.name} (${currentUser.role === 'president' ? 'President' : 'Admin'})`,
      posted_at: new Date().toISOString()
    };

    const updated = [newN, ...notices];
    dbInstance.saveNotices(updated);
    setNotices(updated);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    onRequestToast('College Notice bullet bulletin successfully published!', 'success');
  };

  const handleDeleteNotice = (id: string) => {
    const updated = notices.filter(n => n.id !== id);
    dbInstance.saveNotices(updated);
    setNotices(updated);
    onRequestToast('Notice removed from files.', 'info');
  };

  // Add event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaFolderName.trim() || !newMediaFolderDesc.trim()) {
      onRequestToast('Fields cannot be empty', 'error');
      return;
    }
    const eId = `event_${Date.now()}`;
    const newE: ClubEvent = {
      id: eId,
      name: newMediaFolderName,
      description: newMediaFolderDesc,
      category: newMediaFolderCategory,
      event_date: newMediaFolderDate,
      image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400",
      year: newMediaFolderDate.split('-')[0] || '2026',
      drive_link: newMediaFolderDriveLink
    };

    const updated = [newE, ...events];
    dbInstance.saveEvents(updated);
    setEvents(updated);
    setNewMediaFolderName('');
    setNewMediaFolderDesc('');
    setNewMediaFolderDriveLink('');
    onRequestToast('Event successfully added to gallery!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    dbInstance.saveEvents(updated);
    setEvents(updated);
    onRequestToast('Gallery recital listing removed.', 'info');
  };

  // Timetable Handlers
  const getNextDateForWeekday = (weekdayName: string): string => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetIndex = weekdays.indexOf(weekdayName);
    if (targetIndex === -1) return new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentIndex = now.getDay();
    let daysToAdd = targetIndex - currentIndex;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + daysToAdd);
    return targetDate.toISOString().split('T')[0];
  };

  const handleAddTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeTitle.trim()) {
      onRequestToast('Timetable title is required', 'error');
      return;
    }

    let assignedVal = 'All';
    if (timetableAssignType === 'Individual') {
      if (selectedTimetableMembers.length === 0) {
        onRequestToast('Please select at least one individual member or choose a group target.', 'error');
        return;
      }
      assignedVal = selectedTimetableMembers.join(', ');
    } else {
      assignedVal = timetableAssignType;
    }

    const tId = `time_${Date.now()}`;
    const newT: TimetableEntry = {
      id: tId,
      title: newTimeTitle,
      description: newTimeDesc,
      event_type: newTimeType,
      start_time: newTimeStart,
      end_time: newTimeEnd,
      day_of_week: newTimeDay,
      assigned_to: assignedVal,
      google_meet_url: newTimeGoogleMeet ? (newTimeGoogleMeetUrl.trim() || 'https://meet.google.com/furo-2010-mal') : undefined
    };

    const updated = [newT, ...timetableList];
    dbInstance.saveTimetable(updated);
    setTimetableList(updated);
    setNewTimeTitle('');
    setNewTimeDesc('');
    setNewTimeAssignedTo('All');
    setTimetableAssignType('All');
    setSelectedTimetableMembers([]);
    setNewTimeGoogleMeet(false);
    setNewTimeGoogleMeetUrl('');

    // Always sync with Google Calendar for Admin, President, and Core team if Google Account is linked
    const token = getWorkspaceToken();
    if (token) {
      const targetDateStr = newTimeDay.includes('-') ? newTimeDay : getNextDateForWeekday(newTimeDay);
      const startTimeStr = `${targetDateStr}T${newTimeStart}:00`;
      const endTimeStr = `${targetDateStr}T${newTimeEnd}:00`;
      
      createCalendarEvent(
        newT.title,
        `Malhaar Rehearsal Pattern: ${newT.description || 'Practice session'}\nTarget Audience: ${newT.assigned_to}`,
        startTimeStr,
        endTimeStr,
        true
      ).then(() => {
        onRequestToast(`Successfully added locally and synced "${newT.title}" to Google Calendar!`, 'success');
      }).catch((err: any) => {
        console.error("Auto Google Sync failed:", err);
        onRequestToast(`Google Sync warning: ${err.message || err}`, 'info');
      });
    } else {
      onRequestToast('Practice timetable slot successfully added locally! (Note: Google Calendar sync was skipped because Google Account is not connected).', 'info');
    }

    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteTimetable = (id: string) => {
    const updated = timetableList.filter(t => t.id !== id);
    dbInstance.saveTimetable(updated);
    setTimetableList(updated);
    onRequestToast('Timetable slot removed successfully.', 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Dispatch monthly targets
  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargTitle.trim() || !newTargAssign) {
      onRequestToast('Target title and assignment are mandatory.', 'error');
      return;
    }
    const targId = `targ_${Date.now()}`;
    const newT: MonthlyTarget = {
      id: targId,
      title: newTargTitle,
      description: newTargDesc,
      assigned_to: newTargAssign,
      status: 'pending',
      progress: 0,
      due_date: newTargDate
    };
    const updated = [...targets, newT];
    dbInstance.saveMonthlyTargets(updated);
    setTargets(updated);
    setNewTargTitle('');
    setNewTargDesc('');
    setNewTargAssign('');
    onRequestToast('Target successfully dispatched and written to database!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteTarget = (id: string) => {
    const updated = targets.filter(t => t.id !== id);
    dbInstance.saveMonthlyTargets(updated);
    setTargets(updated);
    onRequestToast('Assigned target removed.', 'info');
  };

  const handleToggleTargetStatus = (id: string) => {
    const updated = targets.map(t => {
      if (t.id === id) {
        const nextStatus = (t.status === 'completed' ? 'pending' : 'completed') as 'pending' | 'in-progress' | 'completed';
        const nextProgress = nextStatus === 'completed' ? 100 : 0;
        return { ...t, status: nextStatus, progress: nextProgress };
      }
      return t;
    });
    dbInstance.saveMonthlyTargets(updated);
    setTargets(updated);
    onRequestToast('Target progress status updated successfully!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Alumni CMS CRUD
  const handleCreateAlumni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlumniName.trim() || !newAlumniRoleCode.trim()) {
      onRequestToast('Name and historical role are required.', 'error');
      return;
    }
    const newAl: Alumni = {
      id: `al_${Date.now()}`,
      name: newAlumniName,
      role_held: newAlumniRoleCode,
      graduation_year: newAlumniYear,
      bio: newAlumniBio || "Outstanding contribution to the classic core halls of Malhaar.",
      image_url: newAlumniImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
    };

    const currentAl = dbInstance.getAlumni() || [];
    const updated = [newAl, ...currentAl];
    dbInstance.saveAlumni(updated);
    setAlumniList(updated);
    setNewAlumniName('');
    setNewAlumniRoleCode('');
    setNewAlumniBio('');
    setNewAlumniImage('');
    onRequestToast(`New legacy member "${newAlumniName}" added to the Illuminous section!`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteAlumni = (id: string) => {
    const currentAl = dbInstance.getAlumni() || [];
    const updated = currentAl.filter(a => a.id !== id);
    dbInstance.saveAlumni(updated);
    setAlumniList(updated);
    onRequestToast(`Alumni profile removed from CMS files.`, 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleAlumniImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageBase64(file).then(base64 => {
        setNewAlumniImage(base64);
        onRequestToast('Success: Alumni legacy picture parsed and optimized!', 'success');
      });
    }
  };

  const handleCoreImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageBase64(file).then(base64 => {
        setNewCoreImg(base64);
        onRequestToast('Success: Picture parsed and optimized from gallery!', 'success');
      });
    }
  };

  const handleEditCoreImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageBase64(file).then(base64 => {
        setEditCoreImg(base64);
        onRequestToast('Success: Selected picture parsed and optimized for editing!', 'success');
      });
    }
  };

  // Core Members CMS CRUD
  const handleCreateCoreMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoreName.trim() || !newCoreRole.trim()) {
      onRequestToast('Name and domain role are required.', 'error');
      return;
    }
    const newMember: CoreMember = {
      id: `core_${Date.now()}`,
      name: newCoreName,
      role: newCoreRole,
      position: newCorePosition || 'Associate Lead',
      tenure: newCoreTenure || '2024 - Present',
      year: newCoreYear,
      image_url: newCoreImg || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      description: newCoreDesc || "Enthusiastic leader and coordinator of our weekly classical and global sessions.",
      phone_number: newCorePhone || '',
      tenure_year: newCoreTenureYear || '2026'
    };

    const currentCore = dbInstance.getCoreMembers() || [];
    const updated = [newMember, ...currentCore];
    dbInstance.saveCoreMembers(updated);
    setCoreMembersList(updated);
    
    // Reset inputs
    setNewCoreName('');
    setNewCoreRole('');
    setNewCorePosition('');
    setNewCoreTenure('2024-25');
    setNewCoreYear('1st');
    setNewCoreImg('');
    setNewCoreDesc('');
    setNewCorePhone('');
    setNewCoreTenureYear('2026');

    onRequestToast(`New core leader "${newCoreName}" successfully registered to directory!`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleStartEditCore = (member: CoreMember) => {
    setSelectedCore(member);
    setEditCoreName(member.name);
    setEditCoreRole(member.role);
    setEditCorePosition(member.position);
    setEditCoreTenure(member.tenure);
    setEditCoreYear(member.year);
    setEditCoreImg(member.image_url);
    setEditCoreDesc(member.description);
    setEditCorePhone(member.phone_number || '');
    setEditCoreTenureYear(member.tenure_year || '2026');
  };

  const handleSaveEditCore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCore) return;
    if (!editCoreName.trim() || !editCoreRole.trim()) {
      onRequestToast('Name and domain role cannot be blank.', 'error');
      return;
    }

    const updatedMember: CoreMember = {
      ...selectedCore,
      name: editCoreName,
      role: editCoreRole,
      position: editCorePosition,
      tenure: editCoreTenure,
      year: editCoreYear,
      image_url: editCoreImg,
      description: editCoreDesc,
      phone_number: editCorePhone,
      tenure_year: editCoreTenureYear
    };

    const currentCore = dbInstance.getCoreMembers() || [];
    const updated = currentCore.map(m => m.id === selectedCore.id ? updatedMember : m);
    dbInstance.saveCoreMembers(updated);
    setCoreMembersList(updated);
    setSelectedCore(null);
    onRequestToast(`Core profile for "${editCoreName}" updated and saved successfully!`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const executeDeleteCoreMember = (id: string, name: string) => {
    const currentCore = dbInstance.getCoreMembers() || [];
    const updated = currentCore.filter(m => m.id !== id);
    dbInstance.saveCoreMembers(updated);
    setCoreMembersList(updated);
    onRequestToast(`Core team member removed from database registry.`, 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteCoreMember = (id: string, name: string) => {
    setDeleteConfirmation({
      type: 'core_member',
      id: id,
      name: name,
      extraAction: () => executeDeleteCoreMember(id, name)
    });
  };

  const handleToggleStarCoreMember = (id: string) => {
    const currentCore = dbInstance.getCoreMembers() || [];
    const updated = currentCore.map(m => {
      if (m.id === id) {
        return {
          ...m,
          is_starred: m.is_starred ? false : true
        };
      }
      return m;
    });
    dbInstance.saveCoreMembers(updated);
    setCoreMembersList(updated);
    onRequestToast('Starred status toggled successfully!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Custom CMS Segments CRUD
  const handleCreateCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecTitle.trim() || !newSecContent.trim()) {
      onRequestToast('Section title and content cannot be blank.', 'error');
      return;
    }

    const newSec: CustomSection = {
      id: `sec_${Date.now()}`,
      title: newSecTitle,
      content: newSecContent,
      created_at: new Date().toISOString().split('T')[0],
      active: true,
      image_url: newSecImage || undefined,
      drive_link: newSecDriveLink || undefined,
      meet_link: newSecMeetLink || undefined,
      form_link: newSecFormLink || undefined
    };

    const currentSecs = dbInstance.getCustomSections() || [];
    const updated = [newSec, ...currentSecs];
    dbInstance.saveCustomSections(updated);
    setCustomSectionsList(updated);
    setNewSecTitle('');
    setNewSecContent('');
    setNewSecImage('');
    setNewSecDriveLink('');
    setNewSecMeetLink('');
    setNewSecFormLink('');

    onRequestToast(`Custom section "${newSecTitle}" created! It now displays directly on the home dashboard blocks.`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleEditCustomSection = (s: CustomSection) => {
    setSelectedSec(s);
    setEditSecTitle(s.title);
    setEditSecContent(s.content);
    setEditSecImage(s.image_url || '');
    setEditSecDriveLink(s.drive_link || '');
    setEditSecMeetLink(s.meet_link || '');
    setEditSecFormLink(s.form_link || '');
  };

  const handleUpdateCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSec) return;
    if (!editSecTitle.trim() || !editSecContent.trim()) {
      onRequestToast('Section title and content cannot be blank.', 'error');
      return;
    }

    const currentSecs = dbInstance.getCustomSections() || [];
    const updated = currentSecs.map(s => {
      if (s.id === selectedSec.id) {
        return {
          ...s,
          title: editSecTitle,
          content: editSecContent,
          image_url: editSecImage || undefined,
          drive_link: editSecDriveLink || undefined,
          meet_link: editSecMeetLink || undefined,
          form_link: editSecFormLink || undefined
        };
      }
      return s;
    });

    dbInstance.saveCustomSections(updated);
    setCustomSectionsList(updated);
    setSelectedSec(null);
    setEditSecTitle('');
    setEditSecContent('');
    setEditSecImage('');
    setEditSecDriveLink('');
    setEditSecMeetLink('');
    setEditSecFormLink('');

    onRequestToast('Custom lobby segment updated successfully!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteCustomSection = (id: string) => {
    const currentSecs = dbInstance.getCustomSections() || [];
    const updated = currentSecs.filter(s => s.id !== id);
    dbInstance.saveCustomSections(updated);
    setCustomSectionsList(updated);
    if (selectedSec?.id === id) {
      setSelectedSec(null);
    }
    onRequestToast('Custom segment deleted.', 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleUpdateLiveMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const current = dbInstance.getSiteContent() || [];
    const updated = current.filter(x => x.content_key !== 'live_status_text');
    updated.push({ content_key: 'live_status_text', content_value: liveStatusText });
    dbInstance.saveSiteContent(updated);
    onRequestToast('Live broadcast headers updated! All members will see this status instantly.', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Vision Statement & Achievements CMS handlers
  const handleSaveSiteVisionMissionAbout = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedContent = [
      { content_key: 'our_vision', content_value: siteVision },
      { content_key: 'live_status_text', content_value: liveStatusText },
      { content_key: 'our_mission', content_value: siteMission },
      { content_key: 'about_malhaar', content_value: siteAbout },
      { content_key: 'about_developer', content_value: siteAboutDeveloper },
      { content_key: 'why_join', content_value: siteWhyJoin },
      { content_key: 'developer_name', content_value: siteDevName },
      { content_key: 'developer_chapter', content_value: siteDevChapter },
      { content_key: 'developer_picture', content_value: siteDevPicture },
      { content_key: 'our_history', content_value: dbInstance.getSiteContent().find(x => x.content_key === 'our_history')?.content_value || 'Founded in 2010...' }
    ];
    dbInstance.saveSiteContent(updatedContent);
    onRequestToast('Site Core Vision, Mission, About, Developer and Why You Parameters updated successfully!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleCreateAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchTitle.trim() || !newAchDesc.trim()) {
      onRequestToast('Achievement title and description cannot be blank.', 'error');
      return;
    }
    const newAch: Achievement = {
      id: `ach_${Date.now()}`,
      year: newAchYear,
      title: newAchTitle,
      description: newAchDesc,
      image_url: newAchImg || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400'
    };
    const currentAchs = dbInstance.getAchievements() || [];
    const updated = [newAch, ...currentAchs];
    dbInstance.saveAchievements(updated);
    setAchievementsList(updated);
    setNewAchTitle('');
    setNewAchDesc('');
    setNewAchImg('');
    onRequestToast(`Achievement "${newAchTitle}" added successfully!`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteAchievement = (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this achievement medal?');
    if (!confirm) return;
    const currentAchs = dbInstance.getAchievements() || [];
    const updated = currentAchs.filter(a => a.id !== id);
    dbInstance.saveAchievements(updated);
    setAchievementsList(updated);
    onRequestToast('Achievement medal removed.', 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleStartEditAchievement = (ach: Achievement) => {
    setSelectedAch(ach);
    setEditAchYear(ach.year);
    setEditAchTitle(ach.title);
    setEditAchDesc(ach.description);
    setEditAchImg(ach.image_url);
  };

  const handleSaveEditAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAch) return;
    const currentAchs = dbInstance.getAchievements() || [];
    const updated = currentAchs.map(a => {
      if (a.id === selectedAch.id) {
        return {
          ...a,
          year: editAchYear,
          title: editAchTitle,
          description: editAchDesc,
          image_url: editAchImg
        };
      }
      return a;
    });
    dbInstance.saveAchievements(updated);
    setAchievementsList(updated);
    setSelectedAch(null);
    onRequestToast('Achievement updated successfully!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Merchandise CMS CRUD Handlers
  const handleCreateMerchandise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchItemName.trim() || !newMerchDescription.trim()) {
      onRequestToast('Merchandise name and description are required.', 'error');
      return;
    }
    const priceNum = parseFloat(newMerchPrice) || 0;
    const newMerch: Merchandise = {
      id: `merch_${Date.now()}`,
      year: newMerchYear,
      item_name: newMerchItemName,
      description: newMerchDescription,
      price: priceNum,
      image_url: newMerchImageUrl || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400'
    };
    const currentMerch = dbInstance.getMerchandise() || [];
    const updated = [newMerch, ...currentMerch];
    dbInstance.saveMerchandise(updated);
    setMerchandiseList(updated);
    setNewMerchItemName('');
    setNewMerchDescription('');
    setNewMerchPrice('15');
    setNewMerchImageUrl('');
    onRequestToast(`Merchandise item "${newMerchItemName}" added successfully!`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteMerchandise = (id: string) => {
    const confirm = window.confirm('Are you sure you want to permanently delete this merchandise item?');
    if (!confirm) return;
    const currentMerch = dbInstance.getMerchandise() || [];
    const updated = currentMerch.filter(m => m.id !== id);
    dbInstance.saveMerchandise(updated);
    setMerchandiseList(updated);
    onRequestToast('Merchandise item removed.', 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleStartEditMerchandise = (merch: Merchandise) => {
    setSelectedMerch(merch);
    setEditMerchYear(merch.year);
    setEditMerchItemName(merch.item_name);
    setEditMerchDescription(merch.description);
    setEditMerchPrice(String(merch.price || 0));
    setEditMerchImageUrl(merch.image_url);
  };

  const handleSaveEditMerchandise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerch) return;
    const priceNum = parseFloat(editMerchPrice) || 0;
    const currentMerch = dbInstance.getMerchandise() || [];
    const updated = currentMerch.map(m => {
      if (m.id === selectedMerch.id) {
        return {
          ...m,
          year: editMerchYear,
          item_name: editMerchItemName,
          description: editMerchDescription,
          price: priceNum,
          image_url: editMerchImageUrl
        };
      }
      return m;
    });
    dbInstance.saveMerchandise(updated);
    setMerchandiseList(updated);
    setSelectedMerch(null);
    onRequestToast('Merchandise item updated successfully!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Media Event-Linked CMS Handlers (Updates ClubEvents on Dashboard directly!)
  const handleMediaEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageBase64(file).then(base64 => {
        setNewMediaFolderImagesText(base64);
        onRequestToast('Success: Snapshot parsed and optimized!', 'success');
      });
    }
  };

  const handleEditMediaEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageBase64(file).then(base64 => {
        setEditMediaFolderImagesText(base64);
        onRequestToast('Success: Snapshot parsed and optimized for editing!', 'success');
      });
    }
  };

  const handleCreateMediaFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaFolderName.trim()) {
      onRequestToast('Event Title is required.', 'error');
      return;
    }
    const newEvent: ClubEvent = {
      id: `event_${Date.now()}`,
      name: newMediaFolderName,
      description: newMediaFolderDesc || 'A special highlight and memory catalog.',
      event_date: newMediaFolderDate || '2026-06-21',
      category: newMediaFolderCategory || 'Classical',
      image_url: newMediaFolderImagesText || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400',
      drive_link: newMediaFolderDriveLink || '',
      year: newMediaFolderYear || '2025-26'
    };

    const currentEvents = dbInstance.getEvents() || [];
    const updated = [newEvent, ...currentEvents];
    dbInstance.saveEvents(updated);
    setEvents(updated);
    
    // reset
    setNewMediaFolderName('');
    setNewMediaFolderDesc('');
    setNewMediaFolderDriveLink('');
    setNewMediaFolderImagesText('');
    setNewMediaFolderDate('2026-06-21');
    setNewMediaFolderCategory('Classical');
    setNewMediaFolderYear('2025-26');

    onRequestToast(`Memory Album "${newEvent.name}" published & synchronized with dashboard!`, 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteMediaFolder = (id: string) => {
    const confirm = window.confirm('Are you sure you want to permanently delete this media album?');
    if (!confirm) return;
    const currentEvents = dbInstance.getEvents() || [];
    const updated = currentEvents.filter(e => e.id !== id);
    dbInstance.saveEvents(updated);
    setEvents(updated);
    onRequestToast('Event media album deleted.', 'info');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleStartEditMediaFolder = (item: ClubEvent) => {
    setSelectedMediaFolder(item);
    setEditMediaFolderName(item.name);
    setEditMediaFolderDesc(item.description);
    setEditMediaFolderDriveLink(item.drive_link || '');
    setEditMediaFolderImagesText(item.image_url || '');
    setEditMediaFolderDate(item.event_date || '2026-06-21');
    setEditMediaFolderCategory(item.category || 'Classical');
    setEditMediaFolderYear(item.year || '2025-26');
  };

  const handleSaveEditMediaFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMediaFolder) return;

    const currentEvents = dbInstance.getEvents() || [];
    const updated = currentEvents.map(item => {
      if (item.id === selectedMediaFolder.id) {
        return {
          ...item,
          name: editMediaFolderName,
          description: editMediaFolderDesc,
          image_url: editMediaFolderImagesText || item.image_url,
          drive_link: editMediaFolderDriveLink,
          event_date: editMediaFolderDate,
          category: editMediaFolderCategory,
          year: editMediaFolderYear
        };
      }
      return item;
    });

    dbInstance.saveEvents(updated);
    setEvents(updated);
    setSelectedMediaFolder(null);
    onRequestToast('Media album updated dynamically!', 'success');
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Searching filter
  const filteredProfiles = profiles.filter(u => {
    const term = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const pendingApprovals = profiles.filter(p => !p.approved);
  const activeMembersOnly = profiles.filter(p => p.approved && p.role === 'member');

  return (
    <div className="space-y-8 animate-fade-in pb-16 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* ====== HEADER DIAGNOSTICS CONTROL PANEL ====== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-5 gap-4 text-left">
        <div>
          <h1 className="text-3xl font-serif text-[#ECE6E1]">Admin <span className="text-[#D98353]">Cabinet Desk</span></h1>
          <p className="text-xs text-[#AC9E94] mt-1">Accept registrations, toggle mandates, edit core performance indexes, and configure custom segments.</p>
        </div>
      </div>

      {/* ====== TABS SELECTOR ====== */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedUser(null);
            }}
            className={`px-4.5 py-2.5 text-xs font-bold tracking-wider rounded-xl uppercase shrink-0 transition-all duration-300 cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black font-extrabold shadow-[0_0_15px_rgba(217,131,83,0.3)]' 
                : 'bg-white/[0.02] hover:bg-white/[0.06] text-[#AC9E94] hover:text-[#ECE6E1] border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== ACTIVE TAB RENDERING ====== */}

      {/* ====== Tab 1: Users & Live Registrant Approvals ====== */}
      {activeTab === 'users' && (
        <div className="space-y-8 text-left">
          
          {/* Gated New Approvals Section */}
          <div className="bg-gradient-to-br from-[#1C0F0B] to-black/35 rounded-2xl p-6 border border-[#4a2618]/30">
            <h3 className="font-serif text-lg font-bold text-amber-500 flex items-center gap-2">
              ⏳ Pending Member Registration Proposals ({pendingApprovals.length})
            </h3>
            <p className="text-xs text-[#AC9E94] mt-1 leading-relaxed">
              These students registered but are currently barred from entering the application. Accept their application to let them login and populate lists.
            </p>

            {pendingApprovals.length === 0 ? (
              <div className="mt-4 p-4 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-xl bg-black/20">
                No new signups are pending administrative approval.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {pendingApprovals.map(approval => (
                  <div key={approval.id} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        {approval.profile_image_url ? (
                          <img src={approval.profile_image_url} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-white/10 bg-[#2A160F] flex items-center justify-center text-xs font-serif font-bold text-[#D98353] shrink-0">
                            {approval.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <strong className="text-sm font-semibold text-white block">{approval.name}</strong>
                          <span className="text-[10px] font-mono text-[#D98353]">{approval.email}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 font-mono text-[9px] uppercase font-bold">
                        <span className="bg-stone-800 text-[#AC9E94] px-2 py-0.5 rounded">{approval.domain}</span>
                        <span className="bg-stone-800 text-zinc-300 px-2 py-0.5 rounded">{approval.year} Year</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 mt-2">
                      <button
                        onClick={() => handleAcceptMember(approval.id, approval.name)}
                        className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-black font-extrabold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => handleDeclineMember(approval.id, approval.name)}
                        className="py-1.5 bg-black hover:bg-red-950/20 text-red-400 border border-red-900/30 font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Attendance & Ticked Tasks Direct Ledger Desk */}
          <div className="bg-[#120F0D] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#D98353] flex items-center gap-2">
                📝 Society Monthly Tasks Ledger
              </h3>
              <p className="text-xs text-[#AC9E94] mt-1 leading-relaxed">
                Directly tick off completed tasks for active student members. Attendance streaks and points are automatically updated or maintained in their own dedicated views.
              </p>
            </div>

            {isFetchingUsers ? (
              <div className="text-xs text-stone-500 py-5 text-center bg-black/25 rounded-lg border border-white/5 space-y-2">
                <div className="flex justify-center mb-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#D98353] border-t-transparent animate-spin"></div>
                </div>
                <p>Loading members...</p>
              </div>
            ) : profiles.filter(p => p.approved && p.role === 'member').length === 0 ? (
              <div className="text-xs text-stone-500 py-5 text-center bg-black/25 rounded-lg border border-white/5 space-y-2">
                <p>No student members registered yet.</p>
                <p className="text-[10px] text-stone-600">Waiting for standard student members to register.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profiles.filter(p => p.approved && p.role === 'member').map(member => {
                    const perf = performanceMap[member.id] || { attendance_streak: 0, tasks_completed: 0 };
                    const currentStreak = perf.attendance_streak || 0;
                    const currentTasks = perf.tasks_completed || 0;

                    return (
                      <div key={member.id} className="bg-black/30 border border-white/5 hover:border-[#D98353]/30 p-5 rounded-2xl space-y-4 flex flex-col justify-between transition-all">
                        <div className="flex items-center gap-3">
                          {member.profile_image_url ? (
                          <img src={member.profile_image_url} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 bg-[#2A160F] border border-[#D98353]/35 flex items-center justify-center text-xs font-mono font-bold text-[#D98353] rounded-full shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 text-left">
                          <h4 className="text-sm font-bold text-[#ECE6E1] leading-tight truncate">{member.name}</h4>
                          <p className="text-[10px] text-stone-500 font-mono leading-none mt-1 truncate">{member.email}</p>
                          <div className="flex gap-1.5 mt-2">
                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold bg-[#2A160F] text-[#D98353] border border-[#D98353]/20">{member.domain}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold bg-white/5 text-zinc-300">{member.year}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tactile Task Controller: completes */}
                      <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/5 text-left">
                        <span className="block text-[9px] uppercase font-mono tracking-wider text-[#55F2A6] font-bold">📋 Responsible Tasks Streak completed</span>
                        <div className="flex items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateTasksCompleted(member.id, currentTasks - 1)}
                              className="w-7 h-7 rounded-md bg-stone-900 hover:bg-stone-800 border border-white/10 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-center text-xs text-white px-2.5 py-1 bg-black/60 rounded border border-white/5">
                              {currentTasks} completes
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateTasksCompleted(member.id, currentTasks + 1)}
                              className="w-7 h-7 rounded-md bg-stone-900 hover:bg-[#D98353] hover:text-black border border-white/10 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[10px] text-stone-500 font-mono italic">Task completions</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

          {/* Active Members Grid */}
          <div className="space-y-4">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
              <div className="space-y-1 text-left w-full sm:w-auto">
                <h4 className="text-base font-serif font-bold text-white">Roster Directory</h4>
                <p className="text-xs text-[#AC9E94]">Click any profile card to adjust Roles, total Points, and Mandates array.</p>
              </div>

              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 h-10 px-3.5 bg-black/40 border border-white/10 focus:border-[#D98353] text-xs text-[#ECE6E1] rounded-xl focus:outline-none transition-all"
              />
            </div>

            {isFetchingUsers ? (
              <div className="p-12 text-center text-xs text-stone-500 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-[#D98353] border-t-transparent rounded-full animate-spin"></span>
                <span>Loading registered profiles...</span>
              </div>
            ) : filteredProfiles.filter(p => p.approved && p.role !== 'alumni').length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-500 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                No active members found matching "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.filter(p => p.approved && p.role !== 'alumni').map(u => {
                  const myPerf = performanceMap[u.id];
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleEditUserClick(u)}
                      className="bg-white/[0.02] border border-white/10 hover:border-[#D98353] rounded-2xl p-5 shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] relative group"
                    >
                      <div className="absolute top-4 right-4 bg-[#2C1C16] border border-[#D98353]/30 text-[#D98353] font-mono text-xs font-bold px-2.5 rounded-lg py-1">
                        {myPerf ? myPerf.total_points : 0} Pts
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {u.profile_image_url ? (
                            <img src={u.profile_image_url} alt="" className="w-11 h-11 rounded-full object-cover border border-white/15" />
                          ) : (
                            <div className="w-11 h-11 rounded-full border border-white/15 bg-[#2A160F] flex items-center justify-center text-xs font-serif font-bold text-[#D98353] shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h5 className="font-serif text-sm font-bold text-[#ECE6E1] group-hover:text-[#D98353] transition-colors">{u.name}</h5>
                            <p className="text-[10px] text-stone-500 font-mono leading-none mt-1">{u.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#2A160F] text-[#D98353] border border-[#D98353]/30">
                            {u.role === 'admin' ? 'core' : u.role === 'central_core' ? 'central core' : u.role}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#10241A] text-[#55F2A6] border border-[#104D30]">{u.domain}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-white/5 text-zinc-300">{u.year} Year</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-[11px] text-[#AC9E94]">
                        <span>Click to prefill edit form</span>
                        {!(u.role === 'president' || u.role === 'admin') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(u.id, u.name);
                            }}
                            className="text-red-400 hover:text-red-500 hover:underline cursor-pointer uppercase font-mono font-bold text-[9px]"
                          >
                            Purge account
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ====== Registered Alumni Profiles Segment ====== */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="bg-gradient-to-r from-amber-950/15 via-black/20 to-black/35 border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl text-left">
              <div className="space-y-1">
                <h4 className="text-base font-serif font-bold text-[#D98353] flex items-center gap-2">
                  🎓 Registered Alumni Profiles Directory ({profiles.filter(p => p.role === 'alumni').length})
                </h4>
                <p className="text-xs text-[#AC9E94]">Advisors and pass-out batch contacts. Click on an alumni card to manage approval status, role held, or bio details.</p>
              </div>
            </div>

            {isFetchingUsers ? (
              <div className="p-12 text-center text-xs text-stone-500 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-[#D98353] border-t-transparent rounded-full animate-spin"></span>
                <span>Loading alumni profiles...</span>
              </div>
            ) : filteredProfiles.filter(p => p.role === 'alumni').length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                No registered alumni profiles found matching "{searchQuery || 'any filter'}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.filter(p => p.role === 'alumni').map(u => {
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleEditUserClick(u)}
                      className="bg-[#1C120F]/30 border border-white/10 hover:border-[#D98353] rounded-2xl p-5 shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] relative group text-left"
                    >
                      <div className="absolute top-4 right-4">
                        {u.approved ? (
                          <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-[#10241A] text-[#55F2A6] border border-[#104D30]">
                            ✅ Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-amber-950/45 text-amber-400 border border-amber-500/30 animate-pulse">
                            ⏳ Pending
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {u.profile_image_url ? (
                            <img src={u.profile_image_url} alt="" className="w-11 h-11 rounded-full object-cover border border-white/15" />
                          ) : (
                            <div className="w-11 h-11 rounded-full border border-white/15 bg-[#2A160F] flex items-center justify-center text-xs font-serif font-bold text-[#D98353] shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h5 className="font-serif text-sm font-bold text-[#ECE6E1] group-hover:text-[#D98353] transition-colors">{u.name}</h5>
                            <p className="text-[10px] text-stone-500 font-mono leading-none mt-1">{u.email}</p>
                          </div>
                        </div>

                        {u.bio && (
                          <p className="text-[11px] text-stone-400 line-clamp-2 italic pl-1">
                            "{u.bio}"
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-white/5 text-zinc-300">
                            🎓 Alumni Advisor
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#2A160F] text-[#D98353] border border-[#D98353]/30">
                            Batch {u.year}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#10241A] text-[#55F2A6] border border-[#104D30]">
                            {u.domain}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-[11px] text-[#AC9E94]">
                        <span>Click to prefill edit form</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(u.id, u.name);
                          }}
                          className="text-red-400 hover:text-red-500 hover:underline cursor-pointer uppercase font-mono font-bold text-[9px]"
                        >
                          Purge account
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dialog popup for profile standing modifier */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-left">
              <div className="bg-stone-950 border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-5 right-5 text-xs text-[#D98353] border border-[#D98353]/30 px-2 py-1 rounded bg-black/30 cursor-pointer hover:bg-[#D98353] hover:text-black transition-colors"
                >
                  ✕ Close
                </button>

                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xl font-serif text-[#ECE6E1] font-bold">Edit Member Account</h3>
                  <p className="text-xs text-stone-400 mt-1">Adjusting qualifications of <strong>{selectedUser.name}</strong></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase text-stone-400 font-mono font-bold mb-1">Functional Status</label>
                      <select
                        value={editRole}
                        onChange={(e: any) => setEditRole(e.target.value)}
                        className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-[#ECE6E1]"
                      >
                        <option value="member">Member of Society</option>
                        <option value="core">Core Member of Society</option>
                        <option value="central_core">Central Core of Society</option>
                        <option value="president">President of Society</option>
                        <option value="alumni">Alumni of Society</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-stone-400 font-mono font-bold mb-1">Monthly Mandates Matrix</label>
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'].map(m => {
                          const val = editMandates[m] || 'pending';
                          return (
                            <button
                              type="button"
                              key={m}
                              onClick={() => {
                                const newVal = val === 'given' ? 'crossed' : val === 'crossed' ? 'pending' : 'given';
                                setEditMandates({...editMandates, [m]: newVal});
                              }}
                              className={`py-2 rounded-lg text-[9px] font-mono border text-center font-bold uppercase transition-all ${
                                val === 'crossed' 
                                  ? 'bg-red-950/20 border-red-500/50 text-red-400' 
                                  : val === 'given'
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                  : 'bg-black/40 border-stone-800 text-stone-400'
                              }`}
                            >
                              {m}: {val === 'crossed' ? '❌ Missed' : val === 'given' ? '✅ Paid' : '⏳ Pend'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {editRole === 'president' || editRole === 'admin' || editRole === 'core' || editRole === 'central_core' || editRole === 'alumni' ? (
                    <div className="bg-[#2C1C16]/25 border border-[#D98353]/20 p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[160px]">
                      <span className="text-xl">🎓</span>
                      <strong className="text-xs uppercase font-mono tracking-wider text-[#D98353] block">Executive Board / Alumni Advisor</strong>
                      <p className="text-[10px] text-stone-400">Under the Society guidelines, points and task assignments are not tracked for leadership or alumni advisory roles.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                      <h5 className="text-[10px] font-mono text-[#D98353] uppercase font-bold tracking-wider mb-1">Performance Tracking</h5>
                      
                      <div className="grid grid-cols-1 gap-3 text-[10px] font-mono">
                        <div className="bg-black/35 border border-white/5 p-2 rounded-lg">
                          <span className="text-[#AC9E94] block">Tasks Completed (Ticks)</span>
                          <div className="flex items-center gap-2 mt-1">
                            <button 
                              type="button" 
                              onClick={() => setEditTasksCompleted(Math.max(0, editTasksCompleted - 1))}
                              className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-white font-bold flex items-center justify-center cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-white w-8 text-center">{editTasksCompleted}</span>
                            <button 
                              type="button" 
                              onClick={() => setEditTasksCompleted(editTasksCompleted + 1)}
                              className="w-6 h-6 rounded bg-stone-800 hover:bg-[#D98353] hover:text-black font-bold flex items-center justify-center cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[9px] uppercase text-stone-400 font-mono font-bold block mb-1">Evaluations (Points weights for stats)</span>
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                          <div>
                            <span>Attendance Pts</span>
                            <input type="number" value={editAttPoints} onChange={(e) => setEditAttPoints(parseInt(e.target.value) || 0)} className="w-full h-7 bg-black border border-white/10 rounded px-1.5 text-white mt-1 text-center" />
                          </div>
                          <div>
                            <span>Task Pts</span>
                            <input type="number" value={editTaskPoints} onChange={(e) => setEditTaskPoints(parseInt(e.target.value) || 0)} className="w-full h-7 bg-black border border-white/10 rounded px-1.5 text-white mt-1 text-center" />
                          </div>
                          <div>
                            <span>Contrib Pts</span>
                            <input type="number" value={editContribPoints} onChange={(e) => setEditContribPoints(parseInt(e.target.value) || 0)} className="w-full h-7 bg-black border border-white/10 rounded px-1.5 text-white mt-1 text-center" />
                          </div>
                          <div>
                            <span>Champ Pts</span>
                            <input type="number" value={editAchPoints} onChange={(e) => setEditAchPoints(parseInt(e.target.value) || 0)} className="w-full h-7 bg-black border border-white/10 rounded px-1.5 text-white mt-1 text-center" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[11px] font-bold text-white">
                        <span>Total Score standing:</span>
                        <span className="text-[#D98353] font-mono">{realTimeTotal} Pts</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      onRequestToast('Edits cancelled.', 'info');
                    }}
                    className="flex-1 h-11 bg-red-950/20 border border-red-500/30 hover:bg-red-900 text-red-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer inline-flex items-center justify-center font-mono"
                  >
                    ✕ Close & Discard
                  </button>
                  <button
                    onClick={handleSaveModalRecord}
                    disabled={isSavingRole}
                    className="flex-[1.5] h-11 bg-[#D98353] hover:bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer inline-flex items-center justify-center shadow-lg"
                  >
                    {isSavingRole ? 'Syncing...' : '💾 Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ====== Tab 1.5: Dedicated Attendance Board Panel ====== */}
      {activeTab === 'attendance_board' && (
        <div className="space-y-6 text-left animate-fadeIn">
          {/* Header */}
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">📅 Society Attendance Board</h3>
              <p className="text-xs text-[#AC9E94] mt-1 font-mono uppercase tracking-wider">
                Directly increment, decrement, or reset member practice session streaks with real-time feedback
              </p>
            </div>
            
            {/* Quick Metrics */}
            <div className="flex gap-4">
              <div className="bg-black/30 px-4 py-2 rounded-xl text-center border border-white/5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#D98353] font-bold block">Society Streaks</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5">
                  {profiles.filter(p => (p.role === 'member' || p.role === 'core') && p.approved !== false).length} Students
                </span>
              </div>
              <div className="bg-black/30 px-4 py-2 rounded-xl text-center border border-white/5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#E6AF2E] font-bold block">Highly Active (5d+)</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5">
                  {profiles.filter(p => {
                    const pf = performances.find(x => x.user_id === p.id);
                    return pf && pf.attendance_streak >= 5;
                  }).length} Students
                </span>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="🔍 Filter student name, domain, email..."
              value={attendanceSearch}
              onChange={(e) => setAttendanceSearch(e.target.value)}
              className="w-full max-w-md h-10 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all placeholder:text-[#8A766B]"
            />
            {attendanceSearch && (
              <button
                type="button"
                onClick={() => setAttendanceSearch('')}
                className="text-xs text-[#AC9E94] hover:text-[#D98353] underline font-mono cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tactile Roster Cards layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const studentsFiltered = profiles.filter(p => {
                if (p.role === 'admin' || p.role === 'president' || p.role === 'core') return false;
                if (!p.approved) return false;
                const text = (p.name + " " + p.domain + " " + p.email).toLowerCase();
                return text.includes(attendanceSearch.toLowerCase());
              });

              if (studentsFiltered.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-[#AC9E94] font-mono bg-[#120F0D] border border-white/10 rounded-2xl col-span-2">
                    No students match your attendance filters.
                  </div>
                );
              }

              return studentsFiltered.map(student => {
                const perf = performances.find(pf => pf.user_id === student.id) || { attendance_streak: 0 };
                const currentStreak = perf.attendance_streak || 0;

                return (
                  <div key={student.id} className="bg-black/35 border border-white/5 hover:border-[#D98353]/30 p-5 rounded-2xl space-y-4 flex flex-col justify-between transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {student.profile_image_url ? (
                          <img src={student.profile_image_url} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 bg-[#2A160F] border border-[#D98353]/35 flex items-center justify-center text-xs font-mono font-bold text-[#D98353] rounded-full shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 text-left">
                          <h4 className="text-sm font-bold text-[#ECE6E1] leading-tight truncate">{student.name}</h4>
                          <p className="text-[10px] text-stone-500 font-mono leading-none mt-1 truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold bg-[#2A160F] text-[#D98353] border border-[#D98353]/20">
                          {student.domain}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold bg-white/5 text-zinc-300">
                          {student.year} Year
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="block text-[9px] uppercase font-mono tracking-wider text-[#D98353] font-bold">Practice Attendance Streak</span>
                        <span className="font-mono text-xs text-amber-500 font-bold bg-amber-950/20 px-2 py-0.5 rounded">
                          🔥 {currentStreak} days
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateStreak(student.id, currentStreak + 1);
                              onRequestToast(`${student.name}'s attendance marked. Streak set to ${currentStreak + 1} days!`, 'success');
                            }}
                            className="px-3 py-1.5 bg-emerald-950/20 text-[#55F2A6] hover:bg-emerald-900 hover:text-white border border-emerald-500/30 text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer"
                          >
                            Mark Present ✅
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newStreak = Math.max(0, currentStreak - 2);
                              handleUpdateStreak(student.id, newStreak);
                              onRequestToast(`${student.name}'s attendance marked absent. Streak set to ${newStreak} days (2 minus)!`, 'info');
                            }}
                            className="px-3 py-1.5 bg-red-950/20 text-red-400 hover:bg-red-950 hover:text-white border border-red-900/30 text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer"
                          >
                            Mark Absent ❌
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ====== Tab 2: Mandates Ledger Panel ====== */}
      {activeTab === 'mandates' && (
        <div className="space-y-6 text-left">
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">Society Treasury - Mandate Ledger Desk</h3>
              <p className="text-xs text-[#AC9E94] mt-1">Directly toggle Member payments matrix below. Scroll horizontally to manage all 12 months of year 2026. Consecutive crossed months trigger safety administrative warnings.</p>
            </div>
            <button
              type="button"
              onClick={handleExportMandatesCSV}
              className="px-5 h-10 border border-[#D98353]/30 bg-black/30 hover:bg-[#D98353]/10 hover:shadow-[0_0_15px_rgba(217,131,83,0.15)] text-[#D98353] font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              📥 Export Mandates CSV
            </button>
          </div>

          {/* ====== Tactile Month-Centric Square Grid Columns (Admin Easy Quick Setter) ====== */}
          <div className="bg-[#120F0D] border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="border-b border-white/5 pb-3">
              <h4 className="font-serif text-sm font-bold text-[#D98353] uppercase tracking-wider">⚡ Month-by-Month Easy Board Controller</h4>
              <p className="text-[11px] text-[#AC9E94] mt-1">Select a square month card below to rapidly approve, cross, or pend payments for all active members in sequence.</p>
            </div>

            {/* Square Column Month Select Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'].map(month => {
                const isActive = selectedMandateMonth === month;
                // Count current dues paid vs crossed vs pending
                let paidCount = 0;
                let missedCount = 0;
                let pendingCount = 0;
                profiles.filter(p => p.approved && p.role === 'member').forEach(p => {
                  const mStatus = p.mandates?.[month] || 'pending';
                  if (mStatus === 'given') paidCount++;
                  else if (mStatus === 'crossed') missedCount++;
                  else pendingCount++;
                });

                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMandateMonth(month)}
                    className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between h-24 ${
                      isActive
                        ? 'bg-[#D98353] text-black border-[#D98353] shadow-[0_0_15px_rgba(217,131,83,0.3)] font-bold'
                        : 'bg-white/[0.02] text-[#ECE6E1] border-white/10 hover:border-[#D98353]/50 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="font-serif font-black text-xs uppercase tracking-wide">{month}</span>
                    
                    <div className="space-y-1 mt-2">
                      <div className={`text-[9px] font-mono font-bold flex justify-between ${isActive ? 'text-black/80' : 'text-stone-400'}`}>
                        <span>Paid:</span>
                        <span className={isActive ? 'text-black font-extrabold' : 'text-emerald-400'}>{paidCount}</span>
                      </div>
                      <div className={`text-[9px] font-mono font-bold flex justify-between ${isActive ? 'text-black/80' : 'text-stone-400'}`}>
                        <span>Missed:</span>
                        <span className={isActive ? 'text-black font-extrabold' : 'text-red-400'}>{missedCount}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Member Quick Actions List for Selected Month */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="text-left">
                  <h5 className="font-serif text-sm font-bold text-[#ECE6E1]">Member Checklist: <span className="text-[#D98353] font-black uppercase text-sm">{selectedMandateMonth} 2026</span></h5>
                  <p className="text-[10px] text-[#AC9E94]">Click any of the high-fidelity quick-set buttons to instantly alter payment records.</p>
                </div>
                <div className="text-[10px] font-mono bg-[#D98353]/10 text-[#D98353] border border-[#D98353]/20 px-2.5 py-1 rounded">
                  Active Month: {selectedMandateMonth}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 pb-2 border-b border-white/10 text-[10px] font-bold text-[#AC9E94] uppercase tracking-wider">
                <div className="sm:col-span-5">Member Name</div>
                <div className="sm:col-span-2">Status</div>
                <div className="sm:col-span-5 text-right">Actions</div>
              </div>

              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto pr-2 space-y-2.5">
                
                {profiles.filter(p => p.approved && p.role === 'member').length === 0 && (
                  <div className="text-xs text-stone-500 py-6 text-center bg-black/25 rounded-lg border border-white/5 space-y-2">
                    <div className="flex justify-center mb-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#D98353] border-t-transparent animate-spin"></div>
                    </div>
                    <p>Loading members...</p>
                  </div>
                )}
                {profiles.filter(p => p.approved && p.role === 'member').map(p => {
                  const val = p.mandates?.[selectedMandateMonth] || 'pending';
                  return (
                    <div key={p.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors px-2 rounded-lg">
                      <div className="sm:col-span-5">
                        <h6 className="font-bold text-xs text-[#ECE6E1]">{p.name}</h6>
                        <p className="text-[10px] text-[#AC9E94] font-mono uppercase tracking-wider">{p.role} • {p.domain} Domain</p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          val === 'given' 
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' 
                            : val === 'crossed' 
                              ? 'bg-red-950/50 text-red-400 border border-red-900' 
                              : 'bg-stone-900 text-stone-400 border border-stone-800'
                        }`}>
                          {val === 'given' ? '✅ Paid' : val === 'crossed' ? '❌ Crossed' : '⏳ Pending'}
                        </span>
                      </div>

                      <div className="sm:col-span-5 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetMandateStatus(p.id, selectedMandateMonth, 'given')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            val === 'given' ? 'bg-emerald-800 text-white shadow-md' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/40'
                          }`}
                        >
                          Paid
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetMandateStatus(p.id, selectedMandateMonth, 'crossed')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            val === 'crossed' ? 'bg-red-800 text-white shadow-md' : 'bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/45'
                          }`}
                        >
                          Crossed
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetMandateStatus(p.id, selectedMandateMonth, 'pending')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                            val === 'pending' ? 'bg-stone-700 text-white shadow-md' : 'bg-stone-900 text-stone-400 border border-stone-800 hover:bg-stone-800'
                          }`}
                        >
                          Pending
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#0a0807]/95 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="text-left p-4.5 border-b border-white/10 bg-white/[0.01]">
              <h4 className="font-serif text-sm font-bold text-[#ECE6E1]">📋 Cumulative 12-Month Grid View</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1550px]">
                <thead>
                  <tr className="bg-white/[0.03] text-[#D98353] font-mono text-[10px] uppercase tracking-wider border-b border-white/10">
                    <th className="p-4 pl-6 sticky left-0 bg-[#161210]/95 z-10 backdrop-blur-md">Student Member</th>
                    {['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'].map(month => (
                      <th key={month} className="p-4 font-mono text-center tracking-widest">{month.substring(0, 3)}</th>
                    ))}
                    <th className="p-4 text-right pr-6 min-w-[180px]">Consecutive Misses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-[#AC9E94]">
                  {profiles.filter(p => p.approved && p.role === 'member').length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-stone-500">
                        <div className="flex justify-center mb-2">
                          <div className="w-4 h-4 rounded-full border-2 border-[#D98353] border-t-transparent animate-spin"></div>
                        </div>
                        <p>Loading members...</p>
                      </td>
                    </tr>
                  )}
                  {profiles.filter(p => p.approved && p.role === 'member').map(p => {
                    const months = ['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'];
                    
                    // calculate consecutive crossed months
                    let maxStreak = 0;
                    let currentStreak = 0;
                    months.forEach(month => {
                      const status = p.mandates?.[month] || 'pending';
                      if (status === 'crossed') {
                        currentStreak++;
                        if (currentStreak > maxStreak) {
                          maxStreak = currentStreak;
                        }
                      } else {
                        currentStreak = 0;
                      }
                    });

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 pl-6 font-bold text-[#ECE6E1] sticky left-0 bg-[#0a0807]/95 z-10 backdrop-blur-md border-r border-white/5 min-w-[180px] shadow-lg">
                          <div className="truncate max-w-[160px]">{p.name}</div>
                          <div className="text-[9px] text-[#D98353] font-mono uppercase tracking-wider mt-0.5">{p.role}</div>
                        </td>
                        {months.map(month => {
                          const val = p.mandates?.[month] || 'pending';
                          return (
                            <td key={month} className="p-2 text-center">
                              <button
                                onClick={() => handleToggleMandateStatus(p.id, month, val)}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                                  val === 'given' 
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40' 
                                    : val === 'crossed' 
                                      ? 'bg-red-950/40 text-red-500 border border-red-500/30 hover:bg-red-900/40' 
                                      : 'bg-[#1c1917]/80 text-[#8C7D73] border border-white/5 hover:bg-white/5'
                                }`}
                                title="Click to rotate status: Paid -> Crossed -> Pending"
                              >
                                {val === 'given' ? '✅ Paid' : val === 'crossed' ? '❌ Cross' : '⏳ Pend'}
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-4 text-right pr-6 font-mono font-bold">
                          {maxStreak >= 3 ? (
                            <span className="text-red-500 animate-pulse font-black">🚨 {maxStreak} Crosses (Flagged)</span>
                          ) : maxStreak === 1 ? (
                            <span className="text-amber-500">1 Missed</span>
                          ) : maxStreak === 2 ? (
                            <span className="text-orange-500 font-bold">⚠️ 2 Missed</span>
                          ) : (
                            <span className="text-emerald-500 font-semibold">Clear</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====== Tab: Site Vision & Achievements ====== */}
      {activeTab === 'site_vision' && (
        <div className="space-y-6 text-left animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT: Site content CMS (Vision, Mission, About) */}
            <div className="lg:col-span-1 bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-4">
              <h4 className="font-serif text-base font-bold text-[#D98353] flex items-center gap-2">
                🎨 General Site Content CMS
              </h4>
              <p className="text-[11px] text-[#AC9E94] leading-relaxed">
                Edit the Society descriptions, history, and core mission vision statements displayed on the main page.
              </p>

              <form onSubmit={handleSaveSiteVisionMissionAbout} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">Our Vision Statement</label>
                  <textarea
                    rows={4}
                    value={siteVision}
                    onChange={(e) => setSiteVision(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none"
                    placeholder="Vision of the Society..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">Our Core Mission</label>
                  <textarea
                    rows={4}
                    value={siteMission}
                    onChange={(e) => setSiteMission(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none"
                    placeholder="Mission objectives..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">About MALHAAR Description</label>
                  <textarea
                    rows={4}
                    value={siteAbout}
                    onChange={(e) => setSiteAbout(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none"
                    placeholder="Brief description of the Society..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">Why You / Why Join Section</label>
                  <textarea
                    rows={4}
                    value={siteWhyJoin}
                    onChange={(e) => setSiteWhyJoin(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none"
                    placeholder="Why join the Society arguments..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">Developer Name</label>
                    <input
                      type="text"
                      value={siteDevName}
                      onChange={(e) => setSiteDevName(e.target.value)}
                      className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none"
                      placeholder="e.g. Lead Technical Architect"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">Developer Chapter / Organization</label>
                    <input
                      type="text"
                      value={siteDevChapter}
                      onChange={(e) => setSiteDevChapter(e.target.value)}
                      className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none"
                      placeholder="e.g. Malhaar Tech Command"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">
                    Developer Photo (Add via Upload or Image URL)
                  </label>
                  <div className="space-y-3 bg-black p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-4">
                      {siteDevPicture ? (
                        <div className="relative group shrink-0">
                          <img src={siteDevPicture} alt="Selected developer preview" className="w-16 h-16 rounded-xl object-cover ring-1 ring-amber-500/50" />
                          <button
                            type="button"
                            onClick={() => setSiteDevPicture('')}
                            className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-[8px] font-bold leading-none cursor-pointer shadow-md"
                            title="Remove Photo"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-stone-900/50 border border-dashed border-white/10 flex items-center justify-center text-stone-500 text-[10px] font-mono shrink-0">
                          No Image
                        </div>
                      )}
                      
                      <div className="space-y-1.5 flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageBase64(file).then(base64 => {
                                setSiteDevPicture(base64);
                              });
                            }
                          }}
                          className="block w-full text-xs text-stone-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:font-bold file:uppercase file:bg-amber-950/40 file:text-amber-500 hover:file:bg-amber-900/50 cursor-pointer"
                        />
                        <p className="text-[9px] text-stone-500 leading-tight">Option 1: Upload directly from your gallery.</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-2">
                      <label className="block text-[9px] uppercase font-mono font-bold text-stone-500 mb-1">Option 2: Direct Image URL</label>
                      <input
                        type="url"
                        value={siteDevPicture.startsWith('data:') ? '' : siteDevPicture}
                        onChange={(e) => setSiteDevPicture(e.target.value)}
                        className="w-full h-8 px-2.5 bg-stone-950 border border-white/5 text-[11px] text-white rounded-lg focus:border-[#D98353] focus:outline-none"
                        placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                      />
                    </div>
                    
                    {siteDevPicture && (
                      <button
                        type="button"
                        onClick={() => setSiteDevPicture('')}
                        className="w-full h-8 text-[10px] uppercase font-mono font-bold bg-red-950/40 text-red-400 border border-red-900/20 hover:bg-red-900/30 rounded-lg transition-all cursor-pointer"
                      >
                        Remove Current Photo
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-[#AC9E94] mb-1">About the Developer Section</label>
                  <textarea
                    rows={4}
                    value={siteAboutDeveloper}
                    onChange={(e) => setSiteAboutDeveloper(e.target.value)}
                    className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] focus:outline-none"
                    placeholder="Credits and tech highlights..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-10 bg-[#D98353] hover:bg-[#b05f32] text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                >
                  Save Site Contents 💾
                </button>
              </form>
            </div>

            {/* RIGHT: Achievements & Medals List & Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Add Achievement Form / Edit Achievement Form */}
              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl">
                {selectedAch ? (
                  <form onSubmit={handleSaveEditAchievement} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-serif text-base font-bold text-amber-400">
                        ✏️ Edit Achievement Medal
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setSelectedAch(null)}
                        className="text-[10px] uppercase font-mono text-[#AC9E94] hover:text-white"
                      >
                        [Cancel Edit]
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#AC9E94] mb-1">Fiscal Year</label>
                        <select
                          value={editAchYear}
                          onChange={(e) => setEditAchYear(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                        >
                          {['2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020'].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-[#AC9E94] mb-1">Medal/Title Name</label>
                        <input
                          type="text"
                          value={editAchTitle}
                          onChange={(e) => setEditAchTitle(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    {/* Achievements images are not shown in user views, hence image input is disabled */}

                    <div>
                      <label className="block text-[10px] text-[#AC9E94] mb-1">Accomplishment Description Summary</label>
                      <textarea
                        rows={3}
                        value={editAchDesc}
                        onChange={(e) => setEditAchDesc(e.target.value)}
                        className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Update Medal Particulars 🎖
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCreateAchievement} className="space-y-4">
                    <h4 className="font-serif text-base font-bold text-[#D98353]">
                      🎖 Record New Society Achievement / Medal Recital
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#AC9E94] mb-1">Fiscal Year</label>
                        <select
                          value={newAchYear}
                          onChange={(e) => setNewAchYear(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                        >
                          {['2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020'].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-[#AC9E94] mb-1">Medal/Title Name</label>
                        <input
                          type="text"
                          placeholder="e.g. DU Inter-Collegiate Choir Gold Medalist"
                          value={newAchTitle}
                          onChange={(e) => setNewAchTitle(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    {/* Achievements images are not shown in user views, hence image input is disabled */}

                    <div>
                      <label className="block text-[10px] text-[#AC9E94] mb-1">Accomplishment Description Summary</label>
                      <textarea
                        rows={3}
                        placeholder="Brief summary of the recital venue, performers, highlights and results..."
                        value={newAchDesc}
                        onChange={(e) => setNewAchDesc(e.target.value)}
                        className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-10 bg-[#D98353] hover:bg-[#b05f32] text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Publish Achievement 🚀
                    </button>
                  </form>
                )}
              </div>

              {/* Achievements Directory List with Delete / Edit Control buttons */}
              <div className="bg-[#0a0807]/95 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 bg-white/[0.01] border-b border-white/10 flex justify-between items-center">
                  <h4 className="font-serif text-sm font-bold text-[#ECE6E1]">🏆 Historic Achievements & Medals List</h4>
                  <span className="text-[10px] font-mono text-amber-500 font-bold">{achievementsList.length} Records</span>
                </div>

                <div className="max-h-120 overflow-y-auto divide-y divide-white/5 p-4 pr-2 space-y-3">
                  {achievementsList.length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-6">No historical achievements found.</p>
                  ) : (
                    achievementsList.map(ach => (
                      <div key={ach.id} className="flex gap-4 items-start pt-3.5 first:pt-0">
                        {ach.image_url && (
                          <img 
                            src={ach.image_url} 
                            alt={ach.title} 
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 object-cover rounded-xl border border-white/10 shrink-0" 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold bg-[#D98353]/15 text-[#D98353] border border-[#D98353]/30 px-1.5 py-0.5 rounded">
                              {ach.year}
                            </span>
                            <h5 className="font-serif font-bold text-xs text-white truncate">{ach.title}</h5>
                          </div>
                          <p className="text-[11px] text-[#AC9E94] mt-1.5 leading-relaxed">{ach.description}</p>
                          
                          <div className="flex items-center gap-3 mt-2.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditAchievement(ach)}
                              className="text-[9px] font-mono font-bold text-[#D98353] hover:underline"
                            >
                              [Edit Particulars]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAchievement(ach.id)}
                              className="text-[9px] font-mono font-bold text-red-400 hover:underline"
                            >
                              [Delete Permanently]
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ====== Tab: Merchandise CMS Section ====== */}
      {activeTab === 'merchandise_cms' && (
        <div className="space-y-6 text-left animate-fadeIn">
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">🛍️ Merchandise Asset Management</h3>
              <p className="text-xs text-[#AC9E94] mt-1 font-mono uppercase tracking-wider">Configure collectibles, hoodies, picks, and live concert vinyls available in the store</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Add/Edit form */}
            <div className="lg:col-span-5 bg-black/40 border border-white/5 p-6 rounded-2xl space-y-6">
              {selectedMerch ? (
                <form onSubmit={handleSaveEditMerchandise} className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="font-serif text-sm font-bold text-[#D98353] uppercase tracking-wider">✏️ Edit Merchandise</h4>
                    <button 
                      type="button" 
                      onClick={() => setSelectedMerch(null)}
                      className="text-[10px] font-mono text-[#AC9E94] hover:text-white uppercase"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Academic Year & Series</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2026" 
                      value={editMerchYear}
                      onChange={(e) => setEditMerchYear(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Gear Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Signature Golden Flute Hoodie" 
                      value={editMerchItemName}
                      onChange={(e) => setEditMerchItemName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Add Picture from Gallery</label>
                    <div className="flex items-center gap-3 bg-stone-900 border border-white/10 p-2.5 rounded-xl">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImageBase64(file).then(base64 => {
                              setEditMerchImageUrl(base64);
                              onRequestToast('Success: Merchandise image parsed and optimized!', 'success');
                            });
                          }
                        }}
                        className="hidden"
                        id="edit-merch-image-upload"
                      />
                      <label 
                        htmlFor="edit-merch-image-upload"
                        className="px-3 py-1.5 bg-black/40 hover:bg-[#D98353] hover:text-black border border-white/10 rounded-lg text-[10px] text-[#ECE6E1] cursor-pointer transition-all uppercase font-mono font-bold"
                      >
                        📂 Choose Image File
                      </label>
                      {editMerchImageUrl ? (
                        <div className="flex items-center gap-2">
                          <img src={editMerchImageUrl} alt="Preview" className="w-8 h-8 rounded object-cover border border-white/15" />
                          <button 
                            type="button" 
                            onClick={() => setEditMerchImageUrl('')} 
                            className="text-[10px] text-red-400 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-mono">No image file chosen</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Description / Fabrication Particulars</label>
                    <textarea 
                      rows={3}
                      placeholder="Describe fabric blend, embroidery details, sizing options..." 
                      value={editMerchDescription}
                      onChange={(e) => setEditMerchDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#D98353] to-amber-600 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-bold"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateMerchandise} className="space-y-4">
                  <h4 className="font-serif text-sm font-bold text-[#ECE6E1] border-b border-white/5 pb-2 uppercase tracking-wider">✨ Create New Collectible</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Academic Year & Series</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 2026" 
                      value={newMerchYear}
                      onChange={(e) => setNewMerchYear(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Gear Item Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Limited Edition Tour Tee" 
                      value={newMerchItemName}
                      onChange={(e) => setNewMerchItemName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Add Picture from Gallery</label>
                    <div className="flex items-center gap-3 bg-stone-900 border border-white/10 p-2.5 rounded-xl">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImageBase64(file).then(base64 => {
                              setNewMerchImageUrl(base64);
                              onRequestToast('Success: Merchandise image parsed and optimized!', 'success');
                            });
                          }
                        }}
                        className="hidden"
                        id="new-merch-image-upload"
                      />
                      <label 
                        htmlFor="new-merch-image-upload"
                        className="px-3 py-1.5 bg-black/40 hover:bg-[#D98353] hover:text-black border border-white/10 rounded-lg text-[10px] text-[#ECE6E1] cursor-pointer transition-all uppercase font-mono font-bold"
                      >
                        📂 Choose Image File
                      </label>
                      {newMerchImageUrl ? (
                        <div className="flex items-center gap-2">
                          <img src={newMerchImageUrl} alt="Preview" className="w-8 h-8 rounded object-cover border border-white/15" />
                          <button 
                            type="button" 
                            onClick={() => setNewMerchImageUrl('')} 
                            className="text-[10px] text-red-400 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-mono">No image file chosen</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Description / Fabric Blend</label>
                    <textarea 
                      rows={3}
                      placeholder="Describe high-quality specs..." 
                      value={newMerchDescription}
                      onChange={(e) => setNewMerchDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-[#D98353] hover:bg-amber-500 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    🚀 Release Gear
                  </button>
                </form>
              )}
            </div>

            {/* Right side: Catalog list of all years */}
            <div className="lg:col-span-7 bg-black/40 border border-white/5 p-6 rounded-2xl">
              <h4 className="font-serif text-sm font-bold text-[#ECE6E1] border-b border-white/5 pb-2 mb-4 uppercase tracking-wider">📚 Indexed Core Collectibles ({merchandiseList.length})</h4>
              
              <div className="space-y-4 max-h-160 overflow-y-auto pr-2">
                {merchandiseList.length === 0 ? (
                  <p className="text-xs text-[#AC9E94] font-mono text-center py-12">No merchandise records found. Add one on the left!</p>
                ) : (
                  merchandiseList.map(item => (
                    <div key={item.id} className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-stone-950 border border-white/10">
                        <img 
                          src={item.image_url || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400"} 
                          alt={item.item_name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-mono text-[#D98353] border border-[#D98353]/30 px-1.5 py-0.5 rounded uppercase font-bold">{item.year} Series</span>
                        </div>
                        <h5 className="font-serif font-bold text-[#ECE6E1] text-sm mt-1">{item.item_name}</h5>
                        <p className="text-xs text-[#AC9E94] mt-0.5 max-w-lg line-clamp-2 leading-relaxed">{item.description}</p>
                        
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => handleStartEditMerchandise(item)}
                            className="text-[10px] font-mono font-bold text-[#D98353] hover:underline"
                          >
                            [Edit Item]
                          </button>
                          <button
                            onClick={() => handleDeleteMerchandise(item.id)}
                            className="text-[10px] font-mono font-bold text-red-400 hover:underline"
                          >
                            [Delete]
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ====== Tab: Event-Linked Media Hall CMS Section ====== */}
      {activeTab === 'media' && (
        <div className="space-y-6 text-left animate-fadeIn">
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">🎬 Malhaar Event Media Hall CMS</h3>
              <p className="text-xs text-[#AC9E94] mt-1 font-mono uppercase tracking-wider">Deploy event albums, concert summaries, thumbnail snapshots, and sync Google Drive link modules directly to the Dashboard</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-5 bg-black/40 border border-white/5 p-6 rounded-2xl space-y-6">
              {selectedMediaFolder ? (
                /* ================== EDIT MEDIA EVENT ================== */
                <form onSubmit={handleSaveEditMediaFolder} className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h4 className="font-serif text-sm font-bold text-[#D98353] uppercase tracking-wider">✏️ Modify Media Album</h4>
                    <button 
                      type="button" 
                      onClick={() => setSelectedMediaFolder(null)}
                      className="text-[10px] font-mono text-[#AC9E94] hover:text-white uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Album Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Aarohi 2025 Recital" 
                      value={editMediaFolderName}
                      onChange={(e) => setEditMediaFolderName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Category</label>
                      <select
                        value={editMediaFolderCategory}
                        onChange={(e: any) => setEditMediaFolderCategory(e.target.value)}
                        className="w-full px-2 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D98353]"
                      >
                        <option value="Classical">Classical</option>
                        <option value="Western">Western</option>
                        <option value="Fusion">Fusion</option>
                        <option value="Production">Production</option>
                        <option value="Jam">Lobby Jam</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Session (Year)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 2025 or 2024-25" 
                        value={editMediaFolderYear}
                        onChange={(e) => setEditMediaFolderYear(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Concert Date</label>
                      <input 
                        type="date" 
                        value={editMediaFolderDate}
                        onChange={(e) => setEditMediaFolderDate(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Google Drive Shared Folder Link</label>
                      <input 
                        type="url" 
                        placeholder="Paste shared Drive URL..." 
                        value={editMediaFolderDriveLink}
                        onChange={(e) => setEditMediaFolderDriveLink(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      />
                    </div>
                  </div>

                  {/* Attachment selector */}
                  <div className="space-y-1.5 p-3 bg-black/20 rounded-xl border border-white/5">
                    <label className="block text-[10px] font-mono text-stone-400 uppercase font-bold">Thumbnail Gallery Cover Photo</label>
                    <div className="space-y-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleEditMediaEventImageUpload}
                        className="w-full text-[11px] text-stone-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-[#D98353]/10 file:text-[#D98353] file:cursor-pointer"
                      />
                      <div className="text-[10px] text-stone-500">Or edit cover URL directly:</div>
                      <input 
                        type="text" 
                        placeholder="Image cover URL..." 
                        value={editMediaFolderImagesText}
                        onChange={(e) => setEditMediaFolderImagesText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-stone-900 border border-white/5 rounded text-[10px] text-stone-300 font-mono"
                      />
                    </div>
                    {editMediaFolderImagesText && (
                      <img src={editMediaFolderImagesText} alt="edit preview" className="w-20 h-12 object-cover rounded mt-1.5 border border-white/10" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Event Bio / Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Summarize the concert highlight, crew involvement, vocal performance..." 
                      value={editMediaFolderDesc}
                      onChange={(e) => setEditMediaFolderDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-[#D98353] to-amber-600 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Save Changes & Sync
                  </button>
                </form>
              ) : (
                /* ================== CREATE MEDIA EVENT ================== */
                <form onSubmit={handleCreateMediaFolder} className="space-y-4">
                  <h4 className="font-serif text-sm font-bold text-[#ECE6E1] border-b border-white/5 pb-2 uppercase tracking-wider">✨ Publish New Album</h4>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Event Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Aarohi Festival 2025" 
                      value={newMediaFolderName}
                      onChange={(e) => setNewMediaFolderName(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Category</label>
                      <select
                        value={newMediaFolderCategory}
                        onChange={(e: any) => setNewMediaFolderCategory(e.target.value)}
                        className="w-full px-2 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D98353]"
                      >
                        <option value="Classical">Classical</option>
                        <option value="Western">Western</option>
                        <option value="Fusion">Fusion</option>
                        <option value="Production">Production</option>
                        <option value="Jam">Lobby Jam</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Session (Year)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 2025 or 2024-25" 
                        value={newMediaFolderYear}
                        onChange={(e) => setNewMediaFolderYear(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Concert Date</label>
                      <input 
                        type="date" 
                        value={newMediaFolderDate}
                        onChange={(e) => setNewMediaFolderDate(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Google Drive Shared Folder Link</label>
                      <input 
                        type="url" 
                        placeholder="https://drive.google.com/..." 
                        value={newMediaFolderDriveLink}
                        onChange={(e) => setNewMediaFolderDriveLink(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none"
                      />
                    </div>
                  </div>

                  {/* Attachment selector */}
                  <div className="space-y-1.5 p-3 bg-black/20 rounded-xl border border-white/5">
                    <label className="block text-[10px] font-mono text-stone-400 uppercase font-bold">Thumbnail Gallery Cover Photo</label>
                    <div className="space-y-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleMediaEventImageUpload}
                        className="w-full text-[11px] text-stone-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-[#D98353]/10 file:text-[#D98353] file:cursor-pointer"
                      />
                      <div className="text-[10px] text-stone-500">Or paste image cover URL:</div>
                      <input 
                        type="text" 
                        placeholder="https://images.unsplash.com/..." 
                        value={newMediaFolderImagesText}
                        onChange={(e) => setNewMediaFolderImagesText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-stone-900 border border-white/5 rounded text-[10px] text-stone-300 font-mono"
                      />
                    </div>
                    {newMediaFolderImagesText && (
                      <img src={newMediaFolderImagesText} alt="upload preview" className="w-20 h-12 object-cover rounded mt-1.5 border border-white/10" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-[#AC9E94] uppercase tracking-widest font-bold">Folder Overview Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Summarize the concert highlight, vocal choir performance, or recap details..." 
                      value={newMediaFolderDesc}
                      onChange={(e) => setNewMediaFolderDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs text-white focus:border-[#D98353] outline-none resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-[#D98353] hover:bg-amber-500 text-black font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-bold"
                  >
                    🚀 Release Album to Dashboard
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Folders list */}
            <div className="lg:col-span-7 bg-black/40 border border-white/5 p-6 rounded-2xl">
              <h4 className="font-serif text-sm font-bold text-[#ECE6E1] border-b border-white/5 pb-2 mb-4 uppercase tracking-wider">📁 Registered Gallery Albums ({events.length})</h4>
              
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                {events.length === 0 ? (
                  <p className="text-xs text-[#AC9E94] font-mono text-center py-12">No media albums found. Deploy a showcase recital on the left!</p>
                ) : (
                  events.map(eventItem => (
                    <div key={eventItem.id} className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl text-left space-y-3 flex flex-col md:flex-row gap-4 items-start">
                      <div className="w-24 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-stone-950">
                        <img 
                          src={eventItem.image_url || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=250'} 
                          className="w-full h-full object-cover" 
                          alt="" 
                          onError={(e) => {
                            (e.target as any).src = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=250";
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <h5 className="font-serif font-bold text-white text-base truncate">{eventItem.name}</h5>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-[#D98353] bg-[#D98353]/10 border border-[#D98353]/20 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              {eventItem.category}
                            </span>
                            <span className="text-[9px] font-mono text-amber-500 bg-amber-950/40 border border-amber-900/50 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Session {eventItem.year}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[#AC9E94] line-clamp-2 leading-relaxed">{eventItem.description}</p>
                        
                        <div className="text-[9px] font-mono text-stone-500 flex items-center gap-4">
                          <span>📅 Date: {eventItem.event_date}</span>
                          {eventItem.drive_link && (
                            <span className="truncate max-w-[200px] text-amber-500">🔗 Drive Connected</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleStartEditMediaFolder(eventItem)}
                            className="text-[10px] font-mono font-bold text-[#D98353] hover:underline cursor-pointer"
                          >
                            [Edit Record]
                          </button>
                          <button
                            onClick={() => handleDeleteMediaFolder(eventItem.id)}
                            className="text-[10px] font-mono font-bold text-red-400 hover:underline cursor-pointer"
                          >
                            [Purge / Delete]
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ====== Tab: Core Team CMS Section ====== */}
      {activeTab === 'core-members' && (
        <div className="space-y-6 text-left">
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">🎺 Core Team Directory Content Management</h3>
              <p className="text-xs text-[#AC9E94] mt-1">Manage, add, delete and modify administrative roles, tenure years, positions, and phone contacts for Malhaar core gang.</p>
            </div>
            {selectedCore && (
              <button 
                onClick={() => setSelectedCore(null)}
                className="px-3 py-1.5 bg-neutral-800 text-stone-300 font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl border border-white/5 hover:bg-neutral-700 transition-all cursor-pointer"
              >
                Cancel Current Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT / TOP COLUMN: Create or Edit Form */}
            <div className="lg:col-span-5 space-y-6">
              
              {selectedCore ? (
                /* ================== EDIT FORM ================== */
                <form onSubmit={handleSaveEditCore} className="bg-gradient-to-br from-[#2D1A12]/40 to-black/40 border border-[#D98353]/30 p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <h4 className="font-serif font-bold text-[#D98353] text-base">Modify Core profile</h4>
                    <span className="text-[9px] font-mono bg-[#D98353]/20 text-[#D98353] px-2 py-0.5 rounded uppercase font-bold"> editing mode</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Full Name</label>
                      <input
                        type="text"
                        value={editCoreName}
                        onChange={(e) => setEditCoreName(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Domain Role</label>
                      <input
                        type="text"
                        value={editCoreRole}
                        onChange={(e) => setEditCoreRole(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                        placeholder="e.g. Western Vocals Lead"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Position Held</label>
                      <input
                        type="text"
                        value={editCorePosition}
                        onChange={(e) => setEditCorePosition(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs text-white rounded-xl"
                        placeholder="e.g. Public Relations Head"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Tenure Segment</label>
                      <input
                        type="text"
                        placeholder="e.g. 2010-11 or 2024-25"
                        value={editCoreTenure}
                        onChange={(e) => setEditCoreTenure(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Academic Year</label>
                      <select
                        value={editCoreYear}
                        onChange={(e) => setEditCoreYear(e.target.value as any)}
                        className="w-full h-9 px-2 bg-black border border-white/10 text-xs text-white rounded-xl outline-none"
                      >
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Tenure Yr</label>
                      <input
                        type="text"
                        value={editCoreTenureYear}
                        onChange={(e) => setEditCoreTenureYear(e.target.value)}
                        className="w-full h-9 px-2 bg-black border border-white/10 text-xs text-white rounded-xl text-center font-mono"
                        placeholder="e.g. 2027"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Phone No.</label>
                      <input
                        type="text"
                        value={editCorePhone}
                        onChange={(e) => setEditCorePhone(e.target.value)}
                        className="w-full h-9 px-2 bg-black border border-white/10 text-xs text-white rounded-xl text-center font-mono"
                        placeholder="e.g. 9812345678"
                      />
                    </div>
                  </div>

                  {/* Core Photo Gallery Selection and pasting */}
                  <div>
                    <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Gallery Photo Selection</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                      <div>
                        <label className="block text-[9px] text-[#D98353] font-mono mb-1 font-bold">1. Select from Gallery:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditCoreImageUpload}
                          className="w-full text-xs text-stone-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-[#D98353]/10 file:text-[#D98353] file:cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-stone-500 font-mono mb-1">2. Or Paste explicit URL:</label>
                        <input
                          type="text"
                          placeholder="Image URL..."
                          value={editCoreImg}
                          onChange={(e) => setEditCoreImg(e.target.value)}
                          className="w-full h-7 px-2 bg-black border border-white/10 text-[10px] rounded"
                        />
                      </div>
                    </div>
                    {editCoreImg && (
                      <div className="mt-2 flex items-center gap-2 bg-[#D98353]/5 p-2 rounded-lg border border-[#D98353]/20">
                        <img src={editCoreImg} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                        <span className="text-[10px] text-[#D98353] font-mono">Photo updated successfully!</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Biography / Leadership Description</label>
                    <textarea
                      placeholder="Special contributions to the college assemblies..."
                      value={editCoreDesc}
                      onChange={(e) => setEditCoreDesc(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                    >
                      Save Core Details 💾
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCore(null)}
                      className="px-4 py-2.5 bg-neutral-800 text-stone-300 font-bold uppercase text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* ================== CREATE FORM ================== */
                <form onSubmit={handleCreateCoreMember} className="bg-[#1C0F0B]/20 border border-[#4a2618]/30 p-6 rounded-2xl space-y-4">
                  <h4 className="font-serif font-bold text-[#D98353] text-base">Induct Core Office Bearer</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Aryan Sharma"
                        value={newCoreName}
                        onChange={(e) => setNewCoreName(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Domain Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Classical Harmonist"
                        value={newCoreRole}
                        onChange={(e) => setNewCoreRole(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Position Held</label>
                      <input
                        type="text"
                        placeholder="e.g. Vice President"
                        value={newCorePosition}
                        onChange={(e) => setNewCorePosition(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Tenure Segment</label>
                      <input
                        type="text"
                        placeholder="e.g. 2010-11 or 2024-25"
                        value={newCoreTenure}
                        onChange={(e) => setNewCoreTenure(e.target.value)}
                        className="w-full h-9 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Academic Year</label>
                      <select
                        value={newCoreYear}
                        onChange={(e) => setNewCoreYear(e.target.value as any)}
                        className="w-full h-9 px-2 bg-black border border-white/10 text-xs rounded-xl outline-none"
                      >
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Tenure Yr</label>
                      <input
                        type="text"
                        placeholder="e.g. 2027"
                        value={newCoreTenureYear}
                        onChange={(e) => setNewCoreTenureYear(e.target.value)}
                        className="w-full h-9 px-2 bg-black border border-white/10 text-xs rounded-xl text-center font-mono text-[#D98353] bg-black/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Phone No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={newCorePhone}
                        onChange={(e) => setNewCorePhone(e.target.value)}
                        className="w-full h-9 px-2 bg-black border border-white/10 text-xs rounded-xl text-center font-mono text-[#D98353] bg-black/40"
                      />
                    </div>
                  </div>

                  {/* UPLOADING PIX FROM NATIVE GALLERY AS REQUESTED */}
                  <div>
                    <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Gallery Photo Selection</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                      <div>
                        <label className="block text-[9px] text-[#D98353] font-mono mb-1 font-bold">1. Select from Gallery:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoreImageUpload}
                          className="w-full text-xs text-stone-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-[#D98353]/10 file:text-[#D98353] file:cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-stone-500 font-mono mb-1">2. Or Paste explicit URL:</label>
                        <input
                          type="text"
                          placeholder="Image URL..."
                          value={newCoreImg}
                          onChange={(e) => setNewCoreImg(e.target.value)}
                          className="w-full h-7 px-2 bg-black border border-white/10 text-[10px] rounded text-stone-300"
                        />
                      </div>
                    </div>
                    {newCoreImg && (
                      <div className="mt-2 flex items-center gap-2 bg-[#D98353]/5 p-2 rounded-lg border border-[#D98353]/20">
                        <img src={newCoreImg} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                        <span className="text-[10px] text-[#D98353] font-mono">Image loaded successfully</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Short Biography / Leadership Bio</label>
                    <textarea
                      placeholder="Specialist credentials, contributions, or accolades..."
                      value={newCoreDesc}
                      onChange={(e) => setNewCoreDesc(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#D98353] hover:bg-amber-500 hover:shadow-lg text-black font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                  >
                    Induct to Society Core Directory 🚩
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT COLUMN: Directory List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center bg-white/[0.01] p-3 rounded-xl border border-white/5">
                <h4 className="font-serif font-bold text-white text-base">Registered Core Officer Registry</h4>
                <span className="text-[10px] font-mono text-[#D98353] font-bold bg-[#D98353]/10 px-2 py-0.5 rounded-full">{coreMembersList.length} Active bearers</span>
              </div>

              <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
                {coreMembersList.length > 0 ? (
                  coreMembersList.map(member => (
                    <div 
                      key={member.id} 
                      className={`p-4 bg-black/40 border rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-all ${
                        selectedCore?.id === member.id ? 'border-[#D98353]' : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex gap-4 items-center">
                        {member.image_url ? (
                          <img src={member.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10 hover:scale-105 transition-all" />
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-white/10 bg-[#2A160F] flex items-center justify-center text-xl font-serif font-bold text-[#D98353] shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm font-bold text-white flex items-center gap-1">
                              {member.name}
                              {member.is_starred && <span className="text-yellow-400">⭐</span>}
                            </strong>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-[#D98353] font-bold border border-[#D98353]/20">{member.year} Year</span>
                          </div>
                          <div className="text-xs text-stone-300 font-serif font-semibold">{member.position} ({member.role})</div>
                          <div className="text-[10px] font-mono text-stone-500 space-y-0.5 sm:space-y-0 sm:space-x-3 flex flex-col sm:flex-row">
                            <span>📅 Tenure: {member.tenure} ({member.tenure_year || '2026'})</span>
                            {member.phone_number && (
                              <span className="text-[#D98353]">📞 Contact: {member.phone_number}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStarCoreMember(member.id)}
                          className={`px-2.5 py-1.5 text-[10px] uppercase font-mono font-bold rounded border transition-all cursor-pointer ${
                            member.is_starred
                              ? 'bg-amber-500/20 text-yellow-400 border-amber-500/40'
                              : 'bg-stone-500/10 text-stone-400 border-stone-500/15 hover:text-white'
                          }`}
                        >
                          {member.is_starred ? '⭐ Starred' : '☆ Star Current'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditCore(member)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-[#D98353] text-[10px] font-bold uppercase rounded border border-amber-500/20 transition-all cursor-pointer font-mono"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoreMember(member.id, member.name)}
                          className="px-3 py-1.5 bg-red-950/20 text-red-500 border border-red-950/40 text-[10px] font-bold uppercase rounded hover:bg-red-950/60 transition-all cursor-pointer font-mono"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-stone-500 italic bg-white/[0.01] border border-white/5 rounded-2xl">
                    No registered Bearers found in database. Create classical directors using the administrative file-form on the left!
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
      {activeTab === 'alumni' && (
        <div className="space-y-6 text-left">
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
            <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">✨ Luminous Alumni Content Management</h3>
            <p className="text-xs text-[#AC9E94] mt-1">Publish master profiles highlighting preeminent legacy directors of classical choirs and instruments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Create form */}
            <form onSubmit={handleCreateAlumni} className="bg-[#1C0F0B]/20 border border-[#4a2618]/30 p-6 rounded-2xl space-y-4">
              <h4 className="font-serif font-bold text-[#D98353] text-base">Induct Legacy Officer</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Dev"
                    value={newAlumniName}
                    onChange={(e) => setNewAlumniName(e.target.value)}
                    className="w-full h-10 px-3 bg-black border border-white/10 text-xs rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Class of (Graduation Year)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={newAlumniYear}
                    onChange={(e) => setNewAlumniYear(e.target.value)}
                    className="w-full h-10 px-3 bg-black border border-white/10 text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Role/Title Held Previous</label>
                <input
                  type="text"
                  placeholder="e.g. Vocal Choir Lead & Harmonist"
                  value={newAlumniRoleCode}
                  onChange={(e) => setNewAlumniRoleCode(e.target.value)}
                  className="w-full h-10 px-3 bg-black border border-white/10 text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Profile Photo Selection</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] text-[#D98353] font-mono mb-1">1. Choose image from Gallery:</label>
                    <input
                      type="file"
                      id="alumni-gallery-pic"
                      accept="image/*"
                      onChange={handleAlumniImageUpload}
                      className="w-full text-xs text-stone-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-[#D98353]/10 file:text-[#D98353] hover:file:bg-[#D98353]/20 bg-black/40 p-1 border border-white/10 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-stone-500 font-mono mb-1">2. Or Paste explicit Image URL:</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={newAlumniImage}
                      onChange={(e) => setNewAlumniImage(e.target.value)}
                      className="w-full h-9 px-3 bg-black border border-white/10 text-xs rounded-xl text-stone-300"
                    />
                  </div>
                </div>
                {newAlumniImage && (
                  <div className="mt-2 flex items-center gap-2 bg-[#D98353]/5 p-2 rounded-lg border border-[#D98353]/20">
                    <img src={newAlumniImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-[10px] text-stone-300 font-mono select-none truncate">Image loaded successfully</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Short Biography / Legacy Milestones</label>
                <textarea
                  placeholder="Describe medals won, previous master performances, or instrument specialization..."
                  value={newAlumniBio}
                  onChange={(e) => setNewAlumniBio(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#D98353] hover:bg-amber-500 hover:shadow-lg text-black font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
              >
                Induct Into Luminous Sanctuary ✨
              </button>
            </form>

            {/* List entries */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-white text-base">Registered Alumni Hall</h4>
              <div className="max-h-120 overflow-y-auto space-y-3 pr-2">
                {alumniList.map(a => (
                  <div key={a.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex gap-4 items-center justify-between">
                    <div className="flex gap-3 items-center">
                      <img 
                        src={a.image_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200"} 
                        alt="" 
                        className="w-10 h-10 rounded-xl object-cover" 
                      />
                      <div>
                        <strong className="text-sm font-bold text-white block">{a.name}</strong>
                        <span className="text-[10px] font-mono text-amber-500">Class of {a.graduation_year} | {a.role_held}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAlumni(a.id)}
                      className="px-2.5 py-1 bg-red-950/20 text-red-400 border border-red-900/30 text-[10px] font-bold uppercase rounded hover:bg-red-950/60 transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Tab 4: Dashboard Segment Custom CMS ====== */}
      {activeTab === 'custom' && (
        <div className="space-y-8 text-left">
          {/* General Tab info Header */}
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">📌 Custom Lobby Segments & Live Status Broadcasting</h3>
              <p className="text-xs text-[#AC9E94] mt-1">Manage global real-time notifications ("Live Thing" status) and custom layout blocks loaded instantly across all student screens.</p>
            </div>
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 uppercase font-bold tracking-widest align-middle shrink-0 self-start md:self-auto">
              🛰️ Lobby Satellite Direct
            </span>
          </div>

          {/* SECTION A: UPDATE LOBBY LIVE THINK UPDATES */}
          <div className="bg-gradient-to-r from-[#1C120F] to-black/20 border border-[#D98353]/30 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div>
                <h4 className="font-serif font-bold text-[#D98353] text-base">🔴 Update "Live Think" Global Status</h4>
                <p className="text-xs text-stone-400">This banner changes the live announcement at the top of every logged-in user dashboard (e.g. "Voice Practice in Progress").</p>
              </div>
            </div>

            <form onSubmit={handleUpdateLiveMessage} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="e.g. Classical fusion rehearsals are live in Room 2B!"
                  value={liveStatusText}
                  onChange={(e) => setLiveStatusText(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-black border border-white/15 text-xs text-white rounded-xl focus:border-[#D98353]"
                  required
                />
                <span className="absolute right-3.5 top-3.5 text-stone-500 text-xs">🛰️</span>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#D98353] hover:bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                📡 Broadcast Live Message
              </button>
            </form>
          </div>

          {/* SECTION B: CUSTOM BLOCKS WITH IMAGE ENGINES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create/Edit custom segment form */}
            <div className="lg:col-span-5 space-y-6">
              {selectedSec ? (
                /* EDIT FORM */
                <form onSubmit={handleUpdateCustomSection} className="bg-black/40 border border-[#D98353]/40 p-6 rounded-3xl space-y-5 shadow-2xl relative">
                  <div className="absolute -top-3 right-4 bg-[#D98353] text-black text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded shadow">
                    Active Edit mode
                  </div>
                  
                  <h4 className="font-serif font-bold text-white text-base">📝 Edit Segment Custom Block</h4>
                  <p className="text-[11px] text-stone-400">Modifying block details for: <strong className="text-amber-500">{selectedSec.title}</strong></p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1.5 uppercase">Segment Header Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Instrumentalists Recital"
                        value={editSecTitle}
                        onChange={(e) => setEditSecTitle(e.target.value)}
                        className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1.5 uppercase">Segment Content Block</label>
                      <textarea
                        placeholder="Write paragraphs, links, details..."
                        value={editSecContent}
                        onChange={(e) => setEditSecContent(e.target.value)}
                        rows={4}
                        className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none focus:border-[#D98353]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1.5 uppercase">Quick Links (Optional)</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Google Drive Link"
                          value={editSecDriveLink}
                          onChange={(e) => setEditSecDriveLink(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />
                        <input
                          type="text"
                          placeholder="Google Meet Link"
                          value={editSecMeetLink}
                          onChange={(e) => setEditSecMeetLink(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />
                        <input
                          type="text"
                          placeholder="Google Forms Link"
                          value={editSecFormLink}
                          onChange={(e) => setEditSecFormLink(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1.5 uppercase">Cover Image Option</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="HTTP cover image URL (optional)"
                          value={editSecImage}
                          onChange={(e) => setEditSecImage(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />

                        {/* Drag and Drop Image Box */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingEditSec(true); }}
                          onDragLeave={() => setIsDraggingEditSec(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingEditSec(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const f = e.dataTransfer.files[0];
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') setEditSecImage(reader.result);
                              };
                              reader.readAsDataURL(f);
                            }
                          }}
                          className={`border border-dashed p-4 rounded-xl text-center transition-all ${
                            isDraggingEditSec ? 'border-[#D98353] bg-[#D98353]/10 text-white' : 'border-white/10 hover:border-white/20 text-stone-500'
                          }`}
                        >
                          <span className="text-lg block mb-1">🖼️</span>
                          <p className="text-[10px] font-mono">Drag covers here or click to drop pictures</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const f = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') setEditSecImage(reader.result);
                                };
                                reader.readAsDataURL(f);
                              }
                            }}
                            className="hidden"
                            id="edit-sec-file"
                          />
                          <label htmlFor="edit-sec-file" className="text-[9px] text-[#D98353] underline cursor-pointer mt-1 block">
                            Browser Files Explorer
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Pre-sets selections */}
                    <div>
                      <span className="block text-[9px] font-mono text-stone-500 font-bold mb-1 uppercase">OR Quick Images Presets</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditSecImage('https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          🎵 Practice
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSecImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          🎹 Studio Jam
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSecImage('https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          🎤 Choir
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSecImage('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          📢 Notice
                        </button>
                      </div>
                    </div>

                    {editSecImage && (
                      <div className="p-2 bg-black/40 rounded-xl flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2">
                          <img src={editSecImage} className="w-8 h-8 rounded object-cover border border-white/15" alt="Preview" />
                          <span className="text-[10px] text-stone-400 font-mono">Cover Loaded</span>
                        </div>
                        <button type="button" onClick={() => setEditSecImage('')} className="text-[10px] text-red-400 hover:underline">
                          Clear Image
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      className="flex-grow py-2.5 bg-[#D98353] hover:bg-amber-500 hover:shadow-lg text-black font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                    >
                      💾 Update Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSec(null)}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* CREATE FORM */
                <form onSubmit={handleCreateCustomSection} className="bg-[#1C0F0B]/20 border border-[#4a2618]/30 p-6 rounded-3xl space-y-4 shadow-xl">
                  <h4 className="font-serif font-bold text-[#D98353] text-base">Create Dashboard Segment Custom Block</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Segment Header Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Vocal Choir rehearsal timings change"
                        value={newSecTitle}
                        onChange={(e) => setNewSecTitle(e.target.value)}
                        className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Segment Content Block</label>
                      <textarea
                        placeholder="Write the block paragraphs, directives, links, or monthly suggestion details..."
                        value={newSecContent}
                        onChange={(e) => setNewSecContent(e.target.value)}
                        rows={4}
                        className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none focus:border-[#D98353]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Quick Links (Optional)</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Google Drive Link"
                          value={newSecDriveLink}
                          onChange={(e) => setNewSecDriveLink(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />
                        <input
                          type="text"
                          placeholder="Google Meet Link"
                          value={newSecMeetLink}
                          onChange={(e) => setNewSecMeetLink(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />
                        <input
                          type="text"
                          placeholder="Google Forms Link"
                          value={newSecFormLink}
                          onChange={(e) => setNewSecFormLink(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-400 font-mono font-bold mb-1 uppercase">Cover Image Option</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="HTTP cover image URL (optional)"
                          value={newSecImage}
                          onChange={(e) => setNewSecImage(e.target.value)}
                          className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                        />

                        {/* Drag and Drop Image Box */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingSec(true); }}
                          onDragLeave={() => setIsDraggingSec(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingSec(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const f = e.dataTransfer.files[0];
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') setNewSecImage(reader.result);
                              };
                              reader.readAsDataURL(f);
                            }
                          }}
                          className={`border border-dashed p-4 rounded-xl text-center transition-all ${
                            isDraggingSec ? 'border-[#D98353] bg-[#D98353]/10 text-white' : 'border-white/10 hover:border-white/20 text-stone-500'
                          }`}
                        >
                          <span className="text-lg block mb-1">🖼️</span>
                          <p className="text-[10px] font-mono">Drag covers here or click to drop pictures</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const f = e.target.files[0];
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') setNewSecImage(reader.result);
                                };
                                reader.readAsDataURL(f);
                              }
                            }}
                            className="hidden"
                            id="new-sec-file"
                          />
                          <label htmlFor="new-sec-file" className="text-[9px] text-[#D98353] underline cursor-pointer mt-1 block">
                            Browser Files Explorer
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Pre-sets selections */}
                    <div>
                      <span className="block text-[9px] font-mono text-stone-500 font-bold mb-1 uppercase">OR Quick Images Presets</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewSecImage('https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          🎵 Practice
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewSecImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          🎹 Studio Jam
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewSecImage('https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          🎤 Choir
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewSecImage('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600')}
                          className="text-[9px] p-1 bg-white/5 border border-white/5 rounded text-stone-300 hover:border-[#D98353]/60 cursor-pointer"
                        >
                          📢 Notice
                        </button>
                      </div>
                    </div>

                    {newSecImage && (
                      <div className="p-2 bg-black/40 rounded-xl flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2">
                          <img src={newSecImage} className="w-8 h-8 rounded object-cover border border-white/15" alt="Preview" />
                          <span className="text-[10px] text-stone-400 font-mono">Image Loaded</span>
                        </div>
                        <button type="button" onClick={() => setNewSecImage('')} className="text-[10px] text-red-400 hover:underline">
                          Clear Image
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#D98353] hover:bg-amber-500 hover:shadow-lg text-black font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                  >
                    🚀 Live Publish Segment Block
                  </button>
                </form>
              )}
            </div>

            {/* List custom segments */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="font-serif font-bold text-white text-base">Active Custom Blocks</h4>
              <div className="max-h-160 overflow-y-auto space-y-4 pr-1">
                {customSectionsList.length === 0 ? (
                  <div className="text-center p-8 text-xs text-stone-600 border border-dashed border-stone-850 rounded-2xl bg-black/10">
                    No custom segments published. Create one on the left.
                  </div>
                ) : (
                  customSectionsList.map(s => (
                    <div key={s.id} className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <strong className="text-sm font-bold text-white block">{s.title}</strong>
                          <span className="text-[9px] text-[#D98353] font-mono block">Published: {s.created_at}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditCustomSection(s)}
                            className="px-2.5 py-1 bg-white/5 text-amber-500 border border-white/10 text-[10px] font-bold uppercase rounded hover:bg-[#D98353]/10 hover:text-white transition-all cursor-pointer"
                          >
                            📝 Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCustomSection(s.id)}
                            className="px-2.5 py-1 bg-red-950/20 text-red-400 border border-red-900/30 text-[10px] font-bold uppercase rounded hover:bg-red-950/50 transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {s.image_url && (
                        <div className="w-full h-32 rounded-xl overflow-hidden shadow-inner border border-white/5">
                          <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <p className="text-xs text-stone-400 whitespace-pre-wrap leading-relaxed">{s.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Tab 5: Notices Feed Tab ====== */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
          
          <form onSubmit={handlePublishNotice} className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs uppercase font-mono text-[#D98353] font-bold tracking-wider">Publish New Society Notice</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-[#AC9E94] font-bold font-mono mb-1">Notice Header</label>
                <input
                  type="text"
                  placeholder="e.g. Classical Auditions result list"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#AC9E94] font-bold font-mono mb-1">Body Text</label>
                <textarea
                  placeholder="Details of the announcement..."
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
              >
                Broadcast Notice Bullet 📢
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Notices List</h4>
            <div className="max-h-120 overflow-y-auto space-y-3 pr-2">
              {notices.map(n => (
                <div key={n.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex justify-between items-start gap-4">
                  <div>
                    <h5 className="font-bold text-white text-sm">{n.title}</h5>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">By {n.posted_by}</p>
                    <p className="text-xs text-[#AC9E94] mt-2 leading-relaxed">{n.content}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNotice(n.id)}
                    className="text-red-400 hover:text-red-500 text-[10px] uppercase font-bold"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ====== Tab 6: Practice Timetable ====== */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
          
          <form onSubmit={handleAddTimetable} className="lg:col-span-1 bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs uppercase font-mono text-[#D98353] font-bold tracking-wider">Register Timetable Slot</h4>
            <p className="text-[11px] text-[#AC9E94]">Schedule general rehearsals, custom workshops, lobby jams, and core officer meetings.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-[#AC9E94] mb-1 font-bold">Session Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hindustani Vocal Practice"
                  value={newTimeTitle}
                  onChange={(e) => setNewTimeTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#AC9E94] mb-1 font-bold">Category</label>
                  <select
                    value={newTimeType}
                    onChange={(e: any) => setNewTimeType(e.target.value)}
                    className="w-full h-10 px-2 bg-black border border-white/10 text-xs text-white rounded-xl"
                  >
                    <option value="Practice">Practice</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Lobby Jam">Lobby Jam</option>
                    <option value="Audition">Audition</option>
                    <option value="Core Meet">Core Meet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#AC9E94] mb-1 font-bold">Select Date</label>
                  <input
                    type="date"
                    value={newTimeDay}
                    onChange={(e) => setNewTimeDay(e.target.value)}
                    className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#AC9E94] mb-1 font-bold">Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 14:00"
                    value={newTimeStart}
                    onChange={(e) => setNewTimeStart(e.target.value)}
                    className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#AC9E94] mb-1 font-bold">End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 16:00"
                    value={newTimeEnd}
                    onChange={(e) => setNewTimeEnd(e.target.value)}
                    className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#AC9E94] mb-1 font-bold">Assign Target Group or Member</label>
                <select
                  value={timetableAssignType}
                  onChange={(e: any) => setTimetableAssignType(e.target.value)}
                  className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353]"
                >
                  <option value="All">All Society Members (Option All)</option>
                  <option value="Core">Core Members Only (Admin/President/Core)</option>
                  <option value="Alumni">Alumni Only (Verified Graduates)</option>
                  <option value="Individual">Select Multiple Individual Members</option>
                </select>
              </div>

              {timetableAssignType === 'Individual' && (
                <div className="space-y-1.5 p-3 bg-black border border-white/5 rounded-xl">
                  <label className="block text-[10px] text-[#AC9E94] font-bold">Select Multiple Members:</label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {profiles.filter(p => p.approved).map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTimetableMembers.includes(p.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTimetableMembers([...selectedTimetableMembers, p.name]);
                            } else {
                              setSelectedTimetableMembers(selectedTimetableMembers.filter(n => n !== p.name));
                            }
                          }}
                          className="rounded border-white/10 text-[#D98353] focus:ring-0 focus:ring-offset-0 bg-black"
                        />
                        <span>{p.name} ({p.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Meet Option */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeMeet"
                    checked={newTimeGoogleMeet}
                    onChange={(e) => setNewTimeGoogleMeet(e.target.checked)}
                    className="rounded border-white/10 text-[#D98353] focus:ring-0 focus:ring-offset-0 bg-black cursor-pointer"
                  />
                  <label htmlFor="includeMeet" className="text-[11px] font-mono font-bold text-stone-300 cursor-pointer select-none uppercase">
                    📹 Include Google Meet Link
                  </label>
                </div>
                
                {newTimeGoogleMeet && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="block text-[9px] uppercase font-mono text-[#AC9E94]">Google Meet URL (Leave empty for auto-generated link)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://meet.google.com/abc-defg-hij"
                      value={newTimeGoogleMeetUrl}
                      onChange={(e) => setNewTimeGoogleMeetUrl(e.target.value)}
                      className="w-full h-8 px-2.5 bg-black border border-white/15 focus:border-[#D98353] text-xs text-stone-200 rounded-lg outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-[#AC9E94] mb-1 font-bold">Description & Hall Venue</label>
                <textarea
                  placeholder="e.g. Practice Room 3B, vocal warmups for coming event..."
                  value={newTimeDesc}
                  onChange={(e) => setNewTimeDesc(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none outline-none focus:border-[#D98353]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-[#D98353] to-[#B35F30] text-black font-semibold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
              >
                Register Session Slot 📅
              </button>
            </div>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Active Timetables & Schedules</h4>
            <div className="max-h-120 overflow-y-auto space-y-2 pr-2">
              {timetableList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-xs text-[#AC9E94]">
                  No schedules loaded. Register a slot to begin.
                </div>
              ) : (
                timetableList.map(item => (
                  <div key={item.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center bg-black/30">
                    <div>
                      <h5 className="font-bold text-white text-sm">{item.title}</h5>
                      <p className="text-[10px] text-amber-500 font-mono">
                        {item.event_type} • {item.day_of_week} ({item.start_time} - {item.end_time})
                      </p>
                      {item.assigned_to && (
                        <p className="text-[10px] font-mono text-[#D98353] mt-0.5">
                          🎯 Target Audience: {item.assigned_to === 'All' ? 'All Society Members' : `Particular Member: ${item.assigned_to}`}
                        </p>
                      )}
                      <p className="text-xs text-stone-400 mt-1">{item.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Permanently remove timetable slot: "${item.title}"?`);
                        if (confirmed) {
                          handleDeleteTimetable(item.id);
                        }
                      }}
                      className="text-red-400 font-bold hover:underline cursor-pointer text-xs shrink-0 pl-4"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ====== Tab 7: Monthly Targets ====== */}
      {activeTab === 'targets' && (
        <div className="bg-white/[0.02] border border-white/10 p-6 sm:p-8 rounded-2xl text-left space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl text-left">
              <h3 className="text-lg font-serif font-bold text-white">Dispatch New Monthly Target Task</h3>
              <p className="text-xs text-stone-400 mt-1">Core members and presidents can assign specific performance goals to any approved student member.</p>
            </div>
            <button
              type="button"
              onClick={handleExportTasksCSV}
              className="px-5 h-10 border border-[#D98353]/30 bg-black/30 hover:bg-[#D98353]/10 hover:shadow-[0_0_15px_rgba(217,131,83,0.15)] text-[#D98353] font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              📥 Export Tasks CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <form onSubmit={handleAddTarget} className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-[#D98353] font-bold mb-1 uppercase">Target Header</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Classical practice log"
                  value={newTargTitle}
                  onChange={(e) => setNewTargTitle(e.target.value)}
                  className="w-full h-10 px-3.5 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#D98353] font-bold mb-1 uppercase font-bold">Assigned Student Member (Dropdown Coupling)</label>
                <select
                  value={newTargAssign}
                  onChange={(e) => setNewTargAssign(e.target.value)}
                  className="w-full h-10 px-2 bg-black border border-white/10 text-xs text-[#ECE6E1] rounded-xl focus:border-[#D98353] outline-none"
                  required
                >
                  <option value="">-- Choose Member --</option>
                  <option value="All">All Society Members</option>
                  {profiles.filter(p => p.approved && p.role === 'member').map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#D98353] font-bold mb-1 uppercase">Due Date</label>
                <input
                  type="date"
                  value={newTargDate}
                  onChange={(e) => setNewTargDate(e.target.value)}
                  className="w-full h-10 px-3 bg-black border border-white/10 text-xs text-white rounded-xl focus:border-[#D98353]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#D98353] font-bold mb-1 uppercase">Task Specifications</label>
                <textarea
                  placeholder="Required rehearsal hours, deliverables, or checklist..."
                  value={newTargDesc}
                  onChange={(e) => setNewTargDesc(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-black border border-white/10 text-xs text-white rounded-xl resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#D98353] hover:bg-amber-500 text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                🚀 Dispatch Monthly Target
              </button>
            </form>

            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm uppercase tracking-wide">Target Dispatch Queue</h4>
              <div className="max-h-120 overflow-y-auto space-y-3.5 pr-2">
                {targets.map(t => (
                  <div key={t.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-white text-sm truncate">{t.title}</h5>
                      <p className="text-[10px] text-[#D98353] font-mono mt-0.5">Assigned to: <strong className="text-white">{t.assigned_to}</strong> | Due: {t.due_date}</p>
                      
                      {/* State Tracker badge */}
                      <div className="flex items-center gap-2.5 mt-2">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          t.status === 'completed' 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                            : 'bg-amber-950/40 text-[#D98353] border border-[#D98353]/30'
                        }`}>
                          {t.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                        </span>
                        <span className="text-[10px] font-mono text-[#AC9E94]">
                          Progress: <strong className="text-white">{t.progress || 0}%</strong>
                        </span>
                      </div>

                      {t.description && <p className="text-xs text-stone-400 mt-2 leading-relaxed">{t.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleTargetStatus(t.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          t.status === 'completed'
                            ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                            : 'bg-[#D98353] hover:bg-amber-500 text-black'
                        }`}
                      >
                        {t.status === 'completed' ? 'Undo' : 'Mark Done'}
                      </button>
                      <button
                        onClick={() => handleDeleteTarget(t.id)}
                        className="text-red-400 font-bold hover:underline cursor-pointer text-[10px] uppercase font-mono"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Tab 8: settings_backup (Confirm & Export Panel) ====== */}
      {activeTab === 'settings_backup' && (
        <div className="space-y-6 text-left animate-fadeIn">
          {/* Header */}
          <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
            <h3 className="font-serif text-lg font-bold text-[#ECE6E1]">⚙️ Settings & Database backups</h3>
            <p className="text-xs text-[#AC9E94] mt-1 font-mono uppercase tracking-wider">
              Protect your configurations. Review registries, download safety CSV / JSON exports, or customize branding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Data Confirm Checklists & Branding */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Data Confirm Checklists */}
              <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-6">
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#D98353] uppercase tracking-wider mb-2">🎯 Confirm Your Edited Stuff</h4>
                  <p className="text-xs text-stone-400 leading-relaxed mb-4">
                    All local modifications are currently written & active in local storage. Below is the live tally of your updated registers:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[#120F0D] border border-white/5 p-3 rounded-xl text-xs font-mono">
                      <span className="text-stone-300">👥 Approved Student Roster</span>
                      <span className="text-[#D98353] font-bold">{profiles.filter(p => p.approved).length} Profiles</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#120F0D] border border-white/5 p-3 rounded-xl text-xs font-mono">
                      <span className="text-stone-300">📢 Active Notice Feeds</span>
                      <span className="text-[#D98353] font-bold">{notices.length} Notices</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#120F0D] border border-white/5 p-3 rounded-xl text-xs font-mono">
                      <span className="text-stone-300">🎹 Active Stage Events</span>
                      <span className="text-[#D98353] font-bold">{events.length} Events</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#120F0D] border border-white/5 p-3 rounded-xl text-xs font-mono">
                      <span className="text-stone-300">🎬 Media Hall Directory Lists</span>
                      <span className="text-[#D98353] font-bold">{events.length} Folders</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#120F0D] border border-white/5 p-3 rounded-xl text-xs font-mono">
                      <span className="text-stone-300">🎸 Core Officers List</span>
                      <span className="text-[#D98353] font-bold">{coreMembersList.length} Officers</span>
                    </div>
                  </div>

                  <div className="mt-5 p-3 bg-[#1A3A2A]/20 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-xl flex items-center gap-2">
                    <span className="text-xs">✓</span>
                    <span>Auto-saved state is 100% active in this browser.</span>
                  </div>
                </div>
              </div>

              {/* President Only: Custom Logo Controller */}
              <div className="bg-gradient-to-br from-[#2D1B13] to-[#120F0D] border border-[#D98353]/20 p-5 rounded-2xl space-y-4">
                <h4 className="font-serif text-xs font-bold text-[#D98353] uppercase tracking-wider">🎨 Custom Logo Branding</h4>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Upload a custom PNG/JPG logo to replace the default frames globally (Sidebar, Mobile Header, and Login screen).
                </p>
                
                {(() => {
                  const siteContent = dbInstance.getSiteContent() || [];
                  const customLogoItem = siteContent.find(x => x.content_key === 'custom_logo');
                  const currentLogo = customLogoItem ? customLogoItem.content_value : '';

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-3 rounded-xl">
                        <div className="w-12 h-12 rounded-full border border-dashed border-[#D98353]/40 bg-[#D98353]/5 flex items-center justify-center shrink-0 overflow-hidden">
                          {currentLogo ? (
                            <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-[#D98353]/40 font-mono font-bold">Blank</span>
                          )}
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-mono text-[#D98353] font-bold block">Status</span>
                          <span className="text-xs text-stone-300 font-bold font-sans">
                            {currentLogo ? 'Custom Upload Active' : 'Blank Option / Empty Frame'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const fileInput = document.createElement('input');
                            fileInput.type = 'file';
                            fileInput.accept = 'image/png, image/jpeg, image/jpg';
                            fileInput.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (!file) return;
                              if (!file.type.match('image/png') && !file.type.match('image/jpeg') && !file.type.match('image/jpg')) {
                                onRequestToast('Please select a PNG or JPG/JPEG image.', 'error');
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
                                  onRequestToast('Branding logo updated successfully!', 'success');
                                  if (onRefreshTrigger) onRefreshTrigger();
                                }
                              };
                              reader.readAsDataURL(file);
                            };
                            fileInput.click();
                          }}
                          className="flex-grow h-9 bg-[#D98353]/15 hover:bg-[#D98353]/25 text-[#D98353] font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          📷 Upload Logo
                        </button>

                        {currentLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              const confirmReset = window.confirm('Are you sure you want to delete this custom logo and revert to the blank option?');
                              if (!confirmReset) return;
                              const current = dbInstance.getSiteContent() || [];
                              const updated = current.filter(x => x.content_key !== 'custom_logo');
                              dbInstance.saveSiteContent(updated);
                              onRequestToast('Custom logo deleted. Reverted to blank option.', 'info');
                              if (onRefreshTrigger) onRefreshTrigger();
                            }}
                            className="h-9 px-3 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-semibold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center"
                            title="Reset Logo to Blank Frame"
                          >
                            🗑️ Reset
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Right Column: Data Portability & CSV Exporters */}
            <div className="lg:col-span-6 bg-black/40 border border-white/5 p-6 rounded-2xl space-y-6">
              <div>
                <h4 className="font-serif text-sm font-bold text-[#D98353] uppercase tracking-wider mb-2">📥 Data Portability & Governance</h4>
                <p className="text-xs text-stone-400 leading-relaxed mb-4">
                  Export administrative records, rosters, settings, and full system backup archives. Downloaded files can be saved for security, audit, and offline reporting.
                </p>

                <div className="space-y-4">
                  {/* Export Settings CSV */}
                  <div className="bg-[#120F0D] border border-white/5 p-4.5 rounded-xl space-y-3 text-left">
                    <span className="text-[#D98353] font-mono text-[10px] uppercase font-bold tracking-wider block">📊 Roster Settings & Rankings</span>
                    <p className="text-[11px] text-[#AC9E94] leading-relaxed">
                      Download members' details, including their bio, course, points standing, and pre-calculated leader ranking.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportSettingsCSV}
                      className="w-full h-11 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_15px_rgba(217,131,83,0.3)] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 font-mono"
                    >
                      📊 Export Settings CSV
                    </button>
                  </div>

                  {/* Export Member Roster Excel/CSV */}
                  <div className="bg-[#120F0D] border border-white/5 p-4.5 rounded-xl space-y-3 text-left">
                    <span className="text-[#D98353] font-mono text-[10px] uppercase font-bold tracking-wider block">👥 Society General Member Roster</span>
                    <p className="text-[11px] text-[#AC9E94] leading-relaxed">
                      Download the full society registration ledger, showing all active student members' role standing, monthly mandates, and scores.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportToExcel}
                      className="w-full h-11 border border-[#D98353]/30 bg-black/30 hover:bg-[#D98353]/10 hover:shadow-[0_0_15px_rgba(217,131,83,0.15)] text-[#D98353] font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      📋 Export Member Roster CSV
                    </button>
                  </div>

                  {/* Download Master Backup button */}
                  <div className="bg-[#120F0D] border border-white/5 p-4.5 rounded-xl space-y-3 text-left">
                    <span className="text-[#D98353] font-mono text-[10px] uppercase font-bold tracking-wider block">🧬 Complete Master JSON Backup</span>
                    <p className="text-[11px] text-[#AC9E94] leading-relaxed">
                      Download the absolute binary database containing all tables: profiles, performances, events, recitals, and notices.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const backup = {
                          profiles: dbInstance.getProfiles(),
                          performance: dbInstance.getPerformance(),
                          notices: dbInstance.getNotices(),
                          events: dbInstance.getEvents(),
                          achievements: dbInstance.getAchievements(),
                          merchandise: dbInstance.getMerchandise(),
                          media_folders: dbInstance.getMediaFolders(),
                          core_members: dbInstance.getCoreMembers(),
                          core_performance: dbInstance.getCorePerformance(),
                          timetable: dbInstance.getTimetable(),
                          monthly_targets: dbInstance.getMonthlyTargets(),
                          suggestions: dbInstance.getSuggestions(),
                          site_content: dbInstance.getSiteContent(),
                          alumni: dbInstance.getAlumni(),
                          custom_sections: dbInstance.getCustomSections()
                        };
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
                        const dlAnchor = document.createElement('a');
                        dlAnchor.setAttribute("href", dataStr);
                        dlAnchor.setAttribute("download", "malhaar_society_master_backup.json");
                        document.body.appendChild(dlAnchor);
                        dlAnchor.click();
                        dlAnchor.remove();
                        onRequestToast("Master backup JSON downloaded! Save this file to protect your configurations.", "success");
                      }}
                      className="w-full h-11 border border-stone-800 bg-black/30 hover:bg-stone-900 text-stone-300 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      📥 Export Master Backup File
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Tech Stack & App Code Information Section */}
          <div className="bg-[#120F0D]/85 border border-white/10 p-6 rounded-2xl space-y-4">
            <h4 className="font-serif text-sm font-bold text-[#D98353] uppercase tracking-wider flex items-center gap-2">
              🖥️ System Tech Stack & Core Architecture File Map
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              This application is built with a state-of-the-art modular full-stack structure. Here is the technical overview of the technologies, directory structures, and code architecture running this platform:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2 bg-black/40 border border-white/5 p-4 rounded-xl text-left">
                <span className="text-[#D98353] font-bold font-mono uppercase tracking-wider text-[10px] block">⚡ The Core Technology Stack</span>
                <ul className="space-y-1.5 text-stone-400 font-sans list-disc list-inside">
                  <li><strong className="text-stone-300">Framework</strong>: React 18+ with TypeScript & Vite Build Toolchain</li>
                  <li><strong className="text-stone-300">Styling & UI</strong>: Tailwind CSS, Custom Responsive Layouts, Glassmorphism Backdrop Blurs</li>
                  <li><strong className="text-stone-300">Audio Synthesis</strong>: Web Audio API Oscillator Nodes, Custom Swar & Taal Tuning Matrix</li>
                  <li><strong className="text-stone-300">Data Visualizer</strong>: Recharts library for dynamic attendance & task charts</li>
                  <li><strong className="text-stone-300">Workspace Integration</strong>: Firebase Auth, Google APIs, and client-side cached auth states</li>
                </ul>
              </div>
              
              <div className="space-y-2 bg-black/40 border border-white/5 p-4 rounded-xl text-left">
                <span className="text-[#D98353] font-bold font-mono uppercase tracking-wider text-[10px] block">📁 Architecture & Code Map</span>
                <div className="space-y-1.5 font-mono text-[10px] text-stone-400">
                  <p><span className="text-stone-200">/src/App.tsx</span> - Main entry routing & layout viewport</p>
                  <p><span className="text-stone-200">/src/db/mockDb.ts</span> - Storage cache & database persistence layer</p>
                  <p><span className="text-stone-200">/src/components/WorkspaceHubView.tsx</span> - Google Workspace Sync Desk</p>
                  <p><span className="text-stone-200">/src/components/MusicLabView.tsx</span> - Classical synthesizer & ragas</p>
                  <p><span className="text-stone-200">/src/lib/workspaceAuth.ts</span> - Google Auth & token state management</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ====== Custom Delete Confirmation Modal (Iframe Sandbox Safe) ====== */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-fadeIn text-left">
          <div className="bg-[#1C0F0B] border-2 border-red-500/35 p-6 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center space-y-5">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h4 className="font-serif text-lg font-bold text-red-400">
                Administrative Confirmation Requested
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Are you absolutely sure you want to perform this permanent operation? This action is hard-written and cannot be undone.
              </p>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] font-mono text-amber-500 font-bold block overflow-hidden text-ellipsis whitespace-nowrap">
                [{deleteConfirmation.type.toUpperCase()}] {deleteConfirmation.name}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 h-10 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer font-mono border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmation.extraAction) {
                    deleteConfirmation.extraAction();
                  }
                  setDeleteConfirmation(null);
                }}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-900/30 font-mono"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
