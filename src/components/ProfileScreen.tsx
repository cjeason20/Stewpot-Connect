import React, { useState } from 'react';
import { User, Story, DocumentItem } from '../types';
import { Camera, Calendar, Sliders, Bell, Lock, LogOut, FileText, Mic, Users, Check, X, ShieldAlert, ChevronRight } from 'lucide-react';

interface ProfileScreenProps {
  currentUser: User;
  users: User[];
  stories: Story[];
  docs: DocumentItem[];
  onSetTab: (tab: string) => void;
  onUpdateProfile: (updated: User) => void;
  onSignOut: () => void;
  onLaunchAdminPanel: (tab: 'users' | 'docs') => void;
}

export default function ProfileScreen({
  currentUser,
  users,
  stories,
  docs,
  onSetTab,
  onUpdateProfile,
  onSignOut,
  onLaunchAdminPanel,
}: ProfileScreenProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [title, setTitle] = useState(currentUser.title || '');
  const [dept, setDept] = useState(currentUser.dept || '');
  
  // Settings Modals
  const [activeModal, setActiveModal] = useState<'none' | 'notif' | 'privacy'>('none');
  const [passwordOld, setPasswordOld] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConf, setPasswordConf] = useState('');

  // Notification states
  const [notifPosts, setNotifPosts] = useState(currentUser.notifPosts ?? true);
  const [notifAnnounce, setNotifAnnounce] = useState(currentUser.notifAnnounce ?? true);
  const [notifBdays, setNotifBdays] = useState(currentUser.notifBdays ?? true);
  const [notifStories, setNotifStories] = useState(currentUser.notifStories ?? false);

  const isAdmin = currentUser.role === 'admin';
  const myStoriesCount = stories.filter((s) => s.authorId === currentUser.id || s.author === currentUser.name).length;

  const jobTitles = [
    'Director', 'Assistant Director', 'Executive Director', 'Chief Operating Officer',
    'Manager', 'Grants & Admin Manager', 'Shelter Supervisor', 'Shelter Relief Staff',
    'Case Manager', 'Housing Stability Case Manager', 'Housing Navigator',
    'Outreach Specialist', 'Program Staff', 'Receptionist', 'Contract Employee',
    'Custodian', 'Volunteer'
  ];

  const departments = [
    'Community Kitchen', 'Clothing Closet', 'Food Pantry', 'Housing Assistance',
    'Opportunity Center', "Matt's House", 'Billy Brumfield Shelter',
    'Special Events & Communications', 'Teen Services', "Children's Services",
    'Meals on Wheels', 'Volunteer Programs', 'Admin'
  ];

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Name and email cannot be empty.');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      title,
      dept,
      initials: name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase(),
    };

    onUpdateProfile(updatedUser);
    alert('Your profile changes have been registered successfully!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      if (loadEvent.target?.result) {
        const updatedUser: User = {
          ...currentUser,
          photo: loadEvent.target.result as string,
          photoPosX: '50',
          photoPosY: '50'
        };
        onUpdateProfile(updatedUser);
        alert('Photo uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordOld !== currentUser.password) {
      alert('Verification failed: old password is incorrect.');
      return;
    }
    if (!passwordNew || passwordNew.length < 6) {
      alert('New password must be at least 6 characters long for agency compliance.');
      return;
    }
    if (passwordNew !== passwordConf) {
      alert('New password and confirmation do not match.');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      password: passwordNew,
    };
    onUpdateProfile(updatedUser);
    setPasswordOld('');
    setPasswordNew('');
    setPasswordConf('');
    setActiveModal('none');
    alert('Security successfully updated: password has been modified.');
  };

  const handleNotifSave = () => {
    const updatedUser: User = {
      ...currentUser,
      notifPosts,
      notifAnnounce,
      notifBdays,
      notifStories,
    };
    onUpdateProfile(updatedUser);
    setActiveModal('none');
    alert('Notification preferences updated!');
  };

  const initials = currentUser.initials || currentUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24 text-left">
      
      {/* Profile Header Block */}
      <div className="bg-brand-green px-5 pt-12 pb-7 text-center relative overflow-hidden flex-shrink-0 text-white flex flex-col items-center">
        
        {/* Profile Avatar Frame */}
        <div 
          onClick={() => document.getElementById('profilePhotoInput')?.click()}
          className="w-20 h-20 bg-white/20 border-2 border-white rounded-full flex items-center justify-center font-poppins font-bold text-2xl relative mb-3 hover:scale-105 active:scale-95 transition-all shadow cursor-pointer overflow-hidden group"
          style={currentUser.photo ? {
            backgroundImage: `url(${currentUser.photo})`,
            backgroundSize: 'cover',
            backgroundPosition: `${currentUser.photoPosX || 50}% ${currentUser.photoPosY || 50}%`
          } : undefined}
        >
          {!currentUser.photo && initials}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-full">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <input 
            type="file" 
            id="profilePhotoInput" 
            className="hidden" 
            accept="image/*" 
            onChange={handlePhotoUpload}
          />
        </div>

        <div className="font-poppins font-bold text-xl leading-tight text-white mb-0.5">
          {currentUser.name}
        </div>
        <div className="text-xs text-[#E8F5E9]/90">
          {currentUser.title || 'Staff'} &middot; {currentUser.dept || 'Department'}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wider bg-brand-green-light text-brand-green-dark px-3 py-0.5 rounded-full mt-2">
          {currentUser.role}
        </div>
      </div>

      {/* Edit Form */}
      <div className="px-5 mt-5">
        <form onSubmit={handleProfileSave} className="bg-white rounded-2xl border border-brand-border p-5 space-y-3.5 shadow-sm">
          <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider mb-1">📝 Contact Info</h3>
          
          <div>
            <label className="block text-[10px] font-bold text-brand-text-light mb-1 pl-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-sm text-brand-text"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-text-light mb-1 pl-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-sm text-brand-text"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-brand-[#7A8E7A] mb-1 pl-1">Job Title</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text disabled:opacity-60 focus:outline-none"
              >
                <option value="">Select title...</option>
                {jobTitles.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-brand-[#7A8E7A] mb-1 pl-1">Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text disabled:opacity-60 focus:outline-none"
              >
                <option value="">Select dept...</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-brand-green text-white font-bold rounded-xl text-xs hover:bg-brand-green-dark shadow-sm active:scale-[0.99] transition-all"
          >
            Update Profile
          </button>
        </form>
      </div>

      {/* Stats Block */}
      <div className="px-5 mt-6">
        <div className="text-[11px] font-bold text-brand-text-light uppercase tracking-wider mb-2.5 pl-1">
          📊 My Agency Activity Overview
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-4 grid grid-cols-3 gap-4 text-center divide-x divide-brand-border">
          <div>
            <div className="flex justify-center mb-1 text-brand-green"><Mic className="w-4 h-4" /></div>
            <div className="text-sm font-bold text-brand-text">{myStoriesCount}</div>
            <div className="text-[9px] font-semibold text-brand-text-light uppercase mt-0.5">Vocal Stories</div>
          </div>
          <div>
            <div className="flex justify-center mb-1 text-brand-green"><Users className="w-4 h-4" /></div>
            <div className="text-sm font-bold text-brand-text">{users.length}</div>
            <div className="text-[9px] font-semibold text-brand-text-light uppercase mt-0.5">Staff Users</div>
          </div>
          <div>
            <div className="flex justify-center mb-1 text-brand-green"><FileText className="w-4 h-4" /></div>
            <div className="text-sm font-bold text-brand-text">{docs.length}</div>
            <div className="text-[9px] font-semibold text-brand-text-light uppercase mt-0.5">Admin Files</div>
          </div>
        </div>
      </div>

      {/* Admin Quick Shortcuts */}
      {isAdmin && (
        <div className="px-5 mt-6">
          <div className="text-[11px] font-bold text-brand-text-light uppercase tracking-wider mb-2.5 pl-1">
            🛡️ Administrative Privileges
          </div>
          <div className="bg-white rounded-xl border border-brand-border overflow-hidden divide-y divide-brand-border">
            <div 
              onClick={() => onLaunchAdminPanel('users')}
              className="p-3.5 flex justify-between items-center text-xs font-bold text-brand-text hover:bg-brand-green-light/45 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5 text-brand-green" /> 👥 Accounts &amp; Access Controls
              </div>
              <ChevronRight className="w-4 h-4 text-brand-text-light" />
            </div>
            
            <div 
              onClick={() => onLaunchAdminPanel('docs')}
              className="p-3.5 flex justify-between items-center text-xs font-bold text-brand-text hover:bg-brand-green-light/45 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5 text-brand-green" /> 📤 Upload Handbook &amp; Files
              </div>
              <ChevronRight className="w-4 h-4 text-brand-text-light" />
            </div>
          </div>
        </div>
      )}

      {/* Settings Block */}
      <div className="px-5 mt-6 space-y-2.5">
        <div className="text-[11px] font-bold text-brand-text-light uppercase tracking-wider pl-1">
          ⚙️ Personal Settings
        </div>
        
        <div className="bg-white rounded-xl border border-brand-border overflow-hidden divide-y divide-brand-border">
          <div 
            onClick={() => setActiveModal('notif')}
            className="p-3.5 flex justify-between items-center text-xs font-semibold text-brand-text hover:bg-brand-green-light/45 cursor-pointer"
          >
            <div className="flex items-center gap-2.5"><Bell className="w-4 h-4 text-brand-text-mid" /> Alert Preferences</div>
            <ChevronRight className="w-4 h-4 text-brand-text-light" />
          </div>

          <div 
            onClick={() => setActiveModal('privacy')}
            className="p-3.5 flex justify-between items-center text-xs font-semibold text-brand-text hover:bg-brand-green-light/45 cursor-pointer"
          >
            <div className="flex items-center gap-2.5"><Lock className="w-4 h-4 text-brand-text-mid" /> Update Security Credentials</div>
            <ChevronRight className="w-4 h-4 text-brand-text-light" />
          </div>

          <div 
            onClick={onSignOut}
            className="p-3.5 flex justify-between items-center text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <div className="flex items-center gap-2.5"><LogOut className="w-4 h-4 text-red-500" /> Sign Out Agency Vault</div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </div>
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES MODAL */}
      {activeModal === 'notif' && (
        <div className="absolute inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm text-brand-text shadow-2xl relative mb-0">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border mb-4">
              <h3 className="text-sm font-bold font-poppins text-brand-text">Notification Alerts</h3>
              <X className="w-5 h-5 text-brand-text-light cursor-pointer" onClick={() => setActiveModal('none')} />
            </div>

            <div className="space-y-4">
              <label className="flex justify-between items-center cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-brand-text">Team Kudos &amp; Discussion</span>
                  <span className="block text-[10px] text-brand-text-light">Notify when members post updates</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifPosts}
                  onChange={(e) => setNotifPosts(e.target.checked)}
                  className="w-5 h-5 accent-brand-green" 
                />
              </label>

              <label className="flex justify-between items-center cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-brand-text">Important Announcements</span>
                  <span className="block text-[10px] text-brand-text-light">Direct shelter and program operational warnings</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifAnnounce}
                  onChange={(e) => setNotifAnnounce(e.target.checked)}
                  className="w-5 h-5 accent-brand-green" 
                />
              </label>

              <label className="flex justify-between items-center cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-brand-text">Staff Birthdays &amp; Milestones</span>
                  <span className="block text-[10px] text-brand-text-light">Keep updated with team anniversaries</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifBdays}
                  onChange={(e) => setNotifBdays(e.target.checked)}
                  className="w-5 h-5 accent-brand-green" 
                />
              </label>

              <label className="flex justify-between items-center cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-brand-text">Secure Audio Transcription Alerts</span>
                  <span className="block text-[10px] text-brand-text-light">Transcribing vocal story completion alerts</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={notifStories}
                  onChange={(e) => setNotifStories(e.target.checked)}
                  className="w-5 h-5 accent-brand-green" 
                />
              </label>

              <button
                onClick={handleNotifSave}
                className="w-full py-3 bg-brand-green text-white font-bold rounded-xl text-xs mt-2"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY & PASSWORD MODAL */}
      {activeModal === 'privacy' && (
        <div className="absolute inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm text-brand-text shadow-2xl relative mb-0">
            <div className="flex justify-between items-center pb-3 border-b border-brand-border mb-4">
              <h3 className="text-sm font-bold font-poppins text-brand-text">Change Password</h3>
              <X className="w-5 h-5 text-brand-text-light cursor-pointer" onClick={() => setActiveModal('none')} />
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text-light mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={passwordOld}
                  onChange={(e) => setPasswordOld(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-xl text-xs text-brand-text" 
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-light mb-1">New Password (Min 6 chars)</label>
                <input 
                  type="password" 
                  value={passwordNew}
                  onChange={(e) => setPasswordNew(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-xl text-xs text-brand-text" 
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-light mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordConf}
                  onChange={(e) => setPasswordConf(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-xl text-xs text-brand-text" 
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-green text-white font-bold rounded-xl text-xs"
              >
                Update Password Check
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
