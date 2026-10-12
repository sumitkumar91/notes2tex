import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import { BookOpen, Code2, Sparkles, Check, Copy } from 'lucide-react';

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

  return <div ref={containerRef} className="my-2 overflow-x-auto text-black py-1 font-serif text-base" />;
}

// Formats text with inline math and bold LaTeX styling into clean HTML
function FormattedText({ content }) {
  if (!content) return null;

  const paragraphs = content
    .replace(/\\noindent/g, '')
    .replace(/\\vspace\{[^}]+\}/g, '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, idx) => (
        <p key={idx} className="leading-relaxed text-slate-900">
          <InlineContent text={p} />
        </p>
      ))}
    </div>
  );
}

function InlineContent({ text }) {
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
          return <strong key={i} className="font-black text-black"><InlineContent text={pt.val} /></strong>;
        }
        if (pt.type === 'italic') {
          return <em key={i} className="italic text-slate-800"><InlineContent text={pt.val} /></em>;
        }
        if (pt.type === 'math') {
          try {
            const html = katex.renderToString(pt.val, { throwOnError: false, displayMode: false });
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5 text-black font-serif" />;
          } catch {
            return <span key={i} className="font-mono text-black">{pt.val}</span>;
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white border-2 border-black rounded-2xl shadow-neo text-slate-600">
        <BookOpen className="w-12 h-12 mb-3 text-black opacity-30" />
        <p className="text-base font-bold text-black">No study guide loaded</p>
        <p className="text-xs text-slate-600 mt-1">Upload a photo / PDF or select a demo sample to generate.</p>
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
    <div className="flex flex-col h-full bg-white border-2 border-black rounded-2xl overflow-hidden shadow-neo">
      
      {/* Header / Meta */}
      <div className="px-5 py-3.5 border-b-2 border-black bg-[#fbf9f4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-black" />
          <span className="font-black text-sm text-black">Compiled Study Guide</span>
        </div>
        <div className="text-xs font-mono font-bold text-black bg-[#fde047] border-2 border-black shadow-neo-sm px-2.5 py-0.5 rounded-lg">
          Live KaTeX & TikZ Engine
        </div>
      </div>

      {/* Printable / Rendered Content Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f6f0] printable-card">
        
        {/* Document Title Header */}
        <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-neo">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-black uppercase tracking-wider mb-2">
            <span className="px-2 py-0.5 rounded bg-[#bbf7d0] border border-black shadow-sm">
              {studyGuide.subject || 'STEM Lecture'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-black tracking-tight">
            {studyGuide.title || 'Lecture Whiteboard Notes'}
          </h1>
          {studyGuide.summary && (
            <p className="text-xs text-slate-800 mt-3 p-3 bg-[#fbf9f4] border border-black rounded-xl leading-relaxed font-medium">
              {studyGuide.summary}
            </p>
          )}
        </div>

        {/* Region Cards */}
        <div className="space-y-4">
          {studyGuide.regions?.map((region) => {
            const isSelected = selectedRegionId === region.id;

            return (
              <div
                key={region.id}
                ref={(el) => (cardRefs.current[region.id] = el)}
                onClick={() => onSelectRegion(region.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-black ring-4 ring-[#fde047] shadow-neo scale-[1.01]'
                    : 'border-black shadow-neo-sm hover:shadow-neo'
                }`}
              >
                {/* Region Tag & Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-black ${
                      region.type === 'math'
                        ? 'bg-[#93c5fd] text-black'
                        : region.type === 'diagram'
                        ? 'bg-[#e9d5ff] text-black'
                        : 'bg-[#bbf7d0] text-black'
                    }`}>
                      #{region.reading_order} {region.type.toUpperCase()}
                    </span>
                    <span className="text-sm font-black text-black">
                      {region.label || `Section ${region.reading_order}`}
                    </span>
                  </div>

                  {region.type === 'diagram' && region.tikz && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTikZ(region.id);
                      }}
                      className="text-xs text-black font-bold font-mono bg-white hover:bg-[#fde047] px-2.5 py-1 rounded-lg border-2 border-black shadow-neo-sm flex items-center gap-1 transition"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{showTikZCode[region.id] ? 'View SVG' : 'View TikZ'}</span>
                    </button>
                  )}
                </div>

                {/* Content according to type */}
                {/* 1. MATH REGION */}
                {region.type === 'math' && (
                  <div className="bg-[#fbf9f4] p-4 rounded-xl border-2 border-black shadow-neo-sm my-2">
                    {region.math_expressions?.map((expr, i) => (
                      <MathBlock key={i} math={expr} display={true} />
                    ))}
                    {(!region.math_expressions || region.math_expressions.length === 0) && (
                      <pre className="text-xs font-mono text-black whitespace-pre-wrap">
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
                          className="absolute top-2 right-2 flex items-center gap-1 text-[11px] bg-white hover:bg-slate-100 text-black px-2 py-1 rounded border border-black font-bold shadow-sm z-10"
                        >
                          {copiedTikZ === region.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedTikZ === region.id ? 'Copied' : 'Copy TikZ'}</span>
                        </button>
                        <pre className="bg-[#fbf9f4] text-black p-4 rounded-xl border-2 border-black text-xs font-mono overflow-x-auto shadow-neo-sm">
                          {region.tikz}
                        </pre>
                      </div>
                    ) : (
                      <div className="mt-2 bg-[#fbf9f4] p-4 rounded-xl border-2 border-black shadow-neo-sm">
                        {region.svg ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: region.svg }}
                            className="w-full flex justify-center"
                          />
                        ) : (
                          <div className="text-xs font-mono text-black whitespace-pre-wrap">
                            {region.tikz}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. TEXT REGION */}
                {region.type === 'text' && (
                  <div className="text-sm text-slate-900 bg-[#fbf9f4] p-4 rounded-xl border-2 border-black leading-relaxed shadow-neo-sm">
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
