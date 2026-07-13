import React, { useState, useEffect } from 'react';
import { dbInstance, Profile, SiteContent } from '../db/mockDb';
import { Calendar, ClipboardCheck, Users, Trophy, ScrollText, Edit3, AlertTriangle, Wrench, Scale, Coins, BarChart, Save, PenTool, Check, X } from 'lucide-react';

interface RulesViewProps {
  currentUser: Profile;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function RulesView({ currentUser, onRequestToast }: RulesViewProps) {
  const [agreed, setAgreed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [siteContentList, setSiteContentList] = useState<SiteContent[]>([]);

  // Local state for all editable key-value pairs of Rules & Regulations
  const [conductTitle, setConductTitle] = useState('General Code of Conduct');
  const [conductLi1Bold, setConductLi1Bold] = useState('Continuous Presence:');
  const [conductLi1Desc, setConductLi1Desc] = useState('Members must participate in at least 75% of assigned rehearsal schedules each month.');
  const [conductLi2Bold, setConductLi2Bold] = useState('Active Participation:');
  const [conductLi2Desc, setConductLi2Desc] = useState('Passiveness or persistent absence in group assemblies will lead to review by the Executive Board Cabinet.');
  const [conductLi3Bold, setConductLi3Bold] = useState('Mutual Collaboration:');
  const [conductLi3Desc, setConductLi3Desc] = useState('We foster an inclusive sanctuary across classical Svaras and global production styles. Mutual respect between genres is strictly demanded on stage.');
  const [conductLi4Bold, setConductLi4Bold] = useState('Equipment Responsibility:');
  const [conductLi4Desc, setConductLi4Desc] = useState('Society musical instruments, synths, and recording suites must be handles with core professional care. Any damages must be promptly self-reported.');

  const [complianceTitle, setComplianceTitle] = useState('Compliance & Mandate Desk');
  const [complianceDesc, setComplianceDesc] = useState('Malhaar Music Society runs on standard co-commitment mandates. Active student performers are required to keep their monthly dues cleared. Under the explicit bylaws of our institutional charter:');
  const [complianceMatrix, setComplianceMatrix] = useState('Recording 3 continuous unresolved mandates automatically triggers a membership suspension review. No exception is permitted without prior written cabinet consent.');

  const [pointsTitle, setPointsTitle] = useState('Evaluations & Points Assessment Ledger Weights');
  const [pointsDesc, setPointsDesc] = useState('The active Leaderboard scores of society student members are calculated through a rigorous weights system managed by administrators. Points are allocated across four key operational quadrants:');

  const [pointsQ1Title, setPointsQ1Title] = useState('ATTENDANCE');
  const [pointsQ1Desc, setPointsQ1Desc] = useState('Points awarded for attending standard schedules, rehearsals, and choir alignments on time.');
  const [pointsQ2Title, setPointsQ2Title] = useState('WEEKLY TASKS');
  const [pointsQ2Desc, setPointsQ2Desc] = useState('Ticking off weekly tracks, masterclass workshops, and individual skill logs assigned inside monthly targets.');
  const [pointsQ3Title, setPointsQ3Title] = useState('CONTRIBUTIONS');
  const [pointsQ3Desc, setPointsQ3Desc] = useState('Extra leadership in stage design, digital setup, and mentoring new society recruits during lobby jams.');
  const [pointsQ4Title, setPointsQ4Title] = useState('CHAMPIONSHIPS');
  const [pointsQ4Desc, setPointsQ4Desc] = useState('Prestigious recognitions earned at inter-college fests, state singing ensembles, or grand recitals.');

  // Check if role is admin or president
  const canEditRules = currentUser.role === 'admin' || currentUser.role === 'president' || currentUser.role === 'core';

  useEffect(() => {
    const list = dbInstance.getSiteContent();
    setSiteContentList(list);

    // Populate local states if database keys already exist, otherwise use defaults
    const getVal = (key: string, fb: string) => {
      const match = list.find(item => item.content_key === key);
      return match ? match.content_value : fb;
    };

    setConductTitle(getVal('rules_conduct_title', 'General Code of Conduct'));
    setConductLi1Bold(getVal('rules_conduct_li_1_bold', 'Continuous Presence:'));
    setConductLi1Desc(getVal('rules_conduct_li_1_desc', 'Members must participate in at least 75% of assigned rehearsal schedules each month.'));
    setConductLi2Bold(getVal('rules_conduct_li_2_bold', 'Active Participation:'));
    setConductLi2Desc(getVal('rules_conduct_li_2_desc', 'Passiveness or persistent absence in group assemblies will lead to review by the Executive Board Cabinet.'));
    setConductLi3Bold(getVal('rules_conduct_li_3_bold', 'Mutual Collaboration:'));
    setConductLi3Desc(getVal('rules_conduct_li_3_desc', 'We foster an inclusive sanctuary across classical Svaras and global production styles. Mutual respect between genres is strictly demanded on stage.'));
    setConductLi4Bold(getVal('rules_conduct_li_4_bold', 'Equipment Responsibility:'));
    setConductLi4Desc(getVal('rules_conduct_li_4_desc', 'Society musical instruments, synths, and recording suites must be handles with core professional care. Any damages must be promptly self-reported.'));

    setComplianceTitle(getVal('rules_compliance_title', 'Compliance & Mandate Desk'));
    setComplianceDesc(getVal('rules_compliance_desc', 'Malhaar Music Society runs on standard co-commitment mandates. Active student performers are required to keep their monthly dues cleared. Under the explicit bylaws of our institutional charter:'));
    setComplianceMatrix(getVal('rules_compliance_matrix', 'Recording 3 continuous unresolved mandates automatically triggers a membership suspension review. No exception is permitted without prior written cabinet consent.'));

    setPointsTitle(getVal('rules_points_title', 'Evaluations & Points Assessment Ledger Weights'));
    setPointsDesc(getVal('rules_points_desc', 'The active Leaderboard scores of society student members are calculated through a rigorous weights system managed by administrators. Points are allocated across four key operational quadrants:'));

    setPointsQ1Title(getVal('rules_points_q1_title', '🗓️ ATTENDANCE'));
    setPointsQ1Desc(getVal('rules_points_q1_desc', 'Points awarded for attending standard schedules, rehearsals, and choir alignments on time.'));
    setPointsQ2Title(getVal('rules_points_q2_title', '📋 WEEKLY TASKS'));
    setPointsQ2Desc(getVal('rules_points_q2_desc', 'Ticking off weekly tracks, masterclass workshops, and individual skill logs assigned inside monthly targets.'));
    setPointsQ3Title(getVal('rules_points_q3_title', '🤝 CONTRIBUTIONS'));
    setPointsQ3Desc(getVal('rules_points_q3_desc', 'Extra leadership in stage design, digital setup, and mentoring new society recruits during lobby jams.'));
    setPointsQ4Title(getVal('rules_points_q4_title', '🏅 CHAMPIONSHIPS'));
    setPointsQ4Desc(getVal('rules_points_q4_desc', 'Prestigious recognitions earned at inter-college fests, state singing ensembles, or grand recitals.'));
  }, []);

  const handleAgreementClick = () => {
    setAgreed(true);
    onRequestToast('Thank you! Your acknowledgment of Malhaar Society Rules & Regulations is registered.', 'success');
  };

  const handleSaveAllRules = () => {
    const list = [...siteContentList];
    const updateKey = (key: string, val: string) => {
      const idx = list.findIndex(item => item.content_key === key);
      if (idx > -1) {
        list[idx] = { ...list[idx], content_value: val };
      } else {
        list.push({ content_key: key, content_value: val });
      }
    };

    updateKey('rules_conduct_title', conductTitle);
    updateKey('rules_conduct_li_1_bold', conductLi1Bold);
    updateKey('rules_conduct_li_1_desc', conductLi1Desc);
    updateKey('rules_conduct_li_2_bold', conductLi2Bold);
    updateKey('rules_conduct_li_2_desc', conductLi2Desc);
    updateKey('rules_conduct_li_3_bold', conductLi3Bold);
    updateKey('rules_conduct_li_3_desc', conductLi3Desc);
    updateKey('rules_conduct_li_4_bold', conductLi4Bold);
    updateKey('rules_conduct_li_4_desc', conductLi4Desc);

    updateKey('rules_compliance_title', complianceTitle);
    updateKey('rules_compliance_desc', complianceDesc);
    updateKey('rules_compliance_matrix', complianceMatrix);

    updateKey('rules_points_title', pointsTitle);
    updateKey('rules_points_desc', pointsDesc);

    updateKey('rules_points_q1_title', pointsQ1Title);
    updateKey('rules_points_q1_desc', pointsQ1Desc);
    updateKey('rules_points_q2_title', pointsQ2Title);
    updateKey('rules_points_q2_desc', pointsQ2Desc);
    updateKey('rules_points_q3_title', pointsQ3Title);
    updateKey('rules_points_q3_desc', pointsQ3Desc);
    updateKey('rules_points_q4_title', pointsQ4Title);
    updateKey('rules_points_q4_desc', pointsQ4Desc);

    dbInstance.saveSiteContent(list);
    setSiteContentList(list);
    setIsEditing(false);
    onRequestToast('Rules & Regulations updated successfully in the Admin database!', 'success');
  };

  const hasUnpaidMandate = currentUser.mandates && 
    Object.values(currentUser.mandates).includes('crossed');

  return (
    <div className="space-y-8 animate-fade-in pb-16 w-full max-w-5xl mx-auto px-4 sm:px-6 text-left">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-serif text-[#ECE6E1] flex items-center gap-3"><ScrollText size={28} className="text-[#D98353]"/> Society <span className="text-[#D98353]">Rules & Regulations</span></h1>
          <p className="text-xs text-[#AC9E94] mt-1">
            The institutional charter, compliance code, points scoring philosophy, and monthly operations of the Malhaar Music Society.
          </p>
        </div>

        {canEditRules && (
          <button
            onClick={() => {
              if (isEditing) {
                // Cancel
                setIsEditing(false);
                onRequestToast('Rules editor closed. Changes discarded.', 'info');
              } else {
                setIsEditing(true);
                onRequestToast('Rules & Regulations Editor opened. Modify any text dynamically!', 'info');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              isEditing 
                ? 'bg-stone-800 text-[#D98353] border border-[#D98353]' 
                : 'bg-gradient-to-r from-[#D98353] to-[#B35F30] hover:shadow-[0_0_15px_rgba(217,131,83,0.3)] text-black'
            }`}
          >
            {isEditing ? <><X size={14}/> Cancel Editing</> : <><Edit3 size={14}/> Edit Rules & Charters</>}
          </button>
        )}
      </div>

      {hasUnpaidMandate && (
        <div className="bg-red-950/40 border border-red-500/30 p-5 rounded-2xl flex items-start gap-4 animate-pulse">
          <span className="text-red-400 mt-0.5" id="mandate-warning-icon"><AlertTriangle size={24} /></span>
          <div className="space-y-1">
            <strong className="text-sm text-red-200 block uppercase font-mono tracking-wider">Financial Mandate Warning</strong>
            <p className="text-xs text-red-300 leading-relaxed">
              Our record system indicates that you currently have one or more unresolved monthly co-commitment mandates. Please coordinate with an Admin or President to clear dues and restore your profile standing before disciplinary procedures are triggered.
            </p>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="p-6 bg-[#1C0F0B]/30 border-2 border-dashed border-[#D98353]/55 rounded-3xl space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-[#D98353]"><Wrench size={20} /></span>
            <strong className="text-sm text-[#D98353] uppercase font-mono tracking-wider">Admin/President Interactive Command Desk</strong>
          </div>
          <p className="text-xs text-[#AC9E94]">
            You have authoritative clearance to modify the rules displayed below. These changes update standard storage values and synchronize across active members instantly.
          </p>
        </div>
      )}

      {/* ====== BENTO GRID OF CHARTERS ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Module 1: General Code of Conduct */}
        <div className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-4 hover:border-[#D98353]/30 transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-[#D98353]"><Scale size={20} /></span>
            {isEditing ? (
              <input
                type="text"
                value={conductTitle}
                onChange={(e) => setConductTitle(e.target.value)}
                className="bg-black/60 border border-[#D98353]/40 rounded-lg text-xs text-white px-2.5 py-1 w-full focus:outline-none focus:border-[#D98353]"
              />
            ) : (
              <h3 className="font-serif text-lg font-bold text-white">{conductTitle}</h3>
            )}
          </div>
          <div className="w-12 h-0.5 bg-[#D98353] rounded" />
          
          <ul className="space-y-3.5 text-xs text-[#AC9E94] leading-relaxed list-none">
            {/* List item 1 */}
            <li className="border-b border-white/[0.03] pb-2 space-y-1">
              {isEditing ? (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={conductLi1Bold}
                    onChange={(e) => setConductLi1Bold(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-[11px] text-amber-500 w-full"
                  />
                  <textarea
                    value={conductLi1Desc}
                    onChange={(e) => setConductLi1Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1.5 text-[11px] text-stone-300 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <strong className="text-white block sm:inline">{conductLi1Bold} </strong>
                  <span>{conductLi1Desc}</span>
                </>
              )}
            </li>

            {/* List item 2 */}
            <li className="border-b border-white/[0.03] pb-2 space-y-1">
              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={conductLi2Bold}
                    onChange={(e) => setConductLi2Bold(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-[11px] text-amber-500 w-full"
                  />
                  <textarea
                    value={conductLi2Desc}
                    onChange={(e) => setConductLi2Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1.5 text-[11px] text-stone-300 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <strong className="text-white block sm:inline">{conductLi2Bold} </strong>
                  <span>{conductLi2Desc}</span>
                </>
              )}
            </li>

            {/* List item 3 */}
            <li className="border-b border-white/[0.03] pb-2 space-y-1">
              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={conductLi3Bold}
                    onChange={(e) => setConductLi3Bold(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-[11px] text-amber-500 w-full"
                  />
                  <textarea
                    value={conductLi3Desc}
                    onChange={(e) => setConductLi3Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1.5 text-[11px] text-stone-300 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <strong className="text-white block sm:inline">{conductLi3Bold} </strong>
                  <span>{conductLi3Desc}</span>
                </>
              )}
            </li>

            {/* List item 4 */}
            <li className="space-y-1">
              {isEditing ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={conductLi4Bold}
                    onChange={(e) => setConductLi4Bold(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded px-2 py-0.5 text-[11px] text-amber-500 w-full"
                  />
                  <textarea
                    value={conductLi4Desc}
                    onChange={(e) => setConductLi4Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1.5 text-[11px] text-stone-300 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <strong className="text-white block sm:inline">{conductLi4Bold} </strong>
                  <span>{conductLi4Desc}</span>
                </>
              )}
            </li>
          </ul>
        </div>

        {/* Module 2: The Mandate System & Warning Flags */}
        <div className="bg-[#1C0F0B]/20 border border-[#D98353]/15 p-6 rounded-2xl space-y-4 hover:border-[#D98353]/30 transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-amber-500"><Coins size={20} /></span>
            {isEditing ? (
              <input
                type="text"
                value={complianceTitle}
                onChange={(e) => setComplianceTitle(e.target.value)}
                className="bg-black/60 border border-[#D98353]/40 rounded-lg text-xs text-white px-2.5 py-1 w-full focus:outline-none focus:border-[#D98353]"
              />
            ) : (
              <h3 className="font-serif text-lg font-bold text-white">{complianceTitle}</h3>
            )}
          </div>
          <div className="w-12 h-0.5 bg-[#D98353] rounded" />
          
          {isEditing ? (
            <textarea
              value={complianceDesc}
              onChange={(e) => setComplianceDesc(e.target.value)}
              rows={4}
              className="bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-[#AC9E94] w-full resize-none"
            />
          ) : (
            <p className="text-xs text-[#AC9E94] leading-relaxed text-justify">
              {complianceDesc}
            </p>
          )}

          <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-wider font-bold">
              <span className="text-[#AC9E94]">MANDATE COMPLIANCE MATRIX</span>
              <span className="text-[#D98353]">RULE EXCLUSIVES</span>
            </div>
            {isEditing ? (
              <textarea
                value={complianceMatrix}
                onChange={(e) => setComplianceMatrix(e.target.value)}
                rows={3}
                className="bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-neutral-300 w-full resize-none"
              />
            ) : (
              <p className="text-neutral-400 font-serif leading-relaxed">
                {complianceMatrix}
              </p>
            )}
          </div>
        </div>

        {/* Module 3: Points Assessment & Leaderboard Weights */}
        <div className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-4 hover:border-[#D98353]/30 transition-all duration-300 col-span-1 md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="text-[#55F2A6]"><BarChart size={20} /></span>
            {isEditing ? (
              <input
                type="text"
                value={pointsTitle}
                onChange={(e) => setPointsTitle(e.target.value)}
                className="bg-black/60 border border-[#D98353]/40 rounded-lg text-xs text-white px-2.5 py-1 w-full focus:outline-none focus:border-[#D98353]"
              />
            ) : (
              <h3 className="font-serif text-lg font-bold text-white">{pointsTitle}</h3>
            )}
          </div>
          <div className="w-12 h-0.5 bg-[#55F2A6] rounded" />

          {isEditing ? (
            <textarea
              value={pointsDesc}
              onChange={(e) => setPointsDesc(e.target.value)}
              rows={3}
              className="bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-[#AC9E94] w-full resize-none"
            />
          ) : (
            <p className="text-xs text-[#AC9E94] leading-relaxed">
              {pointsDesc}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            {/* Quadrant 1 */}
            <div className="p-4 bg-black/45 border border-white/5 rounded-xl space-y-1">
              {isEditing ? (
                <div className="space-y-1 pb-1 pt-0.5">
                  <input
                    type="text"
                    value={pointsQ1Title}
                    onChange={(e) => setPointsQ1Title(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[11px] text-amber-500 w-full"
                  />
                  <textarea
                    value={pointsQ1Desc}
                    onChange={(e) => setPointsQ1Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[10px] text-stone-400 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <span className="text-amber-500 font-mono font-bold text-xs sm:text-sm block">{pointsQ1Title}</span>
                  <strong className="text-[11px] text-stone-200 block">Class Presence Standing</strong>
                  <p className="text-[11px] text-[#AC9E94] leading-normal">{pointsQ1Desc}</p>
                </>
              )}
            </div>

            {/* Quadrant 2 */}
            <div className="p-4 bg-black/45 border border-white/5 rounded-xl space-y-1">
              {isEditing ? (
                <div className="space-y-1 pb-1 pt-0.5">
                  <input
                    type="text"
                    value={pointsQ2Title}
                    onChange={(e) => setPointsQ2Title(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[11px] text-cyan-400 w-full"
                  />
                  <textarea
                    value={pointsQ2Desc}
                    onChange={(e) => setPointsQ2Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[10px] text-stone-400 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <span className="text-cyan-400 font-mono font-bold text-xs sm:text-sm block">{pointsQ2Title}</span>
                  <strong className="text-[11px] text-stone-200 block">Syllabus Completions</strong>
                  <p className="text-[11px] text-[#AC9E94] leading-normal">{pointsQ2Desc}</p>
                </>
              )}
            </div>

            {/* Quadrant 3 */}
            <div className="p-4 bg-black/45 border border-white/5 rounded-xl space-y-1">
              {isEditing ? (
                <div className="space-y-1 pb-1 pt-0.5">
                  <input
                    type="text"
                    value={pointsQ3Title}
                    onChange={(e) => setPointsQ3Title(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[11px] text-[#55F2A6] w-full"
                  />
                  <textarea
                    value={pointsQ3Desc}
                    onChange={(e) => setPointsQ3Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[10px] text-stone-400 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <span className="text-[#55F2A6] font-mono font-bold text-xs sm:text-sm block">{pointsQ3Title}</span>
                  <strong className="text-[11px] text-stone-200 block">Community Help</strong>
                  <p className="text-[11px] text-[#AC9E94] leading-normal">{pointsQ3Desc}</p>
                </>
              )}
            </div>

            {/* Quadrant 4 */}
            <div className="p-4 bg-black/45 border border-white/5 rounded-xl space-y-1">
              {isEditing ? (
                <div className="space-y-1 pb-1 pt-0.5">
                  <input
                    type="text"
                    value={pointsQ4Title}
                    onChange={(e) => setPointsQ4Title(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[11px] text-purple-400 w-full"
                  />
                  <textarea
                    value={pointsQ4Desc}
                    onChange={(e) => setPointsQ4Desc(e.target.value)}
                    rows={2}
                    className="bg-black/60 border border-white/10 rounded p-1 text-[10px] text-stone-400 w-full resize-none"
                  />
                </div>
              ) : (
                <>
                  <span className="text-purple-400 font-mono font-bold text-xs sm:text-sm block">{pointsQ4Title}</span>
                  <strong className="text-[11px] text-stone-200 block">Auditorium Medals</strong>
                  <p className="text-[11px] text-[#AC9E94] leading-normal">{pointsQ4Desc}</p>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ====== EDIT PUBLISH ACTIONS BAR ====== */}
      {isEditing && (
        <div className="p-6 bg-gradient-to-r from-[#1C0F0B] via-black to-stone-900 border border-[#D98353]/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-white text-xs uppercase font-mono tracking-wider font-bold">Unpublished Changes Pending</h4>
            <p className="text-[11px] text-[#AC9E94]">Click Save below to commit these system-wide updates to the active database.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setIsEditing(false);
                onRequestToast('Rules editor closed. Changes discarded.', 'info');
              }}
              className="px-4 py-2 hover:bg-white/10 bg-black/40 border border-white/10 text-xs text-white font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveAllRules}
              className="px-5 py-2 bg-[#D98353] hover:bg-amber-400 hover:shadow-lg text-black text-xs font-mono font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              <Save size={16}/> Save Custom Rules
            </button>
          </div>
        </div>
      )}

      {/* ====== COMPLIANCE AGREEMENT INTERACTION ====== */}
      {!isEditing && (
        <div className="p-8 bg-gradient-to-br from-[#1C0F0B] to-black border border-[#D98353]/35 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <span className="text-zinc-500 block"><PenTool size={36} className="mx-auto"/></span>
          <h3 className="font-serif text-xl font-bold text-[#ECE6E1]">Bylaws & Charter Acknowledgment</h3>
          <p className="text-xs text-[#AC9E94] max-w-xl leading-relaxed">
            As a registered member of the Malhaar Music Society, you are required to acknowledge and respect these rules to preserve the professional musical culture of the society.
          </p>

          {agreed ? (
            <div className="py-2.5 px-6 bg-emerald-950/35 border border-emerald-500/45 text-[#55F2A6] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 animate-bounce">
              ✓ Compliance Agreement Active & Saved
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAgreementClick}
              className="px-6 py-3 bg-[#D98353] hover:bg-amber-500 hover:scale-[1.01] active:scale-95 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(217,131,83,0.3)] font-mono"
            >
              I Agree to Adhere to the Guidelines
            </button>
          )}
        </div>
      )}
    </div>
  );
}
