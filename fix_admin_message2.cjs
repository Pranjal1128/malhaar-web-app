const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const target1 = `{profiles.filter(p => p.approved && p.role === 'member').map(p => {
                  const val = p.mandates?.[selectedMandateMonth] || 'pending';
                  return (`;
const replace1 = `
                {profiles.filter(p => p.approved && p.role === 'member').length === 0 && (
                  <div className="text-xs text-stone-500 py-6 text-center bg-black/25 rounded-lg border border-white/5 space-y-2">
                    <div className="flex justify-center mb-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[#D98353] border-t-transparent animate-spin"></div>
                    </div>
                    <p>Loading members...</p>
                  </div>
                )}
                {profiles.filter(p => p.approved && p.role === 'member').map(p => {
                  const val = p.mandates?.[selectedMandateMonth] || 'pending';
                  return (`;

const target2 = `<tbody className="divide-y divide-white/5 text-xs text-[#AC9E94]">
                  {profiles.filter(p => p.approved && p.role === 'member').map(p => {`;
const replace2 = `<tbody className="divide-y divide-white/5 text-xs text-[#AC9E94]">
                  {profiles.filter(p => p.approved && p.role === 'member').length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-stone-500">
                        <div className="flex justify-center mb-2">
                          <div className="w-4 h-4 rounded-full border-2 border-[#D98353] border-t-transparent animate-spin"></div>
                        </div>
                        <p>Loading members...</p>
                      </td>
                    </tr>
                  )}
                  {profiles.filter(p => p.approved && p.role === 'member').map(p => {`;

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);
fs.writeFileSync('src/components/AdminView.tsx', content);
