import React, {useState} from 'react';
import {Profile, dbInstance} from '../db/mockDb';
import { compressImageBase64 } from "../db/imageCompressor";

interface AuthViewProps {
  onAuthSuccess: (profile: Profile) => void;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AuthView({onAuthSuccess, onRequestToast}: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Registration States
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDomain, setRegDomain] = useState<'Classical' | 'Western' | 'Rapper' | 'Instrumentalist' | 'Production'>('Classical');
  const [regRole, setRegRole] = useState<'member' | 'alumni' | 'core'>('member');
  const [regYear, setRegYear] = useState<string>('1st');
  const [regCourse, setRegCourse] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regProfileImageUrl, setRegProfileImageUrl] = useState('');
  const [alumniVerificationCode, setAlumniVerificationCode] = useState('');
  const [adminVerificationCode, setAdminVerificationCode] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [registeredPending, setRegisteredPending] = useState(false);

  // Helper toggle helpers to clear errors
  const handleToggleSignUp = (val: boolean) => {
    setIsSignUp(val);
    setErrorMsg('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onRequestToast('Image file is too large. Please select a photo under 5MB.', 'error');
        return;
      }
      try {
        const compressedBase64 = await compressImageBase64(file);
        setRegProfileImageUrl(compressedBase64);
        onRequestToast('Photo uploaded and compressed successfully!', 'success');
      } catch (err) {
        console.error("Compression failed:", err);
        onRequestToast('Failed to read image file.', 'error');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onRequestToast('Please upload an image file (PNG/JPG).', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        onRequestToast('Image file is too large. Please select a photo under 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRegProfileImageUrl(event.target.result as string);
          onRequestToast('Photo uploaded successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const inputIdentifier = emailOrUser.trim().toLowerCase();
    const inputPassword = password.trim();

    if (!inputIdentifier || !inputPassword) {
      setErrorMsg('Please enter both identifier/email and password.');
      onRequestToast('Please enter both identifier and password.', 'error');
      return;
    }

    try {
      await dbInstance.fetchLatestFromServer();
    } catch (err) {
      console.warn("Could not refresh database", err);
    }

    const profiles = dbInstance.getProfiles();
    let matchedProfile: Profile | undefined;

    const cleanIdentifier = inputIdentifier.toLowerCase().trim();

    // Resolve username fallback mapping with high-tolerance matching
    if (cleanIdentifier === 'president' || cleanIdentifier === 'president@miaoda.com') {
      matchedProfile = profiles.find(p => p.role === 'president');
    } else if (cleanIdentifier === 'admin' || cleanIdentifier === 'admin@miaoda.com') {
      matchedProfile = profiles.find(p => p.role === 'admin');
    } else {
      matchedProfile = profiles.find(p => {
        const email = p.email.toLowerCase().trim();
        const fname = p.name.toLowerCase().trim();
        const prefix = email.split('@')[0];
        return email === cleanIdentifier || fname === cleanIdentifier || prefix === cleanIdentifier;
      });
    }

    // 1. Check if user exists
    if (!matchedProfile) {
      setErrorMsg('The user account is not existing. Register first or verify spelling.');
      onRequestToast('Sign-In Failed: The user account does not exist.', 'error');
      return;
    }

    // 2. Admin approval check
    if (matchedProfile.approved === false) {
      setErrorMsg('Your account is pending admin approval. "You will be the part of MALHAAR when the admin approves you"');
      onRequestToast('Awaiting Approval: You are still not approved by the admin to get into the app.', 'error');
      return;
    }

    // 3. Simulate password validation
    let valid = false;
    const cleanPass = inputPassword.replace(/\s+/g, '').toLowerCase(); // Normalize spaces

    if (matchedProfile.role === 'president') {
      // accepts MALHAARVAAYU, "myhad2027" or "my had 2027" or direct password stored
      if (inputPassword === 'MALHAARVAAYU' || cleanPass === 'malhaarvaayu' || cleanPass === 'myhad2027' || inputPassword === 'my had 2027' || inputPassword === 'malhaar2027' || (matchedProfile.password && inputPassword === matchedProfile.password)) {
        valid = true;
      }
    } else if (matchedProfile.role === 'admin') {
      // accepts MALHAARVAAYU, "myheart2027" or "my heart 2027" or direct password stored
      if (inputPassword === 'MALHAARVAAYU' || cleanPass === 'malhaarvaayu' || cleanPass === 'myheart2027' || inputPassword === 'my heart 2027' || inputPassword === 'malhaar2027' || (matchedProfile.password && inputPassword === matchedProfile.password)) {
        valid = true;
      }
    } else if (matchedProfile.role === 'alumni') {
      if (inputPassword === 'MALHAARVAAYU' || cleanPass === 'malhaarvaayu' || cleanPass === 'alumni2027' || inputPassword === 'alumni 2027' || inputPassword === 'malhaar2027' || (matchedProfile.password && inputPassword === matchedProfile.password)) {
        valid = true;
      }
    } else if (matchedProfile.password && inputPassword === matchedProfile.password) {
      valid = true;
    } else if (matchedProfile.role === 'core' && (inputPassword === 'core123' || inputPassword === 'password')) {
      valid = true;
    } else if (matchedProfile.role === 'member' && (inputPassword === 'member123' || inputPassword === 'password' || inputPassword === '123456')) {
      valid = true;
    } else if (inputPassword === 'password' || inputPassword === '123456') {
      valid = true;
    }

    if (valid) {
      setErrorMsg('');
      onAuthSuccess(matchedProfile);
      onRequestToast(`Welcome back, ${matchedProfile.name}!`, 'success');
    } else {
      setErrorMsg('Wrong password! Please check spelling or verify your secret key.');
      onRequestToast('Sign-In Failed: Correct credentials required.', 'error');
    }
  };

  const handleStartSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditingAdmin = regRole === 'core';
    const isAlumni = regRole === 'alumni';

    if (isAlumni && alumniVerificationCode !== 'FURO2010') {
      onRequestToast('Incorrect alumni registration password. Please enter "FURO2010" to verify.', 'error');
      return;
    }

    if (isEditingAdmin && adminVerificationCode !== 'MALHAARVAAYU') {
      onRequestToast('Incorrect Core registration password. Please enter "MALHAARVAAYU" to register as Core.', 'error');
      return;
    }

    if (!name.trim() || !regEmail.trim() || !regPassword.trim() || (!isAlumni && !regCourse.trim())) {
      onRequestToast(isAlumni ? 'Please fill out all required fields (Name, Email, Password).' : 'Please fill out all required fields (Name, Email, Password, Course).', 'error');
      return;
    }
    if (!regEmail.includes('@')) {
      onRequestToast('Please enter a valid email address.', 'error');
      return;
    }

    try {
      await dbInstance.fetchLatestFromServer();
    } catch (err) {
      console.warn("Could not refresh database", err);
    }

    const profiles = dbInstance.getProfiles();
    const perf = dbInstance.getPerformance();

    const existingUser = profiles.find(p => p.email.toLowerCase() === regEmail.toLowerCase());
    if (existingUser) {
      onRequestToast('This email is already registered. Please sign in instead.', 'error');
      setIsSignUp(false);
      return;
    }

    const newId = `user_${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      email: regEmail,
      name: name,
      role: regRole,
      year: regYear,
      domain: isAlumni ? 'Classical' : regDomain,
      course: isAlumni ? 'Alumni Graduate' : regCourse,
      bio: regBio.trim() || (isEditingAdmin ? 'Executive (Core of Society)' : (isAlumni ? 'Verified Malhaar Alumni Graduate.' : 'A passionate newly registered member of MALHAAR.')),
      profile_image_url: regProfileImageUrl.trim() || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      approved: (isEditingAdmin || isAlumni) ? true : false, // Admins & Verified Alumni approved by default so they can access immediately!
      password: regPassword,
      mandates: {
        January: 'pending', February: 'pending', March: 'pending', April: 'pending',
        May: 'pending', June: 'pending', July: 'pending', August: 'pending',
        September: 'pending', October: 'pending', November: 'pending', December: 'pending'
      }
    };

    // Register empty zero-initialized performance metrics
    const newPerf = {
      user_id: newId,
      attendance_points: 0,
      task_points: 0,
      contribution_points: 0,
      achievement_points: 0,
      total_points: 0,
      attendance_streak: 0,
      tasks_completed: 0
    };

    profiles.push(newProfile);
    perf.push(newPerf);

    dbInstance.saveProfiles(profiles);
    dbInstance.savePerformance(perf);

    if (isAlumni) {
      const currentAlumni = dbInstance.getAlumni() || [];
      currentAlumni.push({
        id: newId,
        name: name,
        role_held: 'Alumni',
        graduation_year: regYear,
        bio: regBio.trim() || 'Verified Malhaar Alumni Graduate.',
        image_url: regProfileImageUrl.trim() || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      });
      dbInstance.saveAlumni(currentAlumni);
    }

    if (isEditingAdmin || isAlumni) {
      onAuthSuccess(newProfile);
      onRequestToast(`Welcome to Malhaar, ${newProfile.name}! Registration verified automatically.`, 'success');
    } else {
      setRegisteredPending(true);
      onRequestToast('Registration successful! Awaiting admin verification and approval.', 'success');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0807] overflow-hidden relative">
      {/* Immersive Deep Soundstage Radial Ambient Lights */}
      <div className="absolute top-[-15%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-[#D98353]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-[#E6AF2E]/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[25%] w-[300px] h-[300px] bg-[#803816]/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Floating Audio waves grid mimic for background immersion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,131,83,0.03),transparent_60%)] pointer-events-none" />

      <div className={`w-full ${isSignUp ? 'max-w-lg md:max-w-2xl' : 'max-w-md'} bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] relative z-10 transition-all duration-500`}>
        <div className="absolute -inset-px bg-gradient-to-r from-white/10 to-transparent rounded-3xl pointer-events-none -z-10" />
        
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          {(() => {
            const siteContent = dbInstance.getSiteContent() || [];
            const customLogoItem = siteContent.find(x => x.content_key === 'custom_logo');
            const customLogo = customLogoItem ? customLogoItem.content_value : '';
            return customLogo ? (
              <div className="inline-flex items-center justify-center p-0.5 mb-3 rounded-2xl bg-gradient-to-br from-[#D98353] to-[#803816] shadow-[0_0_30px_rgba(217,131,83,0.25)] select-none w-16 h-16 overflow-hidden">
                <img src={customLogo} alt="Malhaar Logo" className="w-full h-full object-cover rounded-[14px]" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center mb-3 rounded-2xl border-2 border-dashed border-[#D98353]/40 bg-[#D98353]/5 shadow-[0_0_15px_rgba(217,131,83,0.05)] select-none w-16 h-16">
                <span className="text-[10px] font-mono text-[#D98353]/50 font-bold uppercase tracking-wider">Logo Frame</span>
              </div>
            );
          })()}
          <h1 className="text-4xl font-serif tracking-widest text-[#ECE6E1] font-bold">MALHAAR</h1>
          <p className="text-[#D98353] font-mono text-[11px] uppercase mt-2 tracking-wide font-bold px-2">
            The Music Society of Motilal Nehru College (Morning)
          </p>
          <p className="text-[#AC9E94] font-mono text-[9px] tracking-widest uppercase mt-1 pb-1">
            Established in 2010
          </p>
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D98353] to-transparent mx-auto mt-4" />
        </div>

        {/* Registration Pending Screen */}
        {registeredPending ? (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
              <span className="text-4xl animate-pulse">⏳</span>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-serif font-bold text-[#ECE6E1] tracking-wide">Awaiting Verification</h2>
              <p className="text-sm text-[#ECE6E1] leading-relaxed font-sans font-medium px-2 py-4 border-y border-y-[#D98353]/20 bg-[#D98353]/5 rounded-2xl">
                "You will be a part of MALHAAR when the admin approves you"
              </p>
              <p className="text-xs text-[#AC9E94] leading-relaxed">
                Thank you for registering! Your account has been submitted for admin verification. Please wait for an administrator or the president to approve your profile.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRegisteredPending(false);
                handleToggleSignUp(false);
              }}
              className="w-full h-11 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_20px_rgba(217,131,83,0.3)] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              Go to Sign In
            </button>
          </div>
        ) : !isSignUp ? (
          /* Sign In View */
          <form onSubmit={handleSignIn} className="space-y-5 animate-fade-in text-left">
            {errorMsg && (
              <div className="bg-red-950/50 border-2 border-red-500/40 p-4 rounded-2xl flex items-start gap-3 animate-fade-in text-left shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <span className="text-xl mt-0.5" id="auth-error-icon">⚠️</span>
                <div className="space-y-1">
                  <strong className="text-xs text-red-200 block uppercase font-mono tracking-wider">Access Denied</strong>
                  <p className="text-xs text-red-300 font-sans leading-relaxed">
                    {errorMsg}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#AC9E94] mb-2 font-bold font-mono">
                Email or Society Username
              </label>
              <input
                type="text"
                placeholder="e.g. president or president@miaoda.com"
                value={emailOrUser}
                onChange={(e) => {
                  setEmailOrUser(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full h-11 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all placeholder:text-stone-600 duration-300"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] uppercase tracking-[0.15em] text-[#AC9E94] font-bold font-mono">
                  Password
                </label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full h-11 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all placeholder:text-stone-600 duration-300"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_25px_rgba(217,131,83,0.35)] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer active:scale-98 mt-2"
            >
              Sign In
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#AC9E94]">Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => handleToggleSignUp(true)}
                className="text-xs text-[#D98353] font-bold hover:text-amber-400 cursor-pointer"
                id="register-toggle-btn"
              >
                Register Here
              </button>
            </div>
          </form>
        ) : (
          /* Sign Up View */
          <form onSubmit={handleStartSignUp} className="space-y-4 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#AC9E94] mb-1 font-bold font-mono">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Dev"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#AC9E94] mb-1 font-bold font-mono">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@university.edu"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full h-10 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#AC9E94] mb-1 font-bold font-mono">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full h-10 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#AC9E94] mb-1 font-bold font-mono">
                  Register As *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setRegRole(val);
                    if (val === 'alumni') {
                      setRegYear('2010');
                    } else {
                      setRegYear('1st');
                    }
                  }}
                  className="w-full h-10 px-3 bg-black/40 border border-white/10 focus:border-[#D98353] text-[#ECE6E1] rounded-xl text-sm outline-none transition-all"
                  required
                >
                  <option value="member" className="bg-neutral-900">Student Member</option>
                  <option value="alumni" className="bg-neutral-900">Alumni</option>
                  <option value="core" className="bg-neutral-900">Executive (Core)</option>
                </select>
              </div>

              {regRole !== 'alumni' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#AC9E94] mb-1 font-bold font-mono">
                    Specialist Domain *
                  </label>
                  <select
                    value={regDomain}
                    onChange={(e) => setRegDomain(e.target.value as any)}
                    className="w-full h-10 px-3 bg-black/40 border border-white/10 focus:border-[#D98353] text-[#ECE6E1] rounded-xl text-sm outline-none transition-all"
                    required
                  >
                    <option value="Classical" className="bg-neutral-900">Classical</option>
                    <option value="Western" className="bg-neutral-900">Western</option>
                    <option value="Rapper" className="bg-neutral-900">Rapper</option>
                    <option value="Instrumentalist" className="bg-neutral-900">Instrumentalist</option>
                    <option value="Production" className="bg-neutral-900">Production</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#AC9E94] mb-1 font-bold font-mono">
                  {regRole === 'alumni' ? 'Pass out batch year *' : 'Academic Year *'}
                </label>
                {regRole === 'alumni' ? (
                  <input
                    type="text"
                    placeholder="e.g. 2010, 2026"
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="w-full h-10 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all"
                    required
                  />
                ) : (
                  <select
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value as any)}
                    className="w-full h-10 px-3 bg-black/40 border border-white/10 focus:border-[#D98353] text-[#ECE6E1] rounded-xl text-sm outline-none transition-all"
                    required
                  >
                    <option value="1st" className="bg-neutral-900">1st Year</option>
                    <option value="2nd" className="bg-neutral-900">2nd Year</option>
                    <option value="3rd" className="bg-neutral-900">3rd Year</option>
                  </select>
                )}
              </div>
            </div>

            {regRole === 'alumni' && (
              <div className="animate-fade-in">
                <label className="block text-[10px] uppercase tracking-widest text-[#D98353] mb-1 font-bold font-mono">
                  Alumni Verification Passcode *
                </label>
                <input
                  type="password"
                  placeholder="Enter alumni passcode to bypass approval..."
                  value={alumniVerificationCode}
                  onChange={(e) => setAlumniVerificationCode(e.target.value)}
                  className="w-full h-10 px-4 bg-white/[0.03] border border-[#D98353]/40 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all font-mono"
                  required
                />
              </div>
            )}

            {regRole === 'core' && (
              <div className="animate-fade-in">
                <label className="block text-[10px] uppercase tracking-widest text-[#D98353] mb-1 font-bold font-mono">
                  Executive Passcode *
                </label>
                <input
                  type="password"
                  placeholder="Enter Executive registration passcode..."
                  value={adminVerificationCode}
                  onChange={(e) => setAdminVerificationCode(e.target.value)}
                  className="w-full h-10 px-4 bg-white/[0.03] border border-[#D98353]/40 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all font-mono"
                  required
                />
              </div>
            )}

            {regRole !== 'alumni' && (
              <>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#AC9E94] mb-1 font-bold font-mono">
                    College Course *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Com Hons, B.A. History, B.Sc Computer Science"
                    value={regCourse}
                    onChange={(e) => setRegCourse(e.target.value)}
                    className="w-full h-10 px-4 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#AC9E94] mb-1 font-bold font-mono">
                    Short Biography / Bio (Introduce yourself)
                  </label>
                  <textarea
                    placeholder="Share your musical journey so Malhaar seniors can get to know you!"
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    rows={2}
                    className="w-full p-3 bg-white/[0.03] border border-white/10 focus:border-[#D98353] focus:ring-1 focus:ring-[#D98353]/30 focus:outline-none rounded-xl text-sm text-[#ECE6E1] transition-all leading-relaxed"
                  />
                </div>
              </>
            )}

            {/* Profile Picture interactive area with Drag-and-Drop + Manual file upload */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#AC9E94] mb-2 font-bold font-mono">
                Profile Photo Upload (Under 2MB)
              </label>
              <div 
                className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 ${
                  isDragging 
                    ? 'border-[#D98353] bg-[#D98353]/10 scale-[1.01]' 
                    : 'border-white/25 bg-white/[0.02] hover:border-[#D98353]/60 hover:bg-white/[0.04]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('reg-photo-input')?.click()}
              >
                <input 
                  type="file"
                  id="reg-photo-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  {/* Dynamic image preview */}
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 bg-black/50 flex items-center justify-center relative flex-shrink-0">
                    {regProfileImageUrl ? (
                      <img 
                        src={regProfileImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xl text-[#AC9E94]">📷</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-[#ECE6E1] font-semibold">
                      Drag & Drop your photo here, or <span className="text-[#D98353] hover:underline">browse files</span>
                    </p>
                    <p className="text-[10px] text-[#AC9E94] mt-0.5 font-mono">
                      PNG, JPG, JPEG accepted (under 2MB)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Fallback Paste URL input */}
              <div className="mt-2.5">
                <input
                  type="text"
                  placeholder="Or paste direct image URL (optional)"
                  value={regProfileImageUrl}
                  onChange={(e) => setRegProfileImageUrl(e.target.value)}
                  className="w-full h-8 px-3 bg-white/[0.02] border border-white/10 focus:border-[#D98353] focus:outline-none rounded-lg text-xs text-[#ECE6E1] transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_25px_rgba(217,131,83,0.35)] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer active:scale-98 mt-2"
            >
              Request Access & Create Profile
            </button>

            <div className="text-center pt-1">
              <span className="text-xs text-[#AC9E94]">Already have an account? </span>
              <button
                type="button"
                onClick={() => handleToggleSignUp(false)}
                className="text-xs text-[#D98353] font-bold hover:text-amber-400 cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
