import React from 'react';
import { ViewMode } from '../../types';
import {
  FolderOpen,
  Copy,
  Scissors,
  ClipboardPaste,
  Edit2,
  Trash2,
  FolderPlus,
  RotateCcw,
  LayoutGrid,
  List,
  Image,
  Star,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Language, translations } from '../../i18n';

interface ActionToolbarProps {
  selectedCount: number;
  hasClipboard: boolean;
  onOpenSelected: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onRename: () => void;
  onDelete: () => void;
  onNewFolder: () => void;
  onUndo: () => void;
  onToggleFavorite: () => void;
  onTogglePreview: () => void;
  isPreviewOpen: boolean;
  canUndo?: boolean;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  showHidden: boolean;
  onToggleShowHidden: () => void;
  language: Language;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  selectedCount,
  hasClipboard,
  onOpenSelected,
  onCopy,
  onCut,
  onPaste,
  onRename,
  onDelete,
  onNewFolder,
  onUndo,
  onToggleFavorite,
  onTogglePreview,
  isPreviewOpen,
  viewMode,
  onChangeViewMode,
  showHidden,
  onToggleShowHidden,
  language,
}) => {
  const t = translations[language] || translations.en;

  return (
    <div className="h-16 min-h-[64px] max-h-[64px] shrink-0 flex-none px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto overflow-y-hidden select-none shadow-2xs whitespace-nowrap">
      
      {/* Primary Actions Group */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Open Button */}
        <button
          type="button"
          onClick={onOpenSelected}
          disabled={selectedCount === 0}
          className="h-11 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 shrink-0"
          title="Open selected item (Enter)"
        >
          <FolderOpen className="w-5 h-5 shrink-0" />
          <span>{t.open}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-blue-800/60 text-blue-100">↵</kbd>
        </button>

        {/* Preview Inspector Button */}
        <button
          type="button"
          onClick={onTogglePreview}
          disabled={selectedCount !== 1}
          className={`h-11 px-3.5 rounded-xl border-2 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0 ${
            isPreviewOpen
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
          }`}
          title="Inspect file preview (Spacebar)"
        >
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>Preview</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Space</kbd>
        </button>

        {/* Copy Button */}
        <button
          type="button"
          onClick={onCopy}
          disabled={selectedCount === 0}
          className="h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0"
          title="Copy selected item (Ctrl+C)"
        >
          <Copy className="w-4 h-4 text-blue-500 shrink-0" />
          <span>{t.copy}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">^C</kbd>
        </button>

        {/* Move / Cut Button */}
        <button
          type="button"
          onClick={onCut}
          disabled={selectedCount === 0}
          className="h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0"
          title="Move selected item (Ctrl+X)"
        >
          <Scissors className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{t.move}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">^X</kbd>
        </button>

        {/* Paste Button */}
        <button
          type="button"
          onClick={onPaste}
          disabled={!hasClipboard}
          className="h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0"
          title="Paste copied or moved item (Ctrl+V)"
        >
          <ClipboardPaste className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t.paste}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">^V</kbd>
        </button>

        {/* Rename Button */}
        <button
          type="button"
          onClick={onRename}
          disabled={selectedCount !== 1}
          className="h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0"
          title="Rename selected item (F2)"
        >
          <Edit2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{t.rename}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">F2</kbd>
        </button>

        {/* Safe Delete Button (Clearly Guarded) */}
        <button
          type="button"
          onClick={onDelete}
          disabled={selectedCount === 0}
          className="h-11 px-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors shrink-0"
          title="Safely delete selected item (Delete)"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{t.delete}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-200">Del</kbd>
        </button>

        {/* New Folder Button */}
        <button
          type="button"
          onClick={onNewFolder}
          className="h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors shrink-0"
          title="Create a new folder here (Ctrl+Shift+N)"
        >
          <FolderPlus className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{t.newFolder}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">^⇧N</kbd>
        </button>

        {/* Add to Favorites Button */}
        {selectedCount === 1 && (
          <button
            type="button"
            onClick={onToggleFavorite}
            className="h-11 px-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 transition-colors shrink-0"
            title="Pin folder to favorites (Ctrl+D)"
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span className="hidden sm:inline">Favorite</span>
            <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">^D</kbd>
          </button>
        )}

        {/* Undo Button */}
        <button
          type="button"
          onClick={onUndo}
          className="h-11 px-3 rounded-xl border-2 border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1.5 transition-colors shrink-0"
          title="Undo last file operation (Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{t.undo}</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">^Z</kbd>
        </button>

        {/* Show / Hide Hidden Files Toggle */}
        <button
          type="button"
          onClick={onToggleShowHidden}
          className={`h-11 px-3 rounded-xl border-2 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 ${
            showHidden
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
          title="Show or hide hidden Windows files (Ctrl+H)"
        >
          {showHidden ? <Eye className="w-4 h-4 shrink-0" /> : <EyeOff className="w-4 h-4 shrink-0" />}
          <span className="hidden md:inline">Hidden</span>
          <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">^H</kbd>
        </button>
      </div>

      {/* View Toggle Group */}
      <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onChangeViewMode('cards')}
          className={`h-9 px-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
            viewMode === 'cards'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          title="Big Tiles view (Ctrl+1)"
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t.viewCards}</span>
          <kbd className="text-[9px] font-mono opacity-60">^1</kbd>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('list')}
          className={`h-9 px-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
            viewMode === 'list'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          title="List view with details (Ctrl+2)"
        >
          <List className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t.viewList}</span>
          <kbd className="text-[9px] font-mono opacity-60">^2</kbd>
        </button>

        <button
          type="button"
          onClick={() => onChangeViewMode('grid')}
          className={`h-9 px-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
            viewMode === 'grid'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
          title="Photo & thumbnail grid (Ctrl+3)"
        >
          <Image className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t.viewGrid}</span>
          <kbd className="text-[9px] font-mono opacity-60">^3</kbd>
        </button>
      </div>

    </div>
  );
};
