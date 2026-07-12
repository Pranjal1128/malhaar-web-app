const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

// Replace state
content = content.replace(
`  const [editMandateMay, setEditMandateMay] = useState<'given' | 'crossed' | 'pending'>('given');
  const [editMandateJune, setEditMandateJune] = useState<'given' | 'crossed' | 'pending'>('given');
  const [editMandateJuly, setEditMandateJuly] = useState<'given' | 'crossed' | 'pending'>('given');`,
`  const [editMandates, setEditMandates] = useState<Record<string, 'given' | 'crossed' | 'pending'>>({});`
);

content = content.replace(
`            May: editMandateMay,
            June: editMandateJune,
            July: editMandateJuly`,
`            ...editMandates`
);

content = content.replace(
`                          const val = m === 'May' ? editMandateMay : m === 'June' ? editMandateJune : editMandateJuly;
                          const setVal = m === 'May' ? setEditMandateMay : m === 'June' ? setEditMandateJune : setEditMandateJuly;
                          return (
                            <button
                              type="button"
                              key={m}
                              onClick={() => setVal(val === 'given' ? 'crossed' : 'given')}
                              className={\`py-2 rounded-lg text-[9px] font-mono border text-center font-bold uppercase transition-all \${
                                val === 'crossed' 
                                  ? 'bg-red-950/20 border-red-500/50 text-red-400' 
                                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-450'
                              }\`}
                            >
                              {m}: {val === 'crossed' ? '❌ Cross' : '✅ Paid'}
                            </button>
                          );`,
`                          const val = editMandates[m] || 'pending';
                          return (
                            <button
                              type="button"
                              key={m}
                              onClick={() => {
                                const newVal = val === 'given' ? 'crossed' : val === 'crossed' ? 'pending' : 'given';
                                setEditMandates({...editMandates, [m]: newVal});
                              }}
                              className={\`py-2 rounded-lg text-[9px] font-mono border text-center font-bold uppercase transition-all \${
                                val === 'crossed' 
                                  ? 'bg-red-950/20 border-red-500/50 text-red-400' 
                                  : val === 'given'
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                  : 'bg-black/40 border-stone-800 text-stone-400'
                              }\`}
                            >
                              {m}: {val === 'crossed' ? '❌ Missed' : val === 'given' ? '✅ Paid' : '⏳ Pend'}
                            </button>
                          );`
);

fs.writeFileSync('src/components/AdminView.tsx', content);
