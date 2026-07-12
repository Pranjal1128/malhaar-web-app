const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const target = `{['May', 'June', 'July'].map(m => {`;
const replace = `{['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'].map(m => {`;

content = content.replace(target, replace);
fs.writeFileSync('src/components/AdminView.tsx', content);
