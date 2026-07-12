import React, { useState, useEffect, useRef } from 'react';
import { dbInstance, SvaraPracticeMaterial, Profile } from '../db/mockDb';

interface SvaraPracticeHubProps {
  currentUser: Profile;
  onRequestToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CATEGORIES = [
  '1. INDIAN CHOIR COMPOSITION',
  '2. WESTERN A CAPPELLA',
  '3. INSTRUMENTAL WORK',
  '4. WHOLE SOCIETY LEARNING'
];

export default function SvaraPracticeHub({ currentUser, onRequestToast }: SvaraPracticeHubProps) {
  const [materials, setMaterials] = useState<SvaraPracticeMaterial[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioUrl2, setAudioUrl2] = useState('');
  const [audioUrl3, setAudioUrl3] = useState('');
  const [audioUrl4, setAudioUrl4] = useState('');
  const [driveLink, setDriveLink] = useState('');
  
  const isKnowledgeable = ['admin', 'president', 'core', 'central_core'].includes(currentUser.role);

  useEffect(() => {
    // Load practice materials on mount
    setMaterials(dbInstance.getSvaraPracticeMaterials());
  }, []);

  // Handle direct file upload from phone
  const handleFileUploadSlot = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) { // Increased to 15MB to be friendly
      onRequestToast('Audio file too large. Max 15MB allowed.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Audio = uploadEvent.target?.result as string;
      if (slot === 1) setAudioUrl(base64Audio);
      else if (slot === 2) setAudioUrl2(base64Audio);
      else if (slot === 3) setAudioUrl3(base64Audio);
      else if (slot === 4) setAudioUrl4(base64Audio);
      onRequestToast(`Audio file ${slot} loaded successfully!`, 'success');
    };
    reader.onerror = () => {
      onRequestToast('Failed to read file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !lyrics.trim()) {
      onRequestToast('Please enter both Title and Lyrics/Notes.', 'error');
      return;
    }

    if (editingMaterialId) {
      const updated = materials.map(m => {
        if (m.id === editingMaterialId) {
          return {
            ...m,
            title: title.trim(),
            lyrics: lyrics.trim(),
            category: category,
            audio_url: audioUrl || undefined,
            audio_url_2: audioUrl2 || undefined,
            audio_url_3: audioUrl3 || undefined,
            audio_url_4: audioUrl4 || undefined,
            drive_link: driveLink.trim() || undefined
          };
        }
        return m;
      });
      setMaterials(updated);
      dbInstance.saveSvaraPracticeMaterials(updated);
      onRequestToast('Practice material updated successfully!', 'success');
    } else {
      const newMaterial: SvaraPracticeMaterial = {
        id: 'practice_' + Date.now(),
        title: title.trim(),
        lyrics: lyrics.trim(),
        category: category,
        audio_url: audioUrl || undefined,
        audio_url_2: audioUrl2 || undefined,
        audio_url_3: audioUrl3 || undefined,
        audio_url_4: audioUrl4 || undefined,
        drive_link: driveLink.trim() || undefined,
        created_at: new Date().toISOString().split('T')[0]
      };

      const updated = [newMaterial, ...materials];
      setMaterials(updated);
      dbInstance.saveSvaraPracticeMaterials(updated);
      onRequestToast('Practice material published successfully!', 'success');
    }
    
    // Reset form
    setTitle('');
    setLyrics('');
    setAudioUrl('');
    setAudioUrl2('');
    setAudioUrl3('');
    setAudioUrl4('');
    setDriveLink('');
    setEditingMaterialId(null);
    setShowAddForm(false);
  };

  const handleEditMaterial = (mat: SvaraPracticeMaterial) => {
    setEditingMaterialId(mat.id);
    setTitle(mat.title);
    setLyrics(mat.lyrics);
    setCategory(mat.category);
    setAudioUrl(mat.audio_url || '');
    setAudioUrl2(mat.audio_url_2 || '');
    setAudioUrl3(mat.audio_url_3 || '');
    setAudioUrl4(mat.audio_url_4 || '');
    setDriveLink(mat.drive_link || '');
    setShowAddForm(true);
    onRequestToast(`Editing composition: "${mat.title}"`, 'info');
  };

  const handleDeleteMaterial = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    dbInstance.saveSvaraPracticeMaterials(updated);
    onRequestToast('Material deleted successfully.', 'success');
  };

