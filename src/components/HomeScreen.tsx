import React from 'react';
import { User, Post, DocumentItem } from '../types';
import { Mic, Megaphone, FileText, ChevronRight, Eye } from 'lucide-react';

interface HomeScreenProps {
  currentUser: User;
  users: User[];
  posts: Post[];
  docs: DocumentItem[];
  onSetTab: (tab: string) => void;
  onViewDoc: (docId: string) => void;
  onLaunchRecord: () => void;
}

export default function HomeScreen({
  currentUser,
  users,
  posts,
  docs,
  onSetTab,
  onViewDoc,
  onLaunchRecord,
}: HomeScreenProps) {
  
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

  // Extract up to 3 announcements
  const announcements = posts.filter((p) => p.cat === 'Announcement').slice(0, 3);

  // Recent posts across all categories (up to 5, excluding announcements already shown)
  const recentPosts = posts.filter((p) => p.cat !== 'Announcement').slice(0, 5);

  const getCatStyle = (cat: string) => {
    switch (cat) {
      case 'Kudos':    return { pill: 'text-purple-600 bg-purple-50', emoji: '🎉' };
      case 'Update':   return { pill: 'text-sky-600 bg-sky-50',       emoji: 'ℹ️' };
      case 'Question': return { pill: 'text-amber-600 bg-amber-50',   emoji: '❓' };
      default:         return { pill: 'text-brand-text-light bg-brand-cream', emoji: '💬' };
    }
  };

  // Extract birthdays occurring in current month or next 30 days
  const getUpcomingBirthdays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const colors = [
      'bg-[#4BAD47]',
      'bg-[#2196F3]',
      'bg-[#FF7043]',
      'bg-[#9C27B0]',
      'bg-[#FF9800]',
      'bg-[#00BCD4]'
    ];

    return users
      .filter((u) => u.bday)
      .map((u) => {
        // Support both "MM-DD" (new) and "YYYY-MM-DD" (legacy) formats
        const bdStr = u.bday.length === 5 ? `2000-${u.bday}` : u.bday;
        const bd = new Date(bdStr + 'T00:00:00');
        const thisYearBirthday = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
        
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const diffTime = Math.abs(thisYearBirthday.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...u,
          bdayDate: thisYearBirthday,
          diffDays,
        };
      })
      .filter((u) => u.diffDays >= 0 && u.diffDays <= 30)
      .sort((a, b) => a.diffDays - b.diffDays)
      .map((u, index) => ({
        ...u,
        colorClass: colors[index % colors.length]
      }));
  };

  const upcomingBirthdays = getUpcomingBirthdays();
  const recentDocs = docs.slice(0, 3);
  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Staff';

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24">
      
      {/* Header Panel */}
      <div className="bg-brand-green px-5 pt-12 pb-7 text-center relative overflow-hidden flex-shrink-0 text-white">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute -bottom-16 right-6 w-32 h-32 bg-white/5 rounded-full" />
        
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
          <p className="text-xs text-brand-text-light mt-0.5">Capture a client or volunteer experience</p>
        </div>
        <ChevronRight className="w-5 h-5 text-brand-text-light ml-auto flex-shrink-0" />
      </div>

      {/* Announcements */}
      <div className="px-5 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5">&#x1F4E2; Announcements</h2>
          <button 
            onClick={() => onSetTab('forum')}
            className="text-xs font-medium text-brand-green-dark hover:underline cursor-pointer focus:outline-none"
          >
            See all
          </button>
        </div>
        
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center text-xs text-brand-text-light italic">
              No recent announcements. Let's make sure everyone's updated!
            </div>
          ) : (
            announcements.map((p) => (
              <div 
                key={p.id}
                onClick={() => onSetTab('forum')}
                className="bg-white rounded-xl border border-brand-border p-3.5 hover:border-brand-green/30 transition-all cursor-pointer text-left"
              >
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full mb-2">
                  <Megaphone className="w-3 h-3" /> Announcement
                </div>
                <h3 className="text-xs font-semibold text-brand-text line-clamp-2 leading-relaxed">
                  {p.text}
                </h3>
                <div className="text-[10px] text-brand-text-light mt-2.5 font-medium">
                  {p.author} &middot; {p.date}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Team Posts */}
      <div className="px-5 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5">💬 Recent Team Posts</h2>
          <button
            onClick={() => onSetTab('forum')}
            className="text-xs font-medium text-brand-green-dark hover:underline cursor-pointer focus:outline-none"
          >
            See all
          </button>
        </div>

        <div className="space-y-3">
          {recentPosts.length === 0 ? (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center text-xs text-brand-text-light italic">
              No team posts yet. Share an update, kudos, or question in Community!
            </div>
          ) : (
            recentPosts.map((p) => {
              const { pill, emoji } = getCatStyle(p.cat);
              return (
                <div
                  key={p.id}
                  onClick={() => onSetTab('forum')}
                  className="bg-white rounded-xl border border-brand-border p-3.5 hover:border-brand-green/30 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${pill}`}>
                      {emoji} {p.cat}
                    </span>
                    <span className="text-[10px] text-brand-text-light font-medium ml-auto">{p.date}</span>
                  </div>
                  {p.text && (
                    <p className="text-xs text-brand-text-mid leading-relaxed line-clamp-2">{p.text}</p>
                  )}
                  <div className="text-[10px] text-brand-text-light mt-2 font-medium">{p.author}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Birthdays scroll */}
      <div className="mt-6">
        <div className="px-5 flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5">&#x1F382; Birthdays &amp; Milestones</h2>
          <span className="text-[10px] font-semibold text-brand-green bg-brand-green-light px-2 py-0.5 rounded-full">30 Days</span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
          {upcomingBirthdays.length === 0 ? (
            <div className="text-xs text-brand-text-light italic w-full text-center py-4 bg-white rounded-xl border border-brand-border">
              No upcoming birthdays this month.
            </div>
          ) : (
            upcomingBirthdays.map((u, i) => {
              const uInitials = u.initials || u.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
              const formattedBday = () => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const bdStr2 = u.bday.length === 5 ? `2000-${u.bday}` : u.bday;
                const d = new Date(bdStr2 + 'T00:00:00');
                return `${months[d.getMonth()]} ${d.getDate()}`;
              };

              return (
                <div 
                  key={u.id}
                  className="flex-shrink-0 w-32 bg-white rounded-xl border border-brand-border p-3.5 text-center shadow-sm"
                >
                  <div className={`w-11 h-11 ${u.colorClass} rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2 shadow`}>
                    {uInitials}
                  </div>
                  <div className="text-xs font-bold text-brand-text truncate">
                    {u.name.split(' ')[0]} {u.name.split(' ').pop()?.[0]}.
                  </div>
                  <div className="text-[10px] text-brand-text-light truncate mt-0.5">
                    {u.dept || 'Staff'}
                  </div>
                  <div className="text-[10px] font-semibold text-brand-green-dark bg-brand-green-light px-2 py-0.5 rounded-full inline-block mt-2">
                    {u.diffDays === 0 ? '🎉 Today!' : formattedBday()}
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
          <h2 className="text-sm font-bold text-brand-text flex items-center gap-1.5">&#x1F4C1; Recent Staff Files</h2>
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
                    <p className="text-[10px] text-brand-text-light mt-0.5">Shared on {d.date} &middot; {d.size}</p>
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
