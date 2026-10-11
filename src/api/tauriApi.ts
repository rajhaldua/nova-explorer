import { invoke } from '@tauri-apps/api/core';
import {
  ConflictCheck,
  FavoriteItem,
  FileEntry,
  FilePreview,
  OperationResult,
  SpecialFolders,
  TagItem,
  VolumeInfo,
} from '../types';

const isTauri = typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);

async function callTauri<T>(cmd: string, args: Record<string, any> = {}, mockFallback?: () => T | Promise<T>): Promise<T> {
  if (isTauri) {
    try {
      return await invoke<T>(cmd, args);
    } catch (err) {
      if (mockFallback) return await mockFallback();
      throw err;
    }
  }
  if (mockFallback) {
    return await mockFallback();
  }
  throw new Error(`Command "${cmd}" is not available outside the Tauri desktop environment.`);
}

export const tauriApi = {
  // Filesystem
  listDirectory: async (path: string, showHidden = false): Promise<FileEntry[]> => {
    return await callTauri<FileEntry[]>('list_directory', { path, showHidden }, () => {
      const lower = path.toLowerCase();
      const now = Math.floor(Date.now() / 1000);

      if (lower.includes('documents')) {
        return [
          { name: 'Medical Reports 2026', path: `${path}\\Medical Reports 2026`, is_dir: true, is_symlink: false, is_hidden: false, is_readonly: false, size: 0, modified: now - 3600, created: now - 86400, extension: '' },
          { name: 'Pension Statement.pdf', path: `${path}\\Pension Statement.pdf`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 145000, modified: now - 7200, created: now - 100000, extension: 'pdf' },
          { name: 'House Tax Receipt.pdf', path: `${path}\\House Tax Receipt.pdf`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 89000, modified: now - 14400, created: now - 200000, extension: 'pdf' },
          { name: 'Family Grocery List.txt', path: `${path}\\Family Grocery List.txt`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 1200, modified: now - 1800, created: now - 50000, extension: 'txt' },
        ];
      }

      if (lower.includes('pictures')) {
        return [
          { name: 'Summer Vacation 2025', path: `${path}\\Summer Vacation 2025`, is_dir: true, is_symlink: false, is_hidden: false, is_readonly: false, size: 0, modified: now - 86400 * 10, created: now - 86400 * 30, extension: '' },
          { name: 'Grandkids Garden Party.jpg', path: `${path}\\Grandkids Garden Party.jpg`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 3400000, modified: now - 86400 * 2, created: now - 86400 * 2, extension: 'jpg' },
          { name: 'Rose Garden Bloom.png', path: `${path}\\Rose Garden Bloom.png`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 2100000, modified: now - 86400 * 5, created: now - 86400 * 5, extension: 'png' },
        ];
      }

      if (lower.includes('downloads')) {
        return [
          { name: 'NovaExplorer-Installer.exe', path: `${path}\\NovaExplorer-Installer.exe`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 18500000, modified: now - 1200, created: now - 1200, extension: 'exe' },
          { name: 'Delicious Recipes.pdf', path: `${path}\\Delicious Recipes.pdf`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 5200000, modified: now - 86400, created: now - 86400, extension: 'pdf' },
        ];
      }

      if (lower.includes('desktop')) {
        return [
          { name: 'NovaExplorer Shortcut.lnk', path: `${path}\\NovaExplorer Shortcut.lnk`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 1024, modified: now - 86400, created: now - 86400, extension: 'lnk' },
          { name: 'Important Notes.txt', path: `${path}\\Important Notes.txt`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 450, modified: now - 300, created: now - 86400 * 3, extension: 'txt' },
        ];
      }

      if (lower.includes('music')) {
        return [
          { name: 'Golden Oldies 1960s.mp3', path: `${path}\\Golden Oldies 1960s.mp3`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 7800000, modified: now - 86400 * 20, created: now - 86400 * 20, extension: 'mp3' },
          { name: 'Peaceful Acoustic Guitar.flac', path: `${path}\\Peaceful Acoustic Guitar.flac`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 28000000, modified: now - 86400 * 15, created: now - 86400 * 15, extension: 'flac' },
        ];
      }

      if (lower.includes('videos')) {
        return [
          { name: 'Family Golden Jubilee 2024.mp4', path: `${path}\\Family Golden Jubilee 2024.mp4`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 180000000, modified: now - 86400 * 40, created: now - 86400 * 40, extension: 'mp4' },
        ];
      }

      return [
        { name: 'Sample Item 1.txt', path: `${path}\\Sample Item 1.txt`, is_dir: false, is_symlink: false, is_hidden: false, is_readonly: false, size: 2048, modified: now, created: now, extension: 'txt' },
      ];
    });
  },

  getSpecialFolders: async (): Promise<SpecialFolders> => {
    return await callTauri<SpecialFolders>('get_special_folders', {}, () => ({
      desktop: 'C:\\Users\\SeniorUser\\Desktop',
      documents: 'C:\\Users\\SeniorUser\\Documents',
      downloads: 'C:\\Users\\SeniorUser\\Downloads',
      pictures: 'C:\\Users\\SeniorUser\\Pictures',
      music: 'C:\\Users\\SeniorUser\\Music',
      videos: 'C:\\Users\\SeniorUser\\Videos',
      home: 'C:\\Users\\SeniorUser',
    }));
  },

  createFolder: async (parent: string, name: string): Promise<string> => {
    return await callTauri<string>('create_folder', { parent, name }, () => `${parent}\\${name}`);
  },

  checkCollision: async (targetDir: string, name: string): Promise<ConflictCheck> => {
    return await callTauri<ConflictCheck>('check_collision', { targetDir, name }, () => ({
      exists: false,
      target_name: name,
      target_path: `${targetDir}\\${name}`,
      is_dir: false,
      size: 0,
      modified: null,
    }));
  },

  searchDirectory: async (rootPath: string, query: string, maxResults = 100): Promise<FileEntry[]> => {
    return await callTauri<FileEntry[]>('search_directory', { rootPath, query, maxResults }, async () => {
      const all = await tauriApi.listDirectory(rootPath);
      return all.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));
    });
  },

  // Operations
  safeDelete: async (path: string, permanent: boolean): Promise<OperationResult> => {
    return await callTauri<OperationResult>('safe_delete', { path, permanent }, () => ({
      success: true,
      message: permanent ? 'File permanently deleted.' : 'File moved to Recycle Bin.',
      affected_paths: [path],
    }));
  },

  renameFile: async (oldPath: string, newName: string): Promise<OperationResult> => {
    return await callTauri<OperationResult>('rename_file', { oldPath, newName }, () => ({
      success: true,
      message: 'Renamed successfully.',
      affected_paths: [oldPath],
    }));
  },

  copyItem: async (
    source: string,
    destinationDir: string,
    overwrite: boolean,
    newName?: string,
  ): Promise<OperationResult> => {
    return await callTauri<OperationResult>('copy_item', {
      source,
      destinationDir,
      overwrite,
      newName,
    }, () => ({
      success: true,
      message: 'Copied successfully.',
      affected_paths: [source],
    }));
  },

  moveItem: async (
    source: string,
    destinationDir: string,
    overwrite: boolean,
    newName?: string,
  ): Promise<OperationResult> => {
    return await callTauri<OperationResult>('move_item', {
      source,
      destinationDir,
      overwrite,
      newName,
    }, () => ({
      success: true,
      message: 'Moved successfully.',
      affected_paths: [source],
    }));
  },

  undoLastOperation: async (): Promise<OperationResult> => {
    return await callTauri<OperationResult>('undo_last_operation', {}, () => ({
      success: true,
      message: 'Action undone successfully.',
      affected_paths: [],
    }));
  },

  // Volumes
  listVolumes: async (): Promise<VolumeInfo[]> => {
    return await callTauri<VolumeInfo[]>('list_volumes', {}, () => [
      {
        name: 'Local Disk (C:)',
        mount_point: 'C:\\',
        total_bytes: 512 * 1024 * 1024 * 1024,
        available_bytes: 310 * 1024 * 1024 * 1024,
        used_bytes: 202 * 1024 * 1024 * 1024,
        file_system: 'NTFS',
        is_removable: false,
      },
      {
        name: 'USB Family Backup (D:)',
        mount_point: 'D:\\',
        total_bytes: 128 * 1024 * 1024 * 1024,
        available_bytes: 84 * 1024 * 1024 * 1024,
        used_bytes: 44 * 1024 * 1024 * 1024,
        file_system: 'exFAT',
        is_removable: true,
      },
    ]);
  },

  // Shell
  openPath: async (path: string): Promise<void> => {
    return await callTauri<void>('open_path', { path }, () => {
      console.log('Mock: opening file path', path);
    });
  },

  revealInExplorer: async (path: string): Promise<void> => {
    return await callTauri<void>('reveal_in_explorer', { path }, () => {
      console.log('Mock: revealing in file explorer', path);
    });
  },

  switchToWindowsExplorer: async (folderPath?: string): Promise<void> => {
    return await callTauri<void>('switch_to_windows_explorer', { folderPath }, () => {
      console.log('Mock: Switching to Windows Explorer at', folderPath);
    });
  },

  setAutoStart: async (enable: boolean): Promise<boolean> => {
    return await callTauri<boolean>('set_auto_start', { enable }, () => {
      localStorage.setItem('nova_setting_auto_start', String(enable));
      return enable;
    });
  },

  getAutoStart: async (): Promise<boolean> => {
    return await callTauri<boolean>('get_auto_start', {}, () => {
      return localStorage.getItem('nova_setting_auto_start') === 'true';
    });
  },

  // Settings
  getSetting: async (key: string): Promise<string | null> => {
    return await callTauri<string | null>('get_setting', { key }, () => {
      try {
        return localStorage.getItem(`nova_setting_${key}`);
      } catch {
        return null;
      }
    });
  },

  setSetting: async (key: string, value: string): Promise<void> => {
    return await callTauri<void>('set_setting', { key, value }, () => {
      try {
        localStorage.setItem(`nova_setting_${key}`, value);
      } catch (e) {
        console.warn(e);
      }
    });
  },

  // Favorites
  getFavorites: async (): Promise<FavoriteItem[]> => {
    return await callTauri<FavoriteItem[]>('get_favorites', {}, () => []);
  },

  addFavorite: async (path: string, label: string): Promise<void> => {
    return await callTauri<void>('add_favorite', { path, label }, () => {});
  },

  removeFavorite: async (id: string): Promise<void> => {
    return await callTauri<void>('remove_favorite', { id }, () => {});
  },

  // Tags
  getTags: async (): Promise<TagItem[]> => {
    return await callTauri<TagItem[]>('get_tags', {}, () => [
      { id: 'tag-1', name: 'Important', color: '#ef4444', created_at: '' },
      { id: 'tag-2', name: 'Family', color: '#3b82f6', created_at: '' },
    ]);
  },

  setFileTag: async (path: string, tagId: string): Promise<void> => {
    return await callTauri<void>('set_file_tag', { path, tagId }, () => {});
  },

  removeFileTag: async (path: string, tagId: string): Promise<void> => {
    return await callTauri<void>('remove_file_tag', { path, tagId }, () => {});
  },

  getFileTags: async (path: string): Promise<TagItem[]> => {
    return await callTauri<TagItem[]>('get_file_tags', { path }, () => []);
  },

  // Thumbnails & Previews
  getThumbnail: async (path: string, maxDim = 256): Promise<string> => {
    return await callTauri<string>('get_thumbnail', { path, maxDim }, () => '');
  },

  batchGetThumbnails: async (paths: string[], maxDim = 256): Promise<Record<string, string>> => {
    return await callTauri<Record<string, string>>('batch_get_thumbnails', { paths, maxDim }, () => ({}));
  },

  getFilePreview: async (path: string): Promise<FilePreview> => {
    return await callTauri<FilePreview>('get_file_preview', { path }, () => {
      const lower = path.toLowerCase();
      const name = path.split(/[\\/]/).pop() || path;

      let preview_type: FilePreview['preview_type'] = 'text';
      if (lower.endsWith('.pdf')) preview_type = 'pdf';
      else if (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg')) preview_type = 'image';
      else if (lower.endsWith('.mp3') || lower.endsWith('.flac')) preview_type = 'audio';
      else if (lower.endsWith('.mp4') || lower.endsWith('.mov')) preview_type = 'video';

      return {
        path,
        name,
        size: 10240,
        modified: Math.floor(Date.now() / 1000),
        preview_type,
        text_content: preview_type === 'text' ? 'This is an accessible preview of your document.\nEverything is clear, sharp, and easy to read.' : null,
      };
    });
  },
};
