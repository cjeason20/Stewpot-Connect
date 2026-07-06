import React, { useState, useRef } from 'react';
import { User, Photo } from '../types';
import { Camera, X, Trash2, Upload, ImageOff } from 'lucide-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { syncToDrive } from '../lib/driveSync';

interface PhotosScreenProps {
  currentUser: User;
  photos: Photo[];
  onAddPhoto: (photo: Photo) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
}

export default function PhotosScreen({ currentUser, photos, onAddPhoto, onDeletePhoto }: PhotosScreenProps) {
  const programsList = [
    'Afterschool Program', 'Billy Brumfield Shelter', 'Case Management',
    'Clothing Closet', 'Community Kitchen', 'Food Pantry', 'HeARTWorks',
    'Housing Assistance', 'Legal Clinic', "Matt's House", 'Meals on Wheels',
    'Opportunity Center', 'Special Events & Communications', 'Street Outreach',
    'Summer Camp', 'Transitional Shelter',
  ];

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [program, setProgram] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === 'admin';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '_')}`;
      const ref = storageRef(storage, `community-photos/${fileName}`);

      // Compress to JPEG if it's an image
      let blob: Blob = selectedFile;
      if (selectedFile.type.startsWith('image/')) {
        try {
          blob = await new Promise<Blob>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX = 1600;
              const scale = Math.min(1, MAX / Math.max(img.width, img.height));
              canvas.width = Math.round(img.width * scale);
              canvas.height = Math.round(img.height * scale);
              canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', 0.85);
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = previewUrl!;
          });
        } catch {
          // Fall back to the original file if compression fails
          blob = selectedFile;
        }
      }

      await uploadBytes(ref, blob, { contentType: 'image/jpeg' });
      const url = await getDownloadURL(ref);
      syncToDrive(url, fileName, 'community-photos', program || undefined);

      await onAddPhoto({
        id: fileName,
        url,
        caption: caption.trim(),
        program: program || undefined,
        uploadedBy: currentUser.name,
        uploadedById: currentUser.id,
        date: new Date().toISOString(),
      });

      setShowUploadModal(false);
      setCaption('');
      setProgram('');
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err: any) {
      let msg = err?.code || 'unknown';
      try {
        const parsed = JSON.parse(err?.message || '{}');
        msg = parsed.error || parsed.authInfo ? JSON.stringify(parsed) : err?.message;
      } catch {
        msg = err?.message || String(err);
      }
      alert(`Upload failed:\n${msg}`);
      console.error('Photo upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    await onDeletePhoto(photo.id);
    if (lightboxPhoto?.id === photo.id) setLightboxPhoto(null);
  };

  const canDelete = (photo: Photo) => isAdmin || photo.uploadedById === currentUser.id;

  const sorted = [...photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar pb-24 text-left">

      {/* Header */}
      <div className="bg-brand-green px-5 pt-12 pb-5 text-white flex-shrink-0 flex items-end justify-between">
        <div>
          <h1 className="font-poppins font-bold text-2xl">Stewpot Photos</h1>
          <p className="text-xs text-[#E8F5E9]/90 mt-1">Moments from our team &amp; community</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all mb-1"
        >
          <Camera className="w-4 h-4" />
          Add Photo
        </button>
      </div>

      {/* Gallery */}
      <div className="px-4 pt-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-light">
            <ImageOff className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">No photos yet</p>
            <p className="text-xs opacity-70">Be the first to share a Stewpot moment!</p>
          </div>
        ) : (
          <div className="columns-2 gap-2.5 space-y-2.5">
            {sorted.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid rounded-xl overflow-hidden border border-brand-border shadow-sm bg-white relative group cursor-pointer"
                onClick={() => setLightboxPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Stewpot photo'}
                  className="w-full block object-cover"
                  loading="lazy"
                />
                {/* Caption / uploader overlay */}
                <div className="px-2.5 py-2">
                  {photo.caption && (
                    <p className="text-xs font-semibold text-brand-text leading-tight">{photo.caption}</p>
                  )}
                  {photo.program && (
                    <p className="text-[10px] font-semibold text-brand-green-dark bg-brand-green-light px-1.5 py-0.5 rounded-full inline-block mt-1">{photo.program}</p>
                  )}
                  <p className="text-[10px] text-brand-text-light mt-0.5">{photo.uploadedBy}</p>
                </div>
                {canDelete(photo) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-end animate-fade-in" onClick={() => setShowUploadModal(false)}>
          <div
            className="bg-white w-full rounded-t-2xl p-5 pb-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-poppins font-bold text-base text-brand-text">Upload a Photo</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 rounded-lg hover:bg-brand-cream">
                <X className="w-4 h-4 text-brand-text-light" />
              </button>
            </div>

            {/* Image picker area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-44 rounded-xl border-2 border-dashed border-brand-border bg-brand-cream flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-green transition-colors mb-4 overflow-hidden"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="w-7 h-7 text-brand-text-light" />
                  <p className="text-xs text-brand-text-light font-medium">Tap to choose a photo</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Program */}
            <select
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green mb-3 bg-white"
            >
              <option value="">Select a program (optional)</option>
              {programsList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Caption */}
            <input
              type="text"
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text placeholder-brand-text-light focus:outline-none focus:ring-2 focus:ring-brand-green mb-4"
            />

            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full bg-brand-green text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-green-dark transition-colors"
            >
              {isUploading ? 'Uploading…' : 'Share Photo'}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="absolute inset-0 bg-black z-50 flex flex-col animate-slide-up"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {lightboxPhoto.caption && (
                <p className="text-sm font-semibold text-white">{lightboxPhoto.caption}</p>
              )}
              {lightboxPhoto.program && (
                <p className="text-[10px] font-semibold text-brand-green-dark bg-brand-green-light px-1.5 py-0.5 rounded-full inline-block mb-0.5">{lightboxPhoto.program}</p>
              )}
              <p className="text-xs text-zinc-400">{lightboxPhoto.uploadedBy} · {new Date(lightboxPhoto.date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {canDelete(lightboxPhoto) && (
                <button
                  onClick={() => handleDelete(lightboxPhoto)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setLightboxPhoto(null)} className="p-2 bg-white/10 rounded-lg text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || 'Photo'}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
