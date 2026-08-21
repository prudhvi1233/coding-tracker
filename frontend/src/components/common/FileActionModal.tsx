import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, X } from 'lucide-react';

interface FileActionModalProps {
  isOpen: boolean;
  type: 'delete' | 'rename' | null;
  fileName: string;
  projectName: string;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  onConfirmRename: (newName: string) => Promise<void>;
}

export const FileActionModal: React.FC<FileActionModalProps> = ({
  isOpen,
  type,
  fileName,
  projectName,
  onClose,
  onConfirmDelete,
  onConfirmRename
}) => {
  const [newName, setNewName] = useState(fileName);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setNewName(fileName);
  }, [fileName, isOpen]);

  if (!isOpen || !type) return null;

  const handleSubmitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newName.trim() === '' || newName === fileName) return;
    setSubmitting(true);
    try {
      await onConfirmRename(newName.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setSubmitting(true);
    try {
      await onConfirmDelete();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-5 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {type === 'delete' ? (
          <>
            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight font-mono">Delete File History</h3>
                <p className="text-xs text-zinc-400 mt-1">This action cannot be undone.</p>
              </div>
            </div>

            {/* Warning Message Box */}
            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs text-zinc-300 space-y-1.5 font-mono">
              <p>
                Are you sure you want to permanently delete all tracking history, save telemetry, and code snapshots for:
              </p>
              <div className="p-2 rounded bg-black/40 border border-rose-500/20 text-rose-300 font-semibold truncate">
                {fileName} <span className="text-zinc-500 font-normal">({projectName})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete File History
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight font-mono">Rename File</h3>
                <p className="text-xs text-zinc-400 mt-1">Update file records across project telemetry.</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRename} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
                  New File Name / Path
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Hello1.cpp"
                  autoFocus
                  className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="text-[11px] text-zinc-500 font-mono">
                Current: <span className="text-zinc-300">{fileName}</span> ({projectName})
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newName || newName.trim() === '' || newName === fileName}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" /> Save New Name
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
