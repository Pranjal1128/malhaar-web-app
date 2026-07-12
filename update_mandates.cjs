const fs = require('fs');

const months = `['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April']`;
const monthsVar = `['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']`;

const files = ['src/components/AdminView.tsx', 'src/components/ProfileView.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(monthsVar).join(months);
  // Highlight current month
  // We'll do this manually for ProfileView since it's easy.
  fs.writeFileSync(file, content);
});

console.log("Updated mandate months");
