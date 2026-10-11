import React from 'react';
import { FileEntry } from '../../types';
import {
  Folder,
  FileText,
  Image,
  Music,
  Film,
  FileArchive,
  FileCode,
  File,
} from 'lucide-react';
import { Language, translations } from '../../i18n';

interface FileGridViewProps {
  entries: FileEntry[];
  selectedPaths: string[];
  thumbnails?: Record<string, string>;
  onSelect: (path: string, multi: boolean) => void;
  onOpen: (entry: FileEntry) => void;
  isPhotoGrid: boolean;
  language: Language;
}

export const FileGridView: React.FC<FileGridViewProps> = ({
  entries,
  selectedPaths,
  thumbnails,
  onSelect,
  onOpen,
  isPhotoGrid,
  language,
}) => {
  const t = translations[language] || translations.en;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.is_dir) {
      return <Folder className="w-12 h-12 text-amber-500 shrink-0" />;
    }
    const ext = entry.extension.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return <Image className="w-12 h-12 text-purple-500 shrink-0" />;
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      return <Music className="w-12 h-12 text-pink-500 shrink-0" />;
    }
    if (['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(ext)) {
      return <Film className="w-12 h-12 text-rose-500 shrink-0" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="w-12 h-12 text-yellow-600 shrink-0" />;
    }
    if (['txt', 'doc', 'docx', 'pdf', 'rtf', 'odt'].includes(ext)) {
      return <FileText className="w-12 h-12 text-blue-500 shrink-0" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'rs', 'py'].includes(ext)) {
      return <FileCode className="w-12 h-12 text-emerald-500 shrink-0" />;
    }
    return <File className="w-12 h-12 text-slate-400 shrink-0" />;
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto select-none">
      {entries.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Folder className="w-16 h-16 stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-lg font-bold">{t.emptyFolder}</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          isPhotoGrid
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {entries.map((entry) => {
            const isSelected = selectedPaths.includes(entry.path);
            const thumb = thumbnails?.[entry.path];

            return (
              <div
                key={entry.path}
                onClick={(e) => onSelect(entry.path, e.ctrlKey || e.metaKey)}
                onDoubleClick={() => onOpen(entry)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center justify-between gap-2.5 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                }`}
              >
                {/* Thumbnail / Icon Container */}
                <div className={`w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shadow-inner ${
                  isPhotoGrid ? 'h-36' : 'h-24'
                }`}>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    getFileIcon(entry)
                  )}
                </div>

                {/* Name & Size */}
                <div className="w-full">
                  <h4 className="font-black text-base text-slate-950 dark:text-white truncate w-full tracking-tight" title={entry.name}>
                    {entry.name}
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    {entry.is_dir ? 'Folder' : formatSize(entry.size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
