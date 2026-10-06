import React, { useState } from 'react';
import { Sun, Moon, PlusCircle, CheckCircle2, ListFilter, ArrowUpRight, CheckCircle, Clock } from 'lucide-react';
import type { TaskSnapshot, TaskChanges } from '../../types';

interface Props {
  morningTasks: TaskSnapshot[];
  eveningTasks: TaskSnapshot[];
  taskChanges: TaskChanges;
}

export const TaskSnapshotComparison: React.FC<Props> = ({
  morningTasks,
  eveningTasks,
  taskChanges,
}) => {
  const [activeTab, setActiveTab] = useState<'COMPARISON' | 'MORNING' | 'EVENING' | 'CHANGES'>('COMPARISON');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100/90 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> In Progress
          </span>
        );
      case 'TODO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            To Do
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-7 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ListFilter className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Daily Task Snapshot Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Compare morning initial tasks against end-of-day task outcomes and progress updates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl text-xs font-bold shadow-2xs border border-slate-200/50">
          <button
            onClick={() => setActiveTab('COMPARISON')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'COMPARISON' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab('MORNING')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'MORNING' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Morning ({morningTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('EVENING')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'EVENING' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Evening ({eveningTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('CHANGES')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              activeTab === 'CHANGES' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Changes (+{taskChanges?.addedTasks?.length || 0})
          </button>
        </div>
      </div>

      {/* COMPARISON VIEW */}
      {activeTab === 'COMPARISON' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Morning Column */}
          <div className="border border-amber-200/70 bg-gradient-to-b from-amber-50/40 to-amber-50/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                <Sun className="w-4.5 h-4.5 text-amber-600" /> Morning Initial State
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                {morningTasks.length} Tasks
              </span>
            </div>

            {morningTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center font-medium">No tasks recorded at morning check-in.</p>
            ) : (
              <div className="space-y-3">
                {morningTasks.map((t) => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{t.taskTitle}</h4>
                        <span className="text-2xs text-slate-400 font-mono">Task ID: #{t.taskId}</span>
                      </div>
                      {getStatusBadge(t.taskStatus)}
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${t.taskProgress}%` }} />
                      </div>
                      <span className="text-xs font-bold font-mono text-amber-700">{t.taskProgress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evening Column */}
          <div className="border border-indigo-200/70 bg-gradient-to-b from-indigo-50/40 to-indigo-50/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                <Moon className="w-4.5 h-4.5 text-indigo-600" /> Evening Final Outcome
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                {eveningTasks.length} Tasks
              </span>
            </div>

            {eveningTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center font-medium">Evening checkout pending or no tasks.</p>
            ) : (
              <div className="space-y-3">
                {eveningTasks.map((t) => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{t.taskTitle}</h4>
                        <span className="text-2xs text-slate-400 font-mono">Task ID: #{t.taskId}</span>
                      </div>
                      {getStatusBadge(t.taskStatus)}
                    </div>
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${t.taskProgress}%` }} />
                      </div>
                      <span className="text-xs font-bold font-mono text-indigo-700">{t.taskProgress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHANGES VIEW */}
      {activeTab === 'CHANGES' && (
        <div className="space-y-6">
          {/* Added Tasks */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-purple-600" /> Added During Work Hours ({taskChanges?.addedTasks?.length || 0})
            </h4>
            {taskChanges?.addedTasks?.length === 0 ? (
              <p className="text-xs text-slate-400 italic pl-6 font-medium">No additional tasks were created during working hours.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {taskChanges?.addedTasks?.map((t) => (
                  <div key={t.id} className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-purple-950 truncate">{t.taskTitle}</span>
                    {getStatusBadge(t.taskStatus)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed Tasks ({taskChanges?.completedTasks?.length || 0})
            </h4>
            {taskChanges?.completedTasks?.length === 0 ? (
              <p className="text-xs text-slate-400 italic pl-6 font-medium">No tasks marked completed today yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {taskChanges?.completedTasks?.map((t) => (
                  <div key={t.id} className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-emerald-950 truncate">{t.taskTitle}</span>
                    {getStatusBadge(t.taskStatus)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SINGLE LIST VIEWS (MORNING / EVENING) */}
      {(activeTab === 'MORNING' || activeTab === 'EVENING') && (
        <div className="space-y-3">
          {(activeTab === 'MORNING' ? morningTasks : eveningTasks).map((t) => (
            <div key={t.id} className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{t.taskTitle}</h4>
                <div className="flex items-center gap-2 text-2xs text-slate-500 font-medium mt-1">
                  <span>Task #{t.taskId}</span>
                  <span>•</span>
                  <span>Captured at {new Date(t.snapshotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {getStatusBadge(t.taskStatus)}
                <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${t.taskProgress}%` }} />
                </div>
                <span className="text-xs font-bold font-mono text-slate-700 min-w-10 text-right">{t.taskProgress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

