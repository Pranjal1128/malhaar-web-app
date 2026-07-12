const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileView.tsx', 'utf8');

const target = `const status = profile.mandates?.[month] || 'pending';
                    return (
                      <div 
                        key={month} 
                        className={\`p-3.5 rounded-2xl border flex flex-col justify-between h-24 transition-all \${
                          status === 'given' 
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]' 
                            : status === 'crossed' 
                              ? 'bg-red-950/20 border-red-500/20 text-red-400' 
                              : 'bg-black/30 border-zinc-850 text-zinc-400'
                        }\`}`;

const replace = `const status = profile.mandates?.[month] || 'pending';
                    const isCurrentMonth = month === new Date().toLocaleString('default', { month: 'long' });
                    return (
                      <div 
                        key={month} 
                        className={\`p-3.5 rounded-2xl border flex flex-col justify-between h-24 transition-all \${
                          isCurrentMonth && status === 'pending'
                            ? 'bg-[#D98353]/10 border-[#D98353]/50 text-[#D98353] shadow-[0_0_15px_rgba(217,131,83,0.15)]'
                            : status === 'given' 
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]' 
                            : status === 'crossed' 
                              ? 'bg-red-950/20 border-red-500/20 text-red-400' 
                              : 'bg-black/30 border-zinc-850 text-zinc-400'
                        }\`}`;

content = content.replace(target, replace);
fs.writeFileSync('src/components/ProfileView.tsx', content);
