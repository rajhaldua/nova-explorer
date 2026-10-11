import React from 'react';
import { FavoriteItem, SpecialFolders, TagItem, VolumeInfo } from '../../types';
import {
  Home,
  Monitor,
  FileText,
  Download,
  Image,
  Music,
  Film,
  HardDrive,
  Usb,
  Star,
  Tag,
  Trash2,
  Folder,
} from 'lucide-react';
import { Language, translations } from '../../i18n';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  specialFolders: SpecialFolders | null;
  volumes: VolumeInfo[];
  favorites: FavoriteItem[];
  tags: TagItem[];
  onRemoveFavorite: (id: string) => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  specialFolders,
  volumes,
  favorites,
  tags,
  onRemoveFavorite,
  language,
}) => {
  const t = translations[language] || translations.en;

  const quickFolders = [
    { label: t.desktop, path: specialFolders?.desktop, icon: Monitor, color: 'text-indigo-500' },
    { label: t.documents, path: specialFolders?.documents, icon: FileText, color: 'text-blue-500' },
    { label: t.downloads, path: specialFolders?.downloads, icon: Download, color: 'text-emerald-500' },
    { label: t.pictures, path: specialFolders?.pictures, icon: Image, color: 'text-purple-500' },
    { label: t.music, path: specialFolders?.music, icon: Music, color: 'text-amber-500' },
    { label: t.videos, path: specialFolders?.videos, icon: Film, color: 'text-rose-500' },
  ];

  const formatGb = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const isHomeActive = !currentPath || currentPath === 'home';

  return (
    <aside className="w-64 sm:w-72 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto p-3 gap-6 select-none shrink-0">
      
      {/* Quick Access Folders */}
      <div>
        <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          {t.home}
        </h2>
        <div className="flex flex-col gap-1">
          {/* Home / Big Tiles Overview */}
          <button
            type="button"
            onClick={() => onNavigate('')}
            className={`w-full px-3 py-2.5 rounded-xl font-bold text-left flex items-center gap-3 transition-colors ${
              isHomeActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Home className={`w-5 h-5 shrink-0 ${isHomeActive ? 'text-white' : 'text-blue-500'}`} />
            <span className="truncate">{t.home}</span>
          </button>
          {quickFolders.map((item) => {
            if (!item.path) return null;
            const isActive = currentPath.toLowerCase() === item.path.toLowerCase();
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path!)}
                className={`w-full px-3 py-2.5 rounded-xl font-bold text-left flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drives & Removable USBs */}
      <div>
        <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          {t.drives}
        </h2>
        <div className="flex flex-col gap-2">
          {volumes.map((vol) => {
            const isActive = currentPath.toLowerCase().startsWith(vol.mount_point.toLowerCase());
            const percentUsed = vol.total_bytes > 0
              ? Math.min(100, Math.round((vol.used_bytes / vol.total_bytes) * 100))
              : 0;

            return (
              <button
                key={vol.mount_point}
                type="button"
                onClick={() => onNavigate(vol.mount_point)}
                className={`w-full p-2.5 rounded-xl text-left border transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {vol.is_removable ? (
                    <Usb className="w-5 h-5 text-amber-500 shrink-0" />
                  ) : (
                    <HardDrive className="w-5 h-5 text-blue-500 shrink-0" />
                  )}
                  <span className="font-bold truncate text-sm">
                    {vol.name}
                  </span>
                  {vol.is_removable && (
                    <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      USB
                    </span>
                  )}
                </div>

                {/* Storage Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden my-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentUsed > 90 ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{formatGb(vol.available_bytes)} free</span>
                  <span>{percentUsed}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pinned Favorites */}
      {favorites.length > 0 && (
        <div>
          <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {t.favorites}
          </h2>
          <div className="flex flex-col gap-1">
            {favorites.map((fav) => {
              const isActive = currentPath.toLowerCase() === fav.path.toLowerCase();
              return (
                <div
                  key={fav.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onNavigate(fav.path)}
                    className="flex items-center gap-2.5 truncate grow text-left"
                  >
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate text-sm">{fav.label}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(fav.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                    title="Remove from favorites"
                    aria-label="Remove from favorites"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            {t.tags}
          </h2>
          <div className="flex flex-col gap-1">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-semibold">{tag.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </aside>
  );
};
