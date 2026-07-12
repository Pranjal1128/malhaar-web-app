const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

content = content.replace(
  `<p className="text-xs text-stone-500 py-3 text-center bg-black/25 rounded-lg">No active standard student members registered to evaluate.</p>`,
  `<div className="text-xs text-stone-500 py-5 text-center bg-black/25 rounded-lg border border-white/5 space-y-2">
    <div className="flex justify-center mb-2">
      <div className="w-4 h-4 rounded-full border-2 border-[#D98353] border-t-transparent animate-spin"></div>
    </div>
    <p>Loading members...</p>
    <p className="text-[10px] text-stone-600">Waiting for standard student members to register.</p>
  </div>`
);

fs.writeFileSync('src/components/AdminView.tsx', content);
