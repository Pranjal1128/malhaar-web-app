import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { dbInstance } from './db/mockDb';
import { testConnection } from './lib/firebaseDb';

async function bootstrapAndRender() {
  // Test the connection to Firestore as required by integration guidelines
  testConnection();

  try {
    const res = await fetch('/api/db');
    const data = await res.json();

    // Complete list of ALL data keys used by the app — previously missing:
    // attendance_sessions, attendance_records, knowledge_items, alumni_messages, active_month
    const expectedKeys = [
      'profiles', 'performance', 'notices', 'events', 'achievements',
      'merchandise', 'media_folders', 'core_members', 'core_performance',
      'timetable', 'monthly_targets', 'suggestions', 'site_content',
      'alumni', 'custom_sections', 'svara_practice_materials',
      'attendance_sessions', 'attendance_records', 'knowledge_items',
      'alumni_messages', 'active_month'
    ];

    const mergedData = { ...data };

    expectedKeys.forEach(key => {
      if (!data || data[key] === undefined || data[key] === null) {
        mergedData[key] = dbInstance.getDefaultValueForKey(key);
      }
    });

    // Load full merged structure into memory cache and browser local storage.
    // NOTE: We intentionally do NOT call syncAllToServer() here during bootstrap.
    // Previously, syncing defaults back to the server during bootstrap would overwrite
    // cloud data with empty defaults, causing data erasure. The server-side self-repair
    // in GET /api/db handles seeding if the cloud database is truly empty.
    dbInstance.loadServerData(mergedData);
  } catch (error) {
    console.warn("Could not retrieve shared database from backend, using local fallbacks", error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrapAndRender();
