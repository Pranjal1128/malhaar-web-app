import React, {useState, useEffect} from 'react';
import {Profile, Performance, dbInstance} from '../db/mockDb';
import {compressImageBase64} from '../db/imageCompressor';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ProfileViewProps {
  currentUser: Profile;
  onProfileUpdate: (updated: Profile) => void;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigateToView?: (view: string) => void;
}

export default function ProfileView({currentUser, onProfileUpdate, onRequestToast, onNavigateToView}: ProfileViewProps) {
  const [profile, setProfile] = useState<Profile>(currentUser);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const isPresidentOrAdmin = profile && (profile.role === 'president' || profile.role === 'admin');
  
  // Fields for editing
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [domain, setDomain] = useState<'Classical' | 'Western' | 'Rapper' | 'Instrumentalist' | 'Production'>(currentUser.domain);
  const [course, setCourse] = useState(currentUser.course || '');
  const [year, setYear] = useState<string>(currentUser.year || '1st');
  const [isEditing, setIsEditing] = useState(false);
  const [anonymousToggle, setAnonymousToggle] = useState(false);
  const [myTargets, setMyTargets] = useState<any[]>([]);

  const loadProfileTargets = () => {
    const allTargets = dbInstance.getMonthlyTargets() || [];
    const mine = allTargets.filter(t => 
      t.assigned_to.toLowerCase() === currentUser.name.toLowerCase() || 
      t.assigned_to.toLowerCase() === currentUser.role.toLowerCase()
    );
    setMyTargets(mine);
  };

  // Load profile and performance metrics
  useEffect(() => {
    setProfile(currentUser);
    setName(currentUser.name);
    setBio(currentUser.bio);
    setDomain(currentUser.domain);
    setCourse(currentUser.course || '');
    setYear(currentUser.year || '1st');
    
    const performances = dbInstance.getPerformance();
    const myPerf = performances.find(p => p.user_id === currentUser.id);
    if (myPerf) {
      setPerformance(myPerf);
    }
    
    // Read anonymous state from localstorage
    const isAnon = localStorage.getItem(`malhaar_anon_${currentUser.id}`) === 'true';
    setAnonymousToggle(isAnon);
    loadProfileTargets();
  }, [currentUser]);

  const handleUpdateProfile = () => {
    if (!name.trim()) {
      onRequestToast('Name cannot be left blank.', 'error');
      return;
    }
    
    const updatedProfile: Profile = {
      ...profile,
      name,
      bio,
      domain,
      course,
      year
    };

    // Update inside list
    const profiles = dbInstance.getProfiles();
    const updatedProfiles = profiles.map(p => p.id === profile.id ? updatedProfile : p);
    dbInstance.saveProfiles(updatedProfiles);

    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
    setIsEditing(false);
    onRequestToast('Profile bio and details updated successfully!', 'success');
  };

  const handlePresetAvatar = (url: string) => {
    const updatedProfile = { ...profile, profile_image_url: url };
    
    const profiles = dbInstance.getProfiles();
    const updatedProfiles = profiles.map(p => p.id === profile.id ? updatedProfile : p);
    dbInstance.saveProfiles(updatedProfiles);
    
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
    onRequestToast('Profile avatar changed to preset selection!', 'success');
  };

  // Avatar Image Upload
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      onRequestToast('Upload failed: Please choose a valid PNG or JPG image file.', 'error');
      return;
    }

    compressImageBase64(file).then(base64 => {
      const updatedProfile = { ...profile, profile_image_url: base64 };

      const profiles = dbInstance.getProfiles();
      const updatedProfiles = profiles.map(p => p.id === profile.id ? updatedProfile : p);
      dbInstance.saveProfiles(updatedProfiles);

      setProfile(updatedProfile);
      onProfileUpdate(updatedProfile);
      onRequestToast('Custom avatar uploaded and optimized successfully!', 'success');
    });
  };

  const toggleAnonStatus = (checked: boolean) => {
    setAnonymousToggle(checked);
    localStorage.setItem(`malhaar_anon_${profile.id}`, checked ? 'true' : 'false');
    onRequestToast(
      checked 
        ? 'Anonymous mode enabled: Your name is now hidden from suggestions replies.' 
        : 'Anonymous mode disabled: Your full name will be shown alongside your submissions.',
      'info'
    );
  };

  const handleUpdateTargetProgress = (targetId: string, value: number) => {
    const allTargets = dbInstance.getMonthlyTargets();
    const updated = allTargets.map(t => {
      if (t.id === targetId) {
        return {
          ...t,
          progress: value,
          status: value >= 100 ? 'completed' : value > 0 ? 'in-progress' : 'pending' as any
        };
      }
      return t;
    });
    dbInstance.saveMonthlyTargets(updated);
    onRequestToast('Monthly target progress recorded and saved!', 'success');
    loadProfileTargets();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 w-full max-w-4xl mx-auto px-4 text-stone-300">
      
      {/* Outer Device Frame styled with professional dark gradient */}
      <div className="bg-[#0B0908] rounded-[40px] p-4 sm:p-8 shadow-2xl border border-[#D98353]/20 relative overflow-hidden shadow-[0_0_50px_rgba(217,131,83,0.06)]">
        
        {/* Artistic background neon glows */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#D98353]/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#D98353]/5 blur-[100px] pointer-events-none" />

        {/* Main dark glass Container with thin elegant borders */}
        <div className="bg-black/60 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_30px_rgba(0,0,0,0.8)] border border-[#D98353]/15 space-y-8 relative z-10">
          
          {/* ====== PROFILE HEADER SECTION ====== */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-[#D98353]/15 text-left">
            
            {/* Left: Left-Aligned Circular Avatar and Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full sm:w-auto">
              {/* Avatar Container with glowing active orange border */}
              <div className="relative group shrink-0 w-24 h-24 rounded-full border-4 border-[#D98353] overflow-hidden bg-neutral-900 shadow-[0_0_20px_rgba(217,131,83,0.4)] flex items-center justify-center">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt={profile.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-3xl font-serif text-[#D98353] font-black drop-shadow-[0_0_8px_rgba(217,131,83,0.5)]">
                    {profile.name.charAt(0)}
                  </span>
                )}
                <label className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[9px] text-white font-bold text-center px-2 font-mono leading-tight">Click to Upload</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Identity metadata */}
              <div className="space-y-2 py-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">{profile.name}</h1>
                  
                  {/* Status Badges styled with high-contrast glowing tints */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                    profile.role === 'president' ? 'bg-[#D98353]/10 text-[#D98353] border-[#D98353]/30 shadow-[0_0_12px_rgba(217,131,83,0.15)]' :
                    profile.role === 'central_core' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]' :
                    profile.role === 'core' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
                    profile.role === 'alumni' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]' :
                    'bg-zinc-900/90 text-zinc-300 border-zinc-800'
                  }`}>
                    {profile.role === 'president' ? '👑 President Cabinet' :
                     profile.role === 'central_core' ? '⭐ Central Core of Society' :
                     profile.role === 'core' ? '🎖️ Core Member' :
                     profile.role === 'alumni' ? '🎓 Alumni Advisor' :
                     '🎵 Student Member'}
                  </span>
                </div>

                {/* Subtitle fields: Speciality, Year, Course */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-stone-400 font-medium">
                  <span className="font-semibold text-[#D98353] drop-shadow-[0_0_4px_rgba(217,131,83,0.2)]">{profile.domain} division</span>
                  <span className="text-zinc-700">•</span>
                  <span>{profile.year ? `${profile.year} Year` : '1st Year'}</span>
                  {profile.course && (
                    <>
                      <span className="text-zinc-700">•</span>
                      <span className="italic text-zinc-400">{profile.course}</span>
                    </>
                  )}
                </div>

                {/* Bio snippet in beautiful glossy card */}
                {profile.bio && (
                  <p className="text-xs text-stone-300 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl mt-1 leading-relaxed max-w-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                    {profile.bio}
                  </p>
                )}
                
                {/* Stats indicators with neon glowing accents */}
                <div className="flex items-center justify-center sm:justify-start gap-5 pt-1 text-stone-300">
                  <div className="text-left">
                    <span className="block text-xl font-extrabold text-[#D98353] leading-none drop-shadow-[0_0_6px_rgba(217,131,83,0.3)]">
                      {profile.role === 'president' || profile.role === 'central_core' ? 'NA' : (performance ? performance.total_points.toLocaleString() : '1,208')}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">points</span>
                  </div>
                  {profile.role === 'member' && (
                    <>
                      <div className="text-left border-l border-zinc-800 pl-4">
                        <span className="block text-xl font-extrabold text-[#D98353] leading-none drop-shadow-[0_0_6px_rgba(217,131,83,0.3)]">
                          {performance ? `${performance.attendance_streak}d` : '380d'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">streak</span>
                      </div>
                      <div className="text-left border-l border-zinc-800 pl-4">
                        <span className="block text-xl font-extrabold text-[#D98353] leading-none drop-shadow-[0_0_6px_rgba(217,131,83,0.3)]">
                          {performance ? performance.tasks_completed : '120'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">tasks</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick actions */}
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full sm:w-auto px-4 py-2 bg-[#D98353]/10 hover:bg-[#D98353]/20 text-[#ECE6E1] hover:text-[#D98353] text-xs font-bold rounded-xl border border-[#D98353]/30 transition-all cursor-pointer text-center"
                id="edit-profile-toggle"
              >
                {isEditing ? 'Cancel Edit' : '✐ Edit Details'}
              </button>
              
              <div className="text-center sm:text-right">
                <span className="text-[10px] font-mono text-zinc-500 block">Joined 2026</span>
              </div>
            </div>
          </div>

          {/* Core Control Hall Access Widget for President / Central Core */}
          {(profile.role === 'president' || profile.role === 'central_core') && (
            <div className="bg-gradient-to-r from-stone-900 to-[#1C120F] border border-[#D98353]/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_0_15px_rgba(217,131,83,0.08)]">
              <div className="text-left space-y-1">
                <span className="text-[9px] font-mono text-[#D98353] font-bold uppercase tracking-widest block">Executive Board Privilege</span>
                <h4 className="text-sm font-serif font-black text-white">🔒 Core Control Hall Connected</h4>
                <p className="text-[10px] text-stone-400">Manage tasks, assign projects, and analyze real-time efficiency metrics of core board members.</p>
              </div>
              <button
                onClick={() => onNavigateToView?.('core-control')}
                className="px-4 py-2 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_15px_rgba(217,131,83,0.3)] text-black text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all shrink-0 font-mono"
              >
                Enter Control Hall ➔
              </button>
            </div>
          )}

          {/* ====== BIO EDITING FORM (Dark Mode variant) ====== */}
          {isEditing && (
            <div className="bg-[#120F0E] border border-[#D98353]/20 rounded-2xl p-5 shadow-inner space-y-4 text-left animate-slide-down">
              <h2 className="text-md font-bold text-[#D98353] border-b border-zinc-800 pb-2 font-serif">Modify Display Profile</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1 font-bold font-mono">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-black/50 border border-zinc-800 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/40 focus:outline-none rounded-xl text-sm text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1 font-bold font-mono">Specialist Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as any)}
                    className="w-full h-10 px-3 bg-black/50 border border-zinc-800 focus:border-[#D98353] text-white rounded-xl text-sm outline-none"
                  >
                    <option value="Classical">Classical</option>
                    <option value="Western">Western</option>
                    <option value="Rapper">Rapper</option>
                    <option value="Instrumentalist">Instrumentalist</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1 font-bold font-mono">College Year / Batch</label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full h-10 px-3.5 bg-black/50 border border-zinc-800 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/40 focus:outline-none rounded-xl text-sm text-white transition-all"
                    placeholder="e.g. 1st, 2nd, 3rd, or 2028"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1 font-bold font-mono">College Course</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full h-10 px-3.5 bg-black/50 border border-zinc-800 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/40 focus:outline-none rounded-xl text-sm text-white transition-all"
                    placeholder="e.g. B.A. Hons Political Science"
                  />
                </div>
                
                <div className="sm:col-span-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1 font-bold font-mono">Bio Snippet</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full h-10 px-3.5 bg-black/50 border border-zinc-800 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/40 focus:outline-none rounded-xl text-sm text-white transition-all"
                    placeholder="Brief musical journey bio..."
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateProfile}
                className="w-full h-10 bg-[#D98353] hover:bg-[#b36330] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Save Details & Sync
              </button>
            </div>
          )}

          {profile.role === 'member' && (
            <>
              {/* ====== STATISTICS SECTION ====== */}
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white font-serif tracking-tight">Society Evaluation Points</h2>
                  <button 
                    onClick={() => onRequestToast("Evaluation breakdowns are active on the Society Leaderboard!", "info")}
                    className="text-xs font-bold text-[#D98353] hover:underline cursor-pointer"
                  >
                    Show all
                  </button>
                </div>

                {/* Statistics Card matching Dark theme with Recharts */}
                <div className="bg-black/50 border border-[#D98353]/15 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                  
                  {/* Left Column: Specific metrics in neon styling */}
                  <div className="space-y-4 w-full md:w-1/3 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-zinc-500 font-mono font-medium block uppercase tracking-wider">Attendance Points</span>
                      <span className="text-2xl font-black text-white leading-none block">
                        {performance ? `${performance.attendance_points} pts` : '160 pts'}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5 pt-2 border-t border-zinc-850">
                      <span className="text-[11px] text-zinc-500 font-mono font-medium block uppercase tracking-wider">Attendance Streak</span>
                      <span className="text-2xl font-black text-[#D98353] leading-none block drop-shadow-[0_0_8px_rgba(217,131,83,0.25)]">
                        {performance ? `${performance.attendance_streak} days` : '12 days'}
                      </span>
                    </div>

                    <div className="space-y-0.5 pt-2 border-t border-zinc-850">
                      <span className="text-[11px] text-zinc-500 font-mono font-medium block uppercase tracking-wider">Tasks Completed</span>
                      <span className="text-2xl font-black text-white leading-none block">
                        {performance ? `${performance.tasks_completed} tasks` : '15 tasks'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Recharts bar chart */}
                  <div className="w-full md:w-2/3 h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Attendance', points: performance ? performance.attendance_points : 30 },
                          { name: 'Tasks', points: performance ? performance.task_points : 45 },
                          { name: 'Achievement', points: performance ? performance.achievement_points : 60 },
                          { name: 'Contribution', points: performance ? performance.contribution_points : 40 }
                        ]}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF" 
                          fontSize={11} 
                          fontWeight="bold"
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#9CA3AF" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(217,131,83,0.05)' }}
                          contentStyle={{
                            backgroundColor: '#141110',
                            borderColor: '#D98353/30',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: '#ECE6E1',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                          }}
                        />
                        <Bar dataKey="points" barSize={40} radius={[8, 8, 0, 0]}>
                          <Cell fill="#D98353" /> {/* Attendance: Terracotta */}
                          <Cell fill="#EA580C" /> {/* Tasks: Neon Orange */}
                          <Cell fill="#F59E0B" /> {/* Achievement: Rich Amber */}
                          <Cell fill="#F97316" /> {/* Contribution: High Orange */}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                </div>
              </div>

              {/* ====== TRAININGS SECTION ====== */}
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white font-serif tracking-tight">Active Tasks & Targets</h2>
                  <button 
                    onClick={() => onRequestToast("Assign new monthly targets inside the Admin Board!", "info")}
                    className="text-xs font-bold text-[#D98353] hover:underline cursor-pointer"
                  >
                    Show all
                  </button>
                </div>

                {/* List of training targets */}
                <div className="space-y-3">
                  {myTargets.length > 0 ? (
                    myTargets.map((t, index) => (
                      <div 
                        key={t.id} 
                        className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800 hover:border-[#D98353]/30 rounded-2xl shadow-sm transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                            {index % 2 === 0 ? '🎙️' : '🎹'}
                          </div>
                          
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-white leading-tight">{t.title}</h4>
                            <span className="text-[11px] text-zinc-500 font-mono block">
                              Assigned target • {t.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right shrink-0">
                            <span className="block text-xs font-bold text-[#D98353]">{t.progress}% rate</span>
                            <input 
                              type="range"
                              min="0"
                              max="100"
                              value={t.progress}
                              onChange={(e) => handleUpdateTargetProgress(t.id, parseInt(e.target.value))}
                              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D98353]"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-neutral-950/60 border border-dashed border-zinc-800 rounded-2xl text-center">
                      <span className="text-xl">🌟</span>
                      <h4 className="text-xs font-bold text-stone-300 mt-2">No active pending tasks assigned to your division</h4>
                      <p className="text-[10px] text-stone-500 mt-0.5">Contact the President cabinet to trigger dynamic monthly targets.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ====== ANONYMOUS SUGGESTIONS TOGGLE ====== */}
          <div className="bg-black/40 border border-[#D98353]/15 rounded-3xl p-5 flex items-center justify-between text-left">
            <div>
              <h2 className="text-sm font-bold text-white">Anonymous Suggestions Mode</h2>
              <p className="text-[10.5px] text-zinc-400 mt-0.5">Mask your identity inside the public Malhaar suggestion log box</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={anonymousToggle}
                onChange={(e) => toggleAnonStatus(e.target.checked)}
                className="sr-only peer"
                id="profile-anon-toggle"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0B0908] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D98353] peer-checked:after:bg-black"></div>
            </label>
          </div>

          {profile.role === 'member' && (
            <>
              {/* ====== 2026 TREASURY MANDATES LEDGER ====== */}
              <div className="space-y-4 text-left pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-850 pb-2 gap-2">
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2 text-base font-serif">
                      <span>💳</span> 2026 Monthly Society Mandates Ledger
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Check verified ledger status marked by the society treasurer.</p>
                  </div>
                  <span className="text-[10px] font-mono bg-black/40 border border-[#D98353]/30 text-[#D98353] px-3 py-1 rounded-lg font-bold shadow-[0_0_10px_rgba(217,131,83,0.1)]">
                    MANDATE YEAR: 2026
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                  {['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'].map(month => {
                    const status = profile.mandates?.[month] || 'pending';
                    const isCurrentMonth = month === new Date().toLocaleString('default', { month: 'long' });
                    return (
                      <div 
                        key={month} 
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between h-24 transition-all ${
                          isCurrentMonth && status === 'pending'
                            ? 'bg-[#D98353]/10 border-[#D98353]/50 text-[#D98353] shadow-[0_0_15px_rgba(217,131,83,0.15)]'
                            : status === 'given' 
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]' 
                            : status === 'crossed' 
                              ? 'bg-red-950/20 border-red-500/20 text-red-400' 
                              : 'bg-black/30 border-zinc-850 text-zinc-400'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-[#ECE6E1] uppercase tracking-wider font-mono opacity-85">{month}</div>
                        <div className="mt-1 text-left">
                          {status === 'given' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                              ✅ Paid
                            </span>
                          ) : status === 'crossed' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold font-mono bg-red-950/40 text-red-400 border border-red-500/30">
                              ❌ Crossed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold font-mono bg-zinc-900 text-zinc-500 border border-zinc-800">
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-500 font-mono leading-none mt-1">
                          {status === 'given' ? 'Verified Audit' : status === 'crossed' ? 'Missed Ledger' : 'Awaiting Audit'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
