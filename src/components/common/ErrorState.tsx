import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="text-red-500" size={32} />
      </div>
      <p className="text-slate-600 text-sm mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}
