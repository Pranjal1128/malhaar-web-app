import fs from 'fs';

const dbPath = './db.json';
if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  fetch('http://localhost:3000/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
    .then(res => console.log('Successfully synced db.json to Supabase via server API:', res))
    .catch(err => console.error('Failed to sync:', err));
} else {
  console.log('db.json not found');
}
