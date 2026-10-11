import React from 'react';
import { SpecialFolders, ThemeMode } from '../../types';
import { Monitor, FileText, Download, Image, Music, Film, ArrowRight } from 'lucide-react';
import { Language, translations } from '../../i18n';

interface HomeViewProps {
  specialFolders: SpecialFolders | null;
  onNavigate: (path: string) => void;
  language: Language;
  theme?: ThemeMode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  specialFolders,
  onNavigate,
  language,
  theme = 'light',
}) => {
  const t = translations[language] || translations.en;

  const isBW = theme === 'black-and-white';
  const isHighContrast = theme === 'high-contrast';
  const isWarm = theme === 'warm-amber';
  const isOcean = theme === 'cool-ocean';

  const cards = [
    {
      title: t.documents,
      subtitle: "Letters, PDF files, and receipts",
      defaultDir: "Documents",
      path: specialFolders?.documents,
      icon: FileText,
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      iconBg: "bg-blue-600 text-white",
    },
    {
      title: t.pictures,
      subtitle: "Family photos and downloaded pictures",
      defaultDir: "Pictures",
      path: specialFolders?.pictures,
      icon: Image,
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-200 dark:border-purple-800",
      text: "text-purple-800 dark:text-purple-200",
      iconBg: "bg-purple-600 text-white",
    },
    {
      title: t.downloads,
      subtitle: "Files recently downloaded from the internet",
      defaultDir: "Downloads",
      path: specialFolders?.downloads,
      icon: Download,
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-200",
      iconBg: "bg-emerald-600 text-white",
    },
    {
      title: t.desktop,
      subtitle: "Items currently sitting on your computer screen",
      defaultDir: "Desktop",
      path: specialFolders?.desktop,
      icon: Monitor,
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-200 dark:border-indigo-800",
      text: "text-indigo-800 dark:text-indigo-200",
      iconBg: "bg-indigo-600 text-white",
    },
    {
      title: t.music,
      subtitle: "Songs and audio recordings",
      defaultDir: "Music",
      path: specialFolders?.music,
      icon: Music,
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-200",
      iconBg: "bg-amber-600 text-white",
    },
    {
      title: t.videos,
      subtitle: "Home movies, video clips, and recordings",
      defaultDir: "Videos",
      path: specialFolders?.videos,
      icon: Film,
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-800",
      text: "text-rose-800 dark:text-rose-200",
      iconBg: "bg-rose-600 text-white",
    },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full select-none">
      <div className="mb-6 sm:mb-8">
        <h2 className={`text-2xl sm:text-3xl font-black ${
          isBW ? 'text-black' : isHighContrast ? 'text-yellow-300' : isWarm ? 'text-amber-950' : isOcean ? 'text-sky-100' : 'text-slate-900 dark:text-white'
        }`}>
          Where would you like to look?
        </h2>
        <p className={`text-base sm:text-lg mt-1 font-semibold ${
          isBW ? 'text-black' : isHighContrast ? 'text-white' : isWarm ? 'text-amber-900' : isOcean ? 'text-sky-300' : 'text-slate-600 dark:text-slate-300'
        }`}>
          Click any of the large cards below to open your folders.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const target = card.path || (specialFolders?.home ? `${specialFolders.home}\\${card.defaultDir}` : '');

          // Theme-tailored styles
          let cardBg = card.bg;
          let cardBorder = `border-2 ${card.border}`;
          let titleColor = card.text;
          let subtitleColor = 'text-slate-600 dark:text-slate-400';
          let iconBg = card.iconBg;
          let arrowBg = 'bg-white dark:bg-slate-800 text-slate-400 group-hover:text-blue-600';

          if (isBW) {
            cardBg = 'bg-white hover:bg-neutral-100';
            cardBorder = 'border-4 border-black';
            titleColor = 'text-black font-black';
            subtitleColor = 'text-black font-bold';
            iconBg = 'bg-black text-white';
            arrowBg = 'bg-black text-white';
          } else if (isHighContrast) {
            cardBg = 'bg-black hover:bg-neutral-900';
            cardBorder = 'border-4 border-yellow-400 hover:border-white';
            titleColor = 'text-yellow-300 font-black';
            subtitleColor = 'text-white font-semibold';
            iconBg = 'bg-black text-yellow-400 border-2 border-yellow-400';
            arrowBg = 'bg-yellow-400 text-black';
          } else if (isWarm) {
            cardBg = 'bg-[#fffdf9] hover:bg-[#faf5ea]';
            cardBorder = 'border-3 border-amber-300 hover:border-amber-600';
            titleColor = 'text-amber-950 font-black';
            subtitleColor = 'text-amber-900 font-semibold';
            iconBg = 'bg-amber-700 text-white';
            arrowBg = 'bg-amber-100 text-amber-900';
          } else if (isOcean) {
            cardBg = 'bg-[#0e2034] hover:bg-[#152d48]';
            cardBorder = 'border-3 border-sky-700 hover:border-sky-400';
            titleColor = 'text-sky-100 font-black';
            subtitleColor = 'text-sky-300 font-semibold';
            iconBg = 'bg-sky-600 text-white';
            arrowBg = 'bg-sky-900 text-sky-200';
          }

          return (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                if (target) {
                  onNavigate(target);
                }
              }}
              className={`p-6 rounded-3xl ${cardBorder} ${cardBg} text-left transition-all hover:scale-102 hover:shadow-xl active:scale-98 flex flex-col justify-between gap-6 group cursor-pointer shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center shadow-md`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className={`w-11 h-11 rounded-full ${arrowBg} flex items-center justify-center group-hover:translate-x-1.5 transition-all shadow-xs`}>
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>

              <div>
                <h3 className={`text-2xl font-black tracking-tight ${titleColor}`}>
                  {card.title}
                </h3>
                <p className={`text-sm sm:text-base mt-1.5 ${subtitleColor}`}>
                  {card.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
