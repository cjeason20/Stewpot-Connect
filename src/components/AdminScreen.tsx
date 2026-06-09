import React, { useState } from 'react';
import { User, DocumentItem, Prompt, CalendarEvent, UserRole } from '../types';
import { ArrowLeft, UserPlus, FileText, Trash2, Edit3, Mail, UploadCloud, PlusCircle, Check, X, CalendarPlus } from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AdminScreenProps {
  currentUser: User;
  users: User[];
  docs: DocumentItem[];
  prompts: Prompt[];
  events: CalendarEvent[];
  onAddUser: (u: User) => Promise<void>;
  onUpdateUser: (u: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddDoc: (d: DocumentItem) => Promise<void>;
  onDeleteDoc: (id: string) => void;
  onAddPrompt: (p: Prompt) => Promise<void>;
  onUpdatePrompt: (p: Prompt) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
  onAddEvent: (e: CalendarEvent) => Promise<void>;
  onUpdateEvent: (e: CalendarEvent) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function AdminScreen({
  currentUser,
  users,
  docs,
  prompts,
  events,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddDoc,
  onDeleteDoc,
  onAddPrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onClose,
}: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'docs' | 'prompts' | 'events'>('users');
  
  // New User Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('member');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserBdayMon, setNewUserBdayMon] = useState('');
  const [newUserBdayDay, setNewUserBdayDay] = useState('');
  const [newUserAnniv, setNewUserAnniv] = useState('');
  const [lastAddedUser, setLastAddedUser] = useState<User | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const months = [
    { val: '01', label: 'January' }, { val: '02', label: 'February' },
    { val: '03', label: 'March' },   { val: '04', label: 'April' },
    { val: '05', label: 'May' },     { val: '06', label: 'June' },
    { val: '07', label: 'July' },    { val: '08', label: 'August' },
    { val: '09', label: 'September'},{ val: '10', label: 'October' },
    { val: '11', label: 'November' },{ val: '12', label: 'December' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  // Parse a bday string ("MM-DD" or legacy "YYYY-MM-DD") into month/day parts
  const parseBday = (bday?: string): { mon: string; day: string } => {
    if (!bday) return { mon: '', day: '' };
    const parts = bday.split('-');
    if (parts.length === 3) return { mon: parts[1], day: parts[2] }; // YYYY-MM-DD legacy
    if (parts.length === 2) return { mon: parts[0], day: parts[1] }; // MM-DD new
    return { mon: '', day: '' };
  };

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Prompt management state
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Event management state
  const eventCategories: CalendarEvent['category'][] = ['Meeting','Training','Fundraiser','Community','Holiday','Other'];
  const blankEvent = (): Omit<CalendarEvent,'id'> => ({
    title: '', date: '', category: 'Meeting', time: '', endTime: '', location: '', description: '', allDay: false,
  });
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent,'id'>>(blankEvent());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // New Document upload configurations
  const [docDisplayName, setDocDisplayName] = useState('');
  const [docCategory, setDocCategory] = useState<'staff' | 'programs' | 'brand'>('staff');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');

  const jobTitles = [
    'Director', 'Assistant Director', 'Executive Director', 'Chief Operating Officer',
    'Director of Special Events & Communications', 'Director of Shelter Services', 'Director of Case Management',
    'Manager', 'Grants & Admin Manager', 'Shelter Supervisor', 'Shelter Relief Staff',
    'Case Manager', 'Housing Stability Case Manager', 'Housing Navigator',
    'Outreach Specialist', 'Program Staff', 'Receptionist', 'Contract Employee',
    'Assistant', 'Custodian', 'Volunteer Assistant'
  ];

  const departments = [
    'Community Kitchen', 'Clothing Closet', 'Food Pantry', 'Housing Assistance',
    'Opportunity Center', "Matt's House", 'Billy Brumfield Shelter',
    'Special Events & Communications', 'Teen Services', "Children's Services",
    'Meals on Wheels', 'Volunteer Programs', 'Street Outreach', 'Transitional Shelter',
    'Vehicles & Maintenance', 'Admin'
  ];

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLower = newUserEmail.trim().toLowerCase();
    if (!newUserName.trim() || !emailLower || !newUserPassword) {
      alert('Missing required fields: Name, Email and Password are required.');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      alert('A user with that email already exists.');
      return;
    }

    const initials = newUserName.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    const bdayValue = newUserBdayMon && newUserBdayDay ? `${newUserBdayMon}-${newUserBdayDay}` : '';
    const newUser: User = {
      id: String(Date.now()),
      name: newUserName.trim(),
      email: emailLower,
      password: newUserPassword,
      role: newUserRole,
      initials,
      ...(newUserTitle ? { title: newUserTitle } : {}),
      ...(newUserDept ? { dept: newUserDept } : {}),
      ...(bdayValue ? { bday: bdayValue } : {}),
      ...(newUserAnniv ? { anniv: newUserAnniv } : {}),
      ...(newUserPhone.trim() ? { phone: newUserPhone.trim() } : {}),
    };

    try {
      await onAddUser(newUser);
      setLastAddedUser(newUser);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserTitle('');
      setNewUserDept('');
      setNewUserPhone('');
      setNewUserBdayMon('');
      setNewUserBdayDay('');
      setNewUserAnniv('');
      alert(`Colleague "${newUser.name}" added successfully!`);
    } catch {
      alert('Failed to save colleague. Please check your connection and try again.');
    }
  };

  const sendInvitationEmail = () => {
    if (!lastAddedUser) return;
    const subject = encodeURIComponent('Welcome to Stewpot Connect!');
    const body = encodeURIComponent(
      `Hi ${lastAddedUser.name},\n\nYour Stewpot Connect account has been created.\n\nEmail: ${lastAddedUser.email}\nTemporary Password: ${lastAddedUser.password}\n\nPlease sign in, upload a photo, and update your security password after your first login.\n\n— Stewpot Connect Administrator`
    );
    window.location.href = `mailto:${lastAddedUser.email}?subject=${subject}&body=${body}`;
  };

  const handleEditUserClick = (u: User) => {
    setEditingUser({ ...u });
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim() || !editingUser.email.trim()) {
      alert('Name and email cannot be empty.');
      return;
    }
    const { bday, anniv, title, dept, driveLink: _dl, ...rest } = editingUser as User & { driveLink?: string };
    const updated = {
      ...rest,
      initials: editingUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase(),
      ...(title ? { title } : {}),
      ...(dept ? { dept } : {}),
      ...(bday ? { bday } : {}),
      ...(anniv ? { anniv } : {})
    };
    try {
      await onUpdateUser(updated);
      setEditingUser(null);
      alert('User account modified successfully!');
    } catch {
      alert('Failed to save changes. Please check your connection and try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const displayName = docDisplayName.trim() || file.name;
    setIsUploadingDoc(true);
    try {
      const storageRef = ref(storage, `docs/${String(Date.now())}_${file.name}`);
      await uploadBytes(storageRef, file);
      const storageUrl = await getDownloadURL(storageRef);

      const newDoc: DocumentItem = {
        id: String(Date.now()),
        name: file.name,
        displayName,
        size: `${(file.size / 1024).toFixed(0)}KB`,
        type: file.type,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        storageUrl,
        cat: docCategory,
        ...(driveFolderUrl.trim() ? { driveLink: driveFolderUrl.trim() } : {})
      };
      await onAddDoc(newDoc);
      setDocDisplayName('');
      setDriveFolderUrl('');
      alert(`Document "${displayName}" uploaded successfully to Resources tab!`);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please check your connection and try again.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24 bg-brand-cream text-left">
      
      {/* Header */}
      <div className="bg-brand-green px-5 pt-12 pb-5 text-white flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white hover:text-white/80 focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-poppins font-bold text-2xl">Agency Vault Control</h1>
            <p className="text-xs text-[#E8F5E9]/90">Stewpot portal for users &amp; official forms</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border bg-white flex-shrink-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 focus:outline-none cursor-pointer transition-all ${activeTab === 'users' ? 'text-brand-green-dark border-brand-green' : 'text-brand-text-light border-transparent'}`}
        >
          👥 Members
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 focus:outline-none cursor-pointer transition-all ${activeTab === 'docs' ? 'text-brand-green-dark border-brand-green' : 'text-brand-text-light border-transparent'}`}
        >
          📁 Docs
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 focus:outline-none cursor-pointer transition-all ${activeTab === 'prompts' ? 'text-brand-green-dark border-brand-green' : 'text-brand-text-light border-transparent'}`}
        >
          🎙️ Prompts
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 focus:outline-none cursor-pointer transition-all ${activeTab === 'events' ? 'text-brand-green-dark border-brand-green' : 'text-brand-text-light border-transparent'}`}
        >
          📅 Events
        </button>
      </div>

      {/* USERS ADMIN PANEL */}
      {activeTab === 'users' && (
        <div className="p-5 space-y-5">
          
          {/* User list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider pl-1">Colleague Directory ({users.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar bg-white rounded-xl border border-brand-border divide-y divide-brand-border">
              {users.map((u) => (
                <div key={u.id} className="p-3.5 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2.5 min-width-0">
                    <div className="w-9 h-9 bg-brand-cream text-brand-green-dark border border-brand-border text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {u.initials || u.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="text-left min-width-0">
                      <div className="text-xs font-bold text-brand-text truncate">{u.name}</div>
                      <div className="text-xs text-brand-text-light truncate">{u.title || 'Staff'} &middot; {u.dept || ''}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[13px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-green-light text-brand-green-dark">
                      {u.role}
                    </span>
                    <button
                      onClick={() => handleEditUserClick(u)}
                      className="p-1.5 border border-brand-border hover:bg-brand-cream/80 text-brand-text-mid rounded-lg cursor-pointer"
                      title="Edit User details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== currentUser.id && (
                      <button
                        onClick={async () => {
                          if (confirm(`Remove ${u.name} from the directory? This cannot be undone.`)) {
                            try {
                              await onDeleteUser(u.id);
                            } catch {
                              alert('Failed to delete user. Please try again.');
                            }
                          }
                        }}
                        className="p-1.5 border border-transparent hover:border-red-200 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Remove user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add user form */}
          <form onSubmit={handleAddUserSubmit} className="bg-white rounded-2xl border border-brand-border p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-brand-green font-bold text-xs pb-1 border-b border-brand-border">
              <UserPlus className="w-4 h-4" /> Add Stewpot Colleague
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Staff Email</label>
                <input
                  type="email"
                  placeholder="e.g. name@stewpot.org"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Job Title</label>
                <select
                  value={newUserTitle}
                  onChange={(e) => setNewUserTitle(e.target.value)}
                  className="w-full px-2.5 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                >
                  <option value="">Select title...</option>
                  {jobTitles.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Department</label>
                <select
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  className="w-full px-2.5 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                >
                  <option value="">Select dept...</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Access Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                >
                  <option value="member">Member (Read &amp; Post)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Temporary Password</label>
                <input
                  type="text"
                  placeholder="Reset value (min 6 chars)"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">&#x1F382; Birthday (Month &amp; Day)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={newUserBdayMon}
                    onChange={(e) => setNewUserBdayMon(e.target.value)}
                    className="w-full px-2 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                  >
                    <option value="">Month</option>
                    {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                  </select>
                  <select
                    value={newUserBdayDay}
                    onChange={(e) => setNewUserBdayDay(e.target.value)}
                    className="w-full px-2 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                  >
                    <option value="">Day</option>
                    {days.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">&#x1F4BC; Work Anniversary</label>
                <input
                  type="date"
                  value={newUserAnniv}
                  onChange={(e) => setNewUserAnniv(e.target.value)}
                  className="w-full px-3 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-light mb-1.5">📞 Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="e.g. (555) 867-5309"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-green text-white font-bold rounded-xl text-xs hover:bg-brand-green-dark"
            >
              Add Staff Colleague
            </button>

            {lastAddedUser && (
              <button
                type="button"
                onClick={sendInvitationEmail}
                className="w-full py-2.5 bg-brand-green-light text-brand-green-dark border border-brand-green font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Mail className="w-4 h-4" /> Send Email Invitation Info
              </button>
            )}
          </form>

          {/* EDIT SPECIFIC USER MODAL */}
          {editingUser && (
            <div className="absolute inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm text-brand-text shadow-2xl relative mb-0 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                  <h3 className="text-sm font-bold font-poppins text-brand-text">Manage Member</h3>
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="text-brand-text p-1 text-base cursor-pointer focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditUserSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-1">Email</label>
                      <input 
                        type="email" 
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full px-3.5 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-1">Title</label>
                      <select 
                        value={editingUser.title}
                        onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                        className="w-full px-2 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                      >
                        <option value="">Select title...</option>
                        {jobTitles.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-1">Dept</label>
                      <select 
                        value={editingUser.dept}
                        onChange={(e) => setEditingUser({ ...editingUser, dept: e.target.value })}
                        className="w-full px-2 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                      >
                        <option value="">Select dept...</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-1">Role</label>
                      <select 
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                        className="w-full px-2 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs animate-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-1">Compliance Pass</label>
                      <input 
                        type="text" 
                        value={editingUser.password || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-0.5">Birthday (Month &amp; Day)</label>
                      {(() => {
                        const { mon: eMon, day: eDay } = parseBday(editingUser.bday);
                        return (
                          <div className="grid grid-cols-2 gap-1">
                            <select
                              value={eMon}
                              onChange={(e) => setEditingUser({ ...editingUser, bday: `${e.target.value}-${eDay}` })}
                              className="w-full px-1.5 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                            >
                              <option value="">Mo.</option>
                              {months.map(m => <option key={m.val} value={m.val}>{m.label.slice(0,3)}</option>)}
                            </select>
                            <select
                              value={eDay}
                              onChange={(e) => setEditingUser({ ...editingUser, bday: `${eMon}-${e.target.value}` })}
                              className="w-full px-1.5 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                            >
                              <option value="">Day</option>
                              {days.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
                            </select>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-text-light mb-0.5">Work Anniversary</label>
                      <input
                        type="date"
                        value={editingUser.anniv || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, anniv: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text-light mb-1">📞 Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. (555) 867-5309"
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-green text-white font-bold rounded-xl text-xs mt-2"
                  >
                    Save Member Changes
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DOCUMENTS ADMIN PANEL */}
      {activeTab === 'docs' && (
        <div className="p-5 space-y-4">
          
          <div className="bg-white rounded-2xl border border-brand-border p-4 space-y-3.5 shadow-sm text-xs">
            <h3 className="text-brand-green font-bold pb-1.5 border-b border-brand-border flex items-center gap-1.5">
              <UploadCloud className="w-4.5 h-4.5" /> Upload Official Documents &amp; Forms
            </h3>

            <div>
              <label className="block text-xs font-bold text-brand-text-light mb-1 pl-0.5">Document Display Name (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. Employee Evaluation Checklist"
                value={docDisplayName}
                onChange={(e) => setDocDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5 pl-0.5">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full px-2.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs"
                >
                  <option value="staff">Staff Documents</option>
                  <option value="programs">Programs &amp; Protocols</option>
                  <option value="brand">Brand &amp; Media Kit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5 pl-0.5">Google Drive URL (Optional)</label>
                <input 
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={driveFolderUrl}
                  onChange={(e) => setDriveFolderUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className={`w-full py-4 border-2 border-dashed border-brand-green-mid hover:border-brand-green hover:bg-brand-green-light transition-all rounded-xl bg-brand-green-light/40 flex flex-col items-center justify-center gap-1.5 text-center ${isUploadingDoc ? 'cursor-wait opacity-60 pointer-events-none' : 'cursor-pointer'}`}>
                <FileText className="w-7 h-7 text-brand-green" />
                <span className="text-xs text-brand-text font-bold">{isUploadingDoc ? 'Uploading...' : 'Choose staff document file...'}</span>
                <span className="text-xs text-brand-text-light">Accepts PDF, Word, JPEG, PNG, Excel</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploadingDoc}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider pl-1">All Vault Document Files ({docs.length})</h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
              {docs.length === 0 ? (
                <div className="text-xs text-brand-text-light bg-white border border-brand-border rounded-xl p-6 text-center italic">
                  No documents in system directory.
                </div>
              ) : (
                docs.map((d) => (
                  <div key={d.id} className="bg-white rounded-xl border border-brand-border p-3 flex justify-between items-center text-xs">
                    <div className="text-left flex-1 min-width-0 mr-3">
                      <div className="font-bold text-brand-text truncate leading-tight">{d.displayName}</div>
                      <div className="text-xs text-brand-text-light mt-0.5 uppercase font-medium tracking-wide">
                        {d.cat} &middot; {d.size} &middot; {d.date}
                        {d.driveLink && <span className="text-brand-green-dark"> &middot; Drive Link</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Permanently delete file? This is permanent.')) onDeleteDoc(d.id);
                      }}
                      className="p-2 border border-transparent hover:border-red-200 text-red-500 bg-red-50 rounded-lg cursor-pointer flex-shrink-0"
                      title="Delete document permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* EVENTS ADMIN PANEL */}
      {activeTab === 'events' && (
        <div className="p-5 space-y-5">

          {/* Add / Edit form */}
          <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-brand-green font-bold text-xs pb-1 border-b border-brand-border">
              <CalendarPlus className="w-4 h-4" />
              {editingEvent ? 'Edit Event' : 'Add Calendar Event'}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-brand-text-light mb-1.5">Event Title</label>
              <input
                type="text"
                placeholder="e.g. Staff Meeting"
                value={editingEvent ? editingEvent.title : newEvent.title}
                onChange={(e) => editingEvent
                  ? setEditingEvent({ ...editingEvent, title: e.target.value })
                  : setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white"
              />
            </div>

            {/* Date + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Date</label>
                <input
                  type="date"
                  value={editingEvent ? editingEvent.date : newEvent.date}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({ ...editingEvent, date: e.target.value })
                    : setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-light mb-1.5">Category</label>
                <select
                  value={editingEvent ? editingEvent.category : newEvent.category}
                  onChange={(e) => {
                    const val = e.target.value as CalendarEvent['category'];
                    editingEvent ? setEditingEvent({ ...editingEvent, category: val }) : setNewEvent({ ...newEvent, category: val });
                  }}
                  className="w-full px-2.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  {eventCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* All day toggle + times */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
                <input
                  type="checkbox"
                  checked={editingEvent ? !!editingEvent.allDay : !!newEvent.allDay}
                  onChange={(e) => editingEvent
                    ? setEditingEvent({ ...editingEvent, allDay: e.target.checked })
                    : setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="w-3.5 h-3.5 accent-brand-green"
                />
                <span className="text-xs font-bold text-brand-text-light">All-day event</span>
              </label>
              {!(editingEvent ? editingEvent.allDay : newEvent.allDay) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-brand-text-light mb-1">Start Time</label>
                    <input
                      type="time"
                      value={editingEvent ? (editingEvent.time || '') : (newEvent.time || '')}
                      onChange={(e) => editingEvent
                        ? setEditingEvent({ ...editingEvent, time: e.target.value })
                        : setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-brand-text-light mb-1">End Time</label>
                    <input
                      type="time"
                      value={editingEvent ? (editingEvent.endTime || '') : (newEvent.endTime || '')}
                      onChange={(e) => editingEvent
                        ? setEditingEvent({ ...editingEvent, endTime: e.target.value })
                        : setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-brand-text-light mb-1.5">Location <span className="font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Community Kitchen, Room 2B"
                value={editingEvent ? (editingEvent.location || '') : (newEvent.location || '')}
                onChange={(e) => editingEvent
                  ? setEditingEvent({ ...editingEvent, location: e.target.value })
                  : setNewEvent({ ...newEvent, location: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-brand-text-light mb-1.5">Description <span className="font-normal">(optional)</span></label>
              <textarea
                rows={2}
                placeholder="Brief details about this event…"
                value={editingEvent ? (editingEvent.description || '') : (newEvent.description || '')}
                onChange={(e) => editingEvent
                  ? setEditingEvent({ ...editingEvent, description: e.target.value })
                  : setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white"
              />
            </div>

            {/* Save / Cancel */}
            {editingEvent ? (
              <div className="flex gap-2.5">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="flex-1 py-2.5 bg-brand-cream border border-brand-border rounded-xl text-xs font-semibold text-brand-text-mid flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editingEvent.title.trim() || !editingEvent.date) {
                      alert('Title and date are required.');
                      return;
                    }
                    try {
                      await onUpdateEvent(editingEvent);
                      setEditingEvent(null);
                    } catch {
                      alert('Failed to update event. Please try again.');
                    }
                  }}
                  className="flex-1 py-2.5 bg-brand-green text-white font-bold rounded-xl text-xs hover:bg-brand-green-dark flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (!newEvent.title.trim() || !newEvent.date) {
                    alert('Title and date are required.');
                    return;
                  }
                  const ev: CalendarEvent = {
                    id: String(Date.now()),
                    ...newEvent,
                    createdBy: currentUser.name,
                  };
                  try {
                    await onAddEvent(ev);
                    setNewEvent(blankEvent());
                  } catch {
                    alert('Failed to save event. Please try again.');
                  }
                }}
                className="w-full py-2.5 bg-brand-green text-white font-bold rounded-xl text-xs hover:bg-brand-green-dark"
              >
                Add to Calendar
              </button>
            )}
          </div>

          {/* Event list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider pl-1">
              All Events ({events.length})
            </h3>

            {events.length === 0 ? (
              <div className="bg-white border border-brand-border rounded-xl p-6 text-center text-xs text-brand-text-light italic">
                No events yet. Add your first one above.
              </div>
            ) : (
              <div className="space-y-2">
                {[...events].sort((a, b) => a.date.localeCompare(b.date)).map((ev) => (
                  <div key={ev.id} className="bg-white rounded-xl border border-brand-border p-3.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-brand-text truncate">{ev.title}</div>
                      <div className="text-[11px] text-brand-text-light mt-0.5">
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {!ev.allDay && ev.time ? ` · ${ev.time}` : ev.allDay ? ' · All day' : ''}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setEditingEvent({ ...ev })}
                        className="p-1.5 border border-brand-border hover:bg-brand-cream rounded-lg text-brand-text-light hover:text-brand-text cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this event permanently?')) {
                            try { await onDeleteEvent(ev.id); } catch { alert('Failed to delete.'); }
                          }
                        }}
                        className="p-1.5 border border-transparent hover:border-red-200 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* PROMPTS ADMIN PANEL */}
      {activeTab === 'prompts' && (
        <div className="p-5 space-y-5">

          {/* Add new prompt */}
          <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-brand-green font-bold text-xs pb-1 border-b border-brand-border">
              <PlusCircle className="w-4 h-4" /> Add Interview Prompt
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-light mb-1.5">Prompt Text</label>
              <textarea
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                placeholder='e.g. "How did you first hear about Stewpot, and what difference has it made in your life?"'
                rows={3}
                className="w-full px-3.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-light mb-1.5">Program / Category Tag <span className="font-normal">(optional)</span></label>
              <select
                value={newPromptCategory}
                onChange={(e) => setNewPromptCategory(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="">General (all programs)</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button
              onClick={async () => {
                if (!newPromptText.trim()) {
                  alert('Prompt text is required.');
                  return;
                }
                const p: Prompt = {
                  id: String(Date.now()),
                  text: newPromptText.trim(),
                  createdAt: new Date().toISOString(),
                  ...(newPromptCategory ? { category: newPromptCategory } : {}),
                };
                try {
                  await onAddPrompt(p);
                  setNewPromptText('');
                  setNewPromptCategory('');
                } catch {
                  alert('Failed to save prompt. Please try again.');
                }
              }}
              className="w-full py-2.5 bg-brand-green text-white font-bold rounded-xl text-xs hover:bg-brand-green-dark"
            >
              Save Prompt
            </button>
          </div>

          {/* Prompt list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-brand-text-light uppercase tracking-wider pl-1">
              All Prompts ({prompts.length})
            </h3>

            {prompts.length === 0 ? (
              <div className="bg-white border border-brand-border rounded-xl p-6 text-center text-xs text-brand-text-light italic">
                No prompts yet. Add your first one above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {prompts.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-brand-border p-4 space-y-2">

                    {editingPrompt?.id === p.id ? (
                      /* Inline edit mode */
                      <div className="space-y-2.5">
                        <textarea
                          value={editingPrompt.text}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, text: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white"
                        />
                        <select
                          value={editingPrompt.category || ''}
                          onChange={(e) => setEditingPrompt({ ...editingPrompt, category: e.target.value || undefined })}
                          className="w-full px-2.5 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
                        >
                          <option value="">General (all programs)</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!editingPrompt.text.trim()) {
                                alert('Prompt text cannot be empty.');
                                return;
                              }
                              try {
                                await onUpdatePrompt(editingPrompt);
                                setEditingPrompt(null);
                              } catch {
                                alert('Failed to update prompt. Please try again.');
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-brand-green text-white font-bold rounded-lg text-xs hover:bg-brand-green-dark"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            onClick={() => setEditingPrompt(null)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs font-semibold text-brand-text-mid"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        <p className="text-xs text-brand-text leading-relaxed">"{p.text}"</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.category ? 'bg-brand-green-light text-brand-green-dark' : 'bg-gray-100 text-brand-text-light'}`}>
                            {p.category || 'General'}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setEditingPrompt({ ...p })}
                              className="p-1.5 border border-brand-border hover:bg-brand-cream rounded-lg text-brand-text-light hover:text-brand-text cursor-pointer"
                              title="Edit prompt"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Delete this prompt permanently?')) {
                                  try {
                                    await onDeletePrompt(p.id);
                                  } catch {
                                    alert('Failed to delete prompt. Please try again.');
                                  }
                                }
                              }}
                              className="p-1.5 border border-transparent hover:border-red-200 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete prompt"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
