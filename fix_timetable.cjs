const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            )}
          </div>

        );`;

const replace = `            )}
            {/* Upcoming 7 Days Timetable Schedule */}
            <div className="space-y-6 mt-8">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayName = date.toLocaleDateString('default', { weekday: 'long' });
                const dateStr = date.toISOString().split('T')[0];
                
                // Filter timetable entries for this day of the week
                const dayEvents = timetable.filter(t => 
                  (timetableFilter === 'All' || t.event_type === timetableFilter) && 
                  t.day_of_week === dayName
                );
                
                // Filter google events for this specific date
                const dayGoogleEvents = googleEvents.filter(ge => {
                  if (ge.start.dateTime) return ge.start.dateTime.startsWith(dateStr);
                  if (ge.start.date) return ge.start.date === dateStr;
                  return false;
                });

                if (dayEvents.length === 0 && dayGoogleEvents.length === 0) return null;

                return (
                  <div key={dateStr} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                    <h3 className="text-xl font-serif font-bold text-[#D98353] border-b border-white/5 pb-2">
                      {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName} <span className="text-sm font-mono text-stone-500 ml-2">{dateStr}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayEvents.map(slot => (
                        <div key={slot.id} className="bg-black/40 border border-[#D98353]/20 p-4 rounded-2xl flex flex-col justify-between hover:border-[#D98353]/50 transition-all text-left space-y-3">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-[#D98353]/20 text-[#D98353]">
                                {slot.event_type}
                              </span>
                              <span className="text-[10px] font-mono text-stone-400 font-semibold">
                                {slot.start_time}-{slot.end_time}
                              </span>
                            </div>
                            <h4 className="font-serif text-sm font-bold text-white mt-1">{slot.title}</h4>
                            <p className="text-[10px] text-stone-400 line-clamp-1">{slot.description}</p>
                            {slot.assigned_to && (
                              <p className="text-[9px] font-mono text-stone-500 mt-1">🎯 Target: {slot.assigned_to}</p>
                            )}
                          </div>
                          {['admin', 'president', 'core'].includes(currentUser.role) && getWorkspaceToken() && (
                            <div className="pt-2 border-t border-white/5">
                              <button
                                onClick={() => handleSyncToGoogleCalendar(slot, dateStr)}
                                className="w-full py-1.5 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900 border border-emerald-900 rounded-lg text-[9px] font-mono uppercase font-bold transition-all"
                              >
                                Sync to G-Calendar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {dayGoogleEvents.map(ge => {
                        const timeString = ge.start.dateTime 
                          ? new Date(ge.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'All Day';
                        return (
                          <div key={ge.id} className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between hover:border-emerald-500/50 transition-all text-left space-y-3 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 text-emerald-500/10 text-6xl">📅</div>
                            <div className="relative z-10">
                              <div className="flex justify-between items-start gap-2">
                                <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-emerald-500/20 text-emerald-400">
                                  Google Calendar
                                </span>
                                <span className="text-[10px] font-mono text-emerald-400/70 font-semibold">
                                  {timeString}
                                </span>
                              </div>
                              <h4 className="font-serif text-sm font-bold text-white mt-1">{ge.summary}</h4>
                              {ge.description && <p className="text-[10px] text-stone-400 line-clamp-2 mt-1" dangerouslySetInnerHTML={{ __html: ge.description }} />}
                            </div>
                            {ge.htmlLink && (
                              <a href={ge.htmlLink} target="_blank" rel="noreferrer" className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 relative z-10 pt-2 border-t border-emerald-500/10">
                                ↗ View in Google Calendar
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        );`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
