import React, { useState, useEffect } from 'react';
import { User, Post, DocumentItem, Story } from './types';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import StoriesScreen from './components/StoriesScreen';
import CommunityScreen from './components/CommunityScreen';
import ResourcesScreen from './components/ResourcesScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminScreen from './components/AdminScreen';

import { Home, Mic, MessageSquare, BookOpen, User as UserIcon, Shield } from 'lucide-react';

const SC_USERS_KEY = 'sc_users';
const SC_DOCS_KEY = 'sc_docs';
const SC_POSTS_KEY = 'sc_posts';
const SC_STORIES_KEY = 'sc_stories';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  
  // Navigation states
  // 'login' | 'home' | 'stories' | 'forum' | 'resources' | 'profile' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('login');
  const [adminTabFocus, setAdminTabFocus] = useState<'users' | 'docs'>('users');

  // Load Seed Data
  useEffect(() => {
    // 1. Users Seed
    let localUsers = JSON.parse(localStorage.getItem(SC_USERS_KEY) || '[]');
    if (localUsers.length === 0) {
      localUsers = [
        {
          id: 1,
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
          id: 2,
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
          id: 3,
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
      localStorage.setItem(SC_USERS_KEY, JSON.stringify(localUsers));
    }
    setUsers(localUsers);

    // 2. Posts (Community) Seed
    let localPosts = JSON.parse(localStorage.getItem(SC_POSTS_KEY) || '[]');
    if (localPosts.length === 0) {
      localPosts = [
        {
          id: 101,
          author: 'Chris Eason',
          initials: 'CE',
          authorId: 1,
          cat: 'Announcement',
          text: 'The Stewpot Annual Gala is scheduled for October 15th! Thanks to all departmental coordinators who are helping with the invitations. Let’s make 2026 our best year yet.',
          date: 'May 30',
          link: 'https://stewpot.org/gala'
        },
        {
          id: 102,
          author: 'Sarah Johnson',
          initials: 'SJ',
          authorId: 2,
          cat: 'Kudos',
          text: 'Shoutout to the Billy Brumfield Shelter team for handling the emergency intake seamlessly last night during the storms. Real dedication and deep community care! 🎉',
          date: 'May 28'
        },
        {
          id: 103,
          author: 'David Vance',
          initials: 'DV',
          authorId: 3,
          cat: 'Update',
          text: 'New transitional hours for the Clothing Closet are in effect starting Monday. I’ve uploaded the protocol PDF in the Resources tab. Please review it before your shifts.',
          date: 'May 27'
        },
        {
          id: 104,
          author: 'Sarah Johnson',
          initials: 'SJ',
          authorId: 2,
          cat: 'Question',
          text: 'Does anyone have extra laundry detergent available at Matt\'s House? We are running low on standard stock and would appreciate a quick transfer of cases.',
          date: 'May 26'
        }
      ];
      localStorage.setItem(SC_POSTS_KEY, JSON.stringify(localPosts));
    }
    setPosts(localPosts);

    // 3. Documents (Resources) Seed
    let localDocs = JSON.parse(localStorage.getItem(SC_DOCS_KEY) || '[]');
    if (localDocs.length === 0) {
      localDocs = [
        {
          id: 201,
          name: 'stewpot_handbook_2026.pdf',
          displayName: 'Staff Handbook & Agency Guidelines 2026',
          size: '1.2MB',
          type: 'application/pdf',
          date: 'May 1, 2026',
          cat: 'staff',
          data: 'data:application/pdf;base64,JVBERi0xLjQKJ...' // Fake stub or self link
        },
        {
          id: 202,
          name: 'emergency_inclement_weather_protocol.pdf',
          displayName: 'Emergency Inclement Weather Protocols & Ingress',
          size: '420KB',
          type: 'application/pdf',
          date: 'Jan 12, 2026',
          cat: 'programs',
          data: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
        },
        {
          id: 203,
          name: 'stewpot_official_vector_logos.png',
          displayName: 'Stewpot Connect Press Logo Assets',
          size: '2.1MB',
          type: 'image/png',
          date: 'Mar 18, 2026',
          cat: 'brand',
          data: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDIxYTkgOSAwIDAgMCA5LTljMC0xLjQ5LS4zNi0yLjktMS4wMS00LjE1TDE3IDEySDdMNC4wMSA3Ljg1QTguOTYgOC45NiAwIDAgMCAzIDEyYTkgOSAwIDAgMCA5IDlaIi8+PHBhdGggZD0iTTEyIDF2MiIvPjxwYXRoIGQ9Ik0xMiA5djEiLz48cGF0aCBkPSJNOCA0VjMiLz48cGF0aCBkPSJNMTYgNFYzIi8+PC9zdmc+'
        }
      ];
      localStorage.setItem(SC_DOCS_KEY, JSON.stringify(localDocs));
    }
    setDocs(localDocs);

    // 4. Stories Seed
    let localStories = JSON.parse(localStorage.getItem(SC_STORIES_KEY) || '[]');
    if (localStories.length === 0) {
      localStories = [
        {
          id: 301,
          title: "A New Beginning: Matthew's First Apartment",
          program: 'Housing Assistance',
          date: 'May 28, 2026',
          notes: 'Matthew expressed deep gratitude for our community navigators who helped him transition from chronically unhoused shelter status to his first standalone apartment in Jackson.',
          hasConsent: true,
          consentType: 'external',
          author: 'David Vance',
          authorId: 3
        },
        {
          id: 302,
          title: 'Cooking with Youth in Community Kitchen',
          program: 'Volunteer Programs',
          date: 'May 24, 2026',
          notes: 'Group of local high school juniors spent Saturday morning prep-cooking 120 lunches. They shared how connecting with our patrons completely changed their perspectives on community aid.',
          hasConsent: true,
          consentType: 'internal',
          author: 'Sarah Johnson',
          authorId: 2
        }
      ];
      localStorage.setItem(SC_STORIES_KEY, JSON.stringify(localStories));
    }
    setStories(localStories);

  }, []);

  // Sync state to local storage when changed
  const handleAddPost = (p: Post) => {
    const updated = [p, ...posts];
    setPosts(updated);
    localStorage.setItem(SC_POSTS_KEY, JSON.stringify(updated));
  };

  const handleDeletePost = (id: number) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem(SC_POSTS_KEY, JSON.stringify(updated));
  };

  const handleEditPost = (id: number, text: string) => {
    const updated = posts.map(p => p.id === id ? { ...p, text } : p);
    setPosts(updated);
    localStorage.setItem(SC_POSTS_KEY, JSON.stringify(updated));
  };

  const handleAddUser = (u: User) => {
    const updated = [...users, u];
    setUsers(updated);
    localStorage.setItem(SC_USERS_KEY, JSON.stringify(updated));
  };

  const handleUpdateUser = (updatedProfile: User) => {
    const updatedList = users.map(u => u.id === updatedProfile.id ? updatedProfile : u);
    setUsers(updatedList);
    localStorage.setItem(SC_USERS_KEY, JSON.stringify(updatedList));

    if (currentUser && currentUser.id === updatedProfile.id) {
      setCurrentUser(updatedProfile);
    }
  };

  const handleAddDoc = (d: DocumentItem) => {
    const updated = [d, ...docs];
    setDocs(updated);
    localStorage.setItem(SC_DOCS_KEY, JSON.stringify(updated));
  };

  const handleDeleteDoc = (id: number) => {
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    localStorage.setItem(SC_DOCS_KEY, JSON.stringify(updated));
  };

  const handleAddStory = (s: Story) => {
    const updated = [s, ...stories];
    setStories(updated);
    localStorage.setItem(SC_STORIES_KEY, JSON.stringify(updated));
  };

  const handleDeleteStory = (id: number) => {
    const updated = stories.filter(s => s.id !== id);
    setStories(updated);
    localStorage.setItem(SC_STORIES_KEY, JSON.stringify(updated));
  };

  const handleLaunchAdminPanel = (tab: 'users' | 'docs') => {
    setAdminTabFocus(tab);
    setActiveTab('admin');
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center min-h-screen bg-[#2D2D2D] p-0 sm:p-5 font-sans overflow-x-hidden antialiased">
      
      {/* Container Wrapper */}
      <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-10 max-w-6xl w-full">
        
        {/* Info panel (desktop only) */}
        <div className="hidden md:flex flex-col max-w-sm text-white text-left p-10 pr-0 flex-shrink-0 animate-fade-in self-start mt-6">
          <div className="w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center shadow-md mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-9 h-9 text-white"
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
          <div className="h-11 flex items-end justify-between px-6 pb-2 text-[11px] font-bold text-brand-text flex-shrink-0 select-none z-30">
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
              <span className="leading-none text-[9px]">🔋</span>
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
                    onSetTab={setActiveTab}
                    onViewDoc={(id) => {
                      setActiveTab('resources');
                      // Automatically triggers loading file in UI
                    }}
                    onLaunchRecord={() => {
                      setActiveTab('stories');
                    }}
                  />
                )}

                {activeTab === 'stories' && (
                  <StoriesScreen 
                    currentUser={currentUser}
                    stories={stories}
                    onAddStory={handleAddStory}
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

                {activeTab === 'admin' && (
                  <AdminScreen 
                    currentUser={currentUser}
                    users={users}
                    docs={docs}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onAddDoc={handleAddDoc}
                    onDeleteDoc={handleDeleteDoc}
                    onClose={() => {
                      setActiveTab('profile');
                    }}
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
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${activeTab === 'home' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <Home className={`w-5.5 h-5.5 ${activeTab === 'home' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Home
                {activeTab === 'home' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button 
                onClick={() => setActiveTab('stories')}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${activeTab === 'stories' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <Mic className={`w-5.5 h-5.5 ${activeTab === 'stories' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Stories
                {activeTab === 'stories' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button 
                onClick={() => setActiveTab('forum')}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${activeTab === 'forum' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <MessageSquare className={`w-5.5 h-5.5 ${activeTab === 'forum' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Community
                {activeTab === 'forum' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button 
                onClick={() => setActiveTab('resources')}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${activeTab === 'resources' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
              >
                <BookOpen className={`w-5.5 h-5.5 ${activeTab === 'resources' ? 'text-brand-green' : 'text-brand-text-light'}`} />
                Resources
                {activeTab === 'resources' && <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
              </button>

              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${activeTab === 'profile' ? 'text-brand-green-dark' : 'text-brand-text-light hover:text-brand-green-dark'}`}
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
  );

  function doSignOut() {
    setCurrentUser(null);
    setActiveTab('login');
  }
}
