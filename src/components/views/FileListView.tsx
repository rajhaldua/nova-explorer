import React from 'react';
import { FileEntry, SortField, SortOrder } from '../../types';
import {
  Folder,
  FileText,
  Image,
  Music,
  Film,
  FileArchive,
  FileCode,
  File,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Language, translations } from '../../i18n';

interface FileListViewProps {
  entries: FileEntry[];
  selectedPaths: string[];
  thumbnails?: Record<string, string>;
  onSelect: (path: string, multi: boolean) => void;
  onOpen: (entry: FileEntry) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  language: Language;
}

export const FileListView: React.FC<FileListViewProps> = ({
  entries,
  selectedPaths,
  thumbnails,
  onSelect,
  onOpen,
  sortField,
  sortOrder,
  onSort,
  language,
}) => {
  const t = translations[language] || translations.en;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.is_dir) {
      return <Folder className="w-6 h-6 text-amber-500 shrink-0" />;
    }

    const thumb = thumbnails?.[entry.path];
    if (thumb) {
      return (
        <img
          src={thumb}
          alt={entry.name}
          className="w-7 h-7 object-cover rounded-md shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
          loading="lazy"
        />
      );
    }

    const ext = entry.extension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return <Image className="w-6 h-6 text-purple-500 shrink-0" />;
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      return <Music className="w-6 h-6 text-pink-500 shrink-0" />;
    }
    if (['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(ext)) {
      return <Film className="w-6 h-6 text-rose-500 shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="w-6 h-6 text-yellow-600 shrink-0" />;
    }
    if (['txt', 'doc', 'docx', 'pdf', 'rtf', 'odt'].includes(ext)) {
      return <FileText className="w-6 h-6 text-blue-500 shrink-0" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'rs', 'py'].includes(ext)) {
      return <FileCode className="w-6 h-6 text-emerald-500 shrink-0" />;
    }
    return <File className="w-6 h-6 text-slate-400 shrink-0" />;
  };

  return (
    <div className="w-full h-full overflow-y-auto select-none">
      {entries.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Folder className="w-16 h-16 stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-lg font-bold">{t.emptyFolder}</p>
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          {/* Header */}
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shadow-2xs">
            <tr className="text-xs uppercase font-extrabold text-slate-500 dark:text-slate-400">
              <th
                onClick={() => onSort('name')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.name}</span>
                  {sortField === 'name' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => onSort('modified')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors hidden sm:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>{t.dateModified}</span>
                  {sortField === 'modified' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => onSort('type')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors hidden md:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>{t.type}</span>
                  {sortField === 'type' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => onSort('size')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>{t.size}</span>
                  {sortField === 'size' && (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
              </th>
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody>
            {entries.map((entry) => {
              const isSelected = selectedPaths.includes(entry.path);
              return (
                <tr
                  key={entry.path}
                  onClick={(e) => onSelect(entry.path, e.ctrlKey || e.metaKey)}
                  onDoubleClick={() => onOpen(entry)}
                  className={`border-b border-slate-100 dark:border-slate-800/60 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-100 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                  }`}
                  style={{ height: 'var(--control-height)' }}
                >
                  {/* Name column */}
                  <td className="py-2 px-4 flex items-center gap-3">
                    {getFileIcon(entry)}
                    <span className="truncate font-semibold">{entry.name}</span>
                  </td>

                  {/* Date modified */}
                  <td className="py-2 px-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {formatDate(entry.modified)}
                  </td>

                  {/* Type */}
                  <td className="py-2 px-4 text-sm text-slate-500 dark:text-slate-400 capitalize hidden md:table-cell">
                    {entry.is_dir ? 'Folder' : entry.extension ? `${entry.extension.toUpperCase()} File` : 'File'}
                  </td>

                  {/* Size */}
                  <td className="py-2 px-4 text-sm text-slate-500 dark:text-slate-400 text-right font-mono">
                    {formatSize(entry.size)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
