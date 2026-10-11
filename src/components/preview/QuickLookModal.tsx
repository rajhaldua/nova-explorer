import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { FilePreview, FileEntry } from '../../types';
import { tauriApi } from '../../api/tauriApi';
import {
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Music,
  Film,
  BookOpen,
  FileSpreadsheet,
  FileArchive,
  Table,
  Braces,
  Box,
  Palette,
  File,
  Loader2,
} from 'lucide-react';

interface QuickLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string | null;
  entries: FileEntry[];
  onNavigateFile: (path: string) => void;
  onOpenWithApp: (path: string) => void;
}

export const QuickLookModal: React.FC<QuickLookModalProps> = ({
  isOpen,
  onClose,
  currentPath,
  entries,
  onNavigateFile,
  onOpenWithApp,
}) => {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [fontCustomText, setFontCustomText] = useState<string>('The quick brown fox jumps over the lazy dog 1234567890');
  const [markdownViewMode, setMarkdownViewMode] = useState<'rendered' | 'raw'>('rendered');

  // Filter entries to files only (QuickLook cycles through files)
  const fileEntries = useMemo(() => entries.filter((e) => !e.is_dir), [entries]);
  const currentIndex = useMemo(() => {
    if (!currentPath) return -1;
    return fileEntries.findIndex((e) => e.path === currentPath);
  }, [fileEntries, currentPath]);

  // Fetch preview when currentPath changes
  useEffect(() => {
    if (!isOpen || !currentPath) {
      setPreview(null);
      setImageZoom(1);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setImageZoom(1);

    tauriApi
      .getFilePreview(currentPath)
      .then((res) => {
        if (isMounted) setPreview(res);
      })
      .catch((err) => {
        console.error('QuickLook fetch preview error:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentPath]);

  // Navigate to previous file
  const handlePrev = useCallback(() => {
    if (fileEntries.length === 0 || currentIndex === -1) return;
    const prevIdx = (currentIndex - 1 + fileEntries.length) % fileEntries.length;
    onNavigateFile(fileEntries[prevIdx].path);
  }, [fileEntries, currentIndex, onNavigateFile]);

  // Navigate to next file
  const handleNext = useCallback(() => {
    if (fileEntries.length === 0 || currentIndex === -1) return;
    const nextIdx = (currentIndex + 1) % fileEntries.length;
    onNavigateFile(fileEntries[nextIdx].path);
  }, [fileEntries, currentIndex, onNavigateFile]);

  // Keyboard shortcut handler for QuickLook window
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the font preview input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentPath) {
          onOpenWithApp(currentPath);
        }
        return;
      }

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext, currentPath, onOpenWithApp]);

  // CSV parsed rows
  const csvData = useMemo(() => {
    if (preview?.preview_type !== 'csv' || !preview.text_content) return null;
    const lines = preview.text_content.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 100);
    return lines.map((line) => line.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, '')));
  }, [preview]);

  // Formatted JSON string
  const prettyJson = useMemo(() => {
    if (preview?.preview_type !== 'json' || !preview.text_content) return null;
    try {
      return JSON.stringify(JSON.parse(preview.text_content), null, 2);
    } catch {
      return preview.text_content;
    }
  }, [preview]);

  if (!isOpen || !currentPath) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '—';
    return new Date(timestamp * 1000).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyText = (content?: string | null) => {
    const text = content || preview?.text_content;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const fileName = preview?.name || currentPath.split(/[\\/]/).pop() || 'File';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative flex flex-col bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-5xl h-[88vh] max-h-[900px]'
        }`}
      >
        {/* Header Bar */}
        <header className="h-14 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {/* File Information */}
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              {preview?.preview_type === 'image' ? (
                <ImageIcon className="w-4 h-4 text-purple-400" />
              ) : preview?.preview_type === 'text' ? (
                <FileText className="w-4 h-4 text-emerald-400" />
              ) : preview?.preview_type === 'audio' ? (
                <Music className="w-4 h-4 text-pink-400" />
              ) : preview?.preview_type === 'video' ? (
                <Film className="w-4 h-4 text-rose-400" />
              ) : preview?.preview_type === 'pdf' ? (
                <BookOpen className="w-4 h-4 text-red-400" />
              ) : preview?.preview_type === 'archive' ? (
                <FileArchive className="w-4 h-4 text-amber-400" />
              ) : preview?.preview_type === 'office' ? (
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              ) : preview?.preview_type === 'font' ? (
                <TypeIcon className="w-4 h-4 text-violet-400" />
              ) : preview?.preview_type === 'csv' ? (
                <Table className="w-4 h-4 text-teal-400" />
              ) : preview?.preview_type === 'json' ? (
                <Braces className="w-4 h-4 text-amber-400" />
              ) : preview?.preview_type === '3d' ? (
                <Box className="w-4 h-4 text-indigo-400" />
              ) : preview?.preview_type === 'design' ? (
                <Palette className="w-4 h-4 text-pink-400" />
              ) : (
                <File className="w-4 h-4 text-slate-400" />
              )}
            </div>

            <div className="truncate">
              <h2 className="font-extrabold text-sm md:text-base text-white truncate" title={fileName}>
                {fileName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {preview && <span>{formatSize(preview.size)}</span>}
                {preview?.dimensions && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{preview.dimensions[0]} × {preview.dimensions[1]} px</span>
                  </>
                )}
                {preview && (
                  <>
                    <span>•</span>
                    <span>{formatDate(preview.modified)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* QuickLook Navigation & Window Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* File Switcher Carousel */}
            {fileEntries.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700/60 mr-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Previous file (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-1.5 text-slate-400">
                  {currentIndex + 1} / {fileEntries.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Next file (Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Open with default app */}
            <button
              type="button"
              onClick={() => onOpenWithApp(currentPath)}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Open with default Windows application (Enter)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
              title="Close QuickLook (Space / Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Viewer Body */}
        <main className="grow overflow-hidden relative flex flex-col items-center justify-center bg-slate-950/90">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-sm font-semibold">Loading QuickLook preview...</p>
            </div>
          ) : preview ? (
            <>
              {/* 1. PDF Documents & Adobe Illustrator (.ai) Files */}
              {preview.preview_type === 'pdf' && (
                <div className="w-full h-full flex flex-col">
                  {preview.media_data ? (
                    <iframe
                      src={preview.media_data}
                      className="w-full h-full border-none bg-white"
                      title={fileName}
                    />
                  ) : preview.thumbnail_data ? (
                    <div className="w-full h-full flex items-center justify-center p-6">
                      <img
                        src={preview.thumbnail_data}
                        alt={fileName}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                      <div className="w-20 h-20 rounded-full bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center">
                        <BookOpen className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">PDF Document</h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-md">
                          Click below to open in your default PDF reader
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenWithApp(currentPath)}
                        className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-md transition-colors"
                      >
                        Open in PDF Reader
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Images, Adobe Photoshop (.psd), Encapsulated PostScript (.eps) */}
              {(preview.preview_type === 'image' ||
                (preview.preview_type === 'design' && preview.thumbnail_data)) && (
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
                  {/* Checkerboard Pattern for transparent images */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  <img
                    src={preview.thumbnail_data || preview.media_data || ''}
                    alt={fileName}
                    style={{ transform: `scale(${imageZoom})`, transition: 'transform 0.15s ease-out' }}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
                    draggable={false}
                  />

                  {/* Zoom Controls Overlay */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-xl backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setImageZoom((z) => Math.max(0.25, z - 0.25))}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold w-12 text-center text-slate-300">
                      {Math.round(imageZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setImageZoom((z) => Math.min(4, z + 0.25))}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageZoom(1)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Audio Player Engine */}
              {preview.preview_type === 'audio' && (
                <div className="flex flex-col items-center justify-center p-8 w-full max-w-md gap-6">
                  <div className="w-32 h-32 rounded-3xl bg-pink-600/20 border border-pink-500/40 text-pink-400 flex items-center justify-center shadow-2xl">
                    <Music className="w-16 h-16 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-white">{fileName}</h3>
                    <p className="text-xs text-pink-400 mt-1 uppercase tracking-wider font-semibold">
                      {preview.mime_type || 'Audio Track'}
                    </p>
                  </div>
                  {preview.media_data ? (
                    <audio
                      controls
                      autoPlay
                      src={preview.media_data}
                      className="w-full accent-pink-500 shadow-lg"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenWithApp(currentPath)}
                      className="py-3 px-6 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-xl transition-colors"
                    >
                      Play in Media Player
                    </button>
                  )}
                </div>
              )}

              {/* 4. Video Player Engine */}
              {preview.preview_type === 'video' && (
                <div className="w-full h-full flex items-center justify-center bg-black p-4">
                  {preview.media_data ? (
                    <video
                      controls
                      autoPlay
                      src={preview.media_data}
                      className="max-w-full max-h-full rounded-xl shadow-2xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="w-20 h-20 rounded-full bg-rose-600/20 text-rose-500 border border-rose-500/40 flex items-center justify-center">
                        <Film className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Large Video File</h3>
                      <button
                        type="button"
                        onClick={() => onOpenWithApp(currentPath)}
                        className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-colors"
                      >
                        Play in Video Player
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Typography Font Specimen */}
              {preview.preview_type === 'font' && preview.media_data && (
                <div className="w-full h-full p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `@font-face { font-family: 'QuickLookFont'; src: url(${preview.media_data}); }`,
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase font-extrabold text-violet-400 tracking-wider">
                      Interactive Font Specimen (Type custom preview text below)
                    </label>
                    <input
                      type="text"
                      value={fontCustomText}
                      onChange={(e) => setFontCustomText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-sans text-sm focus:outline-none focus:border-violet-500"
                      placeholder="Type custom text to preview font..."
                    />
                  </div>

                  <div
                    style={{ fontFamily: 'QuickLookFont' }}
                    className="flex flex-col gap-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-1">48px</span>
                      <p className="text-5xl text-white leading-tight break-all">{fontCustomText}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-1">32px</span>
                      <p className="text-3xl text-slate-200 leading-tight break-all">{fontCustomText}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-1">20px</span>
                      <p className="text-xl text-slate-300 leading-tight break-all">{fontCustomText}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-1">14px</span>
                      <p className="text-sm text-slate-400 leading-normal break-all">{fontCustomText}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. CSV / TSV Spreadsheet Grid */}
              {preview.preview_type === 'csv' && csvData && (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                    <span className="text-teal-400 font-bold">
                      Interactive Table ({preview.line_count} rows)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText()}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs"
                    >
                      {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedContent ? 'Copied' : 'Copy Data'}</span>
                    </button>
                  </div>
                  <div className="grow overflow-auto p-4 font-mono text-xs">
                    <table className="w-full border-collapse text-left">
                      {csvData.slice(0, 1).map((header, hi) => (
                        <thead key={hi}>
                          <tr className="bg-teal-950/80 text-teal-200 border-b border-teal-800">
                            {header.map((col, ci) => (
                              <th key={ci} className="p-2 border border-slate-800 font-bold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      ))}
                      <tbody>
                        {csvData.slice(1).map((row, ri) => (
                          <tr key={ri} className="odd:bg-slate-900/60 even:bg-slate-950 hover:bg-slate-800/60">
                            {row.map((cell, ci) => (
                              <td key={ci} className="p-2 border border-slate-800/80 truncate max-w-xs">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. Formatted JSON Viewer */}
              {preview.preview_type === 'json' && (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                    <span className="text-amber-400 font-bold">JSON Document</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(prettyJson)}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs"
                    >
                      {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedContent ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="grow overflow-auto p-6 font-mono text-xs text-amber-200/90 leading-relaxed select-text">
                    {prettyJson}
                  </pre>
                </div>
              )}

              {/* 8. Markdown Document */}
              {preview.preview_type === 'markdown' && preview.text_content && (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">Markdown Preview</span>
                      <button
                        type="button"
                        onClick={() => setMarkdownViewMode(markdownViewMode === 'rendered' ? 'raw' : 'rendered')}
                        className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-sans text-xs"
                      >
                        {markdownViewMode === 'rendered' ? 'View Raw' : 'View Rendered'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText()}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs"
                    >
                      {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedContent ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="grow overflow-auto p-6 font-sans text-sm text-slate-200 select-text leading-relaxed">
                    {markdownViewMode === 'rendered' ? (
                      <div className="max-w-3xl mx-auto space-y-3">
                        {preview.text_content.split(/\r?\n/).slice(0, 150).map((line, idx) => {
                          if (line.startsWith('# ')) return <h1 key={idx} className="text-2xl font-black text-white border-b border-slate-700 pb-2">{line.replace('# ', '')}</h1>;
                          if (line.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold text-blue-400 border-b border-slate-800 pb-1">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('### ')) return <h3 key={idx} className="text-base font-bold text-slate-100">{line.replace('### ', '')}</h3>;
                          if (line.startsWith('- ') || line.startsWith('* ')) return <li key={idx} className="ml-5 list-disc">{line.substring(2)}</li>;
                          if (line.trim().length === 0) return <div key={idx} className="h-2" />;
                          return <p key={idx}>{line}</p>;
                        })}
                      </div>
                    ) : (
                      <pre className="font-mono text-xs whitespace-pre-wrap select-text">
                        {preview.text_content}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* 9. Code & Plain Text */}
              {preview.preview_type === 'text' && preview.text_content && (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
                    <span className="text-emerald-400 font-bold">
                      Source Code / Text ({preview.line_count} lines)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText()}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs"
                    >
                      {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedContent ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="grow overflow-auto p-6 font-mono text-xs text-slate-300 leading-relaxed select-text">
                    {preview.text_content}
                  </pre>
                </div>
              )}

              {/* 10. Office, 3D, Archives, Windows Shell Preview Fallback */}
              {!['pdf', 'image', 'audio', 'video', 'font', 'csv', 'json', 'markdown', 'text'].includes(
                preview.preview_type
              ) && (
                <div className="flex flex-col items-center justify-center p-8 gap-6 text-center max-w-md">
                  {preview.thumbnail_data ? (
                    <div className="w-full flex items-center justify-center p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl">
                      <img
                        src={preview.thumbnail_data}
                        alt={fileName}
                        className="max-w-full max-h-72 object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xl">
                      <File className="w-12 h-12" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-white">{fileName}</h3>
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                      {preview.preview_type} file • {formatSize(preview.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenWithApp(currentPath)}
                    className="py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Default Windows App</span>
                  </button>
                </div>
              )}
            </>
          ) : null}
        </main>

        {/* Footer Navigation Bar */}
        <footer className="h-10 px-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] truncate max-w-md select-text" title={currentPath}>
              {currentPath}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span>[ ← / → Navigate ]</span>
            <span>[ Space / Esc to Close ]</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Simple Type icon helper
function TypeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}
