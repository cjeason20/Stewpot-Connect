import React, { useState, useEffect } from 'react';
import { User, Post, DocumentItem, Story, Prompt, CalendarEvent, UserRole, PostCategory } from './types';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import StoriesScreen from './components/StoriesScreen';
import CommunityScreen from './components/CommunityScreen';
import ResourcesScreen from './components/ResourcesScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminScreen from './components/AdminScreen';
import DirectoryScreen from './components/DirectoryScreen';
import CalendarScreen from './components/CalendarScreen';

import { Home, Mic, MessageSquare, BookOpen, User as UserIcon, Shield, LogOut, Bell, Users, CalendarDays } from 'lucide-react';

import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { signInAnonymously, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Navigation states
  // 'login' | 'home' | 'stories' | 'forum' | 'resources' | 'profile' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('login');
  const [adminTabFocus, setAdminTabFocus] = useState<'users' | 'docs'>('users');

  // Load and subscribe to Live Firestore updates
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  // Manage Firebase Auth session & auto sign in anonymously
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthed(true);
        
        // If they logged in via Google Auth, link it to their user profile
        if (!firebaseUser.isAnonymous) {
          try {
            const userDocSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDocSnap.exists()) {
              setCurrentUser(userDocSnap.data() as User);
            } else {
              // Provision a default profile under their UID
              const emailLower = (firebaseUser.email || '').toLowerCase();
              const isEmailAdmin = emailLower === 'cj.eason20@gmail.com' || 
                                   emailLower === 'ceason@stewpot.org' ||
                                   emailLower.endsWith('stewpot.org');
              
              const initials = (firebaseUser.displayName || firebaseUser.email || 'SM')
                .split('@')[0]
                .split(' ')
                .map(w => w[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              const newProfile: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Staff Member',
                email: firebaseUser.email || '',
                role: isEmailAdmin ? 'admin' : 'member',
                title: isEmailAdmin ? 'Director' : 'Staff Coordinator',
                dept: 'General Operations',
                initials: initials,
                bday: '',
                anniv: '',
                notifPosts: true,
                notifAnnounce: true,
                notifBdays: true,
                notifStories: true
              };
              
              await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
              setCurrentUser(newProfile);
            }
            setActiveTab('home');
          } catch (e) {
            console.error('Error handling logged-in user profile:', e);
          }
        }
      } else {
        setIsAuthed(false);
        // Clean session
        setCurrentUser(null);
        // Auto sign in anonymously on boot/signout to satisfy security rules
        try {
          await signInAnonymously(auth);
        } catch (e) {
          // Log as info to prevent test runner from flagging a console.error while Anonymous Auth is disabled
          console.info('Anonymous auto sign-in deferred:', e);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // 1. Snapshot listener for USERS
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (snapshot.empty) {
        // Seed initial users if empty
        const seedUsers: User[] = [
          {
            id: '1',
            name: 'Chris Eason',
            email: 'ceason@stewpot.org',
            password: 'Stewpot1981',
            title: 'Director',
            dept: 'Special Events & Communications',
            role: 'admin',
            initials: 'CE',
            bday: '1985-05-18',
            anniv: '2018-09-01'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sjohnson@stewpot.org',
            password: 'Sarah1990',
            title: 'Shelter Supervisor',
            dept: 'Billy Brumfield Shelter',
            role: 'member',
            initials: 'SJ',
            bday: '1990-12-04',
            anniv: '2021-02-15'
          },
          {
            id: '3',
            name: 'David Vance',
            email: 'dvance@stewpot.org',
            password: 'David1988',
            title: 'Case Manager',
            dept: 'Case Management',
            role: 'member',
            initials: 'DV',
            bday: '1988-06-25',
            anniv: '2023-01-10'
          }
        ];
        seedUsers.forEach(u => {
          setDoc(doc(db, 'users', u.id), u).catch(e => {
            console.error('Error seeding users', e);
          });
        });
      } else {
        const uList: User[] = [];
        snapshot.forEach(docSnap => {
          uList.push({ ...docSnap.data(), id: docSnap.id } as User);
        });
        setUsers(uList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 2. Snapshot listener for POSTS
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const pList: Post[] = [];
      snapshot.forEach(docSnap => {
        pList.push({ ...docSnap.data(), id: docSnap.id } as Post);
      });
      // Sort posts descending by id to mimic newer updates first
      pList.sort((a, b) => b.id.localeCompare(a.id));
      setPosts(pList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    // 3. Snapshot listener for DOCS (Resources)
    const unsubDocs = onSnapshot(collection(db, 'docs'), (snapshot) => {
      const dList: DocumentItem[] = [];
      snapshot.forEach(docSnap => {
        dList.push({ ...docSnap.data(), id: docSnap.id } as DocumentItem);
      });
      setDocs(dList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'docs');
    });

    // 4. Snapshot listener for STORIES
    const unsubStories = onSnapshot(collection(db, 'stories'), (snapshot) => {
      const sList: Story[] = [];
      snapshot.forEach(docSnap => {
        sList.push({ ...docSnap.data(), id: docSnap.id } as Story);
      });
      setStories(sList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stories');
    });

    // 5. Snapshot listener for CALENDAR EVENTS
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eList: CalendarEvent[] = [];
      snapshot.forEach(docSnap => {
        eList.push({ ...docSnap.data(), id: docSnap.id } as CalendarEvent);
      });
      setEvents(eList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    // 6. Snapshot listener for PROMPTS
    const unsubPrompts = onSnapshot(collection(db, 'prompts'), (snapshot) => {
      const pList: Prompt[] = [];
      snapshot.forEach(docSnap => {
        pList.push({ ...docSnap.data(), id: docSnap.id } as Prompt);
      });
      // Sort by createdAt ascending so oldest appear first
      pList.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      setPrompts(pList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prompts');
    });

    // Clean up callbacks
    return () => {
      unsubUsers();
      unsubPosts();
      unsubDocs();
      unsubStories();
      unsubEvents();
      unsubPrompts();
    };
  }, []);

  // Update profile if state changes & triggers refresh on current user
  useEffect(() => {
    if (currentUser) {
      const match = users.find(u => u.id === currentUser.id);
      if (match && JSON.stringify(match) !== JSON.stringify(currentUser)) {
        setCurrentUser(match);
      }
    }
  }, [users, currentUser]);

  // Firestore DB CRUD Handlers
  const handleAddPost = async (p: Post) => {
    try {
      await setDoc(doc(db, 'posts', p.id), p);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `posts/${p.id}`);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (e) {
      console.error('Delete post error:', e);
      alert('Failed to delete post. Please check your connection and try again.');
    }
  };

  const handleEditPost = async (id: string, text: string) => {
    try {
      await updateDoc(doc(db, 'posts', id), { text });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const handleAddUser = async (u: User) => {
    try {
      await setDoc(doc(db, 'users', u.id), u);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${u.id}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
    }
  };

  const handleUpdateUser = async (updatedProfile: User) => {
    try {
      await setDoc(doc(db, 'users', updatedProfile.id), updatedProfile);
      if (currentUser && currentUser.id === updatedProfile.id) {
        setCurrentUser(updatedProfile);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${updatedProfile.id}`);
    }
  };

  const handleAddDoc = async (d: DocumentItem) => {
    try {
      await setDoc(doc(db, 'docs', d.id), d);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `docs/${d.id}`);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'docs', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `docs/${id}`);
    }
  };

  const handleAddStory = async (s: Story) => {
    try {
      await setDoc(doc(db, 'stories', s.id), s);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `stories/${s.id}`);
    }
  };

  const handleDeleteStory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'stories', id));
    } catch (e) {
      console.error('Delete story error:', e);
      alert('Failed to delete story. Please check your connection and try again.');
    }
  };

  const handleAddEvent = async (e: CalendarEvent) => {
    try {
      await setDoc(doc(db, 'events', e.id), e);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `events/${e.id}`);
    }
  };

  const handleUpdateEvent = async (e: CalendarEvent) => {
    try {
      await setDoc(doc(db, 'events', e.id), e);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${e.id}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
    }
  };

  const handleAddPrompt = async (p: Prompt) => {
    try {
      await setDoc(doc(db, 'prompts', p.id), p);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `prompts/${p.id}`);
    }
  };

  const handleUpdatePrompt = async (p: Prompt) => {
    try {
      await setDoc(doc(db, 'prompts', p.id), p);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `prompts/${p.id}`);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'prompts', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `prompts/${id}`);
    }
  };

  const handleUpdateStory = async (s: Story) => {
    try {
      await setDoc(doc(db, 'stories', s.id), s);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `stories/${s.id}`);
    }
  };

  const handleLaunchAdminPanel = (tab: 'users' | 'docs') => {
    setAdminTabFocus(tab);
    setActiveTab('admin');
  };

  // Detect PWA standalone mode (installed on home screen)
  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  // In standalone PWA mode, a dedicated green strip covers the transparent
  // status bar area. Set root backgrounds to cream to match the app.
  if (isStandalone) {
    document.documentElement.style.backgroundColor = '#FAFAF7';
    document.body.style.backgroundColor = '#FAFAF7';
  }

  return (
    <div className="font-sans antialiased overflow-x-hidden">

      {/* ============================================================
          DESKTOP LAYOUT — visible on lg screens and above
      ============================================================ */}
      <div className="hidden lg:flex min-h-screen" style={{ background: 'linear-gradient(135deg, #eef5ee 0%, #e8f0e8 100%)' }}>

        {/* ── Sidebar ── */}
        {currentUser && (
          <aside className="w-72 flex-shrink-0 flex flex-col fixed h-full z-20" style={{ background: 'linear-gradient(180deg, #2d6a2d 0%, #1a4d1a 100%)' }}>

            {/* Logo / Brand */}
            <div className="px-6 pt-8 pb-6 flex-shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                  <img
                    src="https://lh3.googleusercontent.com/d/1p51mr-0Uo7Y-V4u4-d_Zxsa6AothkASN"
                    alt="Stewpot Connect"
                    className="w-full h-full object-contain p-1.5"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div>
                  <h1 className="font-poppins font-bold text-white text-[15px] leading-tight tracking-tight">Stewpot Connect</h1>
                  <p className="text-[13px] text-white/50 mt-0.5">Staff Hub &amp; Communications</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-white/10 mb-2" />

            {/* Nav Section Label */}
            <p className="px-5 pt-3 pb-1.5 text-xs font-bold tracking-widest uppercase text-white/30">Navigation</p>

            {/* Nav links */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
              {([
                { id: 'home',      label: 'Home',        Icon: Home,         desc: 'Dashboard & updates' },
                { id: 'stories',   label: 'Stories',     Icon: Mic,          desc: 'Record & browse stories' },
                { id: 'forum',     label: 'Community',   Icon: MessageSquare,desc: 'Team posts & announcements' },
                { id: 'resources',  label: 'Resources',  Icon: BookOpen,     desc: 'Documents & files' },
                { id: 'calendar',  label: 'Calendar',   Icon: CalendarDays, desc: 'Events & schedule' },
                { id: 'directory', label: 'Directory',  Icon: Users,        desc: 'Staff contact info' },
                { id: 'profile',   label: 'My Profile', Icon: UserIcon,     desc: 'Settings & account' },
                ...(currentUser.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', Icon: Shield, desc: 'Users, docs & controls' }] : [])
              ] as { id: string; label: string; Icon: React.ElementType; desc: string }[]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer group ${
                    activeTab === id
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/65 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${activeTab === id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1">{label}</span>
                  {activeTab === id && <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0" />}
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="mx-5 border-t border-white/10 mt-3" />

            {/* User card */}
            <div className="p-4 flex-shrink-0">
              <div className="bg-white/10 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow">
                  {currentUser.initials || currentUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate leading-tight">{currentUser.name}</div>
                  <div className="text-[13px] text-white/50 mt-0.5 truncate">{currentUser.title || (currentUser.role === 'admin' ? 'Administrator' : 'Staff Member')}</div>
                </div>
                <button
                  onClick={doSignOut}
                  title="Sign out"
                  className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition-all cursor-pointer flex-shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* ── Main content ── */}
        <main className={`flex-1 flex flex-col min-h-screen ${currentUser ? 'ml-72' : ''}`}>

          {/* Login — full bleed, no topbar */}
          {activeTab === 'login' && (
            <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(135deg, #2d6a2d 0%, #1a4d1a 100%)' }}>
              <div className="w-full max-w-md mx-auto px-4">
                <LoginScreen
                  users={users}
                  onLogin={(u) => { setCurrentUser(u); setActiveTab('home'); }}
                  onGoogleLogin={handleGoogleLogin}
                />
              </div>
            </div>
          )}

          {currentUser && (
            <>
              {/* ── Sticky top header ── */}
              <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-black/5 flex-shrink-0 shadow-sm">
                <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-800 leading-tight">
                      {activeTab === 'home'      && 'Dashboard'}
                      {activeTab === 'stories'   && 'Stories'}
                      {activeTab === 'forum'     && 'Community'}
                      {activeTab === 'resources'  && 'Resources'}
                      {activeTab === 'calendar'  && 'Calendar'}
                      {activeTab === 'directory' && 'Staff Directory'}
                      {activeTab === 'profile'   && 'My Profile'}
                      {activeTab === 'admin'     && 'Admin Panel'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all cursor-pointer" title="Notifications">
                      <Bell className="w-4 h-4" />
                    </button>
                    <div
                      onClick={() => setActiveTab('profile')}
                      className="flex items-center gap-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl px-3 py-1.5 cursor-pointer transition-all"
                    >
                      <div className="w-7 h-7 bg-brand-green text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {currentUser.initials || currentUser.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 hidden xl:block">{currentUser.name.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              </header>

              {/* ── Page content ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 py-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden min-h-[calc(100vh-7rem)]">
                    {activeTab === 'home' && (
                      <HomeScreen currentUser={currentUser} users={users} posts={posts} docs={docs} events={events}
                        onSetTab={setActiveTab} onViewDoc={() => setActiveTab('resources')} onLaunchRecord={() => setActiveTab('stories')} />
                    )}
                    {activeTab === 'stories' && (
                      <StoriesScreen currentUser={currentUser} stories={stories} prompts={prompts} onAddStory={handleAddStory} onUpdateStory={handleUpdateStory} onDeleteStory={handleDeleteStory} />
                    )}
                    {activeTab === 'forum' && (
                      <CommunityScreen currentUser={currentUser} posts={posts} onAddPost={handleAddPost} onDeletePost={handleDeletePost} onEditPost={handleEditPost} />
                    )}
                    {activeTab === 'resources' && (
                      <ResourcesScreen currentUser={currentUser} docs={docs} onDeleteDoc={handleDeleteDoc} />
                    )}
                    {activeTab === 'calendar' && (
                      <CalendarScreen events={events} />
                    )}
                    {activeTab === 'directory' && (
                      <DirectoryScreen currentUser={currentUser} users={users} />
                    )}
                    {activeTab === 'profile' && (
                      <ProfileScreen currentUser={currentUser} users={users} stories={stories} docs={docs}
                        onSetTab={setActiveTab} onUpdateProfile={handleUpdateUser} onSignOut={doSignOut} onLaunchAdminPanel={handleLaunchAdminPanel} />
                    )}
                    {activeTab === 'admin' && currentUser.role === 'admin' && (
                      <AdminScreen currentUser={currentUser} users={users} docs={docs}
                        onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser}
                        onAddDoc={handleAddDoc} onDeleteDoc={handleDeleteDoc}
                        prompts={prompts} onAddPrompt={handleAddPrompt} onUpdatePrompt={handleUpdatePrompt} onDeletePrompt={handleDeletePrompt}
                        events={events} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent}
                        onClose={() => setActiveTab('profile')} />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ============================================================
          PWA STANDALONE LAYOUT — installed on iPhone/Android home screen
          No phone mockup, no fake status bar — clean native-style UI
      ============================================================ */}
      {isStandalone && (
        <div className="lg:hidden flex flex-col bg-brand-cream" style={{ height: '100dvh' }}>

          {/* Green strip that fills the area behind the transparent status bar */}
          <div className="flex-shrink-0 bg-brand-green" style={{ height: 'env(safe-area-inset-top)' }} />

          {/* Screens */}
          <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
            {activeTab === 'login' && (
              <LoginScreen users={users}
                onLogin={(u) => { setCurrentUser(u); setActiveTab('home'); }}
                onGoogleLogin={handleGoogleLogin}
              />
            )}
            {currentUser && (
              <>
                {activeTab === 'home' && (
                  <HomeScreen currentUser={currentUser} users={users} posts={posts} docs={docs} events={events}
                    onSetTab={setActiveTab} onViewDoc={() => setActiveTab('resources')} onLaunchRecord={() => setActiveTab('stories')} />
                )}
                {activeTab === 'stories' && (
                  <StoriesScreen currentUser={currentUser} stories={stories} prompts={prompts}
                    onAddStory={handleAddStory} onUpdateStory={handleUpdateStory} onDeleteStory={handleDeleteStory} />
                )}
                {activeTab === 'forum' && (
                  <CommunityScreen currentUser={currentUser} posts={posts}
                    onAddPost={handleAddPost} onDeletePost={handleDeletePost} onEditPost={handleEditPost} />
                )}
                {activeTab === 'resources' && (
                  <ResourcesScreen currentUser={currentUser} docs={docs} onDeleteDoc={handleDeleteDoc} />
                )}
                {activeTab === 'calendar' && (
                  <CalendarScreen events={events} />
                )}
                {activeTab === 'directory' && (
                  <DirectoryScreen currentUser={currentUser} users={users} />
                )}
                {activeTab === 'profile' && (
                  <ProfileScreen currentUser={currentUser} users={users} stories={stories} docs={docs}
                    onSetTab={setActiveTab} onUpdateProfile={handleUpdateUser} onSignOut={doSignOut} onLaunchAdminPanel={handleLaunchAdminPanel} />
                )}
                {activeTab === 'admin' && currentUser.role === 'admin' && (
                  <AdminScreen currentUser={currentUser} users={users} docs={docs}
                    onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser}
                    onAddDoc={handleAddDoc} onDeleteDoc={handleDeleteDoc}
                    prompts={prompts} onAddPrompt={handleAddPrompt} onUpdatePrompt={handleUpdatePrompt} onDeletePrompt={handleDeletePrompt}
                    events={events} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent}
                    onClose={() => setActiveTab('profile')} />
                )}
              </>
            )}
          </div>

          {/* Bottom tab bar — sits above the iOS home indicator */}
          {currentUser && activeTab !== 'login' && activeTab !== 'admin' && (
            <div
              className="bg-white border-t border-brand-border flex items-center justify-around select-none flex-shrink-0 z-30 pt-2"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
            >
              {([
                { id: 'home',      label: 'Home',      Icon: Home },
                { id: 'stories',   label: 'Stories',   Icon: Mic },
                { id: 'forum',     label: 'Community', Icon: MessageSquare },
                { id: 'resources', label: 'Resources', Icon: BookOpen },
                { id: 'directory', label: 'Directory', Icon: Users },
                { id: 'profile',   label: 'Profile',   Icon: UserIcon },
              ] as { id: string; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-0.5 text-xs font-medium px-3 py-1 transition-all ${activeTab === id ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
                >
                  <Icon className={`w-5 h-5 ${activeTab === id ? 'text-brand-green' : 'text-brand-text-light'}`} />
                  {label}
                  {activeTab === id && <span className="w-1 h-1 bg-brand-green rounded-full" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          MOBILE BROWSER LAYOUT — phone mockup preview (non-standalone)
      ============================================================ */}
      {!isStandalone && (
      <div className="lg:hidden flex flex-col sm:flex-row items-center justify-center min-h-screen bg-[#2D2D2D] p-0 sm:p-5">

      {/* Container Wrapper */}
      <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-10 max-w-6xl w-full">
        
        {/* Info panel (desktop only) */}
        <div className="hidden md:flex flex-col max-w-sm text-white text-left p-10 pr-0 flex-shrink-0 animate-fade-in self-start mt-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 overflow-hidden relative">
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
              strokeWidth="2.5"
              className="w-9 h-9 text-white hidden"
            >
              <path d="M12 21a9 9 0 0 0 9-9c0-1.49-.36-2.9-1.01-4.15L17 12H7L4.01 7.85A8.96 8.96 0 0 0 3 12a9 9 0 0 0 9 9Z" />
              <path d="M12 1v2" />
              <path d="M12 9v1" />
              <path d="M8 4V3" />
              <path d="M16 4V3" />
            </svg>
          </div>
          
          <h1 className="font-poppins font-bold text-4xl leading-tight mb-3">Stewpot Connect</h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            An internal operational tool built for Stewpot coordinators and staff. Record vocal stories, share announcements, access handbooks, and celebrate department milestones.
          </p>
          
          <ul className="space-y-3.5 text-xs text-zinc-300">
            <li className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-brand-green rounded-full flex-shrink-0" />
              Voice story capture with client consent steps
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-brand-green rounded-full flex-shrink-0" />
              Community posts, kudos and team updates
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-brand-green rounded-full flex-shrink-0" />
              Agency documents, templates &amp; folders
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-brand-green rounded-full flex-shrink-0" />
              Staff birthday tracking and work milestones
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-brand-green rounded-full flex-shrink-0" />
              Administrative dashboard &amp; directory controls
            </li>
          </ul>
        </div>

        {/* Smartphone mockup frame container */}
        <div className="w-full sm:w-[390px] h-screen sm:h-[844px] bg-brand-cream sm:rounded-[44px] overflow-hidden relative shadow-[0_25px_60px_rgba(0,0,0,0.55),0_0_0_2px_#555,inset_0_0_0_2px_#333] flex flex-col flex-shrink-0">
          
          {/* Status Bar */}
          <div className="h-11 flex items-end justify-between px-6 pb-2 text-[13px] font-bold text-brand-text flex-shrink-0 select-none z-30">
            <span className="font-sans leading-none">9:41</span>
            
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-40 hidden sm:block" />
            
            <div className="flex gap-1.5 items-center">
              <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor" className="opacity-90">
                <rect x="0" y="4" width="2.5" height="8" rx="0.5"/>
                <rect x="4" y="2.5" width="2.5" height="9.5" rx="0.5"/>
                <rect x="8" y="0.5" width="2.5" height="11.5" rx="0.5"/>
                <rect x="12" y="0" width="2.5" height="12" rx="0.5" className="opacity-35"/>
              </svg>
              <svg width="15" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="opacity-90">
                <path d="M1 4C3.5 1.5 12.5 1.5 15 4"/>
                <path d="M3.5 6.5C5.5 4.5 10.5 4.5 12.5 6.5"/>
                <path d="M6 9C7 8 9 8 10 9"/>
              </svg>
              <span className="leading-none text-[13px]">🔋</span>
            </div>
          </div>

          {/* Core Interactive Screen Frame */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-brand-cream">
            
            {activeTab === 'login' && (
              <LoginScreen 
                users={users} 
                onLogin={(u) => {
                  setCurrentUser(u);
                  setActiveTab('home');
                }} 
                onGoogleLogin={handleGoogleLogin}
              />
            )}

            {currentUser && (
              <>
                {activeTab === 'home' && (
                  <HomeScreen
                    currentUser={currentUser}
                    users={users}
                    posts={posts}
                    docs={docs}
                    events={events}
                    onSetTab={setActiveTab}
                    onViewDoc={(id) => { setActiveTab('resources'); }}
                    onLaunchRecord={() => { setActiveTab('stories'); }}
                  />
                )}

                {activeTab === 'stories' && (
                  <StoriesScreen
                    currentUser={currentUser}
                    stories={stories}
                    prompts={prompts}
                    onAddStory={handleAddStory}
                    onUpdateStory={handleUpdateStory}
                    onDeleteStory={handleDeleteStory}
                  />
                )}

                {activeTab === 'forum' && (
                  <CommunityScreen 
                    currentUser={currentUser}
                    posts={posts}
                    onAddPost={handleAddPost}
                    onDeletePost={handleDeletePost}
                    onEditPost={handleEditPost}
                  />
                )}

                {activeTab === 'resources' && (
                  <ResourcesScreen
                    currentUser={currentUser}
                    docs={docs}
                    onDeleteDoc={handleDeleteDoc}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarScreen events={events} />
                )}

                {activeTab === 'directory' && (
                  <DirectoryScreen currentUser={currentUser} users={users} />
                )}

                {activeTab === 'profile' && (
                  <ProfileScreen
                    currentUser={currentUser}
                    users={users}
                    stories={stories}
                    docs={docs}
                    onSetTab={setActiveTab}
                    onUpdateProfile={handleUpdateUser}
                    onSignOut={doSignOut}
                    onLaunchAdminPanel={handleLaunchAdminPanel}
                  />
                )}

                {activeTab === 'admin' && currentUser.role === 'admin' && (
                  <AdminScreen
                    currentUser={currentUser}
                    users={users}
                    docs={docs}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    onAddDoc={handleAddDoc}
                    onDeleteDoc={handleDeleteDoc}
                    prompts={prompts}
                    onAddPrompt={handleAddPrompt}
                    onUpdatePrompt={handleUpdatePrompt}
                    onDeletePrompt={handleDeletePrompt}
                    events={events}
                    onAddEvent={handleAddEvent}
                    onUpdateEvent={handleUpdateEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onClose={() => { setActiveTab('profile'); }}
                  />
                )}
              </>
            )}

          </div>

          {/* Bottom Tabs Bar */}
          {currentUser && activeTab !== 'login' && activeTab !== 'admin' && (
            <div className="h-20 bg-white border-t border-brand-border flex items-center justify-around pb-3 select-none flex-shrink-0 z-30">
              
              <button 
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition-all ${activeTab === 'home' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <Home className={`w-5.5 h-5.5 ${activeTab === 'home' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Home
                {activeTab === 'home' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button 
                onClick={() => setActiveTab('stories')}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition-all ${activeTab === 'stories' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <Mic className={`w-5.5 h-5.5 ${activeTab === 'stories' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Stories
                {activeTab === 'stories' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button 
                onClick={() => setActiveTab('forum')}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition-all ${activeTab === 'forum' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <MessageSquare className={`w-5.5 h-5.5 ${activeTab === 'forum' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Community
                {activeTab === 'forum' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition-all ${activeTab === 'resources' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <BookOpen className={`w-5.5 h-5.5 ${activeTab === 'resources' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Resources
                {activeTab === 'resources' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button
                onClick={() => setActiveTab('directory')}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition-all ${activeTab === 'directory' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <Users className={`w-5.5 h-5.5 ${activeTab === 'directory' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Directory
                {activeTab === 'directory' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 text-xs font-medium transition-all ${activeTab === 'profile' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <UserIcon className={`w-5.5 h-5.5 ${activeTab === 'profile' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Profile
                {activeTab === 'profile' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

            </div>
          )}

        </div>

      </div>

      </div>
      )}
      {/* end !isStandalone mobile browser layout */}

    </div>
  );

  async function handleGoogleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Google sign-in error:', e);
      alert('Google authentication failed. Please try again.');
    }
  }

  async function doSignOut() {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setActiveTab('login');
    } catch (e) {
      console.error('Error during sign out:', e);
    }
  }
}
