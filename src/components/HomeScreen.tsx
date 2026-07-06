import React, { useState } from 'react';
import { User, Post, DocumentItem, CalendarEvent } from '../types';
import { Mic, Megaphone, FileText, ChevronRight, Eye, Calendar, MapPin, Bell, Send } from 'lucide-react';

interface HomeScreenProps {
  currentUser: User;
  users: User[];
  posts: Post[];
  docs: DocumentItem[];
  events: CalendarEvent[];
  onSetTab: (tab: string) => void;
  onViewDoc: (docId: string) => void;
  onLaunchRecord: () => void;
  onAddPost: (post: Post) => Promise<void>;
  onOpenNotif: () => void;
}

export default function HomeScreen({
  currentUser,
  users,
  posts,
  docs,
  events,
  onSetTab,
  onViewDoc,
  onLaunchRecord,
  onAddPost,
  onOpenNotif,
}: HomeScreenProps) {
  const [quickPostText, setQuickPostText] = useState('');
  const [isPostingQuick, setIsPostingQuick] = useState(false);

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostText.trim()) return;
    setIsPostingQuick(true);
    const newPost: Post = {
      id: String(Date.now()),
      author: currentUser.name,
      initials: currentUser.initials || currentUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase(),
      authorId: currentUser.id,
      cat: 'Update',
      text: quickPostText.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attachment: null,
    };
    try {
      await onAddPost(newPost);
      setQuickPostText('');
    } catch {
      alert('Failed to post. Please check your connection and try again.');
    } finally {
      setIsPostingQuick(false);
    }
  };

  // Format current date nicely
  const getFormattedDate = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  };

  // All recent posts across every category, newest first
  const recentPosts = posts.slice(0, 6);

  const getCatStyle = (cat: string) => {
    switch (cat) {
      case 'Kudos':    return { pill: 'text-purple-600 bg-purple-50', emoji: '🎉' };
      case 'Update':   return { pill: 'text-sky-600 bg-sky-50',       emoji: 'ℹ️' };
      case 'Question': return { pill: 'text-amber-600 bg-amber-50',   emoji: '❓' };
      default:         return { pill: 'text-brand-text-light bg-brand-cream', emoji: '💬' };
    }
  };

  // Collect birthdays AND work anniversaries within the next 30 days
  const getUpcomingMilestones = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const colors = [
      'bg-[#4BAD47]', 'bg-[#2196F3]', 'bg-[#FF7043]',
      'bg-[#9C27B0]', 'bg-[#FF9800]', 'bg-[#00BCD4]',
    ];

    type Milestone = typeof users[0] & {
      kind: 'birthday' | 'anniversary';
      milestoneDate: Date;
      diffDays: number;
      years?: number;
      colorClass: string;
    };

    const items: Omit<Milestone, 'colorClass'>[] = [];

    users.forEach((u) => {
      // Birthdays
      if (u.bday) {
        const bdStr = u.bday.length === 5 ? `2000-${u.bday}` : u.bday;
        const bd = new Date(bdStr + 'T00:00:00');
        const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
        const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
        if (diff >= 0 && diff <= 30) {
          items.push({ ...u, kind: 'birthday', milestoneDate: thisYear, diffDays: diff });
        }
      }
      // Work anniversaries
      if (u.anniv) {
        const av = new Date(u.anniv + 'T00:00:00');
        const thisYear = new Date(today.getFullYear(), av.getMonth(), av.getDate());
        if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
        const diff = Math.ceil((thisYear.getTime() - today.getTime()) / 86400000);
        const celebrationYear = thisYear.getFullYear();
        const years = celebrationYear - av.getFullYear();
        if (diff >= 0 && diff <= 30 && years > 0) {
          items.push({ ...u, kind: 'anniversary', milestoneDate: thisYear, diffDays: diff, years });
        }
      }
    });

    return items
      .sort((a, b) => a.diffDays - b.diffDays)
      .map((item, index) => ({ ...item, colorClass: colors[index % colors.length] }));
  };

  const upcomingMilestones = getUpcomingMilestones();
  const recentDocs = docs.slice(0, 3);

  const todayNow = new Date();
  todayNow.setHours(0, 0, 0, 0);
  const todayStr = todayNow.toISOString().slice(0, 10);
  const upcomingEvents = [...events]
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 3);

  const fmt12 = (time?: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
  };

  const eventCategoryColors: Record<CalendarEvent['category'], string> = {
    Meeting:    'bg-sky-100 text-sky-700',
    Training:   'bg-purple-100 text-purple-700',
    Fundraiser: 'bg-amber-100 text-amber-700',
    Community:  'bg-brand-green-light text-brand-green-dark',
    Holiday:    'bg-rose-100 text-rose-700',
    Other:      'bg-gray-100 text-gray-600',
  };
  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Staff';

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24">
      
      {/* Header Panel */}
      <div className="bg-brand-green px-5 pt-12 pb-7 text-center relative overflow-hidden flex-shrink-0 text-white">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 right-6 w-32 h-32 bg-white/5 rounded-full" />

        <button
          onClick={onOpenNotif}
          title="Notifications"
          className="absolute top-12 right-5 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer z-10"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden relative">
            <img
              src="https://lh3.googleusercontent.com/d/1p51mr-0Uo7Y-V4u4-d_Zxsa6AothkASN"
              alt="Stewpot Connect Logo"
              className="w-full h-full object-contain p-2"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sib = e.currentTarget.nextElementSibling as HTMLElement;
                if (sib) sib.style.display = 'block';
              }}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.0"
              className="w-10 h-10 text-[#E8F5E9] hidden"
            >
              <path d="M12 21a9 9 0 0 0 9-9c0-1.49-.36-2.9-1.01-4.15L17 12H7L4.01 7.85A8.96 8.96 0 0 0 3 12a9 9 0 0 0 9 9Z" />
              <path d="M12 1v2" />
              <path d="M12 9v1" />
              <path d="M8 4V3" />
              <path d="M16 4V3" />
            </svg>
          </div>
        </div>
        
        <div className="text-xs font-semibold tracking-widest uppercase text-[#FAFAF7]/80 mb-1">
          Stewpot Connect
        </div>
        <div className="font-poppins font-bold text-2xl leading-tight">
          Hello, {firstName} 👋
        </div>
        <div className="text-xs text-[#FAFAF7]/70 mt-1">
          {getFormattedDate()}
        </div>
      </div>

      {/* Primary Call-to-action recording bar */}
      <div 
        onClick={onLaunchRecord}
        className="-mt-5 mx-5 bg-white rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(75,173,75,0.14)] cursor-pointer hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(75,173,75,0.22)] active:scale-[0.99] transition-all z-10"
      >
        <div className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center flex-shrink-0">
          <Mic className="w-5.5 h-5.5" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-brand-text">Record a Story</h3>
          <p className="text-xs text-brand-text mt-0.5">Capture a client or volunteer experience</p>
        </div>
        <ChevronRight className="w-5 h-5 text-brand-text-light ml-auto flex-shrink-0" />
      </div>

      {/* Calendar CTA */}
      <div
        onClick={() => onSetTab('calendar')}
        className="mt-3 mx-5 bg-white rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(75,173,75,0.10)] cursor-pointer hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(75,173,75,0.18)] active:scale-[0.99] transition-all border border-brand-border"
      >
        <div className="w-12 h-12 bg-brand-green-light text-brand-green rounded-full flex items-center justify-center flex-shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-bold text-brand-text">View Calendar</h3>
          <p className="text-xs text-brand-text mt-0.5">Browse upcoming Stewpot events</p>
        </div>
        <ChevronRight className="w-5 h-5 text-brand-text-light ml-auto flex-shrink-0" />
      </div>

      {/* Upcoming Events */}
      <div className="px-5 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-poppins font-bold text-sm text-white bg-brand-green px-3 py-1.5 rounded-lg flex items-center gap-1.5">📅 Upcoming Events</h2>
          <button
            onClick={() => onSetTab('calendar')}
            className="text-xs font-medium text-brand-green-dark hover:underline cursor-pointer focus:outline-none"
          >
            See all
          </button>
        </div>

        <div className="space-y-2.5">
          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center text-xs text-brand-text-light italic">
              No upcoming events scheduled.
            </div>
          ) : (
            upcomingEvents.map((ev) => {
              const evDate = new Date(ev.date + 'T00:00:00');
              const isToday = ev.date === todayStr;
              const dateLabel = isToday
                ? 'Today'
                : evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const colorClass = eventCategoryColors[ev.category] || eventCategoryColors.Other;
              return (
                <div
                  key={ev.id}
                  onClick={() => onSetTab('calendar')}
                  className="bg-white rounded-xl border border-brand-border p-3.5 flex items-start gap-3 cursor-pointer hover:border-brand-green/30 transition-all"
                >
                  {/* Date chip */}
                  <div className={`flex-shrink-0 w-12 rounded-xl text-center py-1.5 ${isToday ? 'bg-brand-green text-white' : 'bg-brand-cream text-brand-text-mid border border-brand-border'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wide leading-none">
                      {evDate.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-base font-bold leading-tight">{evDate.getDate()}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-brand-text truncate">{ev.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${colorClass}`}>
                        {ev.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {!ev.allDay && ev.time && (
                        <span className="text-[11px] text-brand-text-light font-medium">
                          🕐 {fmt12(ev.time)}{ev.endTime ? ` – ${fmt12(ev.endTime)}` : ''}
                        </span>
                      )}
                      {ev.allDay && (
                        <span className="text-[11px] text-brand-text-light font-medium">All day</span>
                      )}
                      {ev.location && (
                        <span className="text-[11px] text-brand-text-light font-medium flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Team Posts */}
      <div className="px-5 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-poppins font-bold text-sm text-white bg-brand-green px-3 py-1.5 rounded-lg flex items-center gap-1.5">💬 Recent Team Posts</h2>
          <button
            onClick={() => onSetTab('forum')}
            className="text-xs font-medium text-brand-green-dark hover:underline cursor-pointer focus:outline-none"
          >
            See all
          </button>
        </div>

        {/* Quick Post */}
        <div className="mb-3">
          <form onSubmit={handleQuickPost} className="bg-white rounded-xl border border-brand-border p-3 flex items-center gap-2.5">
            <input
              type="text"
              value={quickPostText}
              onChange={(e) => setQuickPostText(e.target.value)}
              placeholder="Share an update with the team…"
              className="flex-1 text-xs text-brand-text bg-transparent focus:outline-none placeholder:text-brand-text-light"
            />
            <button
              type="submit"
              disabled={isPostingQuick || !quickPostText.trim()}
              className="w-8 h-8 rounded-lg bg-brand-green text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <button
            onClick={() => onSetTab('forum')}
            className="text-xs font-medium text-brand-green-dark hover:underline mt-1.5 ml-1 cursor-pointer focus:outline-none"
          >
            Or post from the Community tab →
          </button>
        </div>

        <div className="space-y-3">
          {recentPosts.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center text-xs text-brand-text-light italic">
              No team posts yet. Share an update, kudos, or question in Community!
            </div>
          ) : (
            recentPosts.map((p) => {
              const isAnnouncement = p.cat === 'Announcement';
              const { pill, emoji } = getCatStyle(p.cat);
              const hasPhoto = p.attachment?.kind === 'photo' && p.attachment.data;
              return (
                <div
                  key={p.id}
                  onClick={() => onSetTab('forum')}
                  className="bg-white rounded-xl border border-brand-border overflow-hidden hover:border-brand-green/30 transition-all cursor-pointer text-left"
                >
                  {hasPhoto && (
                    <img
                      src={p.attachment!.data}
                      alt="Post photo"
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isAnnouncement ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full">
                          <Megaphone className="w-3 h-3" /> Announcement
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${pill}`}>
                          {emoji} {p.cat}
                        </span>
                      )}
                      <span className="text-xs text-brand-text-light font-medium ml-auto">{p.date}</span>
                    </div>
                    {p.text && (
                      <p className="text-xs text-brand-text-mid leading-relaxed line-clamp-2">{p.text}</p>
                    )}
                    <div className="text-xs text-brand-text-light mt-2 font-medium">{p.author}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Birthdays scroll */}
      <div className="mt-6">
        <div className="px-5 flex justify-between items-center mb-3">
          <h2 className="font-poppins font-bold text-sm text-white bg-brand-green px-3 py-1.5 rounded-lg flex items-center gap-1.5">🎂 Birthdays &amp; Milestones</h2>
          <span className="text-xs font-semibold text-brand-green bg-brand-green-light px-2 py-0.5 rounded-full">30 Days</span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
          {upcomingMilestones.length === 0 ? (
            <div className="text-xs text-brand-text-light italic w-full text-center py-4 bg-white rounded-xl border border-brand-border">
              No upcoming birthdays or anniversaries this month.
            </div>
          ) : (
            upcomingMilestones.map((u) => {
              const uInitials = u.initials || u.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const dateLabel = `${months[u.milestoneDate.getMonth()]} ${u.milestoneDate.getDate()}`;
              const typeLabel = u.kind === 'birthday' ? '🎂 Birthday' : '💼 Work Anniversary';
              const subLabel = u.kind === 'anniversary' && u.years ? `${u.years} Year${u.years !== 1 ? 's' : ''}` : null;

              return (
                <div
                  key={`${u.id}-${u.kind}`}
                  className="flex-shrink-0 w-36 bg-white rounded-xl border border-brand-border p-3.5 text-center shadow-sm"
                >
                  <div className={`w-11 h-11 ${u.colorClass} rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2 shadow`}>
                    {uInitials}
                  </div>
                  <div className="text-xs font-bold text-brand-text truncate">
                    {u.name.split(' ')[0]} {u.name.split(' ').pop()?.[0]}.
                  </div>
                  <div className="text-[10px] font-semibold text-brand-text-mid mt-0.5">{typeLabel}</div>
                  {subLabel && (
                    <div className="text-[10px] text-brand-text-light">{subLabel}</div>
                  )}
                  <div className="text-xs font-semibold text-brand-green-dark bg-brand-green-light px-2 py-0.5 rounded-full inline-block mt-2">
                    {u.diffDays === 0 ? '🎉 Today!' : dateLabel}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Resources */}
      <div className="px-5 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-poppins font-bold text-sm text-white bg-brand-green px-3 py-1.5 rounded-lg flex items-center gap-1.5">📁 Recent Staff Files</h2>
          <button 
            onClick={() => onSetTab('resources')}
            className="text-xs font-medium text-brand-green-dark hover:underline cursor-pointer focus:outline-none"
          >
            See all
          </button>
        </div>

        <div className="space-y-2">
          {recentDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center text-xs text-brand-text-light italic">
              No shared documents yet. Upload files from the Admin portal.
            </div>
          ) : (
            recentDocs.map((d) => {
              const isPdf = d.type?.includes('pdf');
              return (
                <div 
                  key={d.id}
                  onClick={() => onViewDoc(d.id)}
                  className="bg-white rounded-xl border border-brand-border p-3 flex items-center gap-3 hover:border-brand-green/30 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-brand-green-light text-brand-green-dark rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1 min-width-0">
                    <h3 className="text-xs font-semibold text-brand-text truncate">{d.displayName}</h3>
                    <p className="text-xs text-brand-text-light mt-0.5">Shared on {d.date} &middot; {d.size}</p>
                  </div>
                  <Eye className="w-4 h-4 text-brand-green" />
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
