import React, {useEffect, useState} from 'react';

const NEON_COLORS = [
  'text-rose-400 [text-shadow:0_0_12px_rgba(244,63,94,0.6)]',
  'text-orange-400 [text-shadow:0_0_12px_rgba(251,146,60,0.6)]',
  'text-amber-400 [text-shadow:0_0_12px_rgba(251,191,36,0.6)]',
  'text-emerald-400 [text-shadow:0_0_12px_rgba(52,211,153,0.6)]',
  'text-teal-400 [text-shadow:0_0_12px_rgba(45,212,191,0.6)]',
  'text-sky-400 [text-shadow:0_0_12px_rgba(56,189,248,0.6)]',
  'text-violet-400 [text-shadow:0_0_12px_rgba(167,139,250,0.6)]',
  'text-fuchsia-400 [text-shadow:0_0_12px_rgba(232,121,249,0.6)]'
];

interface Note {
  id: number;
  x: number;
  y: number;
  size: number;
  symbol: string;
  duration: number;
  opacity: number;
  colorClass: string;
}

const NOTE_SYMBOLS = ['सा', 'रे', 'ग', 'म', 'प', 'ध', 'नि', 'Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', '♩', '♪', '♫', '♬', '∮', '♭', '♮', '♯', '𝄞'];

export default function FloatingNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Keep between 20-25 notes active for more abundant ambient beauty
    const interval = setInterval(() => {
      setNotes((prev) => {
        if (prev.length >= 25) {
          return prev.slice(1); // remove oldest
        }
        const newNote: Note = {
          id: Math.random() * 100000,
          x: Math.random() * 95, // percentage x-axis
          y: 100, // starts at bottom
          size: Math.random() * 2.0 + 1.2, // upscaled sizing (1.2rem to 3.2rem)
          symbol: NOTE_SYMBOLS[Math.floor(Math.random() * NOTE_SYMBOLS.length)],
          duration: Math.random() * 14 + 11, // seconds to float
          opacity: Math.random() * 0.35 + 0.12, // slightly transparent for subtle backdrops
          colorClass: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
        };
        return [...prev, newNote];
      });
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {notes.map((note) => (
        <span
          key={note.id}
          className={`absolute select-none animate-float-up transition-opacity duration-500 ${note.colorClass}`}
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            fontSize: `${note.size}rem`,
            opacity: note.opacity,
            animationDuration: `${note.duration}s`,
            animationTimingFunction: 'linear',
            filter: 'blur(0.3px)',
          }}
        >
          {note.symbol}
        </span>
      ))}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            top: 100%;
          }
          100% {
            transform: translateY(-110vh) rotate(360deg);
            top: -10%;
          }
        }
        .animate-float-up {
          animation-name: float-up;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
