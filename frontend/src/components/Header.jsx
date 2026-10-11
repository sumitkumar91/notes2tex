import React from 'react';
import { FileCode, Download, Printer, Key, Sparkles, Upload, Image as ImageIcon, Check } from 'lucide-react';

export default function Header({
  samples,
  activeSampleId,
  onSelectSample,
  onUploadClick,
  onExportTex,
  onPrintPdf,
  onOpenApiKeyModal,
  hasApiKey,
  copiedTex,
  onCopyTex,
  processing
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-xl">
            📐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Board2TeX</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                🍌 Banana Hacks 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Messy Whiteboard <span className="text-cyan-400 font-mono">&rarr;</span> Compiled LaTeX & TikZ Study Guide
            </p>
          </div>
        </div>

        {/* Center: Quick Sample Selector & Upload */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Demo:
          </span>
          <button
            onClick={() => onSelectSample('sample-cse320')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSampleId === 'sample-cse320'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            CSE 320 (Virtual Memory & Heap)
          </button>
          
          <div className="w-[1px] h-4 bg-slate-800 mx-1" />

          <button
            onClick={onUploadClick}
            disabled={processing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Photo</span>
          </button>
        </div>

        {/* Right Actions: API Key, Copy, Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
              hasApiKey
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/80 text-slate-300'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Key Active' : 'API Key'}</span>
          </button>

          <button
            onClick={onCopyTex}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Copy LaTeX source"
          >
            {copiedTex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedTex ? 'Copied!' : 'Copy .tex'}</span>
          </button>

          <button
            onClick={onExportTex}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-md shadow-cyan-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .tex</span>
          </button>

          <button
            onClick={onPrintPdf}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>

      </div>
    </header>
  );
}
