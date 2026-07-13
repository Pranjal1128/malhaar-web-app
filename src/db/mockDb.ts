export interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'core' | 'admin' | 'president' | 'alumni' | 'central_core';
  year: string;
  domain: 'Classical' | 'Western' | 'Rapper' | 'Instrumentalist' | 'Production';
  bio: string;
  profile_image_url: string;
  approved: boolean;
  password?: string;
  course?: string;
  mandates?: {
    [key: string]: 'given' | 'crossed' | 'pending';
  };
}

export interface KnowledgeItem {
  id: string;
  title?: string;
  category: 'raga_psychoacoustics' | 'svara_solfege' | 'general' | 'dictionary' | 'psychoacoustics';
  content?: string;
  created_by?: string;
  column_a?: string;
  column_b?: string;
  column_c?: string;
}

export interface AlumniMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  sender_image?: string;
  text: string;
  timestamp: string;
  audio_url?: string;
  image_url?: string;
}

export interface Alumni {
  id: string;
  name: string;
  role_held: string;
  graduation_year: string;
  bio: string;
  image_url: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  created_at: string;
  active: boolean;
  image_url?: string;
  drive_link?: string;
  meet_link?: string;
  form_link?: string;
}

export interface SvaraPracticeMaterial {
  id: string;
  title: string;
  lyrics: string;
  category: string; // e.g. "CLASSICAL VOCAL WARMUPS", "RAAG PRACTICE SESSION", "LYRICS & BANDISH ARCHIVE"
  audio_url?: string;
  audio_url_2?: string;
  audio_url_3?: string;
  audio_url_4?: string;
  drive_link?: string;
  created_at: string;
}

export interface Performance {
  user_id: string;
  attendance_points: number;
  task_points: number;
  contribution_points: number;
  achievement_points: number;
  total_points: number;
  attendance_streak: number;
  tasks_completed: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  posted_by: string;
  posted_at: string;
}

export interface ClubEvent {
  id: string;
  name: string;
  description: string;
  event_date: string;
  category: 'Classical' | 'Western' | 'Fusion' | 'Production' | 'Jam';
  image_url: string;
  year: string;
  drive_link?: string;
}

export interface Achievement {
  id: string;
  year: string;
  title: string;
  description: string;
  image_url: string;
}

export interface Merchandise {
  id: string;
  year: string;
  item_name: string;
  description: string;
  image_url: string;
  price?: number;
}

export interface MediaFolder {
  id: string;
  name: string;
  description: string;
  images: string[];
  drive_link?: string;
}

export interface CorePerformance {
  core_id: string;
  tasks_assigned: number;
  tasks_completed: number;
  progress: number; // calculated as tasks_completed * 100 / tasks_assigned
  efficiency_score: number; // calculated as completion rate & quality
}

export interface TimetableEntry {
  id: string;
  title: string;
  description: string;
  event_type: 'Practice' | 'Workshop' | 'Lobby Jam' | 'Audition' | 'Core Meet';
  start_time: string; // e.g. "14:00"
  end_time: string; // e.g. "16:00"
  day_of_week: string; // e.g. "Monday"
  assigned_to?: string; // "All" or a specific user's name/id
  google_meet_url?: string;
}

export interface MonthlyTarget {
  id: string;
  title: string;
  description: string;
  assigned_to: string; // user name or role
  status: 'pending' | 'in-progress' | 'completed';
  progress: number; // 0 to 100
  due_date: string;
}

export interface AttendanceSession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  user_id: string; // references Profile.id
  status: 'present' | 'absent';
  excuse?: string;
}

export interface CoreMember {
  id: string;
  name: string;
  role: string;
  position: string;
  tenure: string; // e.g. "2024 - Present"
  year: '1st' | '2nd' | '3rd';
  image_url: string;
  description: string;
  phone_number?: string;
  tenure_year?: string; // e.g. "2025", "2026", "2027"
  is_starred?: boolean;
  role_key?: string;
}

export interface Suggestion {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_response?: string;
  created_at: string;
}

export interface SiteContent {
  content_key: string;
  content_value: string;
}

