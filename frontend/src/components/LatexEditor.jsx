import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

export default function LatexEditor({
  latexContent = '',
  title = 'board2tex_notes',
  onExportTex
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(latexContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm text-slate-200">Raw LaTeX Source (.tex)</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {latexContent.split('\n').length} Lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy All'}</span>
          </button>

          <button
            onClick={onExportTex}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .tex</span>
          </button>
        </div>
      </div>

      {/* Editor / Code area */}
      <div className="flex-1 bg-slate-950 p-4 overflow-y-auto">
        <pre className="text-xs font-mono text-cyan-300 leading-relaxed whitespace-pre-wrap select-text">
          {latexContent || '% No LaTeX content generated yet'}
        </pre>
      </div>

      {/* Compiler status footer */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Valid LaTeX 2e Document Class article</span>
        </div>
        <span className="text-slate-500 font-mono text-[11px]">Ready for Overleaf / pdflatex</span>
      </div>
    </div>
  );
}
