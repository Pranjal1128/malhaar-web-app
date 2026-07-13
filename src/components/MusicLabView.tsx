import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Radio, Music, Award, Sparkles, BookOpen, Volume2, Info, Check, Plus, Trash2, Edit3, AlertTriangle, Mic2 } from 'lucide-react';
import { Profile, KnowledgeItem, dbInstance } from '../db/mockDb';
import SvaraPracticeHub from './SvaraPracticeHub';

interface ThaatDefinition {
  name: string;
  englishName: string;
  description: string;
  mood: string;
  timeOfDay: string;
  notes: {
    name: string;      // Sa, Komal Re, etc.
    svara: string;     // सा, रे̱, etc.
    semitoneIdx: number; // Index in the 12 chromatic semitones (0 to 11)
    frequencyFactor: number;
    description: string;
  }[];
}

// 10 Traditional Hindustani Classical Thaats (Scales)
const CLASSICAL_THAATS: ThaatDefinition[] = [
  {
    name: 'Bilawal Thaat',
    englishName: 'Shankarabharanam (Major Scale)',
    description: 'The standard reference scale in Hindustani music. All notes are Shuddha (natural).',
    mood: 'Joyous, celebratory, bright',
    timeOfDay: 'Morning (6 AM - 9 AM)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Shuddha Rishabh (Re)', svara: 'रे', semitoneIdx: 2, frequencyFactor: 1.1225, description: 'Major 2nd' },
      { name: 'Shuddha Gandhar (Ga)', svara: 'ग', semitoneIdx: 4, frequencyFactor: 1.2599, description: 'Major 3rd' },
      { name: 'Shuddha Madhyam (Ma)', svara: 'म', semitoneIdx: 5, frequencyFactor: 1.3348, description: 'Perfect 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Shuddha Dhaivat (Dha)', svara: 'ध', semitoneIdx: 9, frequencyFactor: 1.6818, description: 'Major 6th' },
      { name: 'Shuddha Nishad (Ni)', svara: 'नि', semitoneIdx: 11, frequencyFactor: 1.8877, description: 'Major 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Bhairav Thaat',
    englishName: 'Double Harmonic Major',
    description: 'Features Komal Rishabh (flat Re) and Komal Dhaivat (flat Dha) with natural Ga & Ni. Intensely prayerful.',
    mood: 'Devotional, solemn, peaceful',
    timeOfDay: 'Dawn (4 AM - 6 AM)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Komal Rishabh (Re̱)', svara: 'रे̱', semitoneIdx: 1, frequencyFactor: 1.0595, description: 'Minor 2nd' },
      { name: 'Shuddha Gandhar (Ga)', svara: 'ग', semitoneIdx: 4, frequencyFactor: 1.2599, description: 'Major 3rd' },
      { name: 'Shuddha Madhyam (Ma)', svara: 'म', semitoneIdx: 5, frequencyFactor: 1.3348, description: 'Perfect 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Komal Dhaivat (Dha̱)', svara: 'ध̱', semitoneIdx: 8, frequencyFactor: 1.5874, description: 'Minor 6th' },
      { name: 'Shuddha Nishad (Ni)', svara: 'नि', semitoneIdx: 11, frequencyFactor: 1.8877, description: 'Major 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Bhairavi Thaat',
    englishName: 'Hanumatodi (Phrygian Mode)',
    description: 'All variable notes (Re, Ga, Dha, Ni) are Komal (flat). Highly sentimental and melancholic.',
    mood: 'Compassionate, yearning, emotional',
    timeOfDay: 'Morning (Post-sunrise)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Komal Rishabh (Re̱)', svara: 'रे̱', semitoneIdx: 1, frequencyFactor: 1.0595, description: 'Minor 2nd' },
      { name: 'Komal Gandhar (Ga̱)', svara: 'ग̱', semitoneIdx: 3, frequencyFactor: 1.1892, description: 'Minor 3rd' },
      { name: 'Shuddha Madhyam (Ma)', svara: 'म', semitoneIdx: 5, frequencyFactor: 1.3348, description: 'Perfect 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Komal Dhaivat (Dha̱)', svara: 'ध̱', semitoneIdx: 8, frequencyFactor: 1.5874, description: 'Minor 6th' },
      { name: 'Komal Nishad (Ni̱)', svara: 'नि̱', semitoneIdx: 10, frequencyFactor: 1.7818, description: 'Minor 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Kalyan Thaat',
    englishName: 'Mechalyani (Lydian Mode)',
    description: 'Features Teevra Madhyam (sharp Ma) while all other notes are natural. Beautiful evening framework.',
    mood: 'Peaceful, meditative, romantic',
    timeOfDay: 'Evening (Sunset to 9 PM)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Shuddha Rishabh (Re)', svara: 'रे', semitoneIdx: 2, frequencyFactor: 1.1225, description: 'Major 2nd' },
      { name: 'Shuddha Gandhar (Ga)', svara: 'ग', semitoneIdx: 4, frequencyFactor: 1.2599, description: 'Major 3rd' },
      { name: 'Teevra Madhyam (Ma\')', svara: 'म॑', semitoneIdx: 6, frequencyFactor: 1.4142, description: 'Augmented 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Shuddha Dhaivat (Dha)', svara: 'ध', semitoneIdx: 9, frequencyFactor: 1.6818, description: 'Major 6th' },
      { name: 'Shuddha Nishad (Ni)', svara: 'नि', semitoneIdx: 11, frequencyFactor: 1.8877, description: 'Major 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Kafi Thaat',
    englishName: 'Kharaharapriya (Dorian Mode)',
    description: 'Features Komal Gandhar (flat Ga) and Komal Nishad (flat Ni). Popular in rhythmic folk, thumri, and hori.',
    mood: 'Playful, celebratory, nostalgic',
    timeOfDay: 'Night (9 PM - Midnight)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Shuddha Rishabh (Re)', svara: 'रे', semitoneIdx: 2, frequencyFactor: 1.1225, description: 'Major 2nd' },
      { name: 'Komal Gandhar (Ga̱)', svara: 'ग̱', semitoneIdx: 3, frequencyFactor: 1.1892, description: 'Minor 3rd' },
      { name: 'Shuddha Madhyam (Ma)', svara: 'म', semitoneIdx: 5, frequencyFactor: 1.3348, description: 'Perfect 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Shuddha Dhaivat (Dha)', svara: 'ध', semitoneIdx: 9, frequencyFactor: 1.6818, description: 'Major 6th' },
      { name: 'Komal Nishad (Ni̱)', svara: 'नि̱', semitoneIdx: 10, frequencyFactor: 1.7818, description: 'Minor 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Asavari Thaat',
    englishName: 'Natabhairavi (Natural Minor / Aeolian)',
    description: 'Features Komal Gandhar, Komal Dhaivat, and Komal Nishad with a natural Re. Bold and melancholic.',
    mood: 'Renunciation, courage, sadness',
    timeOfDay: 'Late Morning (9 AM - Noon)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Shuddha Rishabh (Re)', svara: 'रे', semitoneIdx: 2, frequencyFactor: 1.1225, description: 'Major 2nd' },
      { name: 'Komal Gandhar (Ga̱)', svara: 'ग̱', semitoneIdx: 3, frequencyFactor: 1.1892, description: 'Minor 3rd' },
      { name: 'Shuddha Madhyam (Ma)', svara: 'म', semitoneIdx: 5, frequencyFactor: 1.3348, description: 'Perfect 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Komal Dhaivat (Dha̱)', svara: 'ध̱', semitoneIdx: 8, frequencyFactor: 1.5874, description: 'Minor 6th' },
      { name: 'Komal Nishad (Ni̱)', svara: 'नि̱', semitoneIdx: 10, frequencyFactor: 1.7818, description: 'Minor 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Khamaj Thaat',
    englishName: 'Harikambhoji (Mixolydian Mode)',
    description: 'Uses Shuddha Ga (natural Ga) with Komal Ni (flat Ni). Famous for romantic Ghazals and light classical pieces.',
    mood: 'Sensual, longing, expressive',
    timeOfDay: 'Late Night (Midnight - 3 AM)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Shuddha Rishabh (Re)', svara: 'रे', semitoneIdx: 2, frequencyFactor: 1.1225, description: 'Major 2nd' },
      { name: 'Shuddha Gandhar (Ga)', svara: 'ग', semitoneIdx: 4, frequencyFactor: 1.2599, description: 'Major 3rd' },
      { name: 'Shuddha Madhyam (Ma)', svara: 'म', semitoneIdx: 5, frequencyFactor: 1.3348, description: 'Perfect 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Shuddha Dhaivat (Dha)', svara: 'ध', semitoneIdx: 9, frequencyFactor: 1.6818, description: 'Major 6th' },
      { name: 'Komal Nishad (Ni̱)', svara: 'नि̱', semitoneIdx: 10, frequencyFactor: 1.7818, description: 'Minor 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Poorvi Thaat',
    englishName: 'Kamavardhani',
    description: 'Features flat Re, sharp Ma, and flat Dha with natural Ga & Ni. Highly ornate and dark chromatic colors.',
    mood: 'Deeply mystical, serious, evening twilight',
    timeOfDay: 'Sunset (4 PM - 6 PM)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Komal Rishabh (Re̱)', svara: 'रे̱', semitoneIdx: 1, frequencyFactor: 1.0595, description: 'Minor 2nd' },
      { name: 'Shuddha Gandhar (Ga)', svara: 'ग', semitoneIdx: 4, frequencyFactor: 1.2599, description: 'Major 3rd' },
      { name: 'Teevra Madhyam (Ma\')', svara: 'म॑', semitoneIdx: 6, frequencyFactor: 1.4142, description: 'Augmented 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Komal Dhaivat (Dha̱)', svara: 'ध̱', semitoneIdx: 8, frequencyFactor: 1.5874, description: 'Minor 6th' },
      { name: 'Shuddha Nishad (Ni)', svara: 'नि', semitoneIdx: 11, frequencyFactor: 1.8877, description: 'Major 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Marwa Thaat',
    englishName: 'Gamanasrama',
    description: 'Features Komal Re (flat Re) and Teevra Ma (sharp Ma) with all other notes Shuddha. Extremely tense and moody.',
    mood: 'Anxiety, expectation, raw beauty',
    timeOfDay: 'Sunset (Twilight hours)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Komal Rishabh (Re̱)', svara: 'रे̱', semitoneIdx: 1, frequencyFactor: 1.0595, description: 'Minor 2nd' },
      { name: 'Shuddha Gandhar (Ga)', svara: 'ग', semitoneIdx: 4, frequencyFactor: 1.2599, description: 'Major 3rd' },
      { name: 'Teevra Madhyam (Ma\')', svara: 'म॑', semitoneIdx: 6, frequencyFactor: 1.4142, description: 'Augmented 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Shuddha Dhaivat (Dha)', svara: 'ध', semitoneIdx: 9, frequencyFactor: 1.6818, description: 'Major 6th' },
      { name: 'Shuddha Nishad (Ni)', svara: 'नि', semitoneIdx: 11, frequencyFactor: 1.8877, description: 'Major 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  },
  {
    name: 'Todi Thaat',
    englishName: 'Subhapantuvarali',
    description: 'The most chromatic and complex scale. Flat Re, flat Ga, sharp Ma, flat Dha. Profoundly tragic and meditative.',
    mood: 'Adoration, deep remorse, tragedy',
    timeOfDay: 'Morning (9 AM - Noon)',
    notes: [
      { name: 'Shadj (Sa)', svara: 'सा', semitoneIdx: 0, frequencyFactor: 1.0000, description: 'Root' },
      { name: 'Komal Rishabh (Re̱)', svara: 'रे̱', semitoneIdx: 1, frequencyFactor: 1.0595, description: 'Minor 2nd' },
      { name: 'Komal Gandhar (Ga̱)', svara: 'ग̱', semitoneIdx: 3, frequencyFactor: 1.1892, description: 'Minor 3rd' },
      { name: 'Teevra Madhyam (Ma\')', svara: 'म॑', semitoneIdx: 6, frequencyFactor: 1.4142, description: 'Augmented 4th' },
      { name: 'Pancham (Pa)', svara: 'प', semitoneIdx: 7, frequencyFactor: 1.4983, description: 'Perfect 5th' },
      { name: 'Komal Dhaivat (Dha̱)', svara: 'ध̱', semitoneIdx: 8, frequencyFactor: 1.5874, description: 'Minor 6th' },
      { name: 'Shuddha Nishad (Ni)', svara: 'नि', semitoneIdx: 11, frequencyFactor: 1.8877, description: 'Major 7th' },
      { name: 'Tar Shadj (Sa\')', svara: 'सां', semitoneIdx: 12, frequencyFactor: 2.0000, description: 'Octave' }
    ]
  }
];

// High fidelity acoustic performance styles
interface PerformanceStyle {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'vocal' | 'instrument';
}

const PERFORMANCE_STYLES: PerformanceStyle[] = [
  {
    id: 'harmonium-keys',
    name: '🎹 Harmonium Keys',
    emoji: '🪗',
    description: 'Rich dual-reed classical Indian organ simulation with soft bellows air pressure tremolo.',
    type: 'instrument'
  },
  {
    id: 'piano-keys',
    name: '🎹 Keyboard Keys',
    emoji: '🎹',
    description: 'Resonant classical piano key pluck with full mechanical hammer soundstage.',
    type: 'instrument'
  }
];

// 12 Semitone Roots for Master Scale Tuning
interface MasterKeyPitch {
  name: string;
  freq: number; // Hz for C4 (261.63 Hz)
}

const MASTER_KEYS: MasterKeyPitch[] = [
  { name: 'C', freq: 261.63 },
  { name: 'C#', freq: 277.18 },
  { name: 'D', freq: 293.66 },
  { name: 'D#', freq: 311.13 },
  { name: 'E', freq: 329.63 },
  { name: 'F', freq: 349.23 },
  { name: 'F#', freq: 369.99 },
  { name: 'G', freq: 392.00 },
  { name: 'G#', freq: 415.30 },
  { name: 'A', freq: 440.00 },
  { name: 'A#', freq: 466.16 },
  { name: 'B', freq: 493.88 }
];

const KEY_MAPPINGS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];

