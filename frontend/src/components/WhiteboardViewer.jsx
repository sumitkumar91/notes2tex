import React, { useState } from 'react';
import { Layers, Eye, Sliders, Scan, Info } from 'lucide-react';

export default function WhiteboardViewer({
  rawImage,
  enhancedImage,
  regions = [],
  selectedRegionId,
  onSelectRegion,
  metrics,
  pdfInfo,
  onPageChange
}) {
  const [viewMode, setViewMode] = useState('segmented'); // 'segmented' | 'enhanced' | 'raw'
  const [hoveredRegionId, setHoveredRegionId] = useState(null);

  // Active image to display
  const displayImage = (viewMode === 'raw' || !enhancedImage) ? rawImage : enhancedImage;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'math':
        return {
          border: 'border-black',
          bg: 'bg-sky-400/25',
          text: 'text-black',
          badge: 'bg-[#93c5fd] text-black border border-black',
          ring: 'ring-sky-500'
        };
      case 'diagram':
        return {
          border: 'border-black',
          bg: 'bg-purple-400/25',
          text: 'text-black',
          badge: 'bg-[#e9d5ff] text-black border border-black',
          ring: 'ring-purple-500'
        };
      case 'text':
      default:
        return {
          border: 'border-black',
          bg: 'bg-emerald-400/25',
          text: 'text-black',
          badge: 'bg-[#bbf7d0] text-black border border-black',
          ring: 'ring-emerald-500'
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black rounded-2xl overflow-hidden shadow-neo">
      
      {/* Top Bar / View Modes */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-[#fbf9f4]">
        <div className="flex items-center gap-2">
          <Scan className="w-4 h-4 text-black" />
          <span className="font-black text-sm text-black">Vision Analysis Canvas</span>
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-white text-black border-2 border-black shadow-neo-sm">
            {regions.length} Regions
          </span>
        </div>

        {/* PDF Page Controls (if PDF loaded) */}
        {pdfInfo?.is_pdf && pdfInfo.total_pages > 1 && (
          <div className="flex items-center gap-2 bg-[#fde047] border-2 border-black px-3 py-1 rounded-xl text-xs shadow-neo-sm">
            <span className="text-black font-mono font-bold">Page {pdfInfo.current_page} of {pdfInfo.total_pages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={pdfInfo.current_page <= 1}
                onClick={() => onPageChange(pdfInfo.current_page - 1)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 disabled:opacity-40 text-black border border-black font-bold transition"
                title="Previous PDF Page"
              >
                &larr;
              </button>
              <button
                disabled={pdfInfo.current_page >= pdfInfo.total_pages}
                onClick={() => onPageChange(pdfInfo.current_page + 1)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 disabled:opacity-40 text-black border border-black font-bold transition"
                title="Next PDF Page"
              >
                &rarr;
              </button>
            </div>
          </div>
        )}

        {/* View Switcher Buttons */}
        <div className="flex items-center bg-[#f4efe6] border-2 border-black rounded-xl p-1 gap-1 text-xs shadow-neo-sm">
          <button
            onClick={() => setViewMode('segmented')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-bold border-2 ${
              viewMode === 'segmented'
                ? 'bg-[#99f6e4] border-black text-black shadow-neo-sm'
                : 'border-transparent text-slate-700 hover:text-black'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AI Bounding Boxes</span>
          </button>
          
          <button
            onClick={() => setViewMode('enhanced')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-bold border-2 ${
              viewMode === 'enhanced'
                ? 'bg-[#99f6e4] border-black text-black shadow-neo-sm'
                : 'border-transparent text-slate-700 hover:text-black'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>OpenCV CLAHE</span>
          </button>

          <button
            onClick={() => setViewMode('raw')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-bold border-2 ${
              viewMode === 'raw'
                ? 'bg-[#99f6e4] border-black text-black shadow-neo-sm'
                : 'border-transparent text-slate-700 hover:text-black'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Raw Photo</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 bg-[#f8f6f0] flex items-center justify-center p-3 overflow-hidden select-none">
        {displayImage ? (
          <div className="relative max-w-full max-h-[580px] rounded-xl overflow-hidden shadow-neo border-2 border-black bg-white">
            <img
              src={displayImage}
              alt="Whiteboard Lecture"
              className="w-full h-auto max-h-[580px] object-contain block"
            />

            {/* Bounding Box Overlay (in segmented mode) */}
            {viewMode === 'segmented' && (
              <div className="absolute inset-0 pointer-events-auto">
                {regions.map((region) => {
                  const style = getTypeStyle(region.type);
                  const isSelected = selectedRegionId === region.id;
                  const isHovered = hoveredRegionId === region.id;
                  const norm = region.bbox.normalized;

                  const top = `${norm.ymin * 100}%`;
                  const left = `${norm.xmin * 100}%`;
                  const width = `${(norm.xmax - norm.xmin) * 100}%`;
                  const height = `${(norm.ymax - norm.ymin) * 100}%`;

                  return (
                    <div
                      key={region.id}
                      onClick={() => onSelectRegion(region.id)}
                      onMouseEnter={() => setHoveredRegionId(region.id)}
                      onMouseLeave={() => setHoveredRegionId(null)}
                      style={{ top, left, width, height }}
                      className={`absolute cursor-pointer border-2 transition-all rounded-md flex flex-col justify-between ${style.border} ${style.bg} ${
                        isSelected
                          ? `ring-4 ${style.ring} ring-opacity-90 scale-[1.01] z-20 shadow-lg`
                          : isHovered
                          ? 'ring-2 ring-black z-10'
                          : 'opacity-90 hover:opacity-100'
                      }`}
                    >
                      {/* Top Tag Badge */}
                      <div className="flex items-center gap-1 p-1">
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shadow-sm ${style.badge}`}>
                          #{region.reading_order} {region.type.toUpperCase()}
                        </span>
                        {region.confidence && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white text-black border border-black">
                            {Math.round(region.confidence * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Bottom Label on Hover */}
                      {(isHovered || isSelected) && (
                        <div className="bg-black text-white text-[11px] p-1.5 rounded-b font-medium border-t border-black truncate">
                          {region.label || region.type}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-slate-600 bg-white border-2 border-black rounded-2xl shadow-neo p-8 max-w-sm">
            <Scan className="w-12 h-12 mx-auto mb-3 opacity-40 text-black" />
            <p className="font-bold text-base text-black">No document loaded</p>
            <p className="text-xs text-slate-600 mt-1">Select the CSE 320 demo sample or upload a photo / PDF above.</p>
          </div>
        )}
      </div>

      {/* Legend & Instructions Footer */}
      <div className="px-4 py-2.5 bg-[#fbf9f4] border-t-2 border-black flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center gap-4">
          <span className="font-mono font-bold text-slate-800 uppercase text-[10px]">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#bbf7d0] border border-black shadow-sm" />
            <span className="font-bold text-black text-xs">Text Notes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#93c5fd] border border-black shadow-sm" />
            <span className="font-bold text-black text-xs">Math Equations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#e9d5ff] border border-black shadow-sm" />
            <span className="font-bold text-black text-xs">Diagram / TikZ</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-800 font-mono font-bold flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>Click any bounding box to inspect & jump to compiled section</span>
        </div>
      </div>

    </div>
  );
}