// Pre-seeded profiles
const defaultProfiles: Profile[] = [
  {
    id: "vaibhav_id",
    email: "President@miaoda.com",
    name: "President",
    role: "president",
    year: "3rd",
    domain: "Classical",
    bio: "President of Malhaar. Hindustani Classical vocalist, multi-instrumentalist, and conductor of the collegiate choir.",
    profile_image_url: "",
    approved: true,
    mandates: { May: 'given', June: 'given', July: 'given' }
  },
  {
    id: "admin_id",
    email: "admin@miaoda.com",
    name: "Admin",
    role: "admin",
    year: "3rd",
    domain: "Western",
    bio: "Admin of Malhaar. Operatic soprano, Western Classical violinist, and chief organizer.",
    profile_image_url: "",
    approved: true,
    mandates: { May: 'given', June: 'given', July: 'given' }
  },
  {
    id: "alumni_id",
    email: "alumni@miaoda.com",
    name: "Alumni",
    role: "alumni",
    year: "Graduate",
    domain: "Classical",
    bio: "Malhaar Alumni Network.",
    profile_image_url: "",
    approved: true
  },
  {
    id: "sid_id",
    email: "siddharth@miaoda.com",
    name: "Siddharth Verma",
    role: "member",
    year: "2nd",
    domain: "Western",
    bio: "Violinist and arranger. Loves composing multi-part arrangements for Western classical ensemble.",
    profile_image_url: "",
    approved: true,
    mandates: { May: 'given', June: 'given', July: 'pending' }
  },
  {
    id: "ananya_id",
    email: "ananya@miaoda.com",
    name: "Ananya Iyer",
    role: "member",
    year: "1st",
    domain: "Classical",
    bio: "Carnatic music enthusiast. Specializes in rapid svara patterns and traditional classical compositions.",
    profile_image_url: "",
    approved: true,
    mandates: { May: 'given', June: 'given', July: 'given' }
  },
  {
    id: "aarav_id",
    email: "aarav@miaoda.com",
    name: "Aarav Mehta",
    role: "member",
    year: "2nd",
    domain: "Rapper",
    bio: "Hip-hop beat producer and rapid-fire lyricist. Explores fusion rhythms and jam improvisations.",
    profile_image_url: "",
    approved: true,
    mandates: { May: 'crossed', June: 'given', July: 'pending' }
  }
];

// Pre-seeded performance corresponding to profiles
const defaultPerformance: Performance[] = [
  {
    user_id: "vaibhav_id",
    attendance_points: 98,
    task_points: 95,
    contribution_points: 98,
    achievement_points: 90,
    total_points: 381,
    attendance_streak: 15,
    tasks_completed: 18
  },
  {
    user_id: "admin_id",
    attendance_points: 92,
    task_points: 94,
    contribution_points: 96,
    achievement_points: 85,
    total_points: 367,
    attendance_streak: 9,
    tasks_completed: 15
  },
  {
    user_id: "sid_id",
    attendance_points: 80,
    task_points: 75,
    contribution_points: 85,
    achievement_points: 70,
    total_points: 310,
    attendance_streak: 5,
    tasks_completed: 6
  },
  {
    user_id: "ananya_id",
    attendance_points: 95,
    task_points: 80,
    contribution_points: 90,
    achievement_points: 85,
    total_points: 350,
    attendance_streak: 12,
    tasks_completed: 8
  },
  {
    user_id: "aarav_id",
    attendance_points: 60,
    task_points: 70,
    contribution_points: 65,
    achievement_points: 60,
    total_points: 255,
    attendance_streak: 2,
    tasks_completed: 4
  }
];

const defaultNotices: Notice[] = [];

const defaultEvents: ClubEvent[] = [];

const defaultAchievements: Achievement[] = [];

const defaultMerchandise: Merchandise[] = [];

const defaultMediaFolders: MediaFolder[] = [];

const defaultCoreMembers: CoreMember[] = [];

const defaultCorePerformance: CorePerformance[] = [];

const defaultTimetable: TimetableEntry[] = [
  {
    id: 't_1',
    title: 'Classical Choir Rehearsal',
    description: 'Focusing on raag classification, pitch correction, and traditional bandish compositions.',
    event_type: 'Practice',
    start_time: '14:00',
    end_time: '16:00',
    day_of_week: 'Monday'
  },
  {
    id: 't_2',
    title: 'Western Ensemble Harmony Practice',
    description: 'Choral voice blending, intervals ear-training, and multi-part arrangements.',
    event_type: 'Practice',
    start_time: '15:00',
    end_time: '17:00',
    day_of_week: 'Wednesday'
  },
  {
    id: 't_3',
    title: 'Synths & Production Workshop',
    description: 'Introduction to DAWs, subtractive synthesis, and digital audio tracking.',
    event_type: 'Workshop',
    start_time: '16:00',
    end_time: '17:30',
    day_of_week: 'Thursday'
  },
  {
    id: 't_4',
    title: 'Open Lobby Jam Sessions',
    description: 'Fusion and improvisation circle. All instrumentalists and rappers are welcome.',
    event_type: 'Lobby Jam',
    start_time: '13:00',
    end_time: '15:30',
    day_of_week: 'Friday'
  },
  {
    id: 't_5',
    title: 'Core Review Committee Meet',
    description: 'Administrative planning, event organizing, and target tracking for core officers.',
    event_type: 'Core Meet',
    start_time: '11:00',
    end_time: '12:30',
    day_of_week: 'Saturday'
  }
];

