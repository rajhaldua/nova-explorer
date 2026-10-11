import React, { useState } from 'react';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { Language, translations } from '../../i18n';

interface SafeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permanent: boolean) => void;
  targetNames: string[];
  isRemovableDrive: boolean;
  language: Language;
}

export const SafeDeleteModal: React.FC<SafeDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetNames,
  isRemovableDrive,
  language,
}) => {
  const [confirmedRemovable, setConfirmedRemovable] = useState(false);
  const t = translations[language] || translations.en;

  if (!isOpen) return null;

  const isPermanent = isRemovableDrive;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-lg w-full p-6 border-2 border-red-500/30 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            {isPermanent ? <AlertTriangle className="w-7 h-7" /> : <Trash2 className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-red-600 dark:text-red-400">
              {t.safeDeleteTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {targetNames.length === 1 ? targetNames[0] : `${targetNames.length} items selected`}
            </p>
          </div>
        </div>

        {/* Informative Explanation */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm flex flex-col gap-2">
          {isPermanent ? (
            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 font-medium">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p>{t.safeDeletePermanentPrompt}</p>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
              <RotateCcw className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p>{t.safeDeleteRecyclePrompt}</p>
            </div>
          )}
        </div>

        {/* Double-confirmation checkbox for removable drives */}
        {isPermanent && (
          <label className="flex items-center gap-3 p-3 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmedRemovable}
              onChange={(e) => setConfirmedRemovable(e.target.checked)}
              className="w-5 h-5 rounded text-red-600 accent-red-600"
            />
            <span className="text-sm font-bold text-red-800 dark:text-red-300">
              {t.permanentDeleteCheckbox}
            </span>
          </label>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={() => onConfirm(isPermanent)}
            disabled={isPermanent && !confirmedRemovable}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold shadow-md shadow-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
          >
            {t.deleteButton}
          </button>
        </div>

      </div>
    </div>
  );
};
