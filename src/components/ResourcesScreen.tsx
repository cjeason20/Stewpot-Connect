import React, { useState } from 'react';
import { User, DocumentItem } from '../types';
import { Search, FileText, Download, Eye, FileSpreadsheet, Image as ImageIcon, Trash2, X } from 'lucide-react';

interface ResourcesScreenProps {
  currentUser: User;
  docs: DocumentItem[];
  onDeleteDoc: (id: number) => void;
}

export default function ResourcesScreen({
  currentUser,
  docs,
  onDeleteDoc,
}: ResourcesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  const isAdmin = currentUser && currentUser.role === 'admin';

  // Group docs by category
  const categories = {
    staff: {
      title: '📋 Staff Documents & Forms',
      docs: docs.filter((d) => d.cat === 'staff'),
    },
    programs: {
      title: '📄 Programs & Protocols',
      docs: docs.filter((d) => d.cat === 'programs'),
    },
    brand: {
      title: '🎨 Brand & Media Kit',
      docs: docs.filter((d) => d.cat === 'brand'),
    },
  };

  const getDocIcon = (type: string) => {
    if (type.includes('pdf')) {
      return <FileText className="w-5 h-5" />;
    } else if (type.includes('image')) {
      return <ImageIcon className="w-5 h-5" />;
    } else if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) {
      return <FileSpreadsheet className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  // Filter doc lists based on search query
  const getFilteredDocs = (docList: DocumentItem[]) => {
    if (!searchQuery.trim()) return docList;
    return docList.filter(
      (d) =>
        d.displayName.toLowerCase().includes(searchQuery) ||
        d.name.toLowerCase().includes(searchQuery)
    );
  };

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24 text-left">
      
      {/* Header */}
      <div className="bg-brand-green px-5 pt-12 pb-5 text-white flex-shrink-0">
        <h1 className="font-poppins font-bold text-2xl">Staff Resources</h1>
        <p className="text-xs text-[#E8F5E9]/90 mt-1">Official documents, template files &amp; agency forms</p>
      </div>

      {/* Styled Search Field */}
      <div className="px-5 mt-4 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search documents or templates..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm placeholder-brand-text-light text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-brand-text-light" />
        </div>
      </div>

      {/* Categories container */}
      <div className="px-5 mt-5 space-y-6">
        
        {Object.entries(categories).map(([key, cat]) => {
          const filtered = getFilteredDocs(cat.docs);
          
          return (
            <div key={key} className="space-y-2.5">
              <div className="text-[11px] font-bold text-brand-text-light uppercase tracking-wider pl-1">
                {cat.title}
              </div>
              
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <div className="text-xs text-brand-text-light italic bg-white rounded-xl border border-brand-border p-3.5 text-center">
                    {searchQuery.trim() ? 'No documents match your filter.' : 'Sub-folder is empty.'}
                  </div>
                ) : (
                  filtered.map((d) => (
                    <div 
                      key={d.id}
                      className="bg-white rounded-xl border border-brand-border p-3.5 flex items-center justify-between shadow-sm hover:border-brand-green/30 tracking-tight transition-all"
                    >
                      <div 
                        onClick={() => setActiveDoc(d)}
                        className="flex items-center gap-3 flex-1 min-width-0 mr-4 cursor-pointer"
                      >
                        <div className="w-10 h-10 bg-brand-green-light text-brand-green-dark rounded-lg flex items-center justify-center flex-shrink-0">
                          {getDocIcon(d.type)}
                        </div>
                        <div className="text-left min-width-0">
                          <h4 className="text-xs font-bold text-brand-text truncate leading-tight">
                            {d.displayName}
                          </h4>
                          <p className="text-[10px] text-brand-text-light mt-0.5">
                            {d.size} &middot; {d.date}
                          </p>
                        </div>
                      </div>

                      {/* Doc actions row */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setActiveDoc(d)}
                          className="p-2 bg-brand-green-light rounded-lg text-brand-green-dark hover:bg-brand-green cursor-pointer hover:text-white transition-all focus:outline-none"
                          title="Preview document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <a
                          href={d.data}
                          download={d.displayName || d.name}
                          className="p-2 bg-brand-cream border border-brand-border rounded-lg text-brand-text-mid hover:bg-brand-green-light transition-all cursor-pointer"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this file from agency directory? (This is permanent and cannot be undone)')) {
                                onDeleteDoc(d.id);
                              }
                            }}
                            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-lg cursor-pointer focus:outline-none"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* Doc Viewer Fullscreen Overlay */}
      {activeDoc && (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col animate-slide-up">
          <div className="bg-[#1C1C1E] px-4 py-3 pb-3 flex items-center justify-between text-white flex-shrink-0 border-b border-white/5">
            <div className="text-left min-width-0 flex-1 mr-4">
              <h3 className="text-sm font-bold truncate">{activeDoc.displayName}</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">{activeDoc.size} &middot; {activeDoc.date}</p>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <a
                href={activeDoc.data}
                download={activeDoc.displayName || activeDoc.name}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                title="Save file"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                onClick={() => setActiveDoc(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-zinc-300 hover:text-white focus:outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Render container depending on file type */}
          <div className="flex-1 overflow-auto bg-zinc-900 justify-center items-center flex">
            {activeDoc.type?.includes('image') ? (
              <img
                src={activeDoc.data}
                alt="Doc preview"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <iframe
                src={activeDoc.data}
                title="Doc previewframe"
                className="w-full h-full bg-white border-none"
              />
            )}
          </div>
        </div>
      )}

    </div>
  );
}
