import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Phone, Search } from 'lucide-react';

interface DirectoryScreenProps {
  currentUser: User;
  users: User[];
}

export default function DirectoryScreen({ currentUser, users }: DirectoryScreenProps) {
  const [query, setQuery] = useState('');

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.dept || '').toLowerCase().includes(q) ||
      (u.title || '').toLowerCase().includes(q)
    );
  });

  // Group by department
  const grouped = filtered.reduce<Record<string, User[]>>((acc, u) => {
    const dept = u.dept || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(u);
    return acc;
  }, {});

  const deptKeys = Object.keys(grouped).sort();
  deptKeys.forEach(k => grouped[k].sort((a, b) => a.name.localeCompare(b.name)));

  const avatarColors = [
    'bg-[#4BAD47]', 'bg-[#2196F3]', 'bg-[#FF7043]',
    'bg-[#9C27B0]', 'bg-[#FF9800]', 'bg-[#00BCD4]',
  ];

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24 text-left">

      {/* Header */}
      <div className="bg-brand-green px-5 pt-12 pb-5 text-white flex-shrink-0">
        <h1 className="font-poppins font-bold text-2xl">Staff Directory</h1>
        <p className="text-xs text-white mt-1">Contact information for all Stewpot staff</p>
      </div>

      {/* Search */}
      <div className="px-5 -mt-4 z-10">
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(75,173,75,0.12)] flex items-center gap-2.5 px-4 py-3">
          <Search className="w-4 h-4 text-brand-text-light flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by name, department, or title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-xs text-brand-text bg-transparent focus:outline-none placeholder:text-brand-text-light"
          />
        </div>
      </div>

      {/* Results */}
      <div className="px-5 mt-5 space-y-6">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-border p-6 text-center text-xs text-brand-text-light italic">
            No staff members match your search.
          </div>
        ) : (
          deptKeys.map((dept) => (
            <div key={dept}>
              <h2 className="text-xs font-bold text-brand-text-light uppercase tracking-wider mb-2 pl-1">
                {dept}
              </h2>
              <div className="bg-white rounded-xl border border-brand-border overflow-hidden divide-y divide-brand-border">
                {grouped[dept].map((u, i) => {
                  const initials = u.initials || u.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                  const colorClass = avatarColors[users.indexOf(u) % avatarColors.length];
                  return (
                    <div key={u.id} className="p-4 flex items-center gap-3">

                      {/* Avatar */}
                      <div className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden">
                        {u.photo ? (
                          <div
                            className="w-full h-full rounded-full"
                            style={{
                              backgroundImage: `url(${u.photo})`,
                              backgroundSize: 'cover',
                              backgroundPosition: `${u.photoPosX || 50}% ${u.photoPosY || 50}%`,
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full ${colorClass} flex items-center justify-center text-white font-bold text-sm`}>
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-brand-text truncate">{u.name}</span>
                          {u.role === 'admin' && (
                            <span className="text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-green-light text-brand-green-dark flex-shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-brand-text-light truncate mt-0.5">
                          {u.title || 'Staff Member'}
                        </div>

                        {/* Contact links */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                          {u.email && (
                            <a
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(u.email)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-brand-green-dark font-semibold hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              {u.email}
                            </a>
                          )}
                          {u.phone && (
                            <a
                              href={`tel:${u.phone.replace(/\D/g, '')}`}
                              className="flex items-center gap-1 text-xs text-brand-green-dark font-semibold hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {u.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
