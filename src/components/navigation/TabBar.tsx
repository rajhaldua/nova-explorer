import React from 'react';
import { TabItem } from '../../types';
import { Plus, X, Pin, Folder } from 'lucide-react';

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onTogglePinTab: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTogglePinTab,
}) => {
  return (
    <div className="h-10 px-3 bg-slate-200/80 dark:bg-slate-950 flex items-center gap-1 overflow-x-auto border-b border-slate-300 dark:border-slate-800 select-none">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group h-8 px-3 rounded-t-lg flex items-center gap-2 cursor-pointer border-t-2 transition-all ${
              isActive
                ? 'bg-white dark:bg-slate-900 border-blue-600 font-bold text-slate-900 dark:text-white shadow-xs'
                : 'bg-slate-100/60 dark:bg-slate-900/40 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs truncate max-w-28">{tab.title || 'Folder'}</span>
            
            {/* Pin Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinTab(tab.id);
              }}
              className={`p-0.5 rounded-sm hover:text-blue-500 ${tab.isPinned ? 'text-blue-600 opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
              title={tab.isPinned ? 'Unpin tab' : 'Pin tab'}
            >
              <Pin className="w-3 h-3" />
            </button>

            {/* Close Tab (if more than 1 tab and not pinned) */}
            {tabs.length > 1 && !tab.isPinned && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 opacity-60 group-hover:opacity-100"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNewTab}
        className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300/50 dark:hover:bg-slate-800 transition-colors"
        title="Open new tab"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