const defaultMonthlyTargets: MonthlyTarget[] = [];

const defaultSuggestions: Suggestion[] = [];

const defaultSessions: AttendanceSession[] = [
  // January 2026
  { id: 'session_jan_1', date: '2026-01-12', title: 'Classical Choir Rehearsal', description: 't_1' },
  { id: 'session_jan_2', date: '2026-01-22', title: 'Synths & Production Workshop', description: 't_3' },
  // February 2026
  { id: 'session_feb_1', date: '2026-02-09', title: 'Classical Choir Rehearsal', description: 't_1' },
  { id: 'session_feb_2', date: '2026-02-18', title: 'Western Ensemble Harmony Practice', description: 't_2' },
  // March 2026
  { id: 'session_mar_1', date: '2026-03-04', title: 'Western Ensemble Harmony Practice', description: 't_2' },
  { id: 'session_mar_2', date: '2026-03-12', title: 'Synths & Production Workshop', description: 't_3' },
  // April 2026
  { id: 'session_apr_1', date: '2026-04-10', title: 'Open Lobby Jam Sessions', description: 't_4' },
  { id: 'session_apr_2', date: '2026-04-20', title: 'Classical Choir Rehearsal', description: 't_1' },
  // May 2026
  { id: 'session_may_1', date: '2026-05-13', title: 'Western Ensemble Harmony Practice', description: 't_2' },
  { id: 'session_may_2', date: '2026-05-28', title: 'Synths & Production Workshop', description: 't_3' },
  // June 2026
  { id: 'session_jun_1', date: '2026-06-08', title: 'Classical Choir Rehearsal', description: 't_1' },
  { id: 'session_jun_2', date: '2026-06-19', title: 'Open Lobby Jam Sessions', description: 't_4' },
  // July 2026
  { id: 'session_jul_1', date: '2026-07-01', title: 'Western Ensemble Harmony Practice', description: 't_2' },
  { id: 'session_jul_2', date: '2026-07-09', title: 'Synths & Production Workshop', description: 't_3' }
];

