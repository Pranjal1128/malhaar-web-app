import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function SplashView({ onComplete }: { onComplete: () => void }) {
  const [countdown, setCountdown] = useState(3);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [equalizerHeights, setEqualizerHeights] = useState<number[]>(new Array(15).fill(20));

  // Countdown timer
  useEffect(() => {
    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(timer);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 600); // Allow 600ms for elegant hardware-accelerated fade-out
      } else {
        setCountdown(count);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Audio equalizer simulation animation loop
  useEffect(() => {
    const eqTimer = setInterval(() => {
      setEqualizerHeights(
        new Array(15).fill(0).map(() => Math.floor(Math.random() * 50) + 10)
      );
    }, 90);
    return () => clearInterval(eqTimer);
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#080706] overflow-hidden flex flex-col items-center justify-center select-none transition-all duration-500 ease-in-out ${isFadingOut ? 'opacity-0 scale-[0.98] pointer-events-none' : 'opacity-100'}`}
    >
      {/* Absolute Cinematic Star Dust and Glowing Resonance */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Soft slow pulsing solar flares */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[#D98353]/10 blur-[130px] animate-pulse" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-[#E6AF2E]/5 blur-[90px] animate-pulse" style={{ animationDuration: '4s' }} />

        {/* Orbiting cosmic golden dust particles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#D98353] rounded-full animate-float"
              style={{
                top: `${20 + (i * 7) % 70}%`,
                left: `${15 + (i * 11) % 75}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${5 + (i % 3) * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Core Typography Wrapper */}
      <div className="z-10 text-center px-6 max-w-2xl space-y-8 flex flex-col items-center relative">
        
        {/* Motilal Nehru College Identity elegantly sliding downward */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-1.5 text-center"
        >
          <p className="text-[9px] font-mono tracking-[0.4em] uppercase text-[#D98353] font-black">
            Established 2010
          </p>
          <h2 className="text-xs sm:text-xs font-serif uppercase tracking-[0.25em] text-[#ECE6E1] font-semibold leading-relaxed max-w-md mx-auto">
            The Music Society of Motilal Nehru College (Morning)
          </h2>
        </motion.div>

        {/* Separator Accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
          className="h-[1px] w-40 bg-gradient-to-r from-transparent via-[#D98353]/60 to-transparent"
        />

        {/* MALHAAR Title - Styled with elegant RISE masking animation layout */}
        <div className="space-y-3 text-center flex flex-col items-center">
          <div className="flex items-center justify-center gap-1 sm:gap-2.5 py-1 overflow-hidden">
            {'MALHAAR'.split('').map((char, index) => (
              <motion.div
                key={index}
                initial={{ y: '80%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{
                  duration: 0.45,
                  delay: 0.1 + index * 0.05,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className={`text-3.5xl sm:text-5.5xl font-serif font-black tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDFB] via-[#ECE6E1] to-[#D98353] drop-shadow-[0_4px_20px_rgba(217,131,83,0.18)] ${
                  index % 3 === 1 ? 'italic font-medium' : ''
                }`}
              >
                {char}
              </motion.div>
            ))}
          </div>

          {/* Elegant Devanagari Hindi Translation Subtitle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 5 }}
            animate={{ opacity: 0.95, scale: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.45,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="text-lg sm:text-xl tracking-[0.35em] pl-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-[#FFFDFB] via-[#ECE6E1] to-[#D98353] drop-shadow-[0_2px_8px_rgba(217,131,83,0.22)] font-serif font-bold text-center"
          >
            मल्हार
          </motion.div>

          {/* Svara Notes Floating Up to represent Rag Malhaar resonance */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex gap-3 text-[#E6AF2E] font-mono text-[9px] tracking-wider font-semibold uppercase bg-white/[0.02] border border-white/5 py-1 px-3 rounded-full"
          >
            <span className="opacity-40 animate-pulse">S</span>
            <span className="opacity-60 animate-pulse" style={{ animationDelay: '0.1s' }}>R</span>
            <span className="opacity-80 animate-pulse" style={{ animationDelay: '0.2s' }}>G</span>
            <span className="text-[#D98353]" style={{ animationDelay: '0.3s' }}>M</span>
            <span className="opacity-80 animate-pulse" style={{ animationDelay: '0.4s' }}>P</span>
            <span className="opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}>D</span>
            <span className="opacity-40 animate-pulse" style={{ animationDelay: '0.6s' }}>N</span>
          </motion.div>
        </div>

        {/* Dynamic Equalizer Visualizer Reacting Live */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-end justify-center gap-1 h-12 pt-1"
        >
          {equalizerHeights.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-t-full bg-gradient-to-t from-[#D98353] to-[#E6AF2E] transition-all duration-100 ease-out shadow-[0_0_8px_rgba(217,131,83,0.4)]"
              style={{ height: `${height * 0.8}%` }}
            />
          ))}
        </motion.div>

        {/* Loader Progress Block */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="w-48 space-y-2"
        >
          <div className="w-full bg-white/5 h-[2px] rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#D98353] via-[#E6AF2E] to-white h-full shadow-[0_0_10px_rgba(217,131,83,0.5)] animate-progress-bar"
              style={{ width: '100%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[7.5px] font-mono text-[#AC9E94] tracking-widest uppercase">
            <span className="animate-pulse">Synthesizing Acoustics...</span>
            <span className="text-[#D98353] font-bold">{countdown}s</span>
          </div>
        </motion.div>
      </div>

      {/* Embedded Floating Dust & Continuous Smooth Progress Animation */}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-60px) translateX(15px) scale(1.1);
            opacity: 0;
          }
        }
        @keyframes fillProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
        .animate-progress-bar {
          animation: fillProgress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}
