import {
  defaultProfiles, defaultPerformance, defaultNotices, defaultEvents,
  defaultAchievements, defaultMerchandise, defaultMediaFolders,
  defaultCoreMembers, defaultCorePerformance, defaultTimetable,
  defaultMonthlyTargets, defaultSuggestions, defaultSessions,
  defaultAttendanceRecords, defaultSiteContent, defaultAlumni,
  defaultCustomSections, defaultSvaraPracticeMaterials
} from './src/db/mockDb.js'; // Note: using .js extension if necessary for Node, or .ts with tsx

const defaultPayload = {
  profiles: defaultProfiles,
  performance: defaultPerformance,
  notices: defaultNotices,
  events: defaultEvents,
  achievements: defaultAchievements,
  merchandise: defaultMerchandise,
  media_folders: defaultMediaFolders,
  core_members: defaultCoreMembers,
  core_performance: defaultCorePerformance,
  timetable: defaultTimetable,
  monthly_targets: defaultMonthlyTargets,
  suggestions: defaultSuggestions,
  attendance_sessions: defaultSessions,
  attendance_records: defaultAttendanceRecords,
  site_content: defaultSiteContent,
  alumni: defaultAlumni,
  custom_sections: defaultCustomSections,
  svara_practice_materials: defaultSvaraPracticeMaterials,
  knowledge_items: [{ id: 'k_1', title: 'Microtones (Srutis) in Ragas', category: 'general', content: 'Indian music divides the octave into 22 srutis (microtonal intervals) rather than the Western 12 semitones. This allows classical vocalists to express emotional micro-variations (gamakas) between notes.', created_by: 'President' }],
  alumni_messages: [],
  active_month: new Date().toLocaleString('en-US', { month: 'long' })
};

fetch('http://localhost:3000/api/db', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(defaultPayload)
}).then(res => res.json()).then(console.log).catch(console.error);
