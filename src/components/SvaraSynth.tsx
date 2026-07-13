import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Radio, Music, Flame, Sparkles, Activity, Triangle, Zap, AlertTriangle } from 'lucide-react';

interface RagaScale {
  name: string;
  description: string;
  notes: {
    label: string;
    english: string;
    freq: number;
    color: string;
    shadow: string;
    desc: string;
  }[];
}

// 4 Ragas with accurate frequency tunings based on C4 (Sa = 261.63 Hz)
const RAGA_SCALES: RagaScale[] = [
  {
    name: 'Raga Bilawal (Major Scale)',
    description: 'Bright, joyful morning scale. Matches Western Major mode.',
    notes: [
      { label: 'सा', english: 'Sa', freq: 261.63, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10', shadow: 'shadow-orange-500/50 bg-orange-500/10', desc: 'Shadj (Root)' },
      { label: 'रे', english: 'Re', freq: 293.66, color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10', shadow: 'shadow-amber-500/50 bg-amber-500/10', desc: 'Rishabh' },
      { label: 'ग', english: 'Ga', freq: 329.63, color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10', shadow: 'shadow-yellow-500/50 bg-yellow-500/10', desc: 'Gandhar' },
      { label: 'म', english: 'Ma', freq: 349.23, color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10', shadow: 'shadow-emerald-500/50 bg-emerald-500/10', desc: 'Madhyam' },
      { label: 'प', english: 'Pa', freq: 392.00, color: 'text-teal-400 border-teal-500/30 hover:bg-teal-500/10', shadow: 'shadow-teal-500/50 bg-teal-500/10', desc: 'Pancham' },
      { label: 'ध', english: 'Dha', freq: 440.00, color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10', shadow: 'shadow-cyan-500/50 bg-cyan-500/10', desc: 'Dhaivat' },
      { label: 'नि', english: 'Ni', freq: 493.88, color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10', shadow: 'shadow-indigo-500/50 bg-indigo-500/10', desc: 'Nishad' },
      { label: 'सां', english: 'Sa\'', freq: 523.25, color: 'text-violet-400 border-violet-500/30 hover:bg-violet-500/10', shadow: 'shadow-violet-500/50 bg-violet-500/10', desc: 'Shadj (Octave)' }
    ]
  },
  {
    name: 'Raga Bhairav (Double Harmonic Major)',
    description: 'Solemn, mystical dawn scale with flat Re & Dha. Intensely spiritual.',
    notes: [
      { label: 'सा', english: 'Sa', freq: 261.63, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10', shadow: 'shadow-orange-500/50 bg-orange-500/10', desc: 'Shadj (Root)' },
      { label: 'रे̱', english: 'Re̱', freq: 277.18, color: 'text-rose-500 border-rose-600/30 hover:bg-rose-600/10', shadow: 'shadow-rose-600/50 bg-rose-600/10', desc: 'Komal Rishabh' },
      { label: 'ग', english: 'Ga', freq: 329.63, color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10', shadow: 'shadow-yellow-500/50 bg-yellow-500/10', desc: 'Gandhar' },
      { label: 'म', english: 'Ma', freq: 349.23, color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10', shadow: 'shadow-emerald-500/50 bg-emerald-500/10', desc: 'Madhyam' },
      { label: 'प', english: 'Pa', freq: 392.00, color: 'text-teal-400 border-teal-500/30 hover:bg-teal-500/10', shadow: 'shadow-teal-500/50 bg-teal-500/10', desc: 'Pancham' },
      { label: 'ध̱', english: 'Dha̱', freq: 415.30, color: 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10', shadow: 'shadow-rose-500/50 bg-rose-500/10', desc: 'Komal Dhaivat' },
      { label: 'नि', english: 'Ni', freq: 493.88, color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10', shadow: 'shadow-indigo-500/50 bg-indigo-500/10', desc: 'Nishad' },
      { label: 'सां', english: 'Sa\'', freq: 523.25, color: 'text-violet-400 border-violet-500/30 hover:bg-violet-500/10', shadow: 'shadow-violet-500/50 bg-violet-500/10', desc: 'Shadj (Octave)' }
    ]
  },
  {
    name: 'Raga Yaman (Lydian Mode)',
    description: 'Prestige evening raga of supreme peace & beauty. Features sharp Ma.',
    notes: [
      { label: 'सा', english: 'Sa', freq: 261.63, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10', shadow: 'shadow-orange-500/50 bg-orange-500/10', desc: 'Shadj (Root)' },
      { label: 'रे', english: 'Re', freq: 293.66, color: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10', shadow: 'shadow-amber-500/50 bg-amber-500/10', desc: 'Rishabh' },
      { label: 'ग', english: 'Ga', freq: 329.63, color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10', shadow: 'shadow-yellow-500/50 bg-yellow-500/10', desc: 'Gandhar' },
      { label: 'म॑', english: 'Ma\'', freq: 369.99, color: 'text-fuchsia-400 border-fuchsia-500/30 hover:bg-fuchsia-500/10', shadow: 'shadow-fuchsia-500/50 bg-fuchsia-500/10', desc: 'Teevra Madhyam' },
      { label: 'प', english: 'Pa', freq: 392.00, color: 'text-teal-400 border-teal-500/30 hover:bg-teal-500/10', shadow: 'shadow-teal-500/50 bg-teal-500/10', desc: 'Pancham' },
      { label: 'ध', english: 'Dha', freq: 440.00, color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10', shadow: 'shadow-cyan-500/50 bg-cyan-500/10', desc: 'Dhaivat' },
      { label: 'नि', english: 'Ni', freq: 493.88, color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10', shadow: 'shadow-indigo-500/50 bg-indigo-500/10', desc: 'Nishad' },
      { label: 'सां', english: 'Sa\'', freq: 523.25, color: 'text-violet-400 border-violet-500/30 hover:bg-violet-500/10', shadow: 'shadow-violet-500/50 bg-violet-500/10', desc: 'Shadj (Octave)' }
    ]
  },
  {
    name: 'Raga Bhairavi (Phrygian Mode)',
    description: 'Empathetic evening scale with flat Re, Ga, Dha & Ni. Soft and emotional.',
    notes: [
      { label: 'सा', english: 'Sa', freq: 261.63, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10', shadow: 'shadow-orange-500/50 bg-orange-500/10', desc: 'Shadj (Root)' },
      { label: 'रे̱', english: 'Re̱', freq: 277.18, color: 'text-rose-500 border-rose-600/30 hover:bg-rose-600/10', shadow: 'shadow-rose-600/50 bg-rose-600/10', desc: 'Komal Rishabh' },
      { label: 'ग̱', english: 'Ga̱', freq: 311.13, color: 'text-amber-500 border-amber-600/30 hover:bg-amber-600/10', shadow: 'shadow-amber-600/50 bg-amber-600/10', desc: 'Komal Gandhar' },
      { label: 'म', english: 'Ma', freq: 349.23, color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10', shadow: 'shadow-emerald-500/50 bg-emerald-500/10', desc: 'Madhyam' },
      { label: 'प', english: 'Pa', freq: 392.00, color: 'text-teal-400 border-teal-500/30 hover:bg-teal-500/10', shadow: 'shadow-teal-500/50 bg-teal-500/10', desc: 'Pancham' },
      { label: 'ध̱', english: 'Dha̱', freq: 415.30, color: 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10', shadow: 'shadow-rose-500/50 bg-rose-500/10', desc: 'Komal Dhaivat' },
      { label: 'नि̱', english: 'Ni̱', freq: 466.16, color: 'text-sky-400 border-sky-500/30 hover:bg-sky-500/10', shadow: 'shadow-sky-500/50 bg-sky-500/10', desc: 'Komal Nishad' },
      { label: 'सां', english: 'Sa\'', freq: 523.25, color: 'text-violet-400 border-violet-500/30 hover:bg-violet-500/10', shadow: 'shadow-violet-500/50 bg-violet-500/10', desc: 'Shadj (Octave)' }
    ]
  }
];

const KEY_MAPPINGS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];

export default function SvaraSynth() {
  const [activeRagaIdx, setActiveRagaIdx] = useState(0);
  const [synthWave, setSynthWave] = useState<'sine' | 'triangle' | 'sawtooth' | 'square'>('sine');
  const [isPlayingDrone, setIsPlayingDrone] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const droneNodesRef = useRef<OscillatorNode[]>([]);
  const droneGainRef = useRef<GainNode | null>(null);
  const activeOscillatorsRef = useRef<Record<number, OscillatorNode>>({});
  const activeGainNodesRef = useRef<Record<number, GainNode>>({});
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const raga = RAGA_SCALES[activeRagaIdx];

  // Initialize Audio Context on demand to satisfy browser policies
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error('Web Audio API is not supported in this browser.');
      }
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Create main reverb delay line
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.35; // 350ms beautiful echo
      
      const feedback = ctx.createGain();
      feedback.gain.value = 0.3; // 30% feedback

      const filter = ctx.createBiquadFilter();
      filter.frequency.value = 1200; // Warm delay filter

      // Connect delay loop
      delay.connect(feedback);
      feedback.connect(filter);
      filter.connect(delay);

      // Create master analyzer
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;

      // Connections: Synth Node -> Delay -> Analyzer -> Output
      delay.connect(analyzer);
      analyzer.connect(ctx.destination);
      
      delayNodeRef.current = delay;
    }
    
    // Resume context if suspended
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play a single svara note
  const playSvara = (noteIdx: number, freq: number) => {
    try {
      const ctx = getAudioContext();
      
      // Stop existing oscillator if active
      if (activeOscillatorsRef.current[noteIdx]) {
        try {
          activeOscillatorsRef.current[noteIdx].stop();
        } catch (e) {}
        delete activeOscillatorsRef.current[noteIdx];
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = synthWave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Low pass filter to make synth warm and traditional (sounds like bamboo bansuri or sitar resonance)
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1400, ctx.currentTime);
      lowpass.Q.setValueAtTime(1.5, ctx.currentTime);

      // Apply gorgeous ADSR envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.08); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.2); // Decay & Sustain
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5); // Release

      // Connect pipeline
      osc.connect(lowpass);
      lowpass.connect(gainNode);
      
      // Send directly to output and also to echo delay node
      gainNode.connect(ctx.destination);
      if (delayNodeRef.current) {
        gainNode.connect(delayNodeRef.current);
      }
      if (analyzerRef.current) {
        gainNode.connect(analyzerRef.current);
      }

      osc.start();
      
      activeOscillatorsRef.current[noteIdx] = osc;
      activeGainNodesRef.current[noteIdx] = gainNode;

      setActiveNoteIdx(noteIdx);
      setTimeout(() => {
        setActiveNoteIdx(null);
      }, 300);

    } catch (err: any) {
      console.error(err);
      setAudioError(err.message || 'Error initializing synth.');
    }
  };

  // Toggle ambient Indian Tanpura drone loop (Acoustic simulated)
  const toggleDrone = () => {
    try {
      const ctx = getAudioContext();

      if (isPlayingDrone) {
        // Stop drone
        droneNodesRef.current.forEach(osc => {
          try {
            osc.stop();
          } catch (e) {}
        });
        droneNodesRef.current = [];
        setIsPlayingDrone(false);
        return;
      }

      // Root Sa drone (C2 = 65.41 Hz) and Pancham Pa drone (G2 = 98.00 Hz)
      const rootFreq = 65.41;
      const fifthFreq = 98.00;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator(); // Subharmonic

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0, ctx.currentTime);
      droneGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.5); // Fade in smoothly

      // Soft triangle & sine waves for a rich, warm string feel
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(rootFreq, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(fifthFreq, ctx.currentTime);

      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(rootFreq * 2, ctx.currentTime); // C3 resonance

      // Connect to warm low-pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);

      filter.connect(droneGain);
      droneGain.connect(ctx.destination);
      
      if (analyzerRef.current) {
        droneGain.connect(analyzerRef.current);
      }

      osc1.start();
      osc2.start();
      osc3.start();

      droneNodesRef.current = [osc1, osc2, osc3];
      droneGainRef.current = droneGain;
      setIsPlayingDrone(true);

    } catch (err: any) {
      console.error(err);
      setAudioError('Failed to start Tanpura Drone loop.');
    }
  };

  // Keyboard layout map events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const idx = KEY_MAPPINGS.indexOf(key);
      if (idx !== -1 && idx < raga.notes.length) {
        playSvara(idx, raga.notes[idx].freq);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeRagaIdx, synthWave]);

  // Clean up nodes on unmount
  useEffect(() => {
    return () => {
      droneNodesRef.current.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      Object.values(activeOscillatorsRef.current).forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Live real-time canvas frequency waves visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      animationFrameRef.current = requestAnimationFrame(draw);

      // Subtle trace background to create motion blur effect
      canvasCtx.fillStyle = 'rgba(10, 8, 7, 0.2)';
      canvasCtx.fillRect(0, 0, width, height);

      const analyzer = analyzerRef.current;
      if (!analyzer) {
        // Draw ambient resting glow wave
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgba(217, 131, 83, 0.25)';
        canvasCtx.moveTo(0, height / 2);
        
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.05 + Date.now() * 0.003) * 3;
          canvasCtx.lineTo(i, y);
        }
        canvasCtx.stroke();
        return;
      }

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzer.getByteTimeDomainData(dataArray);

      canvasCtx.beginPath();
      canvasCtx.lineWidth = 2.5;

      // Glow effect via standard canvas properties (Neon Glow!)
      canvasCtx.shadowBlur = 10;
      canvasCtx.shadowColor = '#D98353';
      
      // Beautiful gradient across the neon wave line
      const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#F43F5E'); // Rose
      gradient.addColorStop(0.3, '#D98353'); // Malhaar Amber
      gradient.addColorStop(0.7, '#E6AF2E'); // Svara Gold
      gradient.addColorStop(1, '#8B5CF6'); // Electric Violet
      
      canvasCtx.strokeStyle = gradient;

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();

      // Reset shadows for optimization
      canvasCtx.shadowBlur = 0;
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      {/* Decorative neon gradient orb behind synthesizer */}
      <div className="absolute top-[-40%] right-[-10%] w-72 h-72 rounded-full bg-gradient-to-br from-[#D98353]/15 to-[#E6AF2E]/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-30%] left-[-10%] w-60 h-60 rounded-full bg-[#E6AF2E]/5 blur-[60px] pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5 relative z-10 text-left">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2A160F] text-[#D98353] border border-[#D98353]/30 uppercase tracking-widest mb-1 shadow-[0_0_12px_rgba(217,131,83,0.15)]">
            <Radio className="w-3 h-3 text-[#D98353] animate-pulse" />
            Live Acoustics
          </span>
          <div className="flex items-center gap-3">
            <div className="bg-[#D98353] text-black px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(217,131,83,0.3)] border border-[#E6AF2E]/50 font-mono font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Music size={14} />
              <span>Malhaar Raga Synthesizer</span>
            </div>
            <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Bansuri Synth</span>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Tap the keys or press physical keys <strong className="text-white font-mono bg-white/5 px-1 py-0.2 rounded">A-S-D-F-G-H-J-K</strong> to play real-time classical melody lines.
          </p>
        </div>

        {/* Drone control button with neon hover shadow */}
        <button
          type="button"
          onClick={toggleDrone}
          className={`px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            isPlayingDrone
              ? 'bg-[#D98353] text-black border-[#D98353] shadow-[0_0_20px_rgba(217,131,83,0.4)] animate-pulse'
              : 'bg-black/40 text-stone-300 border-white/10 hover:border-[#D98353]/40 hover:text-white'
          }`}
        >
          {isPlayingDrone ? (
            <>
              <Square className="w-3.5 h-3.5 fill-black text-black" />
              <span>Stop Tanpura Drone</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-[#D98353] text-[#D98353]" />
              <span>Start Tanpura Drone</span>
            </>
          )}
        </button>
      </div>

      {/* Raga Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 relative z-10">
        {RAGA_SCALES.map((scale, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveRagaIdx(idx)}
            className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
              activeRagaIdx === idx
                ? 'bg-gradient-to-br from-[#1E120D] to-[#0A0706] border-[#D98353] text-white shadow-[0_0_15px_rgba(217,131,83,0.15)]'
                : 'bg-white/[0.02] border-white/5 text-stone-400 hover:text-white hover:border-white/10'
            }`}
          >
            <span className="block text-xs font-bold uppercase tracking-wider text-[#D98353]">
              {scale.name.split(' (')[0]}
            </span>
            <span className="block text-[9px] text-stone-400 mt-0.5 line-clamp-1">
              {scale.description}
            </span>
          </button>
        ))}
      </div>

      {/* Synth Controls & Real-Time Neon Wave Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10 items-stretch">
        {/* Waveform Selector */}
        <div className="bg-[#120F0D]/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-between text-left">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 font-bold block mb-2">
              Select Sound Wave
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['sine', 'triangle', 'sawtooth', 'square'] as const).map(wave => (
                <button
                  key={wave}
                  type="button"
                  onClick={() => setSynthWave(wave)}
                  className={`py-1.5 px-1 rounded-lg text-[10px] flex items-center justify-center gap-1.5 font-mono font-bold uppercase transition-all cursor-pointer ${
                    synthWave === wave
                      ? 'bg-[#D98353] text-black font-extrabold'
                      : 'bg-white/5 text-stone-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {wave === 'sine' ? <><Activity size={12}/> Sine</> : 
                   wave === 'triangle' ? <><Triangle size={12}/> Triangle</> : 
                   wave === 'sawtooth' ? <><Zap size={12}/> Saw</> : 
                   <><Square size={12}/> Square</>}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-stone-500 font-mono leading-relaxed mt-4 border-t border-white/5 pt-3">
            Active: {raga.name}. Delay reverb is set to 350ms for cosmic resonance.
          </div>
        </div>

        {/* Real-time frequency wave visualizer canvas */}
        <div className="md:col-span-2 bg-[#120F0D]/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400 font-bold">
              Real-time Neon Frequency Oscillogram
            </span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#D98353] animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          
          <div className="relative w-full h-24 bg-black/40 rounded-xl overflow-hidden border border-white/5">
            <canvas
              ref={canvasRef}
              width={400}
              height={96}
              className="w-full h-full block"
            />
          </div>

          <div className="text-[9px] font-mono text-stone-400 text-left mt-2 flex items-center justify-between">
            <span>Acoustic Amplitude</span>
            <span className="text-[#D98353] font-bold">Web Audio Node Output</span>
          </div>
        </div>
      </div>

      {/* Svara Keypad (Beautiful Glowing Neon Music Keys) */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 relative z-10">
        {raga.notes.map((note, idx) => {
          const isActive = activeNoteIdx === idx;
          const keyLetter = KEY_MAPPINGS[idx]?.toUpperCase();
          return (
            <button
              key={idx}
              type="button"
              onClick={() => playSvara(idx, note.freq)}
              className={`h-28 rounded-2xl border flex flex-col justify-between items-center p-3 select-none transition-all duration-150 cursor-pointer ${
                isActive 
                  ? `${note.shadow} border-white translate-y-1 scale-95` 
                  : `${note.color} bg-white/[0.01] hover:border-white/20 hover:shadow-[0_4px_12px_rgba(255,255,255,0.02)]`
              }`}
            >
              {/* Keyboard Key Hint */}
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-stone-400 select-none">
                {keyLetter}
              </span>

              {/* Indian Svara Name - Beautiful large serif text */}
              <div className="text-center">
                <span className="block text-2xl sm:text-3xl font-serif font-black tracking-tight leading-none">
                  {note.label}
                </span>
                <span className="block text-[10px] font-mono tracking-widest uppercase text-stone-400 mt-0.5 font-bold">
                  {note.english}
                </span>
              </div>

              {/* Technical Pitch Info */}
              <span className="text-[8px] font-mono text-stone-500 font-medium">
                {note.freq.toFixed(1)}Hz
              </span>
            </button>
          );
        })}
      </div>

      {/* Embedded Svara Help Tips */}
      <div className="flex items-center gap-2 mt-4 bg-white/[0.01] border border-white/5 rounded-xl p-3 text-left relative z-10">
        <Sparkles className="w-4 h-4 text-[#D98353] shrink-0" />
        <p className="text-[10px] text-stone-400 leading-normal">
          <strong>Tip:</strong> Press your keyboard keys <strong className="text-white">A, S, D, F, G, H, J, K</strong> in order to play classical ragas without clicking. Perfect for on-campus melody practices!
        </p>
      </div>

      {audioError && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-400 font-mono flex items-center gap-2">
          <AlertTriangle size={14} /> {audioError}
        </div>
      )}
    </div>
  );
}
