import { useCallback, useEffect, useState } from 'react';
import { FavoriteItem, FileEntry, SortField, SortOrder, SpecialFolders, TabItem, TagItem, ViewMode, VolumeInfo } from '../types';
import { tauriApi } from '../api/tauriApi';

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [specialFolders, setSpecialFolders] = useState<SpecialFolders | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Navigation history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Tabs
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'tab-1', path: '', title: 'Home', isPinned: false, history: [], historyIndex: -1 }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showHidden, setShowHidden] = useState<boolean>(false);

  // Selection & Clipboard
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<{ mode: 'copy' | 'cut'; paths: string[] } | null>(null);

  // Load initial environment: special folders & volumes
  useEffect(() => {
    async function init() {
      try {
        const [folders, vols, favs, tagList] = await Promise.all([
          tauriApi.getSpecialFolders(),
          tauriApi.listVolumes(),
          tauriApi.getFavorites(),
          tauriApi.getTags(),
        ]);
        setSpecialFolders(folders);
        setVolumes(vols);
        setFavorites(favs);
        setTags(tagList);

        // Start at Home screen by default so elderly users see the large destination cards
        navigateTo('', true);
      } catch (err: any) {
        console.error('Failed to initialize filesystem:', err);
        setErrorMessage(typeof err === 'string' ? err : 'Could not detect computer folders.');
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Fetch directory entries when currentPath changes
  const refreshDirectory = useCallback(async (path: string = currentPath) => {
    if (!path) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const items = await tauriApi.listDirectory(path, showHidden);
      setEntries(items);
      setSelectedPaths([]);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : 'Unable to open folder. Please check your permissions.';
      setErrorMessage(msg);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, showHidden]);

  useEffect(() => {
    if (currentPath) {
      refreshDirectory(currentPath);
    } else {
      setEntries([]);
      setIsLoading(false);
    }
  }, [currentPath, showHidden]);

  // Navigate to path
  const navigateTo = useCallback((targetPath: string, replace = false) => {
    const isHome = !targetPath || targetPath === 'home';
    const resolvedPath = isHome ? '' : targetPath;

    setSearchQuery('');
    setErrorMessage(null);

    setHistory((prev) => {
      if (replace) {
        return [resolvedPath];
      }
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(resolvedPath);
      return newHistory;
    });

    setHistoryIndex((prev) => (replace ? 0 : prev + 1));
    setCurrentPath(resolvedPath);

    if (isHome) {
      setEntries([]);
      setSelectedPaths([]);
      setIsLoading(false);
    }

    // Update active tab title
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeTabId) {
          if (isHome) {
            return { ...t, path: '', title: 'Home' };
          }
          const parts = resolvedPath.split(/[\\/]/).filter(Boolean);
          const title = parts.length > 0 ? parts[parts.length - 1] : resolvedPath;
          return { ...t, path: resolvedPath, title };
        }
        return t;
      })
    );
  }, [historyIndex, activeTabId]);

  // Back
  const canGoBack = historyIndex > 0;
  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevPath = history[newIndex];
      setCurrentPath(prevPath);
      if (!prevPath) {
        setEntries([]);
        setSelectedPaths([]);
        setIsLoading(false);
      }
    }
  }, [canGoBack, historyIndex, history]);

  // Forward
  const canGoForward = historyIndex < history.length - 1;
  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextPath = history[newIndex];
      setCurrentPath(nextPath);
      if (!nextPath) {
        setEntries([]);
        setSelectedPaths([]);
        setIsLoading(false);
      }
    }
  }, [canGoForward, historyIndex, history]);

  // Up One Level
  const canGoUp = currentPath.length > 0;
  const goUp = useCallback(() => {
    if (!currentPath) return;
    const normalized = currentPath.replace(/[\\/]+$/, '');
    const lastSlash = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'));
    if (lastSlash > 0) {
      const parent = normalized.substring(0, lastSlash);
      navigateTo(parent.endsWith(':') ? parent + '\\' : parent);
    } else if (lastSlash === 2 && normalized.charAt(1) === ':') {
      navigateTo(normalized.substring(0, 3));
    } else {
      navigateTo('');
    }
  }, [currentPath, navigateTo]);

  // Filter & Sort entries
  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    return e.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    // Directories always on top
    if (a.is_dir && !b.is_dir) return -1;
    if (!a.is_dir && b.is_dir) return 1;

    let comp = 0;
    if (sortField === 'name') {
      comp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortField === 'size') {
      comp = a.size - b.size;
    } else if (sortField === 'modified') {
      comp = (a.modified || 0) - (b.modified || 0);
    } else if (sortField === 'type') {
      comp = a.extension.localeCompare(b.extension);
    }

    return sortOrder === 'asc' ? comp : -comp;
  });

  // Toggle selection
  const toggleSelect = (path: string, multi = false) => {
    if (!multi) {
      setSelectedPaths([path]);
    } else {
      setSelectedPaths((prev) =>
        prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
      );
    }
  };

  const clearSelection = () => setSelectedPaths([]);

  // Clipboard operations
  const setCopy = (paths: string[]) => setClipboard({ mode: 'copy', paths });
  const setCut = (paths: string[]) => setClipboard({ mode: 'cut', paths });

  // Add & remove favorites
  const addFavorite = async (path: string, label: string) => {
    await tauriApi.addFavorite(path, label);
    const favs = await tauriApi.getFavorites();
    setFavorites(favs);
  };

  const removeFavorite = async (id: string) => {
    await tauriApi.removeFavorite(id);
    const favs = await tauriApi.getFavorites();
    setFavorites(favs);
  };

  // Check if current path is on a removable USB drive
  const isCurrentDriveRemovable = Boolean(
    volumes.find((v) => currentPath.toUpperCase().startsWith(v.mount_point.toUpperCase()))?.is_removable
  );

  return {
    currentPath,
    setCurrentPath,
    entries: sortedEntries,
    rawEntriesCount: entries.length,
    volumes,
    specialFolders,
    favorites,
    tags,
    isLoading,
    errorMessage,
    navigateTo,
    refreshDirectory,
    canGoBack,
    goBack,
    canGoForward,
    goForward,
    canGoUp,
    goUp,
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    showHidden,
    setShowHidden,
    selectedPaths,
    toggleSelect,
    clearSelection,
    clipboard,
    setCopy,
    setCut,
    addFavorite,
    removeFavorite,
    isCurrentDriveRemovable,
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
  };
}
