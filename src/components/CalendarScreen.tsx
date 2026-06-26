import React, { useState } from 'react';
import { CalendarEvent, User } from '../types';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar, Plus, X } from 'lucide-react';

interface CalendarScreenProps {
  events: CalendarEvent[];
  currentUser: User;
  onSubmitEventRequest: (event: CalendarEvent) => Promise<void>;
}

const CATEGORY_STYLES: Record<CalendarEvent['category'], { pill: string; dot: string; emoji: string }> = {
  Meeting:     { pill: 'bg-sky-50 text-sky-700',        dot: 'bg-sky-500',     emoji: '📋' },
  Training:    { pill: 'bg-purple-50 text-purple-700',  dot: 'bg-purple-500',  emoji: '🎓' },
  Fundraiser:  { pill: 'bg-amber-50 text-amber-700',    dot: 'bg-amber-500',   emoji: '💛' },
  Community:   { pill: 'bg-brand-green-light text-brand-green-dark', dot: 'bg-brand-green', emoji: '🤝' },
  Holiday:     { pill: 'bg-rose-50 text-rose-700',      dot: 'bg-rose-400',    emoji: '🎉' },
  Other:       { pill: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400',    emoji: '📌' },
};

function fmt12(time?: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function parseLocalDate(dateStr: string) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d);
}

export default function CalendarScreen({ events, currentUser, onSubmitEventRequest }: CalendarScreenProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const visibleEvents = events.filter((e) => e.status !== 'pending');

  // Add Event request modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<CalendarEvent['category']>('Other');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  const resetAddForm = () => {
    setNewTitle(''); setNewDate(''); setNewTime(''); setNewEndTime('');
    setNewLocation(''); setNewDescription(''); setNewCategory('Other');
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) {
      alert('Please provide at least a title and date.');
      return;
    }
    setIsSubmittingEvent(true);
    const event: CalendarEvent = {
      id: String(Date.now()),
      title: newTitle.trim(),
      date: newDate,
      ...(newTime ? { time: newTime } : {}),
      ...(newEndTime ? { endTime: newEndTime } : {}),
      ...(newLocation.trim() ? { location: newLocation.trim() } : {}),
      ...(newDescription.trim() ? { description: newDescription.trim() } : {}),
      category: newCategory,
      status: 'pending',
      submittedBy: currentUser.id,
      submitterName: currentUser.name,
    };
    try {
      await onSubmitEventRequest(event);
      resetAddForm();
      setShowAddModal(false);
      alert('Your event submission is under review by an admin.');
    } catch {
      alert('Failed to submit event. Please try again.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const dayLabels = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Map events by date string
  const eventsByDate = visibleEvents.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const padDate = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const isToday = (d: number) => {
    return today.getFullYear() === viewYear &&
           today.getMonth() === viewMonth &&
           today.getDate() === d;
  };

  // Events to show in the list below
  const listEvents: CalendarEvent[] = selectedDate
    ? (eventsByDate[selectedDate] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    : visibleEvents
        .filter(e => e.date >= today.toISOString().slice(0, 10))
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
        .slice(0, 20);

  const selectedLabel = selectedDate
    ? parseLocalDate(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Upcoming Events';

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24 text-left">

      {/* Header */}
      <div className="bg-brand-green px-5 pt-12 pb-5 text-white flex-shrink-0 flex items-start justify-between">
        <div>
          <h1 className="font-poppins font-bold text-2xl">Calendar</h1>
          <p className="text-xs text-[#E8F5E9]/90 mt-1">Stewpot events &amp; important dates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl cursor-pointer transition-all flex-shrink-0 mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Event
        </button>
      </div>

      {/* Month navigator */}
      <div className="mx-5 -mt-4 bg-white rounded-2xl shadow-[0_4px_16px_rgba(75,173,75,0.12)] overflow-hidden z-10">

        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-brand-cream flex items-center justify-center text-brand-text-mid cursor-pointer focus:outline-none">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-brand-text">
            {monthNames[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-brand-cream flex items-center justify-center text-brand-text-mid cursor-pointer focus:outline-none">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {dayLabels.map(d => (
            <div key={d} className="text-center text-[11px] font-bold text-brand-text-light uppercase tracking-wide py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dateStr = padDate(day);
            const hasEvents = !!eventsByDate[dateStr]?.length;
            const isSelected = selectedDate === dateStr;
            const isTodayCell = isToday(day);
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer focus:outline-none relative
                  ${isSelected ? 'bg-brand-green text-white' : isTodayCell ? 'bg-brand-green-light text-brand-green-dark font-bold' : 'hover:bg-brand-cream text-brand-text'}`}
              >
                <span className="text-xs font-semibold leading-none">{day}</span>
                {hasEvents && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-brand-green'}`} />
                )}
                {!hasEvents && <span className="w-1.5 h-1.5 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-green" />
            {selectedLabel}
          </h2>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs font-medium text-brand-green-dark hover:underline cursor-pointer focus:outline-none"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-3">
          {listEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-border p-6 text-center text-xs text-brand-text-light italic">
              {selectedDate ? 'No events on this day.' : 'No upcoming events scheduled.'}
            </div>
          ) : (
            listEvents.map((e) => {
              const style = CATEGORY_STYLES[e.category] || CATEGORY_STYLES.Other;
              const eventDate = parseLocalDate(e.date);
              const dateLabel = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={e.id} className="bg-white rounded-xl border border-brand-border overflow-hidden">
                  <div className={`h-1 w-full ${style.dot}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-brand-text leading-tight">{e.title}</h3>
                        {e.description && (
                          <p className="text-xs text-brand-text-mid mt-1 leading-relaxed line-clamp-2">{e.description}</p>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${style.pill}`}>
                        {style.emoji} {e.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                      <div className="flex items-center gap-1 text-xs text-brand-text-light font-medium">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {selectedDate ? (e.allDay ? 'All Day' : fmt12(e.time)) : dateLabel}
                        {!e.allDay && e.time && selectedDate && e.endTime && (
                          <span> – {fmt12(e.endTime)}</span>
                        )}
                        {!e.allDay && e.time && !selectedDate && (
                          <span className="ml-1">{fmt12(e.time)}{e.endTime ? ` – ${fmt12(e.endTime)}` : ''}</span>
                        )}
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-1 text-xs text-brand-text-light font-medium">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {e.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Event Request Modal */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm text-brand-text shadow-2xl relative mb-0 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border mb-4">
              <h3 className="text-sm font-bold font-poppins text-brand-text">Request an Event</h3>
              <X className="w-5 h-5 text-brand-text-light cursor-pointer" onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-brand-text-light mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-light mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CalendarEvent['category'])}
                    className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text"
                  >
                    {(['Meeting','Training','Fundraiser','Community','Holiday','Other'] as const).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-brand-text-light mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-light mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1">Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingEvent}
                className="w-full py-3 bg-brand-green text-white font-bold rounded-xl text-xs mt-2 disabled:opacity-60"
              >
                {isSubmittingEvent ? 'Submitting…' : 'Submit for Approval'}
              </button>
              <p className="text-[11px] text-brand-text-light text-center">An admin will review your event submission.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
