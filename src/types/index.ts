export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  is_symlink: boolean;
  is_hidden: boolean;
  is_readonly: boolean;
  size: number;
  modified: number | null;
  created: number | null;
  extension: string;
}

export interface VolumeInfo {
  name: string;
  mount_point: string;
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  file_system: string;
  is_removable: boolean;
}

export interface SpecialFolders {
  desktop: string;
  documents: string;
  downloads: string;
  pictures: string;
  music: string;
  videos: string;
  home: string;
}

export interface OperationResult {
  success: boolean;
  message: string;
  affected_paths: string[];
}

export interface ConflictCheck {
  exists: boolean;
  target_name: string;
  target_path: string;
  is_dir: boolean;
  size: number;
  modified: number | null;
}

export interface FavoriteItem {
  id: string;
  path: string;
  label: string;
  position: number;
  created_at: string;
}

export interface TagItem {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export type AppMode = 'simple' | 'advanced';
export type FontSize = 'normal' | 'large' | 'extra-large';
export type ThemeMode =
  | 'light'
  | 'dark'
  | 'black-and-white'
  | 'warm-amber'
  | 'cool-ocean'
  | 'high-contrast';
export type ViewMode = 'cards' | 'list' | 'grid';
export type SortField = 'name' | 'size' | 'modified' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface TabItem {
  id: string;
  path: string;
  title: string;
  isPinned: boolean;
  history: string[];
  historyIndex: number;
}

export interface FilePreview {
  path: string;
  name: string;
  size: number;
  modified: number | null;
  preview_type: 'image' | 'text' | 'audio' | 'video' | 'pdf' | 'archive' | 'office' | 'font' | 'csv' | 'json' | 'markdown' | '3d' | 'design' | 'system' | 'unsupported';
  text_content?: string | null;
  thumbnail_data?: string | null;
  media_data?: string | null;
  mime_type?: string | null;
  dimensions?: [number, number] | null;
  line_count?: number | null;
}
