import React from 'react';
import { AppMode, FontSize, ThemeMode } from '../../types';
import { FolderHeart, Settings, Sun, Moon, Sparkles, Contrast, BookOpen, Compass, Zap, ExternalLink } from 'lucide-react';
import { translations, Language } from '../../i18n';

interface TitleBarProps {
  appMode: AppMode;
  onToggleMode: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  fontSize: FontSize;
  onCycleFontSize: () => void;
  onOpenSettings: () => void;
  onSwitchToExplorer: () => void;
  language: Language;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  appMode,
  onToggleMode,
  theme,
  onToggleTheme,
  fontSize,
  onCycleFontSize,
  onOpenSettings,
  onSwitchToExplorer,
  language,
}) => {
  const t = translations[language] || translations.en;

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'dark':
        return <Moon className="w-5 h-5 text-blue-400" />;
      case 'black-and-white':
        return <Contrast className="w-5 h-5 text-black dark:text-white" />;
      case 'warm-amber':
        return <BookOpen className="w-5 h-5 text-amber-600" />;
      case 'cool-ocean':
        return <Compass className="w-5 h-5 text-sky-400" />;
      case 'high-contrast':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      default:
        return <Sun className="w-5 h-5 text-amber-500" />;
    }
  };

  const getThemeTitle = () => {
    switch (theme) {
      case 'light': return t.lightTheme;
      case 'dark': return t.darkTheme;
      case 'black-and-white': return t.blackAndWhiteTheme;
      case 'warm-amber': return t.warmAmberTheme;
      case 'cool-ocean': return t.coolOceanTheme;
      case 'high-contrast': return t.highContrastTheme;
      default: return t.theme;
    }
  };

  return (
    <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none shadow-xs">
      
      {/* Brand & Mode Indicator */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
          <FolderHeart className="w-6 h-6" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            {t.appName}
          </span>
        </div>

        {/* Mode Toggle Button */}
        <button
          type="button"
          onClick={onToggleMode}
          className={`ml-3 px-3.5 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border transition-all ${
            appMode === 'simple'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
              : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100'
          }`}
          title="Click to toggle between Simple Mode and Advanced Mode"
        >
          <Sparkles className="w-4 h-4" />
          <span>{appMode === 'simple' ? t.simpleMode : t.advancedMode}</span>
          <span className="text-xs opacity-75 font-normal">(Click to switch)</span>
        </button>
      </div>

      {/* Quick Accessibility & Settings Controls */}
      <div className="flex items-center gap-2">
        {/* Font Size Cycle Button */}
        <button
          type="button"
          onClick={onCycleFontSize}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          title="Change text size (Normal / Large / Extra Large)"
          aria-label="Change text size"
        >
          <span className="text-base font-extrabold">A</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
            {fontSize === 'normal' ? '18px' : fontSize === 'large' ? '21px' : '24px'}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={`Switch color theme (Current: ${getThemeTitle()})`}
          aria-label={`Switch color theme (Current: ${getThemeTitle()})`}
        >
          {getThemeIcon()}
        </button>

        {/* Switch back to regular Windows Explorer */}
        <button
          type="button"
          onClick={onSwitchToExplorer}
          className="px-3.5 py-1.5 rounded-xl border-2 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 font-bold text-sm flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          title={t.switchToExplorerTooltip || "Switch back to regular Windows Explorer"}
          aria-label={t.switchToExplorerTooltip || "Switch back to regular Windows Explorer"}
        >
          <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
          <span className="hidden sm:inline font-black">{t.switchToExplorer || "Windows Explorer"}</span>
        </button>

        {/* Full Settings Modal Trigger */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Open Settings"
          aria-label="Open Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

    </header>
  );
};
