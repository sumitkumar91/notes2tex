import React, { useState } from 'react';
import { Layers, Eye, Sliders, Scan, Info } from 'lucide-react';

export default function WhiteboardViewer({
  rawImage,
  enhancedImage,
  regions = [],
  selectedRegionId,
  onSelectRegion,
  metrics
}) {
  const [viewMode, setViewMode] = useState('segmented'); // 'segmented' | 'enhanced' | 'raw'
  const [hoveredRegionId, setHoveredRegionId] = useState(null);

  // Active image to display
  const displayImage = (viewMode === 'raw' || !enhancedImage) ? rawImage : enhancedImage;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'math':
        return {
          border: 'border-sky-500',
          bg: 'bg-sky-500/15',
          text: 'text-sky-300',
          badge: 'bg-sky-500 text-slate-950',
          ring: 'ring-sky-400'
        };
      case 'diagram':
        return {
          border: 'border-purple-500',
          bg: 'bg-purple-500/15',
          text: 'text-purple-300',
          badge: 'bg-purple-500 text-white',
          ring: 'ring-purple-400'
        };
      case 'text':
      default:
        return {
          border: 'border-emerald-500',
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500 text-slate-950',
          ring: 'ring-emerald-400'
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Top Bar / View Modes */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Scan className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm text-slate-200">Vision Analysis Canvas</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {regions.length} Regions Segmented
          </span>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setViewMode('segmented')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              viewMode === 'segmented'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AI Bounding Boxes</span>
          </button>
          
          <button
            onClick={() => setViewMode('enhanced')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              viewMode === 'enhanced'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>OpenCV CLAHE</span>
          </button>

          <button
            onClick={() => setViewMode('raw')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              viewMode === 'raw'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Raw Photo</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-3 overflow-hidden select-none">
        {displayImage ? (
          <div className="relative max-w-full max-h-[580px] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
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
                          ? `ring-4 ${style.ring} ring-opacity-80 scale-[1.01] z-20 shadow-lg`
                          : isHovered
                          ? 'ring-2 ring-white/50 z-10'
                          : 'opacity-85 hover:opacity-100'
                      }`}
                    >
                      {/* Top Tag Badge */}
                      <div className="flex items-center gap-1 p-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow ${style.badge}`}>
                          #{region.reading_order} {region.type.toUpperCase()}
                        </span>
                        {region.confidence && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-900/80 text-slate-300 backdrop-blur-sm">
                            {Math.round(region.confidence * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Bottom Label on Hover */}
                      {(isHovered || isSelected) && (
                        <div className="bg-slate-950/90 text-white text-[11px] p-1.5 rounded-b font-medium backdrop-blur-sm border-t border-slate-700/60 truncate">
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
          <div className="text-center p-8 text-slate-500">
            <Scan className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
            <p className="text-sm">No whiteboard image loaded.</p>
            <p className="text-xs text-slate-600 mt-1">Select a demo sample or upload a photo above.</p>
          </div>
        )}
      </div>

      {/* Legend & Instructions Footer */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-500">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Text Notes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-300">Math Equations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-300">Diagram / TikZ</span>
          </div>
        </div>

        <div className="text-[11px] text-cyan-400/90 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span>Click any box to inspect & jump to compiled section</span>
        </div>
      </div>

    </div>
  );
}
