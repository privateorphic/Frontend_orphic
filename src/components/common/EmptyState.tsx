import { Inbox } from 'lucide-react';

interface Props {
  message?: string;
  description?: string;
}

export default function EmptyState({ message = 'No data found', description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Inbox className="text-slate-400" size={28} />
      </div>
      <p className="text-slate-700 font-medium">{message}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
