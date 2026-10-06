import React, { useState } from 'react';
import { Loader2, Save, Upload, Link2, FileCheck, Paperclip, X, FileText, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { dailyWorkService } from '../../services/dailyWorkService';
import type { DailyWorkRequest } from '../../types';
import { toast } from '../../components/common/Toast';

export default function EmployeeDailyWorkPage() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState<DailyWorkRequest>({
    workDate: new Date().toISOString().slice(0, 10),
    description: '',
    notes: '',
    reportFileName: '',
    driveLink: '',
  });

  const set = (k: keyof DailyWorkRequest, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.pdf', '.doc', '.docx'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast('error', 'Please upload a PDF or DOCX file format.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      set('reportFileName', file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast('error', 'Please describe your work for the client.');
      return;
    }
    setLoading(true);
    try {
      await dailyWorkService.submitWork({
        ...form,
        reportFileName: selectedFile ? selectedFile.name : form.reportFileName,
      });
      toast('success', 'Client report submitted successfully!');
      setSelectedFile(null);
      setForm({
        workDate: new Date().toISOString().slice(0, 10),
        description: '',
        notes: '',
        reportFileName: '',
        driveLink: '',
      });
    } catch {
      toast('error', 'Failed to submit client report');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Daily Work Logger
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Submit Client Work Report
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Record daily accomplishments, deliverable summaries, attached reports, and feedback for clients.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-xs font-bold text-white shadow-inner shrink-0 self-start md:self-auto">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Date: {todayStr}</span>
          </div>
        </div>
      </div>

      {/* Main Card Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Form Header Info */}
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" /> Client Report Entry
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Fill out your daily work details below. Fields marked with <span className="text-rose-500 font-bold">*</span> are required.
            </p>
          </div>

          {/* Work Date & Drive Link Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Work Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.workDate}
                onChange={(e) => set('workDate', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-semibold text-slate-900 bg-slate-50/50"
                max={todayStr}
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                Google Drive / Cloud Document Link <span className="text-slate-400 font-normal text-2xs lowercase">(optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/... or cloud link"
                value={form.driveLink ?? ''}
                onChange={(e) => set('driveLink', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Client Work Description */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Client Work Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              placeholder="Describe your work deliverables, features built, client communications, and progress achieved today..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/50 leading-relaxed"
            />
          </div>

          {/* PDF / DOCX Report Attachment */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
              Attach Report File <span className="text-slate-400 font-normal text-2xs lowercase">(PDF / DOCX - optional)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="flex-1 flex items-center justify-between px-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/80 hover:bg-emerald-50/40 cursor-pointer transition-all duration-200 group">
                <span className="text-xs text-slate-600 font-semibold truncate flex items-center gap-2.5">
                  {selectedFile ? (
                    <>
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-extrabold text-emerald-700 truncate">{selectedFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                      <span className="group-hover:text-slate-900 transition-colors">Choose PDF or DOCX file...</span>
                    </>
                  )}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-2xs bg-slate-200 group-hover:bg-emerald-600 text-slate-700 group-hover:text-white px-3 py-1 rounded-xl font-extrabold shrink-0 ml-2 transition-all">
                  Browse
                </span>
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); set('reportFileName', ''); }}
                  className="p-3 text-slate-400 hover:text-rose-600 rounded-2xl hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors flex items-center justify-center shrink-0"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              Additional Notes / Client Feedback <span className="text-slate-400 font-normal text-2xs lowercase">(optional)</span>
            </label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Any additional remarks, client comments, or pending action items..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting Client Report...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Submit Client Work Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
