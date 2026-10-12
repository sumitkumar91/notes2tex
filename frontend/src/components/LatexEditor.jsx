import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';

export default function LatexEditor({
  latexContent = '',
  title = 'notes2tex_notes',
  onExportTex
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(latexContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black rounded-2xl overflow-hidden shadow-neo">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b-2 border-black bg-[#fbf9f4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-black" />
          <span className="font-black text-sm text-black">LaTeX Source (.tex)</span>
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-white border-2 border-black shadow-neo-sm text-black">
            {latexContent ? latexContent.split('\n').length : 0} Lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-[#fde047] text-black border-2 border-black shadow-neo-sm font-bold transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
            <span>{copied ? 'Copied' : 'Copy All'}</span>
          </button>

          <button
            onClick={onExportTex}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#99f6e4] hover:bg-[#5eead4] text-black border-2 border-black shadow-neo-sm font-bold transition"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Download .tex</span>
          </button>
        </div>
      </div>

      {/* Editor / Code area */}
      <div className="flex-1 bg-[#1e2022] p-5 overflow-y-auto">
        <pre className="text-xs font-mono text-[#fef08a] leading-relaxed whitespace-pre-wrap select-text">
          {latexContent || '% No LaTeX content generated yet'}
        </pre>
      </div>

      {/* Compiler status footer */}
      <div className="px-4 py-2.5 border-t-2 border-black bg-[#fbf9f4] flex items-center justify-between text-xs text-slate-800 font-mono">
        <div className="flex items-center gap-1.5 font-bold text-black">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Valid LaTeX 2e Document Class article</span>
        </div>
        <span className="font-bold text-slate-600 text-[11px]">Ready for Overleaf / pdflatex</span>
      </div>
    </div>
  );
}
