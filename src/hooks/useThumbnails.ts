import { useEffect, useState, useRef } from 'react';
import { FileEntry } from '../types';
import { tauriApi } from '../api/tauriApi';

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'ico', 'tiff', 'tif', 'svg',
  'psd', 'ai', 'eps', 'pdf', 'docx', 'pptx', 'xlsx', 'blend', 'obj', 'stl', 'raw', 'cr2', 'nef'
]);

export function useThumbnails(entries: FileEntry[]) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const cacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Find all images in entries that need thumbnails
    const imagesToFetch: string[] = [];

    entries.forEach((entry) => {
      if (!entry.is_dir) {
        const ext = entry.extension.toLowerCase();
        if (IMAGE_EXTENSIONS.has(ext) && !cacheRef.current[entry.path]) {
          imagesToFetch.push(entry.path);
        }
      }
    });

    if (imagesToFetch.length === 0) return;

    let isMounted = true;

    // Fetch in chunks of 24 images to keep IPC snappy
    const chunkSize = 24;
    async function fetchChunks() {
      for (let i = 0; i < imagesToFetch.length; i += chunkSize) {
        if (!isMounted) break;
        const chunk = imagesToFetch.slice(i, i + chunkSize);
        try {
          const batch = await tauriApi.batchGetThumbnails(chunk, 256);
          if (isMounted && Object.keys(batch).length > 0) {
            cacheRef.current = { ...cacheRef.current, ...batch };
            setThumbnails((prev) => ({ ...prev, ...batch }));
          }
        } catch (err) {
          console.warn('Thumbnail batch failed:', err);
        }
      }
    }

    fetchChunks();

    return () => {
      isMounted = false;
    };
  }, [entries]);

  return thumbnails;
}