interface MusicLabViewProps {
  currentUser?: Profile;
  onRequestToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function MusicLabView({ currentUser, onRequestToast }: MusicLabViewProps) {
  const [activeThaatIdx, setActiveThaatIdx] = useState(0);
  const [activeStyleId, setActiveStyleId] = useState<string>('harmonium-keys');
  const [masterKeyIdx, setMasterKeyIdx] = useState(0); // Default 'C' root
  
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Practice Notes interface and states
  interface MusicPracticeNote {
    id: string;
    userId: string;
    userName: string;
    title: string;
    content: string;
    svaraSequence?: string;
    createdAt: string;
  }

  const [practiceNotes, setPracticeNotes] = useState<MusicPracticeNote[]>(() => {
    try {
      const stored = localStorage.getItem('malhaar_practice_notes');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'note_1',
        userId: 'admin_sys',
        userName: 'Swar Lab Coach',
        title: 'Fundamental Yaman Practice Drill',
        content: 'Yaman requires Tevra Madhyam (Ma#) for its intense evening rasa. Practice transitioning from Ni directly to Re (Ni -> Re -> Ga) to set the authentic mood. Avoid using Shuddha Ma entirely.',
        svaraSequence: 'नि रे ग म॑ प ध नि',
        createdAt: new Date().toISOString()
      },
      {
        id: 'note_2',
        userId: 'admin_sys',
        userName: 'Acharya Malhaar',
        title: 'Bhairav Morning Meditation Routine',
        content: 'Bhairav relies heavily on Komal Rishabh (flat Re) and Komal Dhaivat (flat Dha). Hold the flat Re with slight vibrato (andolan) to trigger deep morning peace.',
        svaraSequence: 'सा रे॒ ग म प ध॒ नि',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSvara, setNoteSvara] = useState('');

  useEffect(() => {
    localStorage.setItem('malhaar_practice_notes', JSON.stringify(practiceNotes));
  }, [practiceNotes]);

  const handleAddPracticeNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      if (onRequestToast) onRequestToast('Please fill in both the title and the practice description.', 'error');
      return;
    }

    const newNote: MusicPracticeNote = {
      id: `note_${Date.now()}`,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Anonymous Member',
      title: noteTitle.trim(),
      content: noteContent.trim(),
      svaraSequence: noteSvara.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setPracticeNotes([newNote, ...practiceNotes]);
    setNoteTitle('');
    setNoteContent('');
    setNoteSvara('');
    if (onRequestToast) onRequestToast('Practice note saved successfully!', 'success');
  };

  const handleDeletePracticeNote = (id: string) => {
    const updated = practiceNotes.filter(n => n.id !== id);
    setPracticeNotes(updated);
    if (onRequestToast) onRequestToast('Practice note removed.', 'info');
  };

  // Audio nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  
  // Track active playing oscillators for key presses
  const activeOscillatorsRef = useRef<Record<number, any[]>>({});
  const activeGainNodesRef = useRef<Record<number, GainNode>>({});

  // Canvas visualizer refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const activeThaat = CLASSICAL_THAATS[activeThaatIdx];
  const activeStyle = PERFORMANCE_STYLES.find(s => s.id === activeStyleId) || PERFORMANCE_STYLES[0];
  const activeRoot = MASTER_KEYS[masterKeyIdx];

  // Initialize Web Audio context lazily on first interaction - Direct dry connection (No Echo)
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error('Web Audio API is not supported in this browser.');
      }
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Create analyzer node for visualizer
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 512;
      analyzerRef.current = analyzer;

      // Direct clean route: Analyzer -> speakers (Direct dry connection, NO echo)
      analyzer.connect(ctx.destination);
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Trigger Svara Node based on selected performance style
  const playSvara = (noteIdx: number, baseFactor: number) => {
    try {
      const ctx = getAudioContext();
      
      // Stop previous note oscillators on same slot
      if (activeOscillatorsRef.current[noteIdx]) {
        activeOscillatorsRef.current[noteIdx].forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        delete activeOscillatorsRef.current[noteIdx];
      }

      const fundamentalFreq = activeRoot.freq * baseFactor;
      const nodesToStop: any[] = [];
      const masterGain = ctx.createGain();

      // Setup customized sound synthesis according to active Performance Style
      if (activeStyleId === 'harmonium-keys') {
        // --- 1. HARMONIUM REEDS MODEL ---
        // Harmoniums have dual/triple reeds with slightly detuned square/sawtooth waves
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const o3 = ctx.createOscillator();
        
        o1.type = 'sawtooth';
        o1.frequency.setValueAtTime(fundamentalFreq, ctx.currentTime);
        
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(fundamentalFreq * 2, ctx.currentTime); // Octave reed
        
        o3.type = 'sawtooth';
        o3.frequency.setValueAtTime(fundamentalFreq * 0.5, ctx.currentTime); // Bass reed

        // Bellows pressure LFO (gentle 4.5Hz tremolo/vibrato for rich air flow)
        const bellowsLfo = ctx.createOscillator();
        const bellowsGain = ctx.createGain();
        bellowsLfo.frequency.value = 4.5;
        bellowsGain.gain.value = 0.04; // 4% volume oscillation
        bellowsLfo.connect(bellowsGain);
        bellowsLfo.start();
        bellowsLfo.stop(ctx.currentTime + 0.38);
        nodesToStop.push(bellowsLfo);

        // Lowpass filter to warm up the harsh reed teeth
        const reedFilter = ctx.createBiquadFilter();
        reedFilter.type = 'lowpass';
        reedFilter.frequency.setValueAtTime(900, ctx.currentTime);

        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.18, ctx.currentTime);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.10, ctx.currentTime);
        const g3 = ctx.createGain();
        g3.gain.setValueAtTime(0.12, ctx.currentTime);

        o1.connect(g1);
        o2.connect(g2);
        o3.connect(g3);

        g1.connect(reedFilter);
        g2.connect(reedFilter);
        g3.connect(reedFilter);

        reedFilter.connect(masterGain);
        bellowsGain.connect(masterGain.gain); // Modulate bellows pressure

        o1.start();
        o2.start();
        o3.start();
        o1.stop(ctx.currentTime + 0.38);
        o2.stop(ctx.currentTime + 0.38);
        o3.stop(ctx.currentTime + 0.38);
        nodesToStop.push(o1, o2, o3);

        // Snappy click keyboard envelope - stops fast and clean! (No Continuation, No Aqua)
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.015); // Snappy attack
        masterGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.15); // Fast decay
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35); // Clean absolute stop

      } else {
        // --- 2. KEYBOARD KEYS MODEL ---
        // Sine + triangle mixture to create a clean, crisp classical keyboard/piano sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(fundamentalFreq, ctx.currentTime);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(fundamentalFreq * 2, ctx.currentTime);

        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.24, ctx.currentTime);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.12, ctx.currentTime);

        osc1.connect(g1);
        osc2.connect(g2);
        g1.connect(masterGain);
        g2.connect(masterGain);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.38);
        osc2.stop(ctx.currentTime + 0.38);
        nodesToStop.push(osc1, osc2);

        // Keyboard/piano envelope: immediate hammer strike attack, smooth ring-decay
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.005);
        masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.15);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      }

      // Chain pipeline to output speakers & ambient echo delay lines
      masterGain.connect(ctx.destination);
      if (analyzerRef.current) {
        masterGain.connect(analyzerRef.current);
      }

      activeOscillatorsRef.current[noteIdx] = nodesToStop;
      activeGainNodesRef.current[noteIdx] = masterGain;

      setActiveNoteIdx(noteIdx);
      setTimeout(() => {
        setActiveNoteIdx(null);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setAudioError(err.message || 'Error triggering performance svara nodes.');
    }
  };

  // Keyboard mapping bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // Skip if typing in form input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      const key = e.key.toLowerCase();
      const idx = KEY_MAPPINGS.indexOf(key);
      if (idx !== -1 && idx < activeThaat.notes.length) {
        playSvara(idx, activeThaat.notes[idx].frequencyFactor);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeThaatIdx, activeStyleId, masterKeyIdx]);

  // Clean up all audio nodes on component unmount
  useEffect(() => {
    return () => {
      Object.values(activeOscillatorsRef.current).forEach(oscs => {
        oscs.forEach(o => {
          try { o.stop(); } catch (e) {}
        });
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Real-time canvas radial circular wave spectrum visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      animationFrameRef.current = requestAnimationFrame(draw);

      // Deep dark premium acoustic trail backfill
      canvasCtx.fillStyle = 'rgba(6, 4, 3, 0.25)';
      canvasCtx.fillRect(0, 0, width, height);

      const analyzer = analyzerRef.current;
      if (!analyzer) {
        // Flat resting glowing neon wave
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 2.0;
        canvasCtx.strokeStyle = 'rgba(217, 131, 83, 0.25)';
        canvasCtx.moveTo(0, height / 2);
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.05 + Date.now() * 0.002) * 3;
          canvasCtx.lineTo(i, y);
        }
        canvasCtx.stroke();
        return;
      }

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzer.getByteFrequencyData(dataArray);

      // Draw beautiful high-fidelity golden spectrum bars
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // Elegant Indian gold/copper sunset theme palette
        const r = Math.floor(217 + (barHeight / 2.5));
        const g = Math.floor(131 + (barHeight / 5));
        const b = Math.floor(83 - (barHeight / 8));

        canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${barHeight / 255})`;
        canvasCtx.shadowBlur = 4;
        canvasCtx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;

        canvasCtx.fillRect(x, height - (barHeight * 0.38), barWidth - 1, barHeight * 0.38);

        x += barWidth;
      }
      
      canvasCtx.shadowBlur = 0; // reset shadow
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-20 w-full max-w-7xl mx-auto px-4 text-left">
      {/* Visual Title Header */}
      <div className="border-b border-white/5 pb-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#2A160F] text-[#D98353] border border-[#D98353]/30 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#D98353] animate-pulse" />
            Interactive Acoustical Research Lab
          </span>
          <h1 className="text-3xl font-serif text-white font-black tracking-wide">
            🎼 <span className="text-[#D98353]">Swar, Taal, Vocal and Harmonies</span>
          </h1>
          <p className="text-sm text-stone-400">
            Synthesize cross-genre classical compositions combining the **10 Hindustani Classical Thaat scales** with **Western Performance styles**.
          </p>
        </div>

        {/* Sleek Master Pitch Key Tuner */}
        <div className="flex items-center gap-4 bg-[#120F0D]/90 border border-[#D98353]/20 p-4 rounded-2xl shrink-0 shadow-[0_0_20px_rgba(217,131,83,0.05)] relative z-10">
          <div className="text-left">
            <span className="block text-[9px] font-mono uppercase tracking-wider text-stone-500 font-bold font-extrabold">Scale Root (Shadj / Sa)</span>
            <span className="block text-xs font-serif font-bold text-white mt-0.5">{activeRoot.name} ({activeRoot.freq.toFixed(1)} Hz)</span>
          </div>
          <div className="flex gap-1 bg-black/60 p-1.5 rounded-xl border border-white/10">
            <select
              value={masterKeyIdx}
              onChange={(e) => setMasterKeyIdx(Number(e.target.value))}
              className="bg-stone-900 text-[#D98353] border-none text-xs font-serif font-black px-2 py-1 rounded cursor-pointer outline-none hover:bg-stone-800"
            >
              {MASTER_KEYS.map((key, idx) => (
                <option key={key.name} value={idx}>
                  {key.name} ({key.freq.toFixed(1)} Hz)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Svara & Vocal Practice Hub section (Moved to top-most position) */}
      <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 shadow-md">
        <SvaraPracticeHub currentUser={currentUser} onRequestToast={onRequestToast} />
      </div>

      {/* THREE BENTO PANELS FOR CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL 1: VOCAL REGISTERS & PHYSICS KNOWLEDGE */}
        <div className="bg-[#0D0B0A] border border-white/5 rounded-3xl p-6 space-y-4 text-left shadow-lg">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
            <Radio className="w-5 h-5 text-[#D98353]" />
            <div>
              <h3 className="font-serif font-black text-white text-md">1. Vocal Physics & Tuning</h3>
              <p className="text-[10px] text-stone-400">The biomechanics of human vocal registers and scale roots</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2 border-b border-white/5 pb-3">
              <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 font-bold block">Biomechanical Registers</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] leading-relaxed">
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-[#D98353] font-bold block">Soprano (Head voice)</span>
                  <span className="text-stone-400 text-[9.5px]">High head/sinus resonance. Short tense vocal folds. Range: 250 - 1200 Hz.</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-indigo-400 font-bold block">Alto (Throat mix)</span>
                  <span className="text-stone-400 text-[9.5px]">Warm throat resonance. Thickened vocal cords. Range: 170 - 700 Hz.</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-emerald-400 font-bold block">Tenor (Chest mix)</span>
                  <span className="text-stone-400 text-[9.5px]">Bright pharyngeal space. Thin fold margins. Range: 130 - 500 Hz.</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-stone-300 font-bold block">Bass (Chest Rumble)</span>
                  <span className="text-stone-400 text-[9.5px]">Deep chest cavity resonance. Relaxed loose folds. Range: 80 - 350 Hz.</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 font-bold block">Master Chromatic Root (Sa)</span>
              <div className="grid grid-cols-4 gap-1.5">
                {MASTER_KEYS.map((root, idx) => (
                  <button
                    key={root.name}
                    type="button"
                    onClick={() => setMasterKeyIdx(idx)}
                    className={`py-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      masterKeyIdx === idx
                        ? 'bg-gradient-to-br from-[#2A160F] to-black border-[#D98353] text-[#D98353] font-black shadow-[0_0_10px_rgba(217,131,83,0.15)]'
                        : 'bg-white/[0.01] border-white/5 text-stone-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-serif font-bold">{root.name}</span>
                    <span className="text-[7.5px] font-mono text-stone-500 mt-0.5">{root.freq.toFixed(1)}Hz</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#2A160F]/30 border border-[#D98353]/10 rounded-xl p-3 text-[10px] text-stone-400 leading-normal flex items-start gap-2">
            <Info className="w-4 h-4 text-[#D98353] shrink-0 mt-0.5" />
            <p>
              In classical Indian music, **Sa** is the home pitch. Changing this root key immediately transposes the fundamental pitch of all 10 Hindustani scales.
            </p>
          </div>
        </div>

        {/* PANEL 2: WESTERN PERFORMANCE STYLES (REPLACES CHEAP WAVE GENERATORS) */}
        <div className="bg-[#0D0B0A] border border-white/5 rounded-3xl p-6 space-y-4 text-left shadow-lg lg:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-serif font-black text-white text-md">2. Select Performance Style</h3>
              <p className="text-[10px] text-stone-400">Trigger simulated organic instruments and rich western vocal choirs</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PERFORMANCE_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setActiveStyleId(style.id)}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all text-left cursor-pointer relative ${
                  activeStyleId === style.id
                    ? 'bg-[#1E1C2E]/40 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                    : 'bg-white/[0.01] border-white/5 text-stone-400 hover:text-white hover:border-white/10'
                }`}
              >
                {activeStyleId === style.id && (
                  <span className="absolute top-3 right-3 bg-indigo-500 text-white p-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                  </span>
                )}
                <div className="text-2xl pt-1">{style.emoji}</div>
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">{style.name}</h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{style.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* REAL-TIME AUDIO SYNTH SPECTRUM PANEL */}
          <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="shrink-0 flex items-center gap-1.5 text-stone-400">
              <Music className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Acoustic Wave Oscillogram:</span>
            </div>
            <div className="flex-1 h-10 bg-black/40 rounded-xl overflow-hidden border border-white/5">
              <canvas
                ref={canvasRef}
                width={480}
                height={40}
                className="w-full h-full block"
              />
            </div>
          </div>
        </div>

      </div>

      {/* 10 CLASSICAL INDIAN THAATS SELECTOR GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-widest text-[#D98353] font-bold">Select Hindustani Classical Thaat</span>
          <span className="text-[10px] text-stone-500 font-mono">10 Thaats cover all classical ragas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CLASSICAL_THAATS.map((thaat, idx) => (
            <button
              key={thaat.name}
              type="button"
              onClick={() => setActiveThaatIdx(idx)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                activeThaatIdx === idx
                  ? 'bg-[#1E120D] border-[#D98353] text-white shadow-[0_4px_25px_rgba(217,131,83,0.15)]'
                  : 'bg-white/[0.01] border-white/5 text-stone-400 hover:text-white hover:border-white/10'
              }`}
            >
              {activeThaatIdx === idx && (
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#D98353]/10 rounded-bl-full flex items-center justify-center">
                  <span className="text-[#D98353] text-[9px] font-bold pl-1 pb-1">★</span>
                </div>
              )}
              <h4 className="font-serif font-bold text-sm text-white group-hover:text-[#D98353] transition-colors">{thaat.name}</h4>
              <p className="text-[10px] text-stone-400 mt-1 line-clamp-1">{thaat.englishName}</p>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[9px] text-stone-500">
                <span className="truncate">{thaat.timeOfDay}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CURRENT THAAT PROFILE DETAILS */}
      <div className="bg-[#120F0D]/90 border border-white/5 rounded-3xl p-6 relative overflow-hidden text-left">
        <div className="absolute top-[-30%] right-[-10%] w-72 h-72 rounded-full bg-gradient-to-br from-[#D98353]/10 to-transparent blur-[80px] pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-1 space-y-2 border-r border-white/5 pr-6">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#D98353] font-bold">Selected Thaat Profile</span>
            <h2 className="text-2xl font-serif font-black text-white">{activeThaat.name}</h2>
            <p className="text-xs text-stone-400 font-medium italic">"{activeThaat.englishName}"</p>
            <div className="space-y-1.5 pt-3">
              <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D98353]" />
                <strong>Mood:</strong> {activeThaat.mood}
              </div>
              <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <strong>Hour:</strong> {activeThaat.timeOfDay}
              </div>
            </div>
          </div>

          <div className="md:col-span-3 text-left pl-0 md:pl-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-stone-400 font-bold">Acoustic Scales Architecture</h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              {activeThaat.description} The synthesized sound shifts beautifully across scales depending on the active Tanpura root key ({activeRoot.name}).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
              <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-widest">Selected Key</span>
                <span className="text-xs font-bold text-white">{activeRoot.name} ({activeRoot.freq.toFixed(1)} Hz)</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-widest">Selected Style</span>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{activeStyle.name.split(' (')[0]}</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-widest">Acoustic Reverb</span>
                <span className="text-xs font-bold text-emerald-400">550ms Reflect</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-center">
                <span className="block text-[8px] font-mono text-stone-500 uppercase tracking-widest">Javari Buzz</span>
                <span className="text-xs font-bold text-amber-500">Physical Model</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THE INTERACTIVE GLOWING SVARA PADS / CHROMATIC BOARD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-black text-white text-md">🎤 Interactive Performance Keys</h3>
            <p className="text-xs text-stone-400">Interact with the high-fidelity synthesis board below to play scales.</p>
          </div>
          <span className="text-[10px] font-mono text-stone-500">Scale Interval Multiplier</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {activeThaat.notes.map((note, idx) => {
            const isActive = activeNoteIdx === idx;
            
            // Calculate final freq output for demonstration
            const finalFreqHz = activeRoot.freq * note.frequencyFactor;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => playSvara(idx, note.frequencyFactor)}
                className={`min-h-[160px] h-auto rounded-2xl border flex flex-col justify-between items-center p-3.5 transition-all duration-150 select-none cursor-pointer ${
                  isActive
                    ? 'bg-[#D98353]/20 border-white shadow-[0_0_20px_rgba(217,131,83,0.4)] translate-y-1 scale-95'
                    : 'bg-white/[0.01] border-white/5 text-[#D98353] hover:border-[#D98353]/30 hover:bg-white/[0.02]'
                }`}
              >
                {/* Svara display */}
                <div className="text-center w-full">
                  <span className="block text-3xl font-serif font-black leading-none text-white tracking-wide">{note.svara}</span>
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-stone-300 mt-2.5 font-bold truncate max-w-full">
                    {note.name.split(' (')[0]}
                  </span>
                </div>

                {/* scale note description and 1s delay */}
                <div className="text-center w-full pt-1.5 border-t border-white/[0.03]">
                  <span className="block text-[10px] font-mono font-bold text-[#D98353] truncate max-w-full">
                    {note.description}
                  </span>
                  <span className="block text-[8px] font-mono text-stone-500">
                    Delay: 1s
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MEMBER NOTES & PRACTICE JOURNAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        
        {/* COLUMN 1: NEW NOTE FORM */}
        <div className="lg:col-span-1 bg-[#15110F] border border-white/10 rounded-3xl p-6 space-y-4 text-left h-fit">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D98353]/15 flex items-center justify-center text-[#D98353]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-black text-white text-base">New Practice Note</h3>
              <p className="text-[10px] text-stone-400">Save a sequence or lesson for your records.</p>
            </div>
          </div>

          <form onSubmit={handleAddPracticeNote} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Note Title</label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g., Yaman Evening Alap Drill"
                className="w-full h-10 px-3.5 bg-black/40 border border-white/10 focus:border-[#D98353] text-xs text-[#ECE6E1] rounded-xl focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Svara Sequence (Optional)</label>
              <input
                type="text"
                value={noteSvara}
                onChange={(e) => setNoteSvara(e.target.value)}
                placeholder="e.g., सा रे॒ ग म प ध॒ नि"
                className="w-full h-10 px-3.5 bg-black/40 border border-white/10 focus:border-[#D98353] text-xs text-[#ECE6E1] rounded-xl focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Detailed Notes & Lessons</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write detailed practice steps, tanpura settings, microtonal tuning holds, or vocal raga keys..."
                rows={4}
                className="w-full p-3.5 bg-black/40 border border-white/10 focus:border-[#D98353] text-xs text-[#ECE6E1] rounded-xl focus:outline-none transition-all leading-relaxed font-serif"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-[#D98353] hover:bg-[#C46E3F] text-black font-serif font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_12px_rgba(217,131,83,0.15)] cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Practice Note</span>
            </button>
          </form>
        </div>

        {/* COLUMN 2: SAVED NOTES FEED */}
        <div className="lg:col-span-2 bg-[#0D0B0A]/80 border border-white/5 rounded-3xl p-6 space-y-4 text-left flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#D98353]" />
              <div>
                <h3 className="font-serif font-black text-white text-base">Swar Practice Notebook</h3>
                <p className="text-xs text-stone-400">Class notes, raga guidelines, and personalized performance records.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-stone-900 text-[10px] text-stone-400 border border-stone-800 font-mono font-bold uppercase">
              {practiceNotes.length} Saved {practiceNotes.length === 1 ? 'Note' : 'Notes'}
            </span>
          </div>

          <div className="space-y-4 max-h-[390px] overflow-y-auto pr-1">
            {practiceNotes.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-500 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                No practice notes saved yet. Use the sidebar notebook to log your first lesson!
              </div>
            ) : (
              practiceNotes.map((note) => {
                const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'president' || currentUser?.role === 'core' || note.userId === currentUser?.id;
                
                return (
                  <div 
                    key={note.id} 
                    className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-[#D98353]/30 transition-all space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-serif font-bold text-[#ECE6E1]">{note.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
                          <span className="flex items-center gap-1 text-[#D98353] font-bold"><Edit3 size={10}/> {note.userName}</span>
                          <span>•</span>
                          <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeletePracticeNote(note.id)}
                          className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-rose-950/40 text-stone-400 hover:text-rose-400 border border-white/5 transition-all cursor-pointer"
                          title="Delete practice note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed font-serif bg-black/20 p-3 rounded-xl border border-white/[0.02]">
                      {note.content}
                    </p>

                    {note.svaraSequence && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[9px] font-mono text-stone-500 uppercase font-bold">Raga Svaras:</span>
                        <span className="px-2.5 py-1 rounded bg-[#2A160F] text-[#D98353] border border-[#D98353]/20 font-mono text-xs font-bold shadow-sm">
                          {note.svaraSequence}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {audioError && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-400 font-mono flex items-center gap-2">
          <AlertTriangle size={14} /> <strong>Audio Error:</strong> {audioError}
        </div>
      )}
    </div>
  );
}
