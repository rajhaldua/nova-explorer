import { useEffect, useState } from 'react';
import { AppMode, FontSize, ThemeMode } from '../types';
import { Language, translations } from '../i18n';
import { tauriApi } from '../api/tauriApi';

export function usePreferences() {
  const [appMode, setAppMode] = useState<AppMode>('simple');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [language, setLanguage] = useState<Language>('en');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load from SQLite on mount
  useEffect(() => {
    async function load() {
      try {
        const storedOnboarded = await tauriApi.getSetting('has_onboarded');
        if (storedOnboarded === null) {
          setHasCompletedOnboarding(false);
        } else {
          setHasCompletedOnboarding(storedOnboarded === 'true');
        }

        const storedMode = await tauriApi.getSetting('app_mode');
        if (storedMode === 'simple' || storedMode === 'advanced') {
          setAppMode(storedMode);
        }

        const storedFont = await tauriApi.getSetting('font_size');
        if (storedFont === 'normal' || storedFont === 'large' || storedFont === 'extra-large') {
          setFontSize(storedFont);
        }

        const storedTheme = await tauriApi.getSetting('theme');
        if (
          storedTheme === 'light' ||
          storedTheme === 'dark' ||
          storedTheme === 'black-and-white' ||
          storedTheme === 'warm-amber' ||
          storedTheme === 'cool-ocean' ||
          storedTheme === 'high-contrast'
        ) {
          setTheme(storedTheme as ThemeMode);
        }

        const storedLang = await tauriApi.getSetting('language');
        if (storedLang && storedLang in translations) {
          setLanguage(storedLang as Language);
        }
      } catch (err) {
        console.warn('Could not load preferences from SQLite, using defaults:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Sync to DOM root
  useEffect(() => {
    const root = document.documentElement;

    // Theme & Contrast
    root.setAttribute('data-theme', theme);

    if (theme === 'dark' || theme === 'cool-ocean' || theme === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (theme === 'black-and-white') {
      root.setAttribute('data-contrast', 'monochrome');
    } else if (theme === 'high-contrast') {
      root.setAttribute('data-contrast', 'high');
    } else {
      root.removeAttribute('data-contrast');
    }

    // Font size & Control targets
    let fontPx = '18px';
    let controlPx = '44px';
    if (fontSize === 'large') {
      fontPx = '21px';
      controlPx = '50px';
    } else if (fontSize === 'extra-large') {
      fontPx = '24px';
      controlPx = '56px';
    }

    root.style.setProperty('--font-base', fontPx);
    root.style.setProperty('--control-height', controlPx);
  }, [theme, fontSize]);

  const updateAppMode = (mode: AppMode) => {
    setAppMode(mode);
    tauriApi.setSetting('app_mode', mode).catch(console.error);
  };

  const updateFontSize = (size: FontSize) => {
    setFontSize(size);
    tauriApi.setSetting('font_size', size).catch(console.error);
  };

  const updateTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    tauriApi.setSetting('theme', newTheme).catch(console.error);
  };

  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    tauriApi.setSetting('language', lang).catch(console.error);
  };

  const completeOnboarding = (chosenMode: AppMode, chosenFontSize: FontSize) => {
    setAppMode(chosenMode);
    setFontSize(chosenFontSize);
    setHasCompletedOnboarding(true);
    tauriApi.setSetting('has_onboarded', 'true').catch(console.error);
    tauriApi.setSetting('app_mode', chosenMode).catch(console.error);
    tauriApi.setSetting('font_size', chosenFontSize).catch(console.error);
  };

  const t = translations[language] || translations.en;

  return {
    appMode,
    updateAppMode,
    fontSize,
    updateFontSize,
    theme,
    updateTheme,
    language,
    updateLanguage,
    hasCompletedOnboarding,
    completeOnboarding,
    isLoading,
    t,
  };
}
