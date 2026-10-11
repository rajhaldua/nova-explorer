import React from 'react';
import { Copy, FileDiff, SkipForward, Check } from 'lucide-react';
import { Language, translations } from '../../i18n';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onResolve: (action: 'replace' | 'keepBoth' | 'skip') => void;
  language: Language;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  fileName,
  onResolve,
  language,
}) => {
  const t = translations[language] || translations.en;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-500/30 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FileDiff className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {t.conflictTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-xs">
              {fileName}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t.conflictPrompt.replace('{name}', fileName)} What would you like to do?
        </p>

        {/* Resolution Options */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onResolve('keepBoth')}
            className="p-3.5 rounded-2xl border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-left hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center gap-3 transition-colors"
          >
            <Copy className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-blue-900 dark:text-blue-100 block text-sm">
                {t.conflictKeepBoth}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Saves with a new name like "{fileName.replace(/\.[^/.]+$/, '')} (1)"
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve('replace')}
            className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition-colors"
          >
            <Check className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                {t.conflictReplace}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Overwrites the existing file with the new copy
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve('skip')}
            className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-3 transition-colors"
          >
            <SkipForward className="w-5 h-5 text-slate-500 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
                {t.conflictSkip}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Leaves the existing file untouched
              </span>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {t.cancel}
          </button>
        </div>

      </div>
    </div>
  );
};
