import { Loader2 } from 'lucide-react';

interface Props {
  fullScreen?: boolean;
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ fullScreen, size = 24, className }: Props) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <Loader2 className="animate-spin text-primary-600" size={40} />
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center p-8 ${className ?? ''}`}>
      <Loader2 className="animate-spin text-primary-600" size={size} />
    </div>
  );
}
