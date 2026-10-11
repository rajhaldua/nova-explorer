import React, { useEffect, useState, useMemo } from 'react';
import { FilePreview } from '../../types';
import { tauriApi } from '../../api/tauriApi';
import {
  X,
  ExternalLink,
  Copy,
  FolderOpen,
  Image as ImageIcon,
  FileText,
  Music,
  Film,
  File,
  Loader2,
  Check,
  FileArchive,
  BookOpen,
  FileSpreadsheet,
  Table,
  Type,
  Braces,
  Box,
  Palette,
  Cpu,
} from 'lucide-react';
import { Language, translations } from '../../i18n';

interface PreviewPanelProps {
  filePath: string | null;
  onClose: () => void;
  onOpenWithApp: (path: string) => void;
  language: Language;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  filePath,
  onClose,
  onOpenWithApp,
  language,
}) => {
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);
  const [markdownViewMode, setMarkdownViewMode] = useState<'rendered' | 'raw'>('rendered');
  const t = translations[language] || translations.en;

  useEffect(() => {
    if (!filePath) {
      setPreview(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    tauriApi.getFilePreview(filePath)
      .then((res) => {
        if (isMounted) {
          setPreview(res);
        }
      })
      .catch((err) => {
        console.error('Preview fetch error:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  // CSV parsed rows (memoized)
  const csvData = useMemo(() => {
    if (preview?.preview_type !== 'csv' || !preview.text_content) return null;
    const lines = preview.text_content.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 30);
    return lines.map((line) => line.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, '')));
  }, [preview]);

  // Formatted JSON string (memoized)
  const prettyJson = useMemo(() => {
    if (preview?.preview_type !== 'json' || !preview.text_content) return null;
    try {
      return JSON.stringify(JSON.parse(preview.text_content), null, 2);
    } catch {
      return preview.text_content;
    }
  }, [preview]);

  if (!filePath) return null;

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

  const handleCopyPath = () => {
    navigator.clipboard.writeText(filePath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTextContent = (text?: string | null) => {
    const content = text || preview?.text_content;
    if (content) {
      navigator.clipboard.writeText(content);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  return (
    <aside className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-xl z-20 shrink-0 select-none animate-in slide-in-from-right-4 duration-200">
      
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            {preview?.preview_type === 'image' ? (
              <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            ) : preview?.preview_type === 'text' ? (
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : preview?.preview_type === 'audio' ? (
              <Music className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            ) : preview?.preview_type === 'video' ? (
              <Film className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : preview?.preview_type === 'pdf' ? (
              <BookOpen className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : preview?.preview_type === 'archive' ? (
              <FileArchive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : preview?.preview_type === 'office' ? (
              <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : preview?.preview_type === 'font' ? (
              <Type className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            ) : preview?.preview_type === 'csv' ? (
              <Table className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            ) : preview?.preview_type === 'json' ? (
              <Braces className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            ) : preview?.preview_type === 'markdown' ? (
              <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            ) : preview?.preview_type === '3d' ? (
              <Box className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            ) : preview?.preview_type === 'design' ? (
              <Palette className="w-5 h-5 text-pink-500 dark:text-pink-400" />
            ) : preview?.preview_type === 'system' ? (
              <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            ) : (
              <File className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
          <div className="truncate">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate" title={preview?.name || filePath}>
              {preview?.name || filePath.split(/[\\/]/).pop()}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {preview?.preview_type || 'File'} Preview
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close preview panel (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grow overflow-y-auto p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-bold">Generating preview...</p>
          </div>
        ) : preview ? (
          <>
            {/* 1. Image Preview */}
            {preview.preview_type === 'image' && preview.thumbnail_data && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center max-h-72 shadow-inner">
                <img
                  src={preview.thumbnail_data}
                  alt={preview.name}
                  className="w-full h-full object-contain max-h-72"
                />
              </div>
            )}

            {/* 2. Audio Playback Player */}
            {preview.preview_type === 'audio' && (
              <div className="p-5 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-md">
                  <Music className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-pink-900 dark:text-pink-100">Audio Track</h4>
                  <p className="text-xs text-pink-700 dark:text-pink-300 mt-0.5">
                    {preview.media_data ? 'Play directly below:' : 'Click below to play in default music player'}
                  </p>
                </div>
                {preview.media_data && (
                  <audio
                    controls
                    src={preview.media_data}
                    className="w-full mt-2 accent-pink-600"
                    preload="metadata"
                  />
                )}
              </div>
            )}

            {/* 3. Video Playback Player */}
            {preview.preview_type === 'video' && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col items-center justify-center shadow-md">
                {preview.media_data ? (
                  <video
                    controls
                    src={preview.media_data}
                    className="w-full max-h-60 rounded-2xl bg-black"
                    preload="metadata"
                  />
                ) : (
                  <div className="p-6 text-center flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                      <Film className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white">Video File</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Large video or container file</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Font Typography Specimen */}
            {preview.preview_type === 'font' && preview.media_data && (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/40 p-4 flex flex-col gap-3">
                <style dangerouslySetInnerHTML={{
                  __html: `@font-face { font-family: 'NovaPreviewFont'; src: url(${preview.media_data}); }`
                }} />
                <div className="flex justify-between items-center text-violet-900 dark:text-violet-200 font-extrabold text-xs">
                  <span>TYPOGRAPHY SPECIMEN</span>
                  <span className="uppercase text-[10px] bg-violet-200 dark:bg-violet-900 px-1.5 py-0.5 rounded">Font</span>
                </div>
                <div style={{ fontFamily: 'NovaPreviewFont' }} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-900 flex flex-col gap-2.5">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    The quick brown fox jumps over the lazy dog.
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    0123456789 !@#$%^&*()_+
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
                  </p>
                </div>
              </div>
            )}

            {/* 5. CSV / TSV Interactive Spreadsheet Table */}
            {preview.preview_type === 'csv' && csvData && (
              <div className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-slate-50 dark:bg-slate-950 overflow-hidden max-h-80 flex flex-col shadow-inner">
                <div className="flex justify-between items-center p-2.5 bg-teal-50 dark:bg-teal-950/60 border-b border-teal-200 dark:border-teal-800 text-[10px] font-bold text-teal-900 dark:text-teal-200">
                  <span>SPREADSHEET PREVIEW ({preview.line_count} rows)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTextContent()}
                    className="hover:text-teal-600 flex items-center gap-1 font-sans"
                  >
                    {copiedContent ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedContent ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-64 p-2 text-xs font-mono">
                  <table className="w-full border-collapse text-left">
                    {csvData.slice(0, 1).map((headerRow, ri) => (
                      <thead key={ri}>
                        <tr className="bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-100">
                          {headerRow.map((col, ci) => (
                            <th key={ci} className="p-1.5 border border-teal-200 dark:border-teal-800 font-bold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    ))}
                    <tbody>
                      {csvData.slice(1).map((row, ri) => (
                        <tr key={ri} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-950">
                          {row.map((cell, ci) => (
                            <td key={ci} className="p-1.5 border border-slate-200 dark:border-slate-800 truncate max-w-[120px]">
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

            {/* 6. Pretty JSON Viewer */}
            {preview.preview_type === 'json' && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-slate-50 dark:bg-slate-950 p-3 max-h-80 overflow-y-auto font-mono text-xs leading-relaxed shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-[10px] text-amber-700 dark:text-amber-400 font-bold mb-2">
                  <span>FORMATTED JSON</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTextContent(prettyJson)}
                    className="hover:text-amber-600 flex items-center gap-1 font-sans"
                  >
                    {copiedContent ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedContent ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre font-mono text-[11px] text-amber-900 dark:text-amber-200 select-text overflow-x-auto">
                  {prettyJson}
                </pre>
              </div>
            )}

            {/* 7. Markdown Document Reader */}
            {preview.preview_type === 'markdown' && preview.text_content && (
              <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-slate-50 dark:bg-slate-950 p-3 max-h-80 overflow-y-auto leading-relaxed shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-700 dark:text-blue-400 font-bold mb-2">
                  <div className="flex items-center gap-2">
                    <span>MARKDOWN</span>
                    <button
                      type="button"
                      onClick={() => setMarkdownViewMode(markdownViewMode === 'rendered' ? 'raw' : 'rendered')}
                      className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-sans"
                    >
                      {markdownViewMode === 'rendered' ? 'Raw Code' : 'Rendered'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyTextContent()}
                    className="hover:text-blue-600 flex items-center gap-1 font-sans"
                  >
                    {copiedContent ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedContent ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                {markdownViewMode === 'rendered' ? (
                  <div className="text-xs text-slate-800 dark:text-slate-200 space-y-2 select-text font-sans">
                    {preview.text_content.split(/\r?\n/).slice(0, 40).map((line, idx) => {
                      if (line.startsWith('# ')) return <h1 key={idx} className="text-base font-extrabold text-blue-900 dark:text-blue-300 border-b pb-1">{line.replace('# ', '')}</h1>;
                      if (line.startsWith('## ')) return <h2 key={idx} className="text-sm font-bold text-slate-900 dark:text-white">{line.replace('## ', '')}</h2>;
                      if (line.startsWith('### ')) return <h3 key={idx} className="text-xs font-bold text-slate-800 dark:text-slate-200">{line.replace('### ', '')}</h3>;
                      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={idx} className="ml-4 list-disc">{line.substring(2)}</li>;
                      if (line.trim().length === 0) return <div key={idx} className="h-1" />;
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-all font-mono select-text text-[11px] text-slate-800 dark:text-slate-200">
                    {preview.text_content}
                  </pre>
                )}
              </div>
            )}

            {/* 8. General Code & Text Preview */}
            {preview.preview_type === 'text' && preview.text_content && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 max-h-80 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-bold mb-2">
                  <span>TEXT PREVIEW ({preview.line_count} lines)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTextContent()}
                    className="hover:text-blue-600 flex items-center gap-1 font-sans"
                    title="Copy preview text"
                  >
                    {copiedContent ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedContent ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap break-all font-mono select-text text-[11px]">
                  {preview.text_content}
                </pre>
              </div>
            )}

            {/* 9. Live PDF Document / IFrame Viewer */}
            {preview.preview_type === 'pdf' && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col shadow-inner">
                {preview.media_data ? (
                  <iframe
                    src={preview.media_data}
                    className="w-full h-80 rounded-xl border-none"
                    title={preview.name}
                  />
                ) : preview.thumbnail_data ? (
                  <img
                    src={preview.thumbnail_data}
                    alt={preview.name}
                    className="w-full h-full object-contain max-h-72"
                  />
                ) : (
                  <div className="p-6 text-center flex flex-col items-center gap-3 bg-red-50 dark:bg-red-950/40">
                    <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-red-900 dark:text-red-100">PDF Document</h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">Click below to open in your default reader</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 10. Archive Card / Thumbnail */}
            {preview.preview_type === 'archive' && (
              preview.thumbnail_data ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center max-h-72 shadow-inner">
                  <img src={preview.thumbnail_data} alt={preview.name} className="w-full h-full object-contain max-h-72" />
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md">
                    <FileArchive className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-900 dark:text-amber-100">Compressed Archive</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Click below to browse or extract contents</p>
                  </div>
                </div>
              )
            )}

            {/* 11. Office Document Preview */}
            {preview.preview_type === 'office' && (
              preview.thumbnail_data ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center max-h-72 shadow-inner">
                  <img src={preview.thumbnail_data} alt={preview.name} className="w-full h-full object-contain max-h-72" />
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-blue-900 dark:text-blue-100">Office Document</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Click below to open and edit in Office</p>
                  </div>
                </div>
              )
            )}

            {/* 12. 3D Model Card */}
            {preview.preview_type === '3d' && (
              preview.thumbnail_data ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center max-h-72 shadow-inner">
                  <img src={preview.thumbnail_data} alt={preview.name} className="w-full h-full object-contain max-h-72" />
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Box className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-indigo-900 dark:text-indigo-100">3D CAD Model</h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">Click below to view in default 3D viewer</p>
                  </div>
                </div>
              )
            )}

            {/* 13. Design & Creative Asset Card */}
            {preview.preview_type === 'design' && (
              preview.thumbnail_data ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center max-h-72 shadow-inner">
                  <img src={preview.thumbnail_data} alt={preview.name} className="w-full h-full object-contain max-h-72" />
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-md">
                    <Palette className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-pink-900 dark:text-pink-100">Creative Design File</h4>
                    <p className="text-xs text-pink-700 dark:text-pink-300 mt-0.5">Click below to open in your design app</p>
                  </div>
                </div>
              )
            )}

            {/* 14. System Binary & Executable Card */}
            {preview.preview_type === 'system' && (
              <div className="p-6 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-md">
                  <Cpu className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-cyan-900 dark:text-cyan-100">System Application / Binary</h4>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-0.5">Executable program or package</p>
                </div>
              </div>
            )}

            {/* File Info Metadata Table */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-semibold">{t.size}:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatSize(preview.size)}
                </span>
              </div>

              {preview.dimensions && (
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Dimensions:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {preview.dimensions[0]} × {preview.dimensions[1]} px
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-semibold">{t.dateModified}:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDate(preview.modified)}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold">Full Path:</span>
                <span className="font-mono text-[11px] text-slate-800 dark:text-slate-300 break-all select-text">
                  {preview.path}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Footer Quick Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => onOpenWithApp(filePath)}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open with Default App</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyPath}
            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Path'}</span>
          </button>

          <button
            type="button"
            onClick={() => tauriApi.revealInExplorer(filePath)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-amber-500" />
            <span>Show in Explorer</span>
          </button>
        </div>
      </div>

    </aside>
  );
};
