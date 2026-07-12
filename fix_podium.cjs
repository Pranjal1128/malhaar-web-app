const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Silver
content = content.replace(
  `                    <div className="absolute -top-1.5 -right-1.5 bg-[#D98353]/80 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 border-[#D98353] shadow-md">
                      🥈
                    </div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#D98353]/60 overflow-hidden bg-neutral-900 shadow-[0_0_15px_rgba(217,131,83,0.25)]">`,
  `                    <div className="absolute -top-1.5 -right-1.5 bg-[#C0C0C0]/90 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 border-[#A0A0A0] shadow-md">
                      🥈
                    </div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#C0C0C0]/60 overflow-hidden bg-neutral-900 shadow-[0_0_15px_rgba(192,192,192,0.25)]">`
);

content = content.replace(
  `                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-black via-[#140C08] to-[#1F120B] border border-[#D98353]/20 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-lg shadow-black/80">
                    <span className="text-[#D98353]/85 font-serif font-black text-3xl sm:text-4xl drop-shadow-[0_0_8px_rgba(217,131,83,0.3)]">2</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#D98353]/80 font-bold">Silver</span>
                  </div>`,
  `                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-black via-[#101010] to-[#202020] border border-[#C0C0C0]/30 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-lg shadow-black/80">
                    <span className="text-[#C0C0C0]/90 font-serif font-black text-3xl sm:text-4xl drop-shadow-[0_0_8px_rgba(192,192,192,0.3)]">2</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#C0C0C0]/80 font-bold">Silver</span>
                  </div>`
);

// Gold (1st Place)
content = content.replace(
  `                    <div className="absolute -top-1.5 -right-1.5 bg-[#D98353] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 border-[#D98353] shadow-md">
                      🥇
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#D98353] overflow-hidden bg-neutral-900 shadow-[0_0_25px_rgba(217,131,83,0.5)] relative">`,
  `                    <div className="absolute -top-1.5 -right-1.5 bg-[#E6AF2E] text-black w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold border-2 border-[#E6AF2E] shadow-md">
                      🥇
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#E6AF2E] overflow-hidden bg-neutral-900 shadow-[0_0_25px_rgba(230,175,46,0.5)] relative">`
);

content = content.replace(
  `                  <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-black via-[#1C100A] to-[#2B180F] border border-[#D98353]/35 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-xl shadow-black/90">
                    <span className="text-[#D98353] font-serif font-black text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(217,131,83,0.5)]">1</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#D98353] font-bold">Winner</span>
                  </div>`,
  `                  <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-black via-[#1A180F] to-[#2B230F] border border-[#E6AF2E]/40 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-xl shadow-black/90">
                    <span className="text-[#E6AF2E] font-serif font-black text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(230,175,46,0.5)]">1</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#E6AF2E] font-bold">Winner</span>
                  </div>`
);

// Bronze (already Bronze colors but let's confirm text color)
content = content.replace(
  `                  <div className="w-full h-18 sm:h-22 bg-gradient-to-t from-black via-[#0F0A06] to-[#1A120B] border border-[#D98353]/15 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-md shadow-black/80">
                    <span className="text-[#D98353]/85 font-serif font-black text-2xl sm:text-3xl drop-shadow-[0_0_6px_rgba(217,131,83,0.2)]">3</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#D98353]/80 font-bold">Bronze</span>
                  </div>`,
  `                  <div className="w-full h-18 sm:h-22 bg-gradient-to-t from-black via-[#0F0A06] to-[#1A120B] border border-[#CD7F32]/30 rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-md shadow-black/80">
                    <span className="text-[#CD7F32]/90 font-serif font-black text-2xl sm:text-3xl drop-shadow-[0_0_6px_rgba(205,127,50,0.3)]">3</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-[#CD7F32]/80 font-bold">Bronze</span>
                  </div>`
);

fs.writeFileSync('src/App.tsx', content);
