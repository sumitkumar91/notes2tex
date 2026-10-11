import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { BookOpen, Code2, ExternalLink, Sparkles, Check, Copy } from 'lucide-react';

// Safe KaTeX equation renderer
function MathBlock({ math, display = true }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && math) {
      try {
        katex.render(math, containerRef.current, {
          throwOnError: false,
          displayMode: display,
        });
      } catch (err) {
        containerRef.current.innerText = math;
      }
    }
  }, [math, display]);

  return <div ref={containerRef} className="my-2 overflow-x-auto text-slate-100 py-1" />;
}

// Formats text with inline math and bold LaTeX styling into clean HTML
function FormattedText({ content }) {
  if (!content) return null;

  // Split into paragraphs by double newlines or single newlines
  const paragraphs = content
    .replace(/\\noindent/g, '')
    .replace(/\\vspace\{[^}]+\}/g, '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, idx) => (
        <p key={idx} className="leading-relaxed">
          <InlineContent text={p} />
        </p>
      ))}
    </div>
  );
}

function InlineContent({ text }) {
  // Replace \textbf{...} and \textit{...} and inline $math$
  // Parse math segments delimited by $...$
  const parts = [];
  const regex = /(\$[^$]+\$|\\textbf\{[^}]+\}|\\textit\{[^}]+\})/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', val: text.substring(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('$') && token.endsWith('$')) {
      parts.push({ type: 'math', val: token.slice(1, -1) });
    } else if (token.startsWith('\\textbf{')) {
      parts.push({ type: 'bold', val: token.slice(8, -1) });
    } else if (token.startsWith('\\textit{')) {
      parts.push({ type: 'italic', val: token.slice(8, -1) });
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', val: text.substring(lastIndex) });
  }

  return (
    <>
      {parts.map((pt, i) => {
        if (pt.type === 'bold') {
          return <strong key={i} className="font-bold text-white"><InlineContent text={pt.val} /></strong>;
        }
        if (pt.type === 'italic') {
          return <em key={i} className="italic text-slate-200"><InlineContent text={pt.val} /></em>;
        }
        if (pt.type === 'math') {
          try {
            const html = katex.renderToString(pt.val, { throwOnError: false, displayMode: false });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5 text-cyan-300 font-serif" />;
          } catch {
            return <span key={i} className="font-mono text-cyan-300">{pt.val}</span>;
          }
        }
        return <span key={i}>{pt.val}</span>;
      })}
    </>
  );
}

export default function StudyGuideViewer({
  studyGuide,
  selectedRegionId,
  onSelectRegion
}) {
  const [showTikZCode, setShowTikZCode] = useState({});
  const [copiedTikZ, setCopiedTikZ] = useState(null);
  const cardRefs = useRef({});

  // Auto-scroll to selected region when selected from whiteboard viewer
  useEffect(() => {
    if (selectedRegionId && cardRefs.current[selectedRegionId]) {
      cardRefs.current[selectedRegionId].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedRegionId]);

  if (!studyGuide) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
        <BookOpen className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium">No study guide loaded.</p>
        <p className="text-xs text-slate-600 mt-1">Upload a whiteboard or click a sample to generate.</p>
      </div>
    );
  }

  const toggleTikZ = (id) => {
    setShowTikZCode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyTikZ = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedTikZ(id);
    setTimeout(() => setCopiedTikZ(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Header / Meta */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm text-slate-200">Compiled Study Guide</span>
        </div>
        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
          Live KaTeX & TikZ Engine
        </div>
      </div>

      {/* Printable / Rendered Content Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 printable-card">
        
        {/* Document Title Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{studyGuide.subject || 'STEM Lecture'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {studyGuide.title || 'Lecture Whiteboard Notes'}
          </h1>
          {studyGuide.summary && (
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {studyGuide.summary}
            </p>
          )}
        </div>

        {/* Region Cards */}
        <div className="space-y-5">
          {studyGuide.regions?.map((region) => {
            const isSelected = selectedRegionId === region.id;

            return (
              <div
                key={region.id}
                ref={(el) => (cardRefs.current[region.id] = el)}
                onClick={() => onSelectRegion(region.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-lg ring-2 ring-cyan-500/40'
                    : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                {/* Region Tag & Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      region.type === 'math'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : region.type === 'diagram'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      #{region.reading_order} {region.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      {region.label || `Section ${region.reading_order}`}
                    </span>
                  </div>

                  {region.type === 'diagram' && region.tikz && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTikZ(region.id);
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono bg-purple-950/40 px-2 py-1 rounded border border-purple-800/40"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{showTikZCode[region.id] ? 'View SVG' : 'View TikZ'}</span>
                    </button>
                  )}
                </div>

                {/* Content according to type */}
                {/* 1. MATH REGION */}
                {region.type === 'math' && (
                  <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800/80 my-2">
                    {region.math_expressions?.map((expr, i) => (
                      <MathBlock key={i} math={expr} display={true} />
                    ))}
                    {(!region.math_expressions || region.math_expressions.length === 0) && (
                      <pre className="text-xs font-mono text-sky-300 whitespace-pre-wrap">
                        {region.latex}
                      </pre>
                    )}
                  </div>
                )}

                {/* 2. DIAGRAM REGION (TikZ & SVG) */}
                {region.type === 'diagram' && (
                  <div>
                    {showTikZCode[region.id] ? (
                      <div className="relative mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyTikZ(region.id, region.tikz);
                          }}
                          className="absolute top-2 right-2 flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-700 z-10"
                        >
                          {copiedTikZ === region.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedTikZ === region.id ? 'Copied' : 'Copy TikZ'}</span>
                        </button>
                        <pre className="bg-slate-950 text-purple-300 p-4 rounded-lg border border-purple-900/40 text-xs font-mono overflow-x-auto">
                          {region.tikz}
                        </pre>
                      </div>
                    ) : (
                      <div className="mt-2">
                        {region.svg ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: region.svg }}
                            className="w-full flex justify-center"
                          />
                        ) : (
                          <div className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-purple-300">
                            {region.tikz}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TEXT REGION */}
                {region.type === 'text' && (
                  <div className="text-sm text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-slate-800/60 leading-relaxed">
                    <FormattedText content={region.latex} />
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