  return (
    <div className="mt-8 bg-white/[0.01] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-serif font-black text-white tracking-wide">🎙️ Vocal Practice & Lyrics Hub</h2>
          <p className="text-xs text-stone-400">Read lyrics, listen to recordings, or practice alongside classical compositions</p>
        </div>
        
        {isKnowledgeable && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-[#D98353] hover:bg-[#c57142] text-black font-semibold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-lg hover:shadow-[#D98353]/20"
          >
            {showAddForm ? 'Close Editor' : '➕ Add Practice Material'}
          </button>
        )}
      </div>

      {/* Admin Addition Form */}
      {isKnowledgeable && showAddForm && (
        <form onSubmit={handleSaveMaterial} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#D98353]">
            {editingMaterialId ? 'Edit Practice Sheet' : 'Add New Practice Sheets (Admin Only)'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">Composition Title</label>
              <input
                type="text"
                placeholder="e.g., Alankar patterns in Raag Bhairav"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 bg-stone-900/60 border border-white/10 rounded-xl focus:border-[#D98353] focus:outline-none text-xs text-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">Practice Segregation / Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 bg-stone-900/60 border border-white/10 rounded-xl focus:border-[#D98353] focus:outline-none text-xs text-stone-300"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-neutral-900 text-stone-200">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-mono text-stone-400 font-bold">Lyrics & Vocal Practice Notes</label>
            <textarea
              placeholder="Provide exact lyrics, Aroha, Avaroha, or note progressions..."
              rows={4}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="w-full p-3 bg-stone-900/60 border border-white/10 rounded-xl focus:border-[#D98353] focus:outline-none text-xs text-white font-mono leading-relaxed"
              required
            />
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-stone-400 font-bold">Acoustic Guide Tracks (Upload up to 4 tracks)</h4>
              <p className="text-[10px] text-stone-500 mt-0.5">Configure reference audio guides or vocal stems.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((slot) => {
                const getUrl = () => {
                  if (slot === 1) return audioUrl;
                  if (slot === 2) return audioUrl2;
                  if (slot === 3) return audioUrl3;
                  return audioUrl4;
                };
                const setUrl = (val: string) => {
                  if (slot === 1) setAudioUrl(val);
                  else if (slot === 2) setAudioUrl2(val);
                  else if (slot === 3) setAudioUrl3(val);
                  else setAudioUrl4(val);
                };

                const currentVal = getUrl();

                return (
                  <div key={slot} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="block text-[10px] uppercase font-mono text-stone-400 font-bold">Track Slot #{slot}</span>
                      {currentVal && (
                        <button
                          type="button"
                          onClick={() => setUrl('')}
                          className="text-[9px] text-red-400 hover:underline font-mono"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileUploadSlot(e, slot)}
                      className="block w-full text-[10px] text-stone-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-mono file:bg-[#D98353]/15 file:text-[#D98353] hover:file:bg-[#D98353]/25"
                    />

                    <div className="space-y-1">
                      <span className="block text-[9px] text-stone-500 font-mono">Or paste audio URL:</span>
                      <input
                        type="text"
                        placeholder="e.g., https://example.com/audio.mp3"
                        value={currentVal.startsWith('data:') ? 'Local file uploaded' : currentVal}
                        disabled={currentVal.startsWith('data:')}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full h-7 px-2 bg-stone-900/80 border border-white/5 rounded-lg focus:outline-none text-[10px] text-white font-mono"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-[#D98353]/5 border border-[#D98353]/10 rounded-xl space-y-1.5">
              <label className="text-[10px] uppercase font-mono text-stone-400 font-bold flex items-center gap-1.5">
                <span>📂 Google Drive / External Collaborative Edit Link</span>
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... or collaborative sheet link"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className="w-full h-10 px-3 bg-stone-900/60 border border-white/10 rounded-xl focus:border-[#D98353] focus:outline-none text-xs text-white font-mono"
              />
              <p className="text-[9px] text-stone-500">Attach folders/workbooks containing sheet music, annotations, or dynamic recordings.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setTitle('');
                setLyrics('');
                setAudioUrl('');
                setAudioUrl2('');
                setAudioUrl3('');
                setAudioUrl4('');
                setDriveLink('');
                setEditingMaterialId(null);
              }}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D98353] hover:bg-[#c57142] text-black font-bold text-xs rounded-xl"
            >
              {editingMaterialId ? 'Save Changes' : 'Publish Composition'}
            </button>
          </div>
        </form>
      )}

      {/* Materials List separated by Bold Highlighted Headings */}
      <div className="space-y-8">
        {CATEGORIES.map((cat) => {
          const filtered = materials.filter(m => m.category === cat);
          
          return (
            <div key={cat} className="space-y-4">
              {/* BOLD HIGHLIGHTED CATEGORY HEADING */}
              <div className="flex items-center gap-2 bg-[#D98353]/10 border-l-4 border-[#D98353] px-3 py-1.5 rounded-r-lg">
                <h3 className="text-xs font-mono uppercase font-black tracking-widest text-[#D98353] py-0.5">
                  {cat}
                </h3>
                <span className="text-[10px] font-mono text-stone-400">({filtered.length})</span>
              </div>

              {filtered.length === 0 ? (
                <p className="text-xs text-stone-500 pl-4 italic">No practice sheets published in this category yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
                  {filtered.map((mat) => (
                    <div
                      key={mat.id}
                      className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-white/[0.03] transition-all space-y-3 relative group text-left"
                    >
                      {isKnowledgeable && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditMaterial(mat)}
                            className="text-stone-400 hover:text-[#D98353] text-xs p-1 cursor-pointer"
                            title="Edit practice material"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="text-stone-400 hover:text-red-400 text-xs p-1 cursor-pointer"
                            title="Delete practice material"
                          >
                            🗑️
                          </button>
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-white text-sm leading-snug pr-12">{mat.title}</h4>
                        <span className="text-[9px] font-mono text-stone-500">{mat.created_at}</span>
                      </div>

                      <div className="bg-stone-950/40 border border-white/5 rounded-xl p-3 max-h-[160px] overflow-y-auto">
                        <pre className="text-stone-300 text-xs font-mono leading-relaxed whitespace-pre-wrap font-sans">
                          {mat.lyrics}
                        </pre>
                      </div>

                      {/* Display up to 4 guide tracks if present */}
                      {(mat.audio_url || mat.audio_url_2 || mat.audio_url_3 || mat.audio_url_4) && (
                        <div className="pt-3 border-t border-white/5 space-y-2">
                          <span className="block text-[8px] font-mono uppercase tracking-widest text-stone-400 font-bold">Acoustic Guide Tracks ({[mat.audio_url, mat.audio_url_2, mat.audio_url_3, mat.audio_url_4].filter(Boolean).length})</span>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Track #1', url: mat.audio_url },
                              { label: 'Track #2', url: mat.audio_url_2 },
                              { label: 'Track #3', url: mat.audio_url_3 },
                              { label: 'Track #4', url: mat.audio_url_4 }
                            ].map((track, trackIdx) => {
                              if (!track.url) return null;
                              return (
                                <div key={trackIdx} className="bg-stone-900/50 rounded-xl p-2 border border-white/5 flex flex-col gap-1">
                                  <span className="text-[8px] font-mono uppercase text-stone-500">{track.label}</span>
                                  <audio src={track.url} controls className="w-full h-8" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Display Drive Link if present */}
                      {mat.drive_link && (
                        <div className="pt-2">
                          <a
                            href={mat.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D98353]/10 border border-[#D98353]/20 rounded-xl text-[10px] font-mono text-[#D98353] hover:bg-[#D98353]/20 transition-all font-bold cursor-pointer"
                          >
                            📂 Open Drive Link to Edit
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
