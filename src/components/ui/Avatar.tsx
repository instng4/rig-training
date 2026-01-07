'use client';

import { useRef, useState } from 'react';
import { Upload, X, User } from 'lucide-react';

interface AvatarUploadProps {
  currentPhotoUrl?: string | null;
  name: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  size?: 'md' | 'lg';
}

export function AvatarUpload({ 
  currentPhotoUrl, 
  name, 
  onUpload, 
  onRemove,
  size = 'lg' 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const sizeClass = size === 'lg' ? 'avatar-lg' : '';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`avatar ${sizeClass}`} style={{ position: 'relative' }}>
        {currentPhotoUrl ? (
          <img src={currentPhotoUrl} alt={name} />
        ) : (
          initials || <User size={size === 'lg' ? 24 : 16} />
        )}
        {isUploading && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
          >
            <div className="spinner" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary btn-sm"
          disabled={isUploading}
        >
          <Upload size={14} />
          Upload
        </button>
        {currentPhotoUrl && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn btn-danger btn-sm"
            disabled={isUploading}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

interface AvatarProps {
  photoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ photoUrl, name, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'sm' ? 'avatar-sm' : '';

  return (
    <div className={`avatar ${sizeClass}`}>
      {photoUrl ? (
        <img src={photoUrl} alt={name} />
      ) : (
        initials || <User size={size === 'lg' ? 24 : size === 'sm' ? 12 : 16} />
      )}
    </div>
  );
}
