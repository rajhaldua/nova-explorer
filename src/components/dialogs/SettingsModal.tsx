import React from 'react';
import { AppMode, FontSize, ThemeMode } from '../../types';
import { Settings, Sparkles, Type, Sun, Moon, Globe, Contrast, BookOpen, Compass, Zap, Check, X } from 'lucide-react';
import { Language, translations } from '../../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  fontSize: FontSize;
  onSelectFontSize: (size: FontSize) => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  appMode,
  onSelectMode,
  fontSize,
  onSelectFontSize,
  theme,
  onSelectTheme,
  language,
  onSelectLanguage,
}) => {
  const t = translations[language] || translations.en;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 border-2 border-slate-300 dark:border-slate-700 flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {t.settings}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>Close</span>
          </button>
        </div>

        {/* Section 1: Display Mode */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Operating Mode:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSelectMode('simple')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                appMode === 'simple'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              <span className="text-base font-extrabold block text-slate-900 dark:text-white">{t.simpleMode}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">
                Extra-large buttons, clean layout, fewer choices
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('advanced')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                appMode === 'advanced'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              <span className="text-base font-extrabold block text-slate-900 dark:text-white">{t.advancedMode}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">
                Browser tabs, detailed columns, drive statistics
              </span>
            </button>
          </div>
        </div>

        {/* Section 2: Text Size */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-500" />
            {t.textSize}:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'normal', label: t.normalText, sizeClass: 'text-sm' },
              { id: 'large', label: t.largeText, sizeClass: 'text-base font-bold' },
              { id: 'extra-large', label: t.extraLargeText, sizeClass: 'text-lg font-extrabold' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFontSize(f.id as FontSize)}
                className={`py-3 px-3 rounded-xl border-2 text-center transition-all ${
                  fontSize === f.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={f.sizeClass}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Color Theme */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            {t.theme}:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'light' as ThemeMode,
                name: t.lightTheme,
                desc: 'Soft daylight, classic clean colors',
                icon: Sun,
                iconColor: 'text-amber-500',
              },
              {
                id: 'dark' as ThemeMode,
                name: t.darkTheme,
                desc: 'Gentle night slate, low glare & fatigue',
                icon: Moon,
                iconColor: 'text-blue-400',
              },
              {
                id: 'black-and-white' as ThemeMode,
                name: t.blackAndWhiteTheme,
                desc: 'Pure crisp monochrome black & white',
                icon: Contrast,
                iconColor: 'text-black dark:text-white',
              },
              {
                id: 'warm-amber' as ThemeMode,
                name: t.warmAmberTheme,
                desc: 'Parchment paper warmth, blocks blue light',
                icon: BookOpen,
                iconColor: 'text-amber-600',
              },
              {
                id: 'cool-ocean' as ThemeMode,
                name: t.coolOceanTheme,
                desc: 'Deep marine slate with ice-blue clarity',
                icon: Compass,
                iconColor: 'text-sky-400',
              },
              {
                id: 'high-contrast' as ThemeMode,
                name: t.highContrastTheme,
                desc: 'Vivid yellow on pitch black (WCAG AAA)',
                icon: Zap,
                iconColor: 'text-yellow-400',
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTheme(item.id)}
                  className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-500 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold block truncate">{item.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{item.desc}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Language */}
        <div className="flex flex-col gap-2">
          <label className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            {t.language}:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'en', label: 'English' },
              { id: 'zh-CN', label: '简体中文' },
              { id: 'zh-TW', label: '繁體中文' },
              { id: 'ja', label: '日本語' },
              { id: 'id', label: 'Bahasa Indonesia' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => onSelectLanguage(lang.id as Language)}
                className={`p-2.5 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                  language === lang.id
                    ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
