import React, { useState } from 'react';
import { User, DocumentItem, UserRole } from '../types';
import { ArrowLeft, UserPlus, FileText, Trash2, Edit3, Mail, UploadCloud } from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AdminScreenProps {
  currentUser: User;
  users: User[];
  docs: DocumentItem[];
  onAddUser: (u: User) => Promise<void>;
  onUpdateUser: (u: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddDoc: (d: DocumentItem) => Promise<void>;
  onDeleteDoc: (id: string) => void;
  onClose: () => void;
}

export default function AdminScreen({
  currentUser,
  users,
  docs,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddDoc,
  onDeleteDoc,
  onClose,
}: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'docs'>('users');
  
  // New User Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('member');
  const [newUserBday, setNewUserBday] = useState('');
  const [newUserAnniv, setNewUserAnniv] = useState('');
  const [lastAddedUser, setLastAddedUser] = useState<User | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New Document upload configurations
  const [docDisplayName, setDocDisplayName] = useState('');
  const [docCategory, setDocCategory] = useState<'staff' | 'programs' | 'brand'>('staff');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');

  const jobTitles = [
    'Director', 'Assistant Director', 'Executive Director', 'Chief Operating Officer',
    'Manager', 'Grants & Admin Manager', 'Shelter Supervisor', 'Shelter Relief Staff',
    'Case Manager', 'Housing Stability Case Manager', 'Housing Navigator',
    'Outreach Specialist', 'Program Staff', 'Receptionist', 'Contract Employee',
    'Custodian', 'Volunteer Assistant'
  ];

  const departments = [
    'Community Kitchen', 'Clothing Closet', 'Food Pantry', 'Housing Assistance',
    'Opportunity Center', "Matt's House", 'Billy Brumfield Shelter',
    'Special Events & Communications', 'Teen Services', "Children's Services",
    'Meals on Wheels', 'Volunteer Programs', 'Admin'
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
    const newUser: User = {
      id: String(Date.now()),
      name: newUserName.trim(),
      email: emailLower,
      password: newUserPassword,
      title: newUserTitle,
      dept: newUserDept,
      role: newUserRole,
      initials,
      bday: newUserBday || undefined,
      anniv: newUserAnniv || undefined
    };

    try {
      await onAddUser(newUser);
      setLastAddedUser(newUser);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserTitle('');
      setNewUserDept('');
      setNewUserBday('');
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
    const updated = { ...editingUser, initials: editingUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase() };
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
          👥 Member Directory
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 focus:outline-none cursor-pointer transition-all ${activeTab === 'docs' ? 'text-brand-green-dark border-brand-green' : 'text-brand-text-light border-transparent'}`}
        >
          📁 Docs Directory
        </button>
      </div>

      {/* USERS ADMIN PANEL */}
      {activeTab === 'users' && (
        <div className="p-5 space-y-5">
          
          {/* User list */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-bold text-brand-text-light uppercase tracking-wider pl-1">Colleague Directory ({users.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar bg-white rounded-xl border border-brand-border divide-y divide-brand-border">
              {users.map((u) => (
                <div key={u.id} className="p-3.5 flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2.5 min-width-0">
                    <div className="w-9 h-9 bg-brand-cream text-brand-green-dark border border-brand-border text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {u.initials || u.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="text-left min-width-0">
                      <div className="text-xs font-bold text-brand-text truncate">{u.name}</div>
                      <div className="text-[10px] text-brand-text-light truncate">{u.title || 'Staff'} &middot; {u.dept || ''}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-green-light text-brand-green-dark">
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">Full Name</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">Staff Email</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">Job Title</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">Department</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">Access Role</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">Temporary Password</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">&#x1F382; Birthday Date</label>
                <input
                  type="date"
                  value={newUserBday}
                  onChange={(e) => setNewUserBday(e.target.value)}
                  className="w-full px-3 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5">&#x1F4BC; Work Anniversary</label>
                <input
                  type="date"
                  value={newUserAnniv}
                  onChange={(e) => setNewUserAnniv(e.target.value)}
                  className="w-full px-3 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                />
              </div>
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
                      <label className="block text-[10px] font-bold text-brand-text-light mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-brand-cream border border-brand-border rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-text-light mb-1">Email</label>
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
                      <label className="block text-[10px] font-bold text-brand-text-light mb-1">Title</label>
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
                      <label className="block text-[10px] font-bold text-brand-text-light mb-1">Dept</label>
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
                      <label className="block text-[10px] font-bold text-brand-text-light mb-1">Role</label>
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
                      <label className="block text-[10px] font-bold text-brand-text-light mb-1">Compliance Pass</label>
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
                      <label className="block text-[10px] font-bold text-brand-text-light mb-0.5">Birthday</label>
                      <input 
                        type="date" 
                        value={editingUser.bday || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, bday: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-brand-text-light mb-0.5">Anniversary</label>
                      <input 
                        type="date" 
                        value={editingUser.anniv || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, anniv: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-cream border border-brand-border rounded-lg text-xs text-brand-text-mid"
                      />
                    </div>
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
              <label className="block text-[10px] font-bold text-brand-text-light mb-1 pl-0.5">Document Display Name (Optional)</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5 pl-0.5">Category</label>
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
                <label className="block text-[10px] font-bold text-brand-text-light mb-1.5 pl-0.5">Google Drive URL (Optional)</label>
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
                <span className="text-[10px] text-brand-text-light">Accepts PDF, Word, JPEG, PNG, Excel</span>
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
            <h3 className="text-[10px] font-bold text-brand-text-light uppercase tracking-wider pl-1">All Vault Document Files ({docs.length})</h3>
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
                      <div className="text-[10px] text-brand-text-light mt-0.5 uppercase font-medium tracking-wide">
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

    </div>
  );
}
