const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

content = content.replace(
`    // Mandates status prefill
    setEditMandateMay(u.mandates?.May || 'given');
    setEditMandateJune(u.mandates?.June || 'given');
    setEditMandateJuly(u.mandates?.July || 'given');`,
`    // Mandates status prefill
    setEditMandates(u.mandates || {});`
);

fs.writeFileSync('src/components/AdminView.tsx', content);
