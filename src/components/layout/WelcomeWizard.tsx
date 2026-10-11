import React, { useState } from 'react';
import { AppMode, FontSize } from '../../types';
import { translations, Language } from '../../i18n';
import { FolderCheck, Sparkles, Type, Check } from 'lucide-react';

interface WelcomeWizardProps {
  onComplete: (mode: AppMode, fontSize: FontSize) => void;
  language: Language;
}

export const WelcomeWizard: React.FC<WelcomeWizardProps> = ({ onComplete, language }) => {
  const [selectedMode, setSelectedMode] = useState<AppMode>('simple');
  const [selectedFont, setSelectedFont] = useState<FontSize>('large');
  const t = translations[language] || translations.en;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl max-w-2xl w-full p-8 border-2 border-blue-500/30 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <FolderCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
            {t.welcomeTitle}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Step 1: Mode Choice */}
        <div className="flex flex-col gap-3">
          <label className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {t.welcomePrompt}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Simple Mode Option */}
            <button
              type="button"
              onClick={() => setSelectedMode('simple')}
              className={`p-5 rounded-2xl border-3 text-left transition-all flex flex-col gap-2 relative ${
                selectedMode === 'simple'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {t.simpleMode} (Recommended)
                </span>
                {selectedMode === 'simple' && (
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Extra-large buttons, big picture tiles, common locations, and clear safeguards. Perfect for everyday simplicity.
              </p>
            </button>

            {/* Advanced Mode Option */}
            <button
              type="button"
              onClick={() => setSelectedMode('advanced')}
              className={`p-5 rounded-2xl border-3 text-left transition-all flex flex-col gap-2 relative ${
                selectedMode === 'advanced'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {t.advancedMode}
                </span>
                {selectedMode === 'advanced' && (
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Browser tabs, multi-column sorting, drive details, and tags while maintaining accessible sizing.
              </p>
            </button>
          </div>
        </div>

        {/* Step 2: Text Size */}
        <div className="flex flex-col gap-3">
          <label className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-500" />
            {t.textSize}:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'normal', label: t.normalText, sizeClass: 'text-base' },
              { id: 'large', label: t.largeText, sizeClass: 'text-lg font-semibold' },
              { id: 'extra-large', label: t.extraLargeText, sizeClass: 'text-xl font-bold' },
            ].map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => setSelectedFont(font.id as FontSize)}
                className={`py-3 px-4 rounded-xl border-2 text-center transition-all ${
                  selectedFont === font.id
                    ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/60 font-bold text-blue-800 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className={font.sizeClass}>{font.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => onComplete(selectedMode, selectedFont)}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl text-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <span>{t.getStarted}</span>
            <FolderCheck className="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>
  );
};
