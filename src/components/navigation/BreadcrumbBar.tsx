import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ChevronRight as BreadcrumbSeparator, Edit3, Check, Search, X, Home } from 'lucide-react';
import { Language, translations } from '../../i18n';

interface BreadcrumbBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
  canGoForward: boolean;
  onGoForward: () => void;
  canGoUp: boolean;
  onGoUp: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  language: Language;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  currentPath,
  onNavigate,
  canGoBack,
  onGoBack,
  canGoForward,
  onGoForward,
  canGoUp,
  onGoUp,
  searchQuery,
  onSearchChange,
  language,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputPath, setInputPath] = useState('');
  const t = translations[language] || translations.en;

  const handleStartEdit = () => {
    setInputPath(currentPath);
    setIsEditing(true);
  };

  const handleFinishEdit = () => {
    setIsEditing(false);
    if (inputPath.trim() && inputPath.trim() !== currentPath) {
      onNavigate(inputPath.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Split path into segments
  const segments: { name: string; fullPath: string }[] = [];
  if (currentPath) {
    const parts = currentPath.split(/[\\/]/).filter(Boolean);
    let accum = '';
    parts.forEach((part, idx) => {
      if (idx === 0 && part.includes(':')) {
        accum = part + '\\';
      } else {
        accum = accum.endsWith('\\') ? accum + part : accum + '\\' + part;
      }
      segments.push({ name: part, fullPath: accum });
    });
  }

  return (
    <div className="h-14 px-4 bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 select-none">
      
      {/* Navigation Buttons: Home, Back, Forward, Up */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('')}
          className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 font-bold text-sm transition-colors shadow-2xs ${
            !currentPath
              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title={t.home}
          aria-label={t.home}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">{t.home}</span>
        </button>

        <button
          type="button"
          onClick={onGoBack}
          disabled={!canGoBack}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          title={t.back}
          aria-label={t.back}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onGoForward}
          disabled={!canGoForward}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          title={t.forward}
          aria-label={t.forward}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onGoUp}
          disabled={!canGoUp}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
          title={t.up}
          aria-label={t.up}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>

      {/* Path Display / Breadcrumbs */}
      <div className="grow flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 h-10 px-2.5 overflow-hidden shadow-2xs">
        {isEditing ? (
          <div className="flex items-center w-full gap-2">
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="grow bg-transparent text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden"
              placeholder="C:\Folder\Subfolder"
            />
            <button
              type="button"
              onClick={handleFinishEdit}
              className="p-1 text-blue-600 hover:text-blue-700"
              title="Navigate to path"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center grow overflow-x-auto no-scrollbar gap-1 py-1">
            {segments.length === 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-sm bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                <Home className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{t.home}</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('')}
                  className="px-2 py-0.5 rounded-md font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 shrink-0 transition-colors"
                >
                  <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t.home}</span>
                </button>
                <BreadcrumbSeparator className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {segments.map((seg, idx) => (
                  <React.Fragment key={seg.fullPath}>
                    {idx > 0 && (
                      <BreadcrumbSeparator className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate(seg.fullPath)}
                      className={`px-2 py-0.5 rounded-md font-semibold text-sm shrink-0 transition-colors ${
                        idx === segments.length - 1
                          ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {seg.name}
                    </button>
                  </React.Fragment>
                ))}
              </>
            )}
            <button
              type="button"
              onClick={handleStartEdit}
              className="ml-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
              title="Type a folder path directly"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Live Search Input */}
      <div className="w-56 sm:w-72 relative shrink-0">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};
