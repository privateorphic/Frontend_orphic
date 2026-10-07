import React from 'react';
import { Activity, PlusCircle, CheckCircle2, Clock, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import type { TaskActivityTimeline } from '../../types';
import { formatTime } from '../../utils/formatters.ts';

interface Props {
  timeline: TaskActivityTimeline[];
}

export const TaskChangeTimeline: React.FC<Props> = ({ timeline }) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'TASK_CREATED':
        return <PlusCircle className="w-4 h-4 text-purple-600" />;
      case 'TASK_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'TASK_PROGRESS_UPDATED':
      case 'TASK_UPDATED':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-7 space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Real-time Task Activity Log
          </h3>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Timeline of all task additions, status updates, and progress changes recorded during office hours
        </p>
      </div>

      {timeline.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100/80 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 opacity-60" />
          </div>
          <p className="text-sm font-bold text-slate-600">No task activities logged today yet.</p>
          <p className="text-xs text-slate-400">Updates will automatically populate here as tasks are updated throughout the day.</p>
        </div>
      ) : (
        <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80">
          {timeline.map((item) => (
            <div key={item.id} className="relative flex items-start gap-4 group">
              {/* Dot Icon */}
              <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                {getActionIcon(item.actionType)}
              </div>

              {/* Activity Card */}
              <div className="flex-1 bg-slate-50/80 hover:bg-slate-100/60 p-4 sm:p-5 rounded-2xl border border-slate-200/70 transition-all hover:shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{item.taskTitle}</h4>
                  <span className="text-xs font-mono font-semibold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 w-fit">
                    {formatTime(item.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3 font-medium">{item.description}</p>

                {/* Status or Progress transition badge */}
                {(item.oldStatus || item.newStatus || item.oldProgress !== undefined || item.newProgress !== undefined) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 w-fit shadow-2xs">
                    {item.oldStatus && (
                      <span className="font-semibold text-slate-500">{item.oldStatus}</span>
                    )}
                    {item.oldStatus && item.newStatus && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                    {item.newStatus && (
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{item.newStatus}</span>
                    )}

                    {item.oldProgress !== undefined && item.newProgress !== undefined && (
                      <span className="ml-1.5 font-mono text-slate-600 font-medium">
                        {item.oldProgress}% &rarr; <strong className="text-emerald-600 font-bold">{item.newProgress}%</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

