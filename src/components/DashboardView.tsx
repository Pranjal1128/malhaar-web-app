import React, {useState, useEffect} from 'react';
import { ChevronUp, ChevronDown, Search, Users, Shield, Star, Terminal, Landmark, Bell, Trash2, Eye, Target, Sparkles, Clapperboard, Plus, Image as ImageIcon, Folder, Video, FileText, FolderOpen, Rocket, RefreshCw, Calendar, Globe, Award } from 'lucide-react';
import {dbInstance, Profile, ClubEvent, Achievement, Merchandise, MediaFolder, Alumni, CustomSection, CoreMember} from '../db/mockDb';
import {compressImageBase64} from '../db/imageCompressor';

interface DashboardViewProps {
  currentUser?: Profile | null;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRefreshTrigger?: () => void;
}

export default function DashboardView({currentUser, onRequestToast, onRefreshTrigger}: DashboardViewProps) {
  // Database tables
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [mediaFolders, setMediaFolders] = useState<MediaFolder[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [myTargets, setMyTargets] = useState<any[]>([]);
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([]);

  // Filtering views by year
  const [eventYear, setEventYear] = useState<string>('All');
  const [achievementYear, setAchievementYear] = useState<string>('default_recent');
  const [merchYear, setMerchYear] = useState<string>('All');

  // Collapsible toggle states
  const [visionOpen, setVisionOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [showMembersRoster, setShowMembersRoster] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDomainFilter, setRosterDomainFilter] = useState<'All' | 'Classical' | 'Western' | 'Rapper' | 'Instrumentalist' | 'Production'>('All');

  // Active cover index tracker for Media Hall folders
  const [folderCovers, setFolderCovers] = useState<Record<string, string>>({});

  // Picture Upload Simulation States inside the Gallery!
  const [showGalleryUpload, setShowGalleryUpload] = useState(false);
  const [uploadEventName, setUploadEventName] = useState('');
  const [uploadEventDesc, setUploadEventDesc] = useState('');
  const [uploadEventCat, setUploadEventCat] = useState<'Classical' | 'Western' | 'Fusion' | 'Production' | 'Jam'>('Fusion');
  const [uploadEventDate, setUploadEventDate] = useState('2026-06-20');
  const [uploadDriveLink, setUploadDriveLink] = useState('');
  const [uiImagePreview, setUiImagePreview] = useState<string>('');

  const handleDeleteLobbySegment = (id: string, name: string) => {
    const current = dbInstance.getCustomSections() || [];
    const updated = current.filter(s => s.id !== id);
    dbInstance.saveCustomSections(updated);
    onRequestToast(`Lobby Segment "${name}" removed.`, 'info');
    loadData();
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const loadData = () => {
    // Read from localStorage-backed database simulation
    const content = dbInstance.getSiteContent();
    const contentMap: Record<string, string> = {};
    content.forEach(item => {
      contentMap[item.content_key] = item.content_value;
    });
    setSiteContent(contentMap);
    setEvents(dbInstance.getEvents());
    setAchievements(dbInstance.getAchievements());
    setMerchandise(dbInstance.getMerchandise());
    setMediaFolders(dbInstance.getMediaFolders() || []);
    setProfiles(dbInstance.getProfiles());
    setAlumni(dbInstance.getAlumni() || []);
    setCustomSections(dbInstance.getCustomSections() || []);
    setCoreMembers(dbInstance.getCoreMembers() || []);

    const allTargets = dbInstance.getMonthlyTargets() || [];
    if (currentUser) {
      // Find targets specifically assigned to this logged-in person
      const mine = allTargets.filter(t => 
        t.assigned_to.toLowerCase() === currentUser.name.toLowerCase() || 
        t.assigned_to.toLowerCase() === currentUser.role.toLowerCase()
      );
      setMyTargets(mine);
    }
  };

  useEffect(() => {
    loadData();
    // Setup listener for general storage and custom database updates
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('malhaar-db-update', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('malhaar-db-update', handleStorageChange);
    };
  }, [currentUser]);

  // Handle Target Progress change locally
  const handleUpdateTargetProgress = (targetId: string, value: number) => {
    const allTargets = dbInstance.getMonthlyTargets();
    const updated = allTargets.map(t => {
      if (t.id === targetId) {
        return {
          ...t,
          progress: value,
          status: (value >= 100 ? 'completed' : value > 0 ? 'in-progress' : 'pending') as 'completed' | 'in-progress' | 'pending'
        };
      }
      return t;
    });
    dbInstance.saveMonthlyTargets(updated);
    onRequestToast('Monthly target progress recorded and saved!', 'success');
    loadData();
    if (onRefreshTrigger) onRefreshTrigger();
  };

  // Gallery File Uploading via Base64 simulation
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageBase64(file).then(base64 => {
        setUiImagePreview(base64);
      });
    }
  };

  const handleCreateGalleryEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadEventName.trim() || !uploadEventDesc.trim()) {
      onRequestToast('Please complete name and description fields.', 'error');
      return;
    }

    const imgUrl = uiImagePreview || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400";
    const newEv: ClubEvent = {
      id: `event_${Date.now()}`,
      name: uploadEventName,
      description: uploadEventDesc,
      category: uploadEventCat,
      event_date: uploadEventDate,
      image_url: imgUrl,
      year: uploadEventDate.split('-')[0] || '2026',
      drive_link: uploadDriveLink.trim() || undefined
    };

    const currentEvs = dbInstance.getEvents();
    currentEvs.unshift(newEv);
    dbInstance.saveEvents(currentEvs);
    
    onRequestToast(`Event "${uploadEventName}" uploaded and saved to database successfully!`, 'success');
    
    // reset states
    setUploadEventName('');
    setUploadEventDesc('');
    setUploadDriveLink('');
    setUiImagePreview('');
    setShowGalleryUpload(false);
    loadData();
    if (onRefreshTrigger) onRefreshTrigger();
  };

  const handleDeleteGalleryEvent = (id: string, name: string) => {
    const confirmDelete = window.confirm(`⚠️ DANGER: Are you absolutely sure you want to permanently delete event memory folder: "${name}"?\nThis will remove the drive connection and media record from the registry forever.`);
    if (confirmDelete) {
      const currentEvs = dbInstance.getEvents();
      const updated = currentEvs.filter(e => e.id !== id);
      dbInstance.saveEvents(updated);
      onRequestToast(`Event memory folder "${name}" was permanently purged.`, 'error');
      loadData();
      if (onRefreshTrigger) onRefreshTrigger();
    }
  };

  // Filter lists
  const filteredEvents = eventYear === 'All' 
    ? events 
    : events.filter(e => e.year === eventYear);

  // Active selection year logic for achievements
  const achievementYears = Array.from(new Set(achievements.map(a => a.year))).sort().reverse();
  const mostRecentAchievementYear = achievementYears[0] || '';
  const activeAchievementYear = achievementYear === 'default_recent' ? mostRecentAchievementYear : achievementYear;

  const filteredAchievements = activeAchievementYear === 'All'
    ? achievements
    : activeAchievementYear === 'previous'
    ? achievements.filter(a => a.year !== mostRecentAchievementYear)
    : achievements.filter(a => a.year === activeAchievementYear);

  const filteredMerchandise = merchYear === 'All'
    ? merchandise
    : merchandise.filter(m => m.year === merchYear);

  // Year choices derived from actual entries
  const availableEventYears = ['All', ...Array.from(new Set(events.map(e => e.year))).sort().reverse()];
  const availableAchievementYears = ['All', ...achievementYears];
  const availableMerchYears = ['All', ...Array.from(new Set(merchandise.map(m => m.year))).sort().reverse()];

  const handleMerchPurcahse = (itemName: string) => {
    onRequestToast(`Purchase simulation initiated for high-fidelity: "${itemName}". In-studio pre-order saved!`, 'success');
  };

  // Mandate System Counter
  // Calculates consecutive crossed mandates across all 12 months
  const getConsecutiveMisses = (mandates: any): number => {
    if (!mandates) return 0;
    let streak = 0;
    let maxStreak = 0;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (let m of months) {
      if (mandates[m] === 'crossed') {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 0;
      }
    }
    return maxStreak;
  };

  const currentMisses = currentUser?.mandates ? getConsecutiveMisses(currentUser.mandates) : 0;

  return (
    <div className="space-y-12 animate-fade-in pb-16 relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* ====== NOTIFICATIONS & SYSTEM SYNC ACTIVE ALERT ====== */}
      {currentUser && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-[#1C120F] to-black/20 border border-white/10 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D98353] animate-ping shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-[#D98353] font-mono uppercase tracking-wide">Lobby Sync Active</h5>
                <p className="text-[11px] text-[#AC9E94]">You are signed in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role}). Live schedules and recital folders are updated dynamically.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-white/5 text-[#ECE6E1] px-2.5 py-1 rounded border border-white/10">v3.9 STABLE</span>
          </div>
        </div>
      )}

      {/* ====== 1. HERO PANEL ====== */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-14 shadow-[0_40px_80px_rgba(0,0,0,0.9)] flex flex-col md:flex-row items-center justify-between gap-12 text-left">
        {/* Glow circles behind text */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#D98353]/15 blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#E6AF2E]/10 blur-[100px] pointer-events-none" />
        
        <div className="space-y-6 max-w-xl relative ::z-10 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#2A160F]/80 text-[#D98353] border border-[#D98353]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_20px_rgba(217,131,83,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D98353] animate-pulse" />
            {siteContent.live_status_text || 'Season Auditions Live'}
          </span>
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-serif leading-tight font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-[#ECE6E1] to-[#8C7D73] drop-shadow-sm">
              MALHAAR
            </h1>
            <h2 className="text-base sm:text-lg font-medium text-gradient-copper tracking-wider font-serif">
              The Music Society of Motilal Nehru College (Morning)
            </h2>
            <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500 uppercase font-bold tracking-widest">
              <span>Established in 2010</span>
              <span>•</span>
              <span className="text-amber-500">16+ Years of Harmonic Legacy</span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[#AC9E94] leading-relaxed">
            Welcome to the official sanctuary of collegiate musical excellence. Connecting Indian Classical lineages, raga elements, and global beats of Motilal Nehru College Morning since 2010.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#media-gallery"
              className="px-8 py-3.5 premium-button rounded-xl"
            >
              Explore MEDIA HALL OF MALHAAR
            </a>
            <a
              href="#about"
              className="px-8 py-3.5 glass-panel glass-panel-hover text-[#ECE6E1] font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              About the Society
            </a>
          </div>
        </div>

        {/* Floating Graphics Container */}
        <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center relative z-10 animate-float-slow">
          <div className="absolute inset-4 rounded-full border border-dashed border-[#D98353]/30 animate-[spin_40s_linear_infinite]" />
          <div className="absolute inset-12 rounded-full border border-white/10 animate-[spin_20s_linear_infinite_reverse]" />
          
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-br from-[#D98353] via-[#B35F30] to-[#803816] flex items-center justify-center p-[2px] shadow-[0_0_50px_rgba(217,131,83,0.4)] z-10">
            <div className="w-full h-full rounded-full bg-[#0A0807] flex flex-col items-center justify-center text-[#ECE6E1] relative overflow-hidden group">
              <span className="text-6xl font-serif select-none text-gradient-copper group-hover:scale-110 transition-transform duration-500">♫</span>
              <span className="text-[10px] uppercase font-bold text-[#8C7D73] mt-2 tracking-[0.3em] font-mono">Est. 2010</span>
            </div>
          </div>
          
          <div className="absolute top-8 left-8 w-10 h-10 rounded-full bg-gradient-to-r from-[#E6AF2E] to-amber-600 flex items-center justify-center text-sm text-[#120F0D] font-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_20px_rgba(230,175,46,0.4)] select-none">♭</div>
          <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-gradient-to-r from-[#D98353] to-[#B35F30] flex items-center justify-center text-base text-[#120F0D] font-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_20px_rgba(217,131,83,0.4)] select-none">♯</div>
        </div>
      </section>

      {/* ====== 2. KEY STATS (ACCURATE MEMBER LIST COUPLING) ====== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div 
          onClick={() => setShowMembersRoster(!showMembersRoster)}
          className="glass-panel glass-panel-hover rounded-2xl p-6 text-center relative group overflow-hidden cursor-pointer select-none"
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#D98353]/20 blur-2xl pointer-events-none" />
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D98353] font-bold mb-2">Registered Active Members</h3>
          {/* Output real current count from database */}
          <p className="text-5xl font-serif font-bold text-[#ECE6E1] tracking-tight group-hover:scale-105 transition-transform duration-300">
            {profiles.filter(p => p.role === 'member' && p.approved).length} <span className="text-lg text-stone-500 font-sans tracking-normal">Active</span>
          </p>
          <p className="text-[10px] text-amber-500/90 font-mono mt-2 flex items-center justify-center gap-1 font-bold">
            <span className="flex items-center gap-1.5 justify-center">{showMembersRoster ? <><ChevronUp size={14} /> Collapse directory roster</> : <><ChevronDown size={14} /> Expand full profile directory <Search size={12} /></>}</span>
          </p>
        </div>
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 text-center relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#E6AF2E]/15 blur-2xl pointer-events-none" />
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D98353] font-bold mb-2">Media Hall Archive</h3>
          <p className="text-5xl font-serif font-bold text-[#ECE6E1] tracking-tight group-hover:scale-105 transition-transform duration-300">
            {events.length} <span className="text-lg text-stone-500 font-sans tracking-normal">Items</span>
          </p>
          <p className="text-xs text-[#AC9E94] mt-2 font-medium">Society clips, jam recordings & picture drives</p>
        </div>
        <div className="glass-panel glass-panel-hover rounded-2xl p-6 text-center relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#D98353]/15 blur-2xl pointer-events-none" />
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D98353] font-bold mb-2">Trophy Achievements</h3>
          <p className="text-5xl font-serif font-bold text-[#ECE6E1] tracking-tight group-hover:scale-105 transition-transform duration-300">
            {achievements.length} <span className="text-lg text-stone-500 font-sans tracking-normal">Medals</span>
          </p>
          <p className="text-xs text-[#AC9E94] mt-1.5">1st place state choir trophies and badges</p>
        </div>
      </section>

      {/* ====== ACTIVE REGISTERED PORTRAITS DRAWER (PROFILE OF EVERY ONE IS VISIBLE!) ====== */}
      {showMembersRoster && (
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#ECE6E1] flex items-center gap-2">
                <span className="flex items-center gap-2"><Users size={18} /> Society Register Directory</span>
                <span className="text-[10px] font-mono bg-[#2A160F] text-[#D98353] px-2 py-0.5 rounded-lg border border-[#D98353]/20">Approved Roster</span>
              </h4>
              <p className="text-xs text-[#AC9E94] mt-1">Browse active approved singers, players, and technical production members.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Filter by name..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="px-3 py-1.5 bg-black border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353] w-40 font-mono"
              />
              <select
                value={rosterDomainFilter}
                onChange={(e) => setRosterDomainFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-black border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353] text-[11px]"
              >
                <option value="All">All Domains</option>
                <option value="Classical">Classical Domain</option>
                <option value="Western">Western Domain</option>
                <option value="Rapper">Rapper Domain</option>
                <option value="Instrumentalist">Instrumentalist Domain</option>
                <option value="Production">Production Domain</option>
              </select>
            </div>
          </div>

          {(() => {
            const approvedProfiles = profiles.filter(p => p.approved);
            const filtered = approvedProfiles.filter(p => {
              const matchesDomain = rosterDomainFilter === 'All' || p.domain === rosterDomainFilter;
              const matchesSearch = p.name.toLowerCase().includes(rosterSearch.toLowerCase()) || 
                                   (p.bio && p.bio.toLowerCase().includes(rosterSearch.toLowerCase())) ||
                                   p.role.toLowerCase().includes(rosterSearch.toLowerCase());
              return matchesDomain && matchesSearch;
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-8 text-xs text-stone-500 font-mono">
                  No matching active registered profiles found in the registry.
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {filtered.map((p, idx) => (
                  <div key={p.id || `profile_${idx}`} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3 hover:border-[#D98353]/35 hover:bg-black/60 transition-all">
                    <img
                      src={p.profile_image_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-[#D98353]/30 shrink-0"
                      onError={(e) => {
                        (e.target as any).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
                      }}
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <strong className="text-xs text-white block truncate">{p.name}</strong>
                      <span className="text-[9px] font-mono font-bold text-[#D98353] uppercase tracking-wider block">
                        {p.role.toUpperCase()} • {p.domain}
                      </span>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5 italic">
                        {p.bio || "Malhaar Active Member."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ====== 2B. THE CORE OFFICERS & DEVELOPERS LEAGUE ====== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        {/* Core Members Guild */}
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-lg font-serif font-bold text-[#ECE6E1] flex items-center gap-2">
              <span className="flex items-center gap-2"><Shield size={18} /> Core Member and Serving Body of Society</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </h3>
            <p className="text-xs text-[#AC9E94]">The official active Core board members managing rehearsals, schedules, and recital categories.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {(() => {
              // Display only starred core members as curated on the main screen, excluding admins
              const currentCoreDisplay = coreMembers
                .filter(member => member.is_starred && member.role_key !== 'admin')
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
                });

              if (currentCoreDisplay.length === 0) {
                return (
                  <div className="p-4 text-center text-xs text-stone-500 font-mono bg-black/20 rounded-xl col-span-2">
                    No active core officers are currently registered.
                  </div>
                );
              }

              return currentCoreDisplay.map((member, idx) => (
                <div key={member.id || `core_${idx}`} className="glass-panel glass-panel-hover p-3 rounded-xl flex items-center gap-4 transition-all">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-[#D98353]/40 bg-[#2A160F] flex items-center justify-center">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-serif text-[#D98353] font-bold">{member.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold text-white truncate leading-none mb-1.5 flex items-center gap-1">
                      <span>{member.name}</span>
                      {member.is_starred && <span className="text-[10px] text-yellow-400"><Star size={12} fill="currentColor" /></span>}
                    </p>
                    <p className="text-[10px] text-[#D98353] font-medium leading-none font-mono tracking-wider truncate mb-1">
                      {member.position.toUpperCase() || 'CORE OFFICER'} • {member.tenure}
                    </p>
                    <p className="text-[9.5px] text-stone-500 truncate leading-none mt-1">
                      {member.description || 'Active Administrator Officer'}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Dedicated App Developers Showcase Section */}
        <div className="bg-[#1c120f] border border-[#D98353]/20 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-lg font-serif font-bold text-gradient bg-gradient-to-r from-amber-400 to-[#D98353] bg-clip-text text-transparent flex items-center gap-2">
              <span className="flex items-center gap-2"><Terminal size={18} /> APP ARCHITECTS & DEVELOPERS</span>
            </h3>
            <p className="text-xs text-[#AC9E94]">The digital design and technology engineers who crafted and optimized the Malhaar ecosystem.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 items-center bg-black/40 p-4 border border-white/5 rounded-2xl">
            {siteContent.developer_picture ? (
              <img
                src={siteContent.developer_picture}
                alt="Lead Software Engineer Developer"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#D98353]/50 shrink-0"
              />
            ) : null}
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-serif font-extrabold text-[#ECE6E1]">{siteContent.developer_name || "Lead Technical Systems Architect"}</h4>
              <p className="text-[10px] text-amber-500 font-bold font-mono uppercase tracking-wider">{siteContent.developer_chapter || "MALHAAR TECH COMMAND CHAPTER"}</p>
              <p className="text-xs text-[#AC9E94] leading-relaxed">
                {siteContent.about_developer || "Responsible for full-stack engineering, secure local/server persistence layers, fine-grained point evaluations ledger desks, and password-protected cabinet gates."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== 4. LOBBY SHOWCASE & BULLETIN SECTION ====== */}
      {customSections && customSections.length > 0 && (
        <section className="space-y-6 text-left bg-gradient-to-b from-[#1C0F0B] to-black/35 rounded-3xl p-6 sm:p-8 border border-[#4a2618]/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <span className="font-mono text-[10px] text-[#D98353] font-bold uppercase tracking-widest block">Active Society Broadcasting</span>
                <span className="flex items-center gap-2"><Landmark size={24} /> LOBBY SHOWCASE & BULLETIN</span>
              <p className="text-xs text-[#AC9E94]">Announcements, live highlights, and bespoke custom features managed by the administrators.</p>
            </div>
          </div>

          {/* Lobby Segment Cards list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {customSections.map((sec, idx) => (
              <div key={sec.id || `sec_${idx}`} className="glass-panel glass-panel-hover rounded-2xl overflow-hidden relative group flex flex-col justify-between">
                {sec.image_url && (
                  <div className="w-full h-44 overflow-hidden relative">
                    <img src={sec.image_url} alt={sec.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-[9px] uppercase font-mono font-bold tracking-widest bg-[#D98353]/95 text-black px-2.5 py-0.5 rounded-md shadow-md">LOBBY SPECIAL</span>
                  </div>
                )}

                <div className="p-6 space-y-3 text-left flex-grow">
                  {!sec.image_url && (
                    <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-[#D98353]/80 flex items-center gap-1"><Bell size={12} /> Lobby Announcement</span>
                  )}
                  <h4 className="font-serif font-bold text-lg text-white group-hover:text-[#D98353] transition-colors">{sec.title}</h4>
                  <p className="text-xs text-[#AC9E94] leading-relaxed text-justify whitespace-pre-wrap">{sec.content}</p>
                  
                  {(sec.drive_link || sec.meet_link || sec.form_link) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {sec.drive_link && (
                        <a href={sec.drive_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-mono font-bold hover:bg-blue-500/20 transition-colors">
                          <Folder size={12} /> Drive
                        </a>
                      )}
                      {sec.meet_link && (
                        <a href={sec.meet_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-mono font-bold hover:bg-emerald-500/20 transition-colors">
                          <Video size={12} /> Meet
                        </a>
                      )}
                      {sec.form_link && (
                        <a href={sec.form_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-mono font-bold hover:bg-purple-500/20 transition-colors">
                          <FileText size={12} /> Forms
                        </a>
                      )}
                    </div>
                  )}

                  <div className="w-8 h-0.5 bg-[#D98353] rounded pt-px mt-3" />
                </div>

                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'president') && (
                  <div className="px-6 pb-4 pt-1 border-t border-white/[0.02] flex justify-between items-center bg-black/10">
                    <span className="text-[9px] text-stone-500 font-mono">{sec.created_at}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLobbySegment(sec.id, sec.title)}
                      className="text-[10px] text-red-400 font-mono font-bold uppercase tracking-wider hover:text-red-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete Segment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Collapsible Vision and Mission statements */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
          <button 
            onClick={() => setVisionOpen(!visionOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
          >
            <span className="font-serif text-lg font-bold text-[#ECE6E1] flex items-center gap-2.5">
              <span className="text-[#D98353] flex items-center"><Eye size={20} /></span> Our Vision Statement
            </span>
            <span className="text-xs text-[#D98353] font-mono font-semibold uppercase tracking-wider">{visionOpen ? '[-] Hide' : '[+] View'}</span>
          </button>
          <div className={`transition-all duration-350 ease-in-out overflow-hidden ${visionOpen ? 'max-h-52 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="w-full h-px bg-white/5 mb-4" />
            <p className="text-xs text-[#AC9E94] leading-relaxed text-justify">
              {siteContent.our_vision || 'To build an enduring, universally accessible sanctuary in our college where music knows no linguistic or generic borders; where a sitarist can construct ambient soundscapes with a synth programmer, creating novel musical expressions that spark inspiration globally.'}
            </p>
          </div>
        </div>
 
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg">
          <button 
            onClick={() => setMissionOpen(!missionOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
          >
            <span className="font-serif text-lg font-bold text-[#ECE6E1] flex items-center gap-2.5">
              <span className="text-[#D98353] flex items-center"><Target size={20} /></span> Our Core Mission
            </span>
            <span className="text-xs text-[#D98353] font-mono font-semibold uppercase tracking-wider">{missionOpen ? '[-] Hide' : '[+] View'}</span>
          </button>
          <div className={`transition-all duration-350 ease-in-out overflow-hidden ${missionOpen ? 'max-h-52 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <div className="w-full h-px bg-white/5 mb-4" />
            <p className="text-xs text-[#AC9E94] leading-relaxed text-justify">
              {siteContent.our_mission || 'Equip students with professional instrument sets, persistent performance tracking metrics, masterclass workshops, and structured weekly practice times to foster consistent craft growth while sharing music publicly with the local community.'}
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-left space-y-8">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#E6AF2E]/5 blur-[70px] pointer-events-none" />
        
        {/* Row 1: About General & History */}
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif text-[#ECE6E1] font-bold">
              About <span className="text-[#D98353]">MALHAAR Society</span>
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-[#D98353] to-transparent rounded" />
            <p className="text-xs sm:text-sm text-[#AC9E94] leading-relaxed text-justify">
              {siteContent.about_malhaar || 'Loading master Society descriptions...'}
            </p>
          </div>
          
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif text-[#ECE6E1] font-bold">
              Our <span className="text-[#E6AF2E]">Society History</span>
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-[#E6AF2E] to-transparent rounded" />
            <p className="text-xs sm:text-sm text-[#AC9E94] leading-relaxed text-justify">
              {siteContent.our_history || 'Loading timeline content...'}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-[1px] bg-white/5 relative z-10" />

        {/* Row 2: Why Join Us */}
        <div className="flex flex-col gap-8 items-start relative z-10 w-full">
          <div className="w-full space-y-4">
            <h2 className="text-2xl sm:text-3xl font-serif text-[#ECE6E1] font-bold text-left">
              Why <span className="text-[#E6AF2E]">You?</span>
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-[#E6AF2E] to-transparent rounded" />
            <p className="text-xs sm:text-sm text-[#AC9E94] leading-relaxed text-justify w-full">
              {siteContent.why_join || 'Joining Malhaar gives you the ultimate platform to cultivate your musical talent, collaborate across classical & modern genres and perform in grand live festivals.'}
            </p>
          </div>
        </div>
      </section>

      {/* ====== 5. ILLUMINOUS SHINES (ALUMNI HIGHLIGHT SECTION) ====== */}
      {alumni.length > 0 && (
        <section className="space-y-6 text-left">
          <div className="border-b border-white/5 pb-4">
            <span className="font-mono text-xs text-amber-500 uppercase font-bold tracking-wider">The Legacy Board</span>
            <h2 className="text-3xl font-serif text-[#ECE6E1] font-bold">
              <span className="flex items-center gap-2"><Sparkles size={24} className="text-[#E6AF2E]" /> <span className="text-gradient bg-gradient-to-r from-[#E6AF2E] to-yellow-500 bg-clip-text text-transparent">Luminous Alumni Section</span></span>
            </h2>
            <p className="text-xs text-[#AC9E94] mt-0.5">Meet prominent previous directors who shaped classical soundscapes across generations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alumni.map((al, idx) => (
              <div key={al.id || `al_${idx}`} className="bg-gradient-to-br from-[#1c120f] to-stone-900 border border-white/10 hover:border-amber-500/40 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-5 transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
                <img 
                  src={al.image_url || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200"} 
                  alt={al.name} 
                  className="w-20 h-20 rounded-2xl border border-white/15 object-cover self-start shrink-0" 
                  onError={(e) => {
                    (e.target as any).src = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200";
                  }}
                />
                <div className="space-y-2 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-serif font-bold text-lg text-white">{al.name}</h4>
                    <span className="text-[9px] bg-[#2A160F] text-amber-300 border border-[#D98353]/30 px-2 py-0.5 rounded font-mono">
                      Batch of {al.graduation_year}
                    </span>
                  </div>
                  <h5 className="font-mono text-xs uppercase font-bold tracking-wider text-[#D98353]">{al.role_held}</h5>
                  <p className="text-xs text-[#AC9E94] leading-relaxed">{al.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====== 6. DYNAMIC FILE-UPLOADABLE MEDIA GALLERY ====== */}
      <section id="media-gallery" className="space-y-6 text-left border-t border-white/15 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <span className="font-mono text-xs text-[#D98353] uppercase font-bold tracking-wider">Dynamic Society Memories</span>
            <h2 className="text-3xl font-serif text-[#ECE6E1] font-bold">
              <span className="flex items-center gap-2"><Clapperboard size={24} className="text-[#ECE6E1]" /> <span>MEDIA HALL <span className="text-[#D98353]">OF MALHAAR</span></span></span>
            </h2>
            <p className="text-xs text-[#AC9E94] mt-0.5">Students and core members can contribute precious moments, audio files, or Drive folder packages for collective memories.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'president') && (
              <button
                onClick={() => setShowGalleryUpload(!showGalleryUpload)}
                className="px-4 py-2 bg-[#D98353] hover:bg-[#b06135] text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {showGalleryUpload ? <span className="flex items-center gap-1.5"><ChevronUp size={16} /> Close Admin Panel</span> : <span className="flex items-center gap-1.5"><Plus size={16} /> Upload Memory / Drive Link</span>}
              </button>
            )}

            <select
              value={eventYear}
              onChange={(e) => setEventYear(e.target.value)}
              className="px-3.5 py-1.5 bg-black/45 border border-white/10 text-xs text-[#ECE6E1] rounded-xl outline-none focus:border-[#D98353]"
            >
              {availableEventYears.map((yr, idx) => (
                <option key={yr || `yr_${idx}`} value={yr || ''}>{yr || 'N/A'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live File Uploader Form */}
        {showGalleryUpload && currentUser && (currentUser.role === 'admin' || currentUser.role === 'president') && (
          <form onSubmit={handleCreateGalleryEvent} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 max-w-2xl">
            <div className="space-y-1">
              <h4 className="text-[#D98353] font-serif font-bold text-base">Media Upload & Drive Sync</h4>
              <p className="text-xs text-[#AC9E94]">Configure the cover photograph of the media and attach the shared folder link below.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#AC9E94] mb-2 font-bold">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Acoustic Lobby Jam 2"
                  value={uploadEventName}
                  onChange={(e) => setUploadEventName(e.target.value)}
                  className="w-full h-10 px-3.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#D98353]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#AC9E94] mb-2 font-bold">Category</label>
                <select
                  value={uploadEventCat}
                  onChange={(e) => setUploadEventCat(e.target.value as any)}
                  className="w-full h-10 px-2 bg-black/45 border border-white/10 text-xs text-white rounded-xl outline-none focus:border-[#D98353]"
                >
                  <option value="Fusion">Fusion</option>
                  <option value="Classical">Classical</option>
                  <option value="Western">Western</option>
                  <option value="Production">Production</option>
                  <option value="Jam">Lobby Jam</option>
                </select>
              </div>
            </div>

            {/* NEW: Choose picture from gallery of active members / people to add as header of media */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-[#AC9E94] font-bold">
                <span className="flex items-center gap-2"><ImageIcon size={14} /> CHOOSE PIX FROM PERSON'S DIRECTORY PORTRAITS (OR CHOOSE THE PRESETS)</span>
              </label>
              <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10">
                {profiles.filter(p => p.approved && p.profile_image_url).map((p, idx) => (
                  <button
                    key={p.id || `profile_img_${idx}`}
                    type="button"
                    onClick={() => {
                      setUiImagePreview(p.profile_image_url || '');
                      onRequestToast(`Selected ${p.name}'s image folder cover!`, 'success');
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 shrink-0 rounded-xl border transition-all ${
                      uiImagePreview === p.profile_image_url
                        ? 'border-[#D98353] bg-[#2A160F]/60'
                        : 'border-white/5 bg-black/20 hover:border-white/15'
                    }`}
                  >
                    <img
                      src={p.profile_image_url}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                      onError={(e) => {
                        (e.target as any).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";
                      }}
                    />
                    <span className="text-[9px] text-white font-medium max-w-[64px] truncate">{p.name}</span>
                  </button>
                ))}
                {/* Fallback Beautiful Curated Presets if they prefer classic performance views */}
                {[
                  { name: "Sitar Recital", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=250" },
                  { name: "Classical Recitative", url: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=250" },
                  { name: "Symphony Stage", url: "https://images.unsplash.com/photo-1460889652573-faab6212e68c?auto=format&fit=crop&q=80&w=250" },
                  { name: "Studio Console", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=250" }
                ].map((p, i) => (
                  <button
                    key={`preset_${i}`}
                    type="button"
                    onClick={() => {
                      setUiImagePreview(p.url);
                      onRequestToast(`Selected preset cover: "${p.name}"!`, 'success');
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 shrink-0 rounded-xl border transition-all ${
                      uiImagePreview === p.url
                        ? 'border-[#D98353] bg-[#2A160F]/60'
                        : 'border-white/5 bg-black/20 hover:border-white/15'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10" />
                    <span className="text-[9px] text-[#AC9E94] max-w-[64px] truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#AC9E94] mb-2 font-bold">Or Attach Personal File PC/Gallery</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-stone-400 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:uppercase file:font-mono file:font-semibold file:bg-[#2A160F] file:text-[#D98353] file:cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-[#AC9E94] mb-2 font-bold">Date Held</label>
                <input 
                  type="date"
                  value={uploadEventDate}
                  onChange={(e) => setUploadEventDate(e.target.value)}
                  className="w-full h-10 px-3.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-[#AC9E94] mb-2 font-bold">Event Bio & Description</label>
              <textarea
                placeholder="Write description or previous memories from this event, vocal choir performance, or recap details..."
                value={uploadEventDesc}
                onChange={(e) => setUploadEventDesc(e.target.value)}
                rows={2}
                className="w-full p-3.5 bg-black/45 border border-white/10 rounded-xl text-xs text-white resize-none outline-none focus:border-[#D98353]"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-[#D98353] mb-1.5 font-bold"><FolderOpen size={14} /> Google Drive Shared Folder Link (Sync 15+ Photos)</label>
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/your-folder-id-or-link"
                value={uploadDriveLink}
                onChange={(e) => setUploadDriveLink(e.target.value)}
                className="w-full h-10 px-3.5 bg-black/45 border border-white/10 rounded-xl text-xs text-[#ECE6E1] focus:border-[#D98353] outline-none"
              />
              <span className="text-[10px] text-stone-500 font-mono mt-1 block">Paste your shareable Drive link. Normal members can click to explore a catalog of high-res pictures!</span>
            </div>

            {uiImagePreview && (
              <div className="space-y-1.5 text-left">
                <span className="block text-[10px] uppercase font-mono text-stone-500 font-bold">Attachment preview:</span>
                <img src={uiImagePreview} alt="upload preview" className="w-32 h-20 rounded-lg object-cover border border-[#D98353]/30" />
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#D98353] to-[#b55e2d] text-black font-semibold uppercase text-xs tracking-wider rounded-xl hover:shadow-lg transition-transform active:scale-95 cursor-pointer font-mono"
            >
              <Rocket size={14} /> PUBLISH TO MEDIA HALL
            </button>
          </form>
        )}

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-xs text-[#AC9E94]">
            No recitals registered for year choice "{eventYear}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEvents.map((event, idx) => (
              <div 
                key={event.id || `event_${idx}`}
                className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-[4/3] bg-stone-950 relative overflow-hidden">
                    <img
                      src={event.image_url || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400"}
                      alt={event.name}
                      auto-referrer="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as any).src = "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400";
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-[#D98353] text-black text-[9px] font-bold font-mono px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {event.category}
                    </span>
                    <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-[#ECE6E1] text-[9px] font-mono px-2 py-0.5 rounded-md border border-white/10">
                      {event.event_date}
                    </span>
                  </div>
                  
                  <div className="p-5 space-y-2">
                    <h3 className="font-serif text-base font-bold text-[#ECE6E1] group-hover:text-[#D98353] transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <p className="text-xs text-[#AC9E94] leading-relaxed text-left text-stone-400 line-clamp-3">
                      {event.description}
                    </p>
                  </div>
                </div>

                {((event.drive_link) || (currentUser && (currentUser.role === 'admin' || currentUser.role === 'president'))) && (
                  <div className="px-5 pb-5 pt-1 space-y-2">
                    {event.drive_link && (
                      <a
                        href={event.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-[#2A160F] hover:bg-[#D98353] hover:text-black border border-[#D98353]/35 text-[#D98353] text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all text-center"
                        title="Opens Google Drive gallery folder in a new tab"
                      >
                        <FolderOpen size={14} /> View Drive Folder (15+ Photos)
                      </a>
                    )}
                    {currentUser && (currentUser.role === 'admin' || currentUser.role === 'president') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGalleryEvent(event.id, event.name)}
                        className="w-full py-1.5 bg-red-950/20 hover:bg-red-900 hover:text-white border border-red-900/40 text-red-400 text-[9px] font-mono font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} /> Purge Folder Record
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ====== 7. Filterable Achievements Showcase ====== */}
      <section className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-3xl font-serif text-[#ECE6E1] font-bold">
              Society <span className="text-[#E6AF2E]">Achievements</span>
            </h2>
            <p className="text-xs text-[#AC9E94] font-mono mt-0.5 uppercase tracking-wider">Outstanding medals & trophies won</p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#AC9E94]">Academic Year:</span>
            <select
              value={activeAchievementYear}
              onChange={(e) => setAchievementYear(e.target.value)}
              className="px-3.5 py-1.5 bg-black/45 border border-white/10 text-xs text-[#ECE6E1] rounded-xl focus:border-[#E6AF2E] outline-none cursor-pointer"
            >
              {mostRecentAchievementYear && (
                <option value={mostRecentAchievementYear}>
                  {mostRecentAchievementYear} (Most Recent)
                </option>
              )}
              {achievementYears.length > 1 && (
                <option value="previous">
                  Show All Previous Records
                </option>
              )}
              {achievementYears.map((yr, idx) => {
                if (yr === mostRecentAchievementYear) return null;
                return (
                  <option key={yr || `yr_${idx}`} value={yr || ''}>
                    Year {yr || 'N/A'}
                  </option>
                );
              })}
              <option value="All">
                Show All Records (All Years)
              </option>
            </select>
          </div>
        </div>

        {filteredAchievements.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-xs text-[#AC9E94]">
            No tournament records stored for year choice "{activeAchievementYear === 'previous' ? 'Previous Years' : activeAchievementYear}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredAchievements.map((ach, idx) => (
              <div 
                key={ach.id || `ach_${idx}`}
                className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-start gap-3 text-left w-full"
              >
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-[#E6AF2E] bg-yellow-950/30 border border-yellow-900/30 px-2 py-0.5 rounded-md">
                      {ach.year}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#E6AF2E] text-[10px] uppercase font-bold tracking-wider"><Award size={12} /> Victory</span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#ECE6E1] leading-snug">
                    {ach.title}
                  </h3>
                  <p className="text-xs text-[#AC9E94] leading-relaxed">
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ====== 8. Merchandise Catalog ====== */}
      <section className="space-y-6 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-3xl font-serif text-[#ECE6E1] font-bold">
              Malhaar <span className="text-[#D98353]">Merchandise Store</span>
            </h2>
            <p className="text-xs text-[#AC9E94] font-mono mt-0.5 uppercase tracking-wider">Original gears, apparel, and live concert vinyls</p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#AC9E94]">Academic Year:</span>
            <select
              value={merchYear}
              onChange={(e) => setMerchYear(e.target.value)}
              className="px-3.5 py-1.5 bg-black/45 border border-white/10 text-xs text-[#ECE6E1] rounded-xl focus:border-[#D98353] outline-none"
            >
              {availableMerchYears.map((yr, idx) => (
                <option key={yr || `yr_${idx}`} value={yr || ''}>{yr || 'N/A'}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredMerchandise.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl text-xs text-[#AC9E94]">
            No catalog listings indexed for year choice "{merchYear}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {filteredMerchandise.map((item, idx) => (
              <div 
                key={item.id || `item_${idx}`}
                className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/10] bg-zinc-950 overflow-hidden relative">
                    <img
                      src={item.image_url || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400"}
                      alt={item.item_name}
                      auto-referrer="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        (e.target as any).src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400";
                      }}
                    />
                  </div>
                  
                  <div className="p-5 space-y-1 text-left pb-6">
                    <span className="text-[9px] font-mono font-bold text-[#D98353] uppercase tracking-widest">{item.year} Collection</span>
                    <h3 className="font-serif text-base font-bold text-[#ECE6E1] leading-tight mt-1">
                      {item.item_name}
                    </h3>
                    <p className="text-xs text-[#AC9E94] leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