const defaultAttendanceRecords: AttendanceRecord[] = [
  // January 2026 Session 1
  { id: 'rec_jan_1_sid', session_id: 'session_jan_1', user_id: 'sid_id', status: 'present' },
  { id: 'rec_jan_1_ananya', session_id: 'session_jan_1', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_jan_1_aarav', session_id: 'session_jan_1', user_id: 'aarav_id', status: 'absent', excuse: 'Out of town' },
  // January 2026 Session 2
  { id: 'rec_jan_2_sid', session_id: 'session_jan_2', user_id: 'sid_id', status: 'present' },
  { id: 'rec_jan_2_ananya', session_id: 'session_jan_2', user_id: 'ananya_id', status: 'absent' },
  { id: 'rec_jan_2_aarav', session_id: 'session_jan_2', user_id: 'aarav_id', status: 'present' },

  // February 2026 Session 1
  { id: 'rec_feb_1_sid', session_id: 'session_feb_1', user_id: 'sid_id', status: 'present' },
  { id: 'rec_feb_1_ananya', session_id: 'session_feb_1', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_feb_1_aarav', session_id: 'session_feb_1', user_id: 'aarav_id', status: 'present' },
  // February 2026 Session 2
  { id: 'rec_feb_2_sid', session_id: 'session_feb_2', user_id: 'sid_id', status: 'absent' },
  { id: 'rec_feb_2_ananya', session_id: 'session_feb_2', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_feb_2_aarav', session_id: 'session_feb_2', user_id: 'aarav_id', status: 'absent' },

  // March 2026 Session 1
  { id: 'rec_mar_1_sid', session_id: 'session_mar_1', user_id: 'sid_id', status: 'present' },
  { id: 'rec_mar_1_ananya', session_id: 'session_mar_1', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_mar_1_aarav', session_id: 'session_mar_1', user_id: 'aarav_id', status: 'absent' },
  // March 2026 Session 2
  { id: 'rec_mar_2_sid', session_id: 'session_mar_2', user_id: 'sid_id', status: 'present' },
  { id: 'rec_mar_2_ananya', session_id: 'session_mar_2', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_mar_2_aarav', session_id: 'session_mar_2', user_id: 'aarav_id', status: 'present' },

  // April 2026 Session 1
  { id: 'rec_apr_1_sid', session_id: 'session_apr_1', user_id: 'sid_id', status: 'absent' },
  { id: 'rec_apr_1_ananya', session_id: 'session_apr_1', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_apr_1_aarav', session_id: 'session_apr_1', user_id: 'aarav_id', status: 'present' },
  // April 2026 Session 2
  { id: 'rec_apr_2_sid', session_id: 'session_apr_2', user_id: 'sid_id', status: 'present' },
  { id: 'rec_apr_2_ananya', session_id: 'session_apr_2', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_apr_2_aarav', session_id: 'session_apr_2', user_id: 'aarav_id', status: 'absent' },

  // May 2026 Session 1
  { id: 'rec_may_1_sid', session_id: 'session_may_1', user_id: 'sid_id', status: 'present' },
  { id: 'rec_may_1_ananya', session_id: 'session_may_1', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_may_1_aarav', session_id: 'session_may_1', user_id: 'aarav_id', status: 'present' },
  // May 2026 Session 2
  { id: 'rec_may_2_sid', session_id: 'session_may_2', user_id: 'sid_id', status: 'present' },
  { id: 'rec_may_2_ananya', session_id: 'session_may_2', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_may_2_aarav', session_id: 'session_may_2', user_id: 'aarav_id', status: 'present' },

  // June 2026 Session 1
  { id: 'rec_jun_1_sid', session_id: 'session_jun_1', user_id: 'sid_id', status: 'present' },
  { id: 'rec_jun_1_ananya', session_id: 'session_jun_1', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_jun_1_aarav', session_id: 'session_jun_1', user_id: 'aarav_id', status: 'absent' },
  // June 2026 Session 2
  { id: 'rec_jun_2_sid', session_id: 'session_jun_2', user_id: 'sid_id', status: 'absent' },
  { id: 'rec_jun_2_ananya', session_id: 'session_jun_2', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_jun_2_aarav', session_id: 'session_jun_2', user_id: 'aarav_id', status: 'present' },

  // July 2026 Session 1
  { id: 'rec_jul_1_sid', session_id: 'session_jul_1', user_id: 'sid_id', status: 'present' },
  { id: 'rec_jul_1_ananya', session_id: 'session_jul_1', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_jul_1_aarav', session_id: 'session_jul_1', user_id: 'aarav_id', status: 'present' },
  // July 2026 Session 2
  { id: 'rec_jul_2_sid', session_id: 'session_jul_2', user_id: 'sid_id', status: 'present' },
  { id: 'rec_jul_2_ananya', session_id: 'session_jul_2', user_id: 'ananya_id', status: 'present' },
  { id: 'rec_jul_2_aarav', session_id: 'session_jul_2', user_id: 'aarav_id', status: 'present' }
];

const defaultSiteContent: SiteContent[] = [
  {
    content_key: "about_malhaar",
    content_value: "Malhaar is the premier collegiate music club, serving as a creative catalyst where traditional Indian Classical lineages and diverse Global Western disciplines seamlessly unite. We are singers, guitarists, computer producers, sitar players, and rhythmists collaborating to push sonic horizons. With fully equipped rehearsal spaces, student performance records, community jams, and prestigious choir competitions, Malhaar is a vibrant sanctuary to live, breathe, and shape the sound of tomorrow."
  },
  {
    content_key: "our_history",
    content_value: "Founded in 2010 with just a couple of classical vocalists on a dormitory veranda, Malhaar has scaled to over 150 active performers, hundreds of staged masterclasses, and an annually celebrated full-house auditorium recital. Across our journey, we have consistently secured gold medals in classical polyphony, crafted custom recording suites, and fostered an enduring culture of musical inclusivity."
  },
  {
    content_key: "our_vision",
    content_value: "To build an enduring, universally accessible sanctuary in our college where music knows no linguistic or generic borders; where a sitarist can construct ambient soundscapes with a synth programmer, creating novel musical expressions that spark inspiration globally."
  },
  {
    content_key: "our_mission",
    content_value: "Equip students with professional instrument sets, persistent performance tracking metrics, masterclass workshops, and structured weekly practice times to foster consistent craft growth while sharing music publicly with the local community."
  },
  {
    content_key: "why_join",
    content_value: "Joining Malhaar gives you the ultimate platform to cultivate your musical talent, collaborate across classical & modern genres, perform in grand inter-college live festivals, track your session logs dynamically via the leaderboard, and become a part of a beautiful, lifelong family of performers."
  },
  {
    content_key: "live_status_text",
    content_value: "Season Auditions Live"
  }
];

const defaultAlumni: Alumni[] = [];

const defaultCustomSections: CustomSection[] = [];

const defaultSvaraPracticeMaterials: SvaraPracticeMaterial[] = [
  {
    id: 'practice_1',
    title: 'Hindustani Sa-Re-Ga-Ma Alankar Warmup',
    lyrics: 'Arohana: Sa Re Ga Ma Pa Dha Ni Sa\'\nAvarohana: Sa\' Ni Dha Pa Ma Ga Re Sa\n\nDouble speed (Dugun):\nSaRe GaMa PaDha NiSa\'\nSa\'Ni DhaPa MaGa ReSa',
    category: '1. INDIAN CHOIR COMPOSITION',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    created_at: '2026-07-01'
  },
  {
    id: 'practice_2',
    title: 'Raag Bhairav Sargam Geet',
    lyrics: 'Sthayi:\nSa Re Ga Ma Pa, Dha Dha Pa,\nMa Ga Re Sa, Re Re Sa\n\nAntara:\nPa Dha Ni Sa\' Sa\', Ni Dha Pa,\nMa Ga Re Sa, Re Re Sa',
    category: '2. WESTERN A CAPPELLA',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    created_at: '2026-07-01'
  }
];

// Class to handle simulated local storage persistence
export class MockDatabase {
  private cache: Record<string, any> = {};
  private loadedFromServer = false;

  // Debounce sync: accumulate dirty keys and flush after 500ms idle
  private _pendingDirtyKeys: Set<string> = new Set();
  private _syncTimer: ReturnType<typeof setTimeout> | null = null;
  private _syncInFlight: boolean = false;
  private static SYNC_DEBOUNCE_MS = 500;

  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (this.cache[key] !== undefined) {
      return this.cache[key];
    }
    try {
      const data = localStorage.getItem(`malhaar_${key}`);
      const parsed = data ? JSON.parse(data) : defaultValue;
      this.cache[key] = parsed;
      return parsed;
    } catch (e) {
      console.warn(`Error reading from localStorage for key "${key}", falling back to default/cache.`, e);
      this.cache[key] = defaultValue;
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    this.cache[key] = value;
    try {
      localStorage.setItem(`malhaar_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`Local storage quota exceeded for key "${key}". Persisted in-memory and syncing with Cloud.`, e);
    }
    // Use debounced sync instead of immediate sync to prevent rapid-fire HTTP requests
    this._scheduleDebouncedSync(key);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('malhaar-db-update'));
    }
  }

  /**
   * Schedule a debounced sync: accumulates dirty keys and flushes them
   * to the server after SYNC_DEBOUNCE_MS of idle time.
   * This prevents rapid-fire race conditions when multiple saves happen
   * in quick succession (e.g., marking attendance for 20 students).
   */
  private _scheduleDebouncedSync(key: string): void {
    if (!this.loadedFromServer) return;
    this._pendingDirtyKeys.add(key);
    if (this._syncTimer) {
      clearTimeout(this._syncTimer);
    }
    this._syncTimer = setTimeout(() => {
      this._flushPendingSync();
    }, MockDatabase.SYNC_DEBOUNCE_MS);
  }

  private _flushPendingSync(): void {
    if (this._pendingDirtyKeys.size === 0 || this._syncInFlight) return;
    const keysToSync = Array.from(this._pendingDirtyKeys);
    this._pendingDirtyKeys.clear();
    this._syncTimer = null;

    const payload: Record<string, any> = {};
    keysToSync.forEach(k => {
      const value = this.cache[k];
      if (value !== undefined && value !== null) {
        payload[k] = value;
      }
    });

    if (Object.keys(payload).length === 0) return;

    this._syncInFlight = true;
    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          console.error(`Server sync failed with status ${res.status}`);
        }
      })
      .catch(err => {
        console.error('Failed to sync database to server:', err);
      })
      .finally(() => {
        this._syncInFlight = false;
        // If more keys accumulated during this sync, flush them now
        if (this._pendingDirtyKeys.size > 0) {
          this._flushPendingSync();
        }
      });
  }

  isSyncPending(): boolean {
    return this._pendingDirtyKeys.size > 0 || this._syncInFlight;
  }

  loadServerData(data: Record<string, any>): void {
    if (!data || typeof data !== 'object') return;
    this.loadedFromServer = true;
    Object.keys(data).forEach(key => {
      this.cache[key] = data[key];
      try {
        localStorage.setItem(`malhaar_${key}`, JSON.stringify(data[key]));
      } catch (e) {
        console.warn(`Could not sync key "${key}" to local storage on startup (quota exceeded/Safari privacy mode), loaded in-memory fallback:`, e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('malhaar-db-update'));
    }
  }

  getDefaultValueForKey(key: string): any {
    switch (key) {
      case 'profiles': return defaultProfiles;
      case 'performance': return defaultPerformance;
      case 'notices': return defaultNotices;
      case 'events': return defaultEvents;
      case 'achievements': return defaultAchievements;
      case 'merchandise': return defaultMerchandise;
      case 'media_folders': return defaultMediaFolders;
      case 'core_members': return defaultCoreMembers;
      case 'core_performance': return defaultCorePerformance;
      case 'timetable': return defaultTimetable;
      case 'monthly_targets': return defaultMonthlyTargets;
      case 'suggestions': return defaultSuggestions;
      case 'attendance_sessions': return defaultSessions;
      case 'attendance_records': return defaultAttendanceRecords;
      case 'site_content': return defaultSiteContent;
      case 'alumni': return defaultAlumni;
      case 'custom_sections': return defaultCustomSections;
      case 'svara_practice_materials': return defaultSvaraPracticeMaterials;
      case 'knowledge_items': return [{ id: 'k_1', title: 'Microtones (Srutis) in Ragas', category: 'general', content: 'Indian music divides the octave into 22 srutis (microtonal intervals) rather than the Western 12 semitones. This allows classical vocalists to express emotional micro-variations (gamakas) between notes.', created_by: 'President' }];
      case 'alumni_messages': return [];
      case 'active_month': return new Date().toLocaleString('en-US', { month: 'long' });
      default: return [];
    }
  }

  async fetchLatestFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        this.loadServerData(data);
      } else {
        this.loadedFromServer = true;
      }
    } catch (error) {
      console.warn("Could not fetch latest server data", error);
      this.loadedFromServer = true;
    }
  }

  syncAllToServer(changedKey?: string): void {
    if (!this.loadedFromServer && !changedKey) {
      console.log("Database not fully initialized from server yet. Postponing background sync.");
      return;
    }
    const payload: Record<string, any> = {};
    if (changedKey) {
      // Use debounced sync for individual key changes
      this._scheduleDebouncedSync(changedKey);
      return;
    } else {
      const keys = [
        'profiles', 'performance', 'notices', 'events', 'achievements',
        'merchandise', 'media_folders', 'core_members', 'core_performance',
        'timetable', 'monthly_targets', 'suggestions', 'site_content',
        'alumni', 'custom_sections', 'attendance_sessions', 'attendance_records',
        'svara_practice_materials', 'knowledge_items', 'alumni_messages',
        'active_month'
      ];
      keys.forEach(k => {
        const value = this.cache[k] !== undefined ? this.cache[k] : null;
        if (value !== null) {
          payload[k] = value;
        }
      });
    }

    if (Object.keys(payload).length === 0) return;

    fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.error("Failed to sync database to server", err);
    });
  }

  resetToDefaults(): void {
    const allKeys = [
      'profiles', 'performance', 'notices', 'events', 'achievements',
      'merchandise', 'media_folders', 'core_members', 'core_performance',
      'timetable', 'monthly_targets', 'suggestions', 'site_content',
      'alumni', 'custom_sections', 'attendance_sessions', 'attendance_records',
      'svara_practice_materials', 'knowledge_items', 'alumni_messages',
      'active_month'
    ];

    const defaultPayload: Record<string, any> = {};

    allKeys.forEach(key => {
      // Clear from localStorage
      localStorage.removeItem(`malhaar_${key}`);
      
      // Get the default value and prepare for server sync
      const defaultVal = this.getDefaultValueForKey(key);
      defaultPayload[key] = defaultVal;
    });

    // Clear the in-memory cache to prevent stale reads
    this.cache = {};

    // Cancel any pending debounced syncs
    if (this._syncTimer) {
      clearTimeout(this._syncTimer);
      this._syncTimer = null;
    }
    this._pendingDirtyKeys.clear();

    // Push the clean defaults to the server to overwrite corrupted cloud backups
    fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(defaultPayload)
    })
    .then(() => {
      console.log("Successfully reset cloud database to defaults.");
      // Force reload to apply defaults
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    })
    .catch(err => console.error("Failed to reset database on server", err));
  }

  getAlumni(): Alumni[] {
    return this.getStorageItem<Alumni[]>('alumni', defaultAlumni);
  }

  getCustomSections(): CustomSection[] {
    return this.getStorageItem<CustomSection[]>('custom_sections', defaultCustomSections);
  }

  saveAlumni(data: Alumni[]): void {
    this.setStorageItem('alumni', data);
  }

  saveCustomSections(data: CustomSection[]): void {
    this.setStorageItem('custom_sections', data);
  }

  getSvaraPracticeMaterials(): SvaraPracticeMaterial[] {
    return this.getStorageItem<SvaraPracticeMaterial[]>('svara_practice_materials', defaultSvaraPracticeMaterials);
  }

  saveSvaraPracticeMaterials(data: SvaraPracticeMaterial[]): void {
    this.setStorageItem('svara_practice_materials', data);
  }

  getProfiles(): Profile[] {
    return this.getStorageItem<Profile[]>('profiles', defaultProfiles);
  }

  getPerformance(): Performance[] {
    return this.getStorageItem<Performance[]>('performance', defaultPerformance);
  }

  getNotices(): Notice[] {
    return this.getStorageItem<Notice[]>('notices', defaultNotices);
  }

  getEvents(): ClubEvent[] {
    return this.getStorageItem<ClubEvent[]>('events', defaultEvents);
  }

  getAchievements(): Achievement[] {
    return this.getStorageItem<Achievement[]>('achievements', defaultAchievements);
  }

  getMerchandise(): Merchandise[] {
    return this.getStorageItem<Merchandise[]>('merchandise', defaultMerchandise);
  }

  getMediaFolders(): MediaFolder[] {
    return this.getStorageItem<MediaFolder[]>('media_folders', defaultMediaFolders);
  }

  getCoreMembers(): CoreMember[] {
    const manualCore = this.getStorageItem<CoreMember[]>('core_members', defaultCoreMembers);
    const profiles = this.getProfiles();
    
    // Find approved profiles with a core or leadership role
    const coreProfiles = profiles.filter(p => p.approved && (p.role === 'core' || p.role === 'central_core' || p.role === 'admin' || p.role === 'president'));
    
    // Map these profiles into the CoreMember structure
    const synthesizedCore: CoreMember[] = coreProfiles.map(p => {
      const existing = manualCore.find(m => m.id === p.id);
      
      let positionText = 'Core Board Member';
      if (p.role === 'president') {
        positionText = 'Overall Club President';
      } else if (p.role === 'central_core') {
        positionText = 'Central Core of Society';
      } else if (p.role === 'admin') {
        positionText = 'Operations Coordinator';
      } else if (p.domain) {
        positionText = `Core Team (${p.domain})`;
      }

      return {
        id: p.id,
        name: p.name,
        role: p.role === 'president' ? 'President' : p.role === 'central_core' ? 'Central Core' : p.role === 'admin' ? 'Admin' : 'Core',
        role_key: p.role,
        position: existing?.position || positionText,
        tenure: existing?.tenure || '2025 - Present',
        description: existing?.description || p.bio || `Active ${p.role === 'president' ? 'President' : p.role === 'central_core' ? 'Central Core Member' : 'Core Board Member'} of Malhaar Music Society`,
        image_url: p.profile_image_url || existing?.image_url || '',
        year: p.year,
        phone_number: existing?.phone_number || '',
        tenure_year: existing?.tenure_year || '2026',
        is_starred: existing?.is_starred !== undefined ? existing.is_starred : (p.role === 'president' || p.role === 'central_core' || p.role === 'admin')
      } as any; // Cast as any if there's any strict property checker (like is_starred)
    });
    
    // Merge: start with synthesized entries (to make sure they override stale manual ones),
    // and append manual ones that don't correspond to any existing profile
    const merged: CoreMember[] = [...synthesizedCore];
    
    manualCore.forEach(mc => {
      if (!merged.some(m => m.id === mc.id)) {
        merged.push({ ...mc, role_key: mc.role?.toLowerCase() } as any);
      }
    });
    
    return merged;
  }

  getCorePerformance(): CorePerformance[] {
    const manualPerformance = this.getStorageItem<CorePerformance[]>('core_performance', defaultCorePerformance);
    const profiles = this.getProfiles();
    
    const coreProfiles = profiles.filter(p => p.approved && p.role === 'core');
    
    // Create performance structure for any core profiles that don't already have one
    const synthesized: CorePerformance[] = coreProfiles.map(p => {
      const existing = manualPerformance.find(cp => cp.core_id === p.id);
      if (existing) {
        return existing;
      }
      return {
        core_id: p.id,
        tasks_assigned: 5,
        tasks_completed: 3,
        efficiency_score: 60,
        progress: 60
      };
    });
    
    // Add any remaining manual performances that aren't matching existing profiles
    const merged: CorePerformance[] = [...synthesized];
    manualPerformance.forEach(mp => {
      if (!merged.some(m => m.core_id === mp.core_id)) {
        merged.push(mp);
      }
    });
    
    return merged;
  }

  getTimetable(): TimetableEntry[] {
    return this.getStorageItem<TimetableEntry[]>('timetable', defaultTimetable);
  }

  getMonthlyTargets(): MonthlyTarget[] {
    return this.getStorageItem<MonthlyTarget[]>('monthly_targets', defaultMonthlyTargets);
  }

  getSuggestions(): Suggestion[] {
    return this.getStorageItem<Suggestion[]>('suggestions', defaultSuggestions);
  }

  getSiteContent(): SiteContent[] {
    return this.getStorageItem<SiteContent[]>('site_content', defaultSiteContent);
  }

  saveSiteContent(data: SiteContent[]): void {
    this.setStorageItem('site_content', data);
  }

  saveProfiles(data: Profile[]): void {
    this.setStorageItem('profiles', data);
  }

  savePerformance(data: Performance[]): void {
    this.setStorageItem('performance', data);
  }

  saveNotices(data: Notice[]): void {
    this.setStorageItem('notices', data);
  }

  saveEvents(data: ClubEvent[]): void {
    this.setStorageItem('events', data);
  }

  saveAchievements(data: Achievement[]): void {
    this.setStorageItem('achievements', data);
  }

  saveMerchandise(data: Merchandise[]): void {
    this.setStorageItem('merchandise', data);
  }

  saveMediaFolders(data: MediaFolder[]): void {
    this.setStorageItem('media_folders', data);
  }

  saveCoreMembers(data: CoreMember[]): void {
    this.setStorageItem('core_members', data);
  }

  saveCorePerformance(data: CorePerformance[]): void {
    this.setStorageItem('core_performance', data);
  }

  saveTimetable(data: TimetableEntry[]): void {
    this.setStorageItem('timetable', data);
  }

  saveMonthlyTargets(data: MonthlyTarget[]): void {
    this.setStorageItem('monthly_targets', data);
  }

  saveSuggestions(data: Suggestion[]): void {
    this.setStorageItem('suggestions', data);
  }

  getAttendanceSessions(): AttendanceSession[] {
    return this.getStorageItem<AttendanceSession[]>('attendance_sessions', defaultSessions);
  }

  saveAttendanceSessions(data: AttendanceSession[]): void {
    this.setStorageItem('attendance_sessions', data);
  }

  getAttendanceRecords(): AttendanceRecord[] {
    return this.getStorageItem<AttendanceRecord[]>('attendance_records', defaultAttendanceRecords);
  }

  saveAttendanceRecords(data: AttendanceRecord[]): void {
    this.setStorageItem('attendance_records', data);
  }

  getKnowledgeItems(): KnowledgeItem[] {
    return this.getStorageItem<KnowledgeItem[]>('knowledge_items', [
      {
        id: 'k_1',
        title: 'Microtones (Srutis) in Ragas',
        category: 'general',
        content: 'Indian music divides the octave into 22 srutis (microtonal intervals) rather than the Western 12 semitones. This allows classical vocalists to express emotional micro-variations (gamakas) between notes.',
        created_by: 'President'
      }
    ]);
  }

  saveKnowledgeItems(data: KnowledgeItem[]): void {
    this.setStorageItem('knowledge_items', data);
  }

  getAlumniMessages(): AlumniMessage[] {
    return this.getStorageItem<AlumniMessage[]>('alumni_messages', [
      {
        id: 'msg_1',
        sender_id: 'admin_id',
        sender_name: 'Admin',
        sender_role: 'admin',
        text: 'Welcome to the Alumni Connect lounge! This is an exclusive space for our legacy members to reconnect, share guidance, and broadcast media jams.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'msg_2',
        sender_id: 'alumni_1',
        sender_name: 'Molly Clark',
        sender_role: 'alumni',
        text: 'Hey team! Recorded a quick classical Svara riff during my afternoon vocal practice. Check it out and let me know your thoughts!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        audio_url: 'blob:simulated_vocal_riff'
      },
      {
        id: 'msg_3',
        sender_id: 'alumni_2',
        sender_name: 'Devon Lane',
        sender_role: 'alumni',
        text: 'Throwback to our grand classical recital jam at the convention hall last year! Such warm memories with the active core group. 🎹✨',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        image_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600'
      }
    ]);
  }

  saveAlumniMessages(data: AlumniMessage[]): void {
    this.setStorageItem('alumni_messages', data);
  }

  getActiveMonth(): string {
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    return this.getStorageItem<string>('active_month', currentMonth);
  }

  saveActiveMonth(month: string): void {
    this.setStorageItem('active_month', month);
  }
}

export const dbInstance = new MockDatabase();
