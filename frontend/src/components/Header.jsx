import React from 'react';
import { FileCode, Download, Printer, Key, Sparkles, Upload, Check } from 'lucide-react';

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
    <header className="border-b-2 border-black bg-[#fbf9f4] sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fde047] border-2 border-black shadow-neo-sm flex items-center justify-center font-black text-sm tracking-wider text-black">
            N2T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-black tracking-tight">Notes2TeX</span>
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-white border border-black shadow-neo-sm uppercase text-slate-800">
                Studio
              </span>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-medium">
              Notes & Whiteboards &rarr; Compiled LaTeX
            </p>
          </div>
        </div>

        {/* Center: Quick Sample Selector & Upload */}
        <div className="flex items-center gap-2 bg-[#f4efe6] p-1.5 rounded-xl border-2 border-black shadow-neo-sm text-xs">
          <span className="text-slate-700 px-2 font-mono uppercase text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-black" /> Demo:
          </span>
          <button
            onClick={() => onSelectSample('sample-cse320')}
            className={`px-3 py-1.5 rounded-lg font-bold border-2 transition-all ${
              activeSampleId === 'sample-cse320'
                ? 'bg-[#fde047] border-black shadow-neo-sm text-black'
                : 'bg-white border-transparent text-slate-700 hover:border-black'
            }`}
          >
            CSE 320 (Virtual Memory & Heap)
          </button>
          
          <div className="w-[2px] h-4 bg-black mx-1" />

          <button
            onClick={onUploadClick}
            disabled={processing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#99f6e4] hover:bg-[#5eead4] border-2 border-black shadow-neo-sm text-black font-bold transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-black" />
            <span>Upload Photo / PDF</span>
          </button>
        </div>

        {/* Right Actions: API Key, Copy, Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border-2 border-black shadow-neo-sm font-bold transition ${
              hasApiKey
                ? 'bg-[#bbf7d0] text-emerald-950'
                : 'bg-white hover:bg-slate-50 text-black'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-black" />
            <span>{hasApiKey ? 'Key Active' : 'API Key'}</span>
          </button>

          <button
            onClick={onCopyTex}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-black border-2 border-black shadow-neo-sm font-bold transition"
            title="Copy LaTeX source"
          >
            {copiedTex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5 text-black" />}
            <span>{copiedTex ? 'Copied!' : 'Copy .tex'}</span>
          </button>

          <button
            onClick={onExportTex}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#fde047] hover:bg-[#facc15] text-black font-bold border-2 border-black shadow-neo-sm transition"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Export .tex</span>
          </button>

          <button
            onClick={onPrintPdf}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-black border-2 border-black shadow-neo-sm font-bold transition"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>

      </div>
    </header>
  );
}
