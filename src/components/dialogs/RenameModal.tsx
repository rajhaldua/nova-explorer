import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { Language, translations } from '../../i18n';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onConfirm: (newName: string) => void;
  language: Language;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onConfirm,
  language,
}) => {
  const [name, setName] = useState(currentName);
  const t = translations[language] || translations.en;

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-indigo-500/30 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Edit2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {t.renameTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-xs">
              {currentName}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t.renamePrompt}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full h-12 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-base font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={!name.trim() || name.trim() === currentName}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.renameButton}
          </button>
        </div>
      </form>
    </div>
  );
};
