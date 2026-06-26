import React, { useState } from 'react';
import { User, Post, PostCategory, PostAttachment } from '../types';
import { Send, FileText, Image as ImageIcon, Link, X, Trash2, Edit3, Search, Download, ZoomIn } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { syncToDrive } from '../lib/driveSync';

interface CommunityScreenProps {
  currentUser: User;
  posts: Post[];
  onAddPost: (post: Post) => Promise<void>;
  onDeletePost: (id: string) => void;
  onEditPost: (id: string, text: string) => void;
}

export default function CommunityScreen({
  currentUser,
  posts,
  onAddPost,
  onDeletePost,
  onEditPost,
}: CommunityScreenProps) {
  const [activeFilter, setActiveFilter] = useState<PostCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  
  // Compose form states
  const [category, setCategory] = useState<PostCategory>('Update');
  const [text, setText] = useState('');
  const [postLink, setPostLink] = useState('');
  const [attachment, setAttachment] = useState<PostAttachment | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; name: string } | null>(null);

  const categories: (PostCategory | 'All')[] = ['All', 'Announcement', 'Kudos', 'Update', 'Question'];
  
  const getCatColor = (cat: PostCategory) => {
    switch (cat) {
      case 'Announcement': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Kudos': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'Update': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'Question': return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  const getCatEmoji = (cat: PostCategory) => {
    switch (cat) {
      case 'Announcement': return '📢';
      case 'Kudos': return '🎉';
      case 'Update': return 'ℹ️';
      case 'Question': return '❓';
    }
  };

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg', 0.82
        );
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleComposeFileChange = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'file' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (kind === 'photo') {
      setIsUploadingPhoto(true);
      try {
        const blob = await compressImage(file);
        const photoRef = storageRef(storage, `post-photos/${Date.now()}-${file.name.replace(/\s+/g, '_')}`);
        await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
        const url = await getDownloadURL(photoRef);
        setAttachment({ name: file.name, type: 'image/jpeg', data: url, kind: 'photo' });
        syncToDrive(url, photoRef.name, 'community-photos');
      } catch (err) {
        console.error('Photo upload error:', err);
        alert('Failed to upload photo. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    } else {
      // Regular files: keep as base64 (documents are typically small)
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setAttachment({ name: file.name, type: file.type, data: loadEvent.target.result as string, kind: 'file' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachment && !postLink) {
      alert('Post content cannot be empty. Write a brief statement or attach media.');
      return;
    }

    const newPost: Post = {
      id: String(Date.now()),
      author: currentUser.name,
      initials: currentUser.initials || currentUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase(),
      authorId: currentUser.id,
      cat: category,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...(postLink.trim() ? { link: postLink.trim() } : {}),
      ...(attachment ? { attachment } : { attachment: null }),
    };

    try {
      await onAddPost(newPost);
      setText('');
      setPostLink('');
      setAttachment(null);
      setIsComposeOpen(false);
    } catch {
      alert('Failed to post. Please check your connection and try again.');
    }
  };

  const handleEdit = (id: string, currentText: string) => {
    const txt = prompt('Edit your post:', currentText);
    if (txt !== null) {
      onEditPost(id, txt.trim());
    }
  };

  const filteredPosts = posts
    .filter((p) => activeFilter === 'All' || p.cat === activeFilter)
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.text.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q)
      );
    });

  const initials = currentUser.initials || currentUser.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24 text-left">
      
      {/* Header */}
      <div className="bg-brand-green px-5 pt-12 pb-5 text-white flex-shrink-0">
        <h1 className="font-poppins font-bold text-2xl">Community</h1>
        <p className="text-xs text-[#E8F5E9]/90 mt-1">Share updates, staff appreciations, and more</p>
      </div>

      {/* Compose trigger */}
      <div 
        onClick={() => setIsComposeOpen(true)}
        className="mx-5 -mt-4 bg-white rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_4px_16px_rgba(75,173,75,0.12)] cursor-pointer"
      >
        <div className="w-9 h-9 bg-brand-green text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 bg-brand-cream border border-brand-border rounded-full px-4 py-2.5 text-xs text-brand-text-light">
          Share an update with your team...
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-2.5 bg-white border border-brand-border rounded-xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-brand-text-light flex-shrink-0" />
          <input
            type="text"
            placeholder="Search posts by keyword or employee name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-xs text-brand-text bg-transparent focus:outline-none placeholder:text-brand-text-light"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-brand-text-light hover:text-brand-text focus:outline-none cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Filter Row */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-5 pt-3 pb-2 flex-shrink-0">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer focus:outline-none ${activeFilter === c ? 'bg-brand-green text-white border-brand-green shadow-sm' : 'bg-white text-brand-text-mid border-brand-border hover:bg-brand-green-light'}`}
          >
            {c === 'All' ? 'All Feed' : c}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="divide-y divide-brand-border px-1">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-xs text-brand-text-light italic max-w-xs mx-auto leading-relaxed">
            No updates in this feed category yet.<br />Be the first to share details or request help!
          </div>
        ) : (
          filteredPosts.map((p) => {
            const isOwn = p.authorId === currentUser.id;
            const isAdmin = currentUser.role === 'admin';
            const canDelete = isOwn || isAdmin;
            return (
              <div key={p.id} className="p-4 bg-white">
                <div className="flex gap-3 items-start">
                  
                  {/* User Initial Circle */}
                  <div className="w-10 h-10 bg-brand-green-mid/50 text-brand-green-dark font-bold text-sm rounded-full flex items-center justify-center flex-shrink-0">
                    {p.initials}
                  </div>

                  <div className="flex-1 min-width-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-brand-text leading-tight">{p.author}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-brand-text-light font-medium">{p.date}</span>
                        {canDelete && (
                          <div className="flex gap-1">
                            {isOwn && <button
                              onClick={() => handleEdit(p.id, p.text)}
                              className="p-1 hover:bg-brand-green-light text-brand-text-light hover:text-brand-green-dark rounded focus:outline-none cursor-pointer"
                              title="Edit post"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>}
                            <button 
                              onClick={() => onDeletePost(p.id)}
                              className="p-1 hover:bg-red-50 text-brand-text-light hover:text-red-600 rounded focus:outline-none cursor-pointer"
                              title="Delete post"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category pill */}
                    <div className="mb-2">
                      <span className={`inline-flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${getCatColor(p.cat)}`}>
                        {getCatEmoji(p.cat)} {p.cat}
                      </span>
                    </div>

                    {/* Post Text */}
                    {p.text && (
                      <p className="text-xs text-brand-text-mid leading-relaxed whitespace-pre-line">{p.text}</p>
                    )}

                    {/* Attachment Render */}
                    {p.attachment && (
                      <div className="mt-3">
                        {p.attachment.kind === 'photo' ? (
                          <div
                            className="relative group cursor-zoom-in"
                            onClick={(e) => { e.stopPropagation(); setEnlargedPhoto({ url: p.attachment!.data, name: p.attachment!.name }); }}
                          >
                            <img
                              src={p.attachment.data}
                              alt="Attachment preview"
                              className="w-full max-h-64 rounded-xl object-cover shadow-sm border border-brand-border"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all flex items-center justify-center">
                              <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-all" />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-brand-cream border border-brand-border rounded-xl p-3 flex items-center justify-between text-xs">
                            <span className="truncate font-semibold text-brand-text flex items-center gap-1.5">&#x1F4CE; {p.attachment.name}</span>
                            <a 
                              href={p.attachment.data} 
                              download={p.attachment.name}
                              className="text-xs text-brand-green-dark bg-brand-green-light px-2.5 py-1 rounded-md font-bold text-center"
                            >
                              Save File
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Associated hyperlink */}
                    {p.link && (
                      <div className="mt-2.5 flex items-center">
                        <a 
                          href={p.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-green-dark hover:underline font-semibold"
                        >
                          <Link className="w-3.5 h-3.5 flex-shrink-0" /> {p.link}
                        </a>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div
          className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setEnlargedPhoto(null)}
        >
          <img
            src={enlargedPhoto.url}
            alt="Full size"
            className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex gap-3 mt-5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(enlargedPhoto.url);
                  const blob = await res.blob();
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = enlargedPhoto.name || 'photo.jpg';
                  a.click();
                  URL.revokeObjectURL(a.href);
                } catch {
                  alert('Could not download the image. Try long-pressing on it instead.');
                }
              }}
              className="flex items-center gap-2 bg-white text-brand-text font-bold text-xs px-5 py-2.5 rounded-full shadow"
            >
              <Download className="w-4 h-4" /> Save Photo
            </button>
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="flex items-center gap-2 bg-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-full"
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>
      )}

      {/* Detailed Compose Post Modal */}
      {isComposeOpen && (
        <div className="absolute inset-0 bg-brand-cream z-50 flex flex-col p-5 animate-slide-up">
          <div className="flex justify-between items-center pb-4 border-b border-brand-border">
            <button 
              onClick={() => setIsComposeOpen(false)}
              className="text-xs text-brand-text-light font-bold cursor-pointer"
            >
              Cancel
            </button>
            <h2 className="text-base font-bold text-brand-text font-poppins">New team post</h2>
            <button
              onClick={handlePostSubmit}
              disabled={isUploadingPhoto}
              className="bg-brand-green text-white font-bold text-xs px-4 py-2 rounded-full shadow hover:bg-brand-green-dark cursor-pointer flex items-center gap-1 disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" /> {isUploadingPhoto ? 'Uploading…' : 'Post'}
            </button>
          </div>

          <form className="mt-4 flex-1 flex flex-col gap-4">
            
            {/* Category Select */}
            <div>
              <label className="block text-[13px] font-bold text-brand-text-light uppercase tracking-wider mb-1.5">Select category:</label>
              <div className="grid grid-cols-4 gap-2">
                {(['Announcement', 'Kudos', 'Update', 'Question'] as PostCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all focus:outline-none cursor-pointer ${category === cat ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-brand-text border-brand-border'}`}
                  >
                    {getCatEmoji(cat)} {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Main input */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Updates, needs, kudos, or questions? Share with Stewpot staff..."
                className="w-full flex-1 p-4 bg-white border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green resize-none leading-relaxed"
                autoFocus
              />
            </div>

            {/* Attachment inputs and pre-viewer */}
            <div className="pt-2 border-t border-brand-border space-y-3">
              
              {attachment ? (
                <div className="p-3 bg-brand-green-light border border-brand-green/30 rounded-xl flex items-center justify-between text-xs">
                  <span className="truncate font-semibold text-brand-green-dark">📎 {attachment.name}</span>
                  <button 
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-red-500 hover:text-red-700 bg-transparent border-none p-1 cursor-pointer focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <label className="flex-1 py-2.5 border border-brand-border rounded-xl bg-white hover:bg-brand-green-light transition-all flex items-center justify-center gap-1.5 text-xs text-brand-text-mid font-semibold cursor-pointer">
                    <FileText className="w-4 h-4 text-brand-green" /> Attachment
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleComposeFileChange(e, 'file')} 
                    />
                  </label>
                  <label className={`flex-1 py-2.5 border border-brand-border rounded-xl bg-white hover:bg-brand-green-light transition-all flex items-center justify-center gap-1.5 text-xs text-brand-text-mid font-semibold ${isUploadingPhoto ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}>
                    <ImageIcon className="w-4 h-4 text-brand-green" />
                    {isUploadingPhoto ? 'Uploading…' : 'Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto}
                      onChange={(e) => handleComposeFileChange(e, 'photo')}
                    />
                  </label>
                </div>
              )}

              <div>
                <input
                  type="url"
                  placeholder="🔗 Paste link URL if applicable"
                  className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-xl text-xs"
                  value={postLink}
                  onChange={(e) => setPostLink(e.target.value)}
                />
              </div>

            </div>

          </form>
        </div>
      )}

    </div>
  );
}
