import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onImageChange?: (base64Url: string) => void;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

// Default high quality professional avatar fallback image
export function getFallbackAvatar(name: string): string {
  const cleanName = encodeURIComponent(name || 'User');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanName}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export default function UserAvatar({
  name,
  src,
  size = 'md',
  editable = false,
  onImageChange,
  className = '',
}: UserAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const [imgError, setImgError] = useState(false);

  const effectiveSrc = !imgError && imageSrc ? imageSrc : getFallbackAvatar(name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageSrc(result);
        setImgError(false);
        if (onImageChange) onImageChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${SIZE_MAP[size]} rounded-2xl overflow-hidden border-2 border-[#EF7D35]/30 bg-[#FFF4EC] shadow-sm flex items-center justify-center transition`}
      >
        <img
          src={effectiveSrc}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>

      {editable && (
        <label
          className="absolute -bottom-1 -right-1 bg-[#EF7D35] text-white p-1.5 rounded-full shadow-md hover:bg-[#DC6422] cursor-pointer transition"
          title="Upload Profile Picture"
        >
          <Camera size={13} />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
