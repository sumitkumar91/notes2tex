import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import WhiteboardViewer from './components/WhiteboardViewer';
import StudyGuideViewer from './components/StudyGuideViewer';
import LatexEditor from './components/LatexEditor';
import OpenCVInspector from './components/OpenCVInspector';
import ApiKeyModal from './components/ApiKeyModal';
import { BookOpen, FileCode, Cpu, Loader2, AlertCircle } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8008';

export default function App() {
  const [samples, setSamples] = useState([]);
  const [activeSampleId, setActiveSampleId] = useState('sample-cse320');
  const [currentData, setCurrentData] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('studyGuide'); // 'studyGuide' | 'latex' | 'inspector'
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copiedTex, setCopiedTex] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval;
    if (processing) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(prev => +(prev + 0.5).toFixed(1));
      }, 500);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [processing]);

  const fileInputRef = useRef(null);

  // Initialize API Key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('board2tex_gemini_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Fetch pre-loaded samples on start
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/samples`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (data.samples && data.samples.length > 0) {
          setSamples(data.samples);
          const cse320 = data.samples[0];
          setCurrentData({
            raw_image: cse320.raw_image,
            enhanced_image: cse320.raw_image,
            opencv_metrics: cse320.opencv_metrics,
            study_guide: {
              title: cse320.title,
              subject: cse320.subject,
              summary: "Extracted from lecture whiteboard on memory hierarchy, heap boundary tags, and explicit doubly linked free lists.",
              regions: cse320.regions,
              latex_full: cse320.latex_full
            }
          });
        }
      } catch (err) {
        console.warn('Could not load samples from backend directly, trying proxy:', err);
        // Fallback to proxy
        try {
          const res2 = await fetch('/api/samples');
          const data2 = await res2.json();
          if (data2.samples?.length > 0) {
            setSamples(data2.samples);
            const cse320 = data2.samples[0];
            setCurrentData({
              raw_image: cse320.raw_image,
              enhanced_image: cse320.raw_image,
              opencv_metrics: cse320.opencv_metrics,
              study_guide: {
                title: cse320.title,
                subject: cse320.subject,
                summary: "Extracted from lecture whiteboard on memory hierarchy, heap boundary tags, and explicit doubly linked free lists.",
                regions: cse320.regions,
                latex_full: cse320.latex_full
              }
            });
          }
        } catch (e) {
          console.error('All sample fetch attempts failed:', e);
        }
      }
    };

    fetchSamples();
  }, []);

  const handleSelectSample = (sampleId) => {
    setActiveSampleId(sampleId);
    setErrorMsg(null);
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      setCurrentData({
        raw_image: sample.raw_image,
        enhanced_image: sample.raw_image,
        opencv_metrics: sample.opencv_metrics,
        study_guide: {
          title: sample.title,
          subject: sample.subject,
          summary: "Extracted from lecture whiteboard on memory hierarchy, heap boundary tags, and explicit doubly linked free lists.",
          regions: sample.regions,
          latex_full: sample.latex_full
        }
      });
      setSelectedRegionId(null);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setErrorMsg(null);
    setActiveSampleId('custom');

    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (apiKey) {
      headers['X-Gemini-Key'] = apiKey;
    }

    try {
      let res;
      try {
        res = await fetch(`${API_BASE}/api/process`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } catch (directErr) {
        console.warn('Direct connection failed, attempting proxy:', directErr);
        res = await fetch('/api/process', {
          method: 'POST',
          headers,
          body: formData,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to process whiteboard photo.');
      }

      setCurrentData({
        raw_image: data.rectified_image,
        enhanced_image: data.enhanced_image,
        opencv_metrics: data.opencv_metrics,
        study_guide: data.study_guide
      });
      setSelectedRegionId(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error processing image. Check backend connection.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportTex = () => {
    const latexContent = currentData?.study_guide?.latex_full || '% Empty document';
    const blob = new Blob([latexContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(currentData?.study_guide?.title || 'lecture_notes').toLowerCase().replace(/\s+/g, '_')}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTex = () => {
    const latexContent = currentData?.study_guide?.latex_full || '';
    if (!latexContent) return;
    navigator.clipboard.writeText(latexContent);
    setCopiedTex(true);
    setTimeout(() => setCopiedTex(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('board2tex_gemini_key', newKey);
    } else {
      localStorage.removeItem('board2tex_gemini_key');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Navigation */}
      <div className="no-print">
        <Header
          samples={samples}
          activeSampleId={activeSampleId}
          onSelectSample={handleSelectSample}
          onUploadClick={handleUploadClick}
          onExportTex={handleExportTex}
          onPrintPdf={handlePrintPdf}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          hasApiKey={Boolean(apiKey)}
          copiedTex={copiedTex}
          onCopyTex={handleCopyTex}
          processing={processing}
        />
      </div>

      {/* Processing Pipeline Modal */}
      {processing && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                <h3 className="font-bold text-base text-white">Compiling Lecture Document</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {elapsedSeconds}s elapsed
              </span>
            </div>

            {/* Stepper Stages */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  elapsedSeconds >= 1.5 ? 'bg-emerald-500 text-slate-950' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                }`}>
                  {elapsedSeconds >= 1.5 ? '✓' : '1'}
                </span>
                <span className={elapsedSeconds >= 1.5 ? 'text-slate-300 font-medium' : 'text-cyan-300 font-semibold'}>
                  OpenCV 4-Point Homography & Keystoning
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  elapsedSeconds >= 3.0 ? 'bg-emerald-500 text-slate-950' : elapsedSeconds >= 1.5 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse' : 'bg-slate-800 text-slate-500'
                }`}>
                  {elapsedSeconds >= 3.0 ? '✓' : '2'}
                </span>
                <span className={elapsedSeconds >= 3.0 ? 'text-slate-300 font-medium' : elapsedSeconds >= 1.5 ? 'text-cyan-300 font-semibold' : 'text-slate-500'}>
                  CLAHE Glare Suppression & Ink Normalization
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  elapsedSeconds >= 14.0 ? 'bg-emerald-500 text-slate-950' : elapsedSeconds >= 3.0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse' : 'bg-slate-800 text-slate-500'
                }`}>
                  {elapsedSeconds >= 14.0 ? '✓' : '3'}
                </span>
                <span className={elapsedSeconds >= 14.0 ? 'text-slate-300 font-medium' : elapsedSeconds >= 3.0 ? 'text-cyan-300 font-semibold' : 'text-slate-500'}>
                  Multimodal Vision: Transcribing Math & Logic Proofs
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  elapsedSeconds >= 17.0 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse' : 'bg-slate-800 text-slate-500'
                }`}>
                  4
                </span>
                <span className={elapsedSeconds >= 17.0 ? 'text-cyan-300 font-semibold' : 'text-slate-500'}>
                  Assembling LaTeX Document & KaTeX Engine
                </span>
              </div>
            </div>

            {/* Progress Bar & ETA */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(95, Math.max(10, Math.round((elapsedSeconds / 18.0) * 90)))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Generating full academic LaTeX study guide (~15-18s)...
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3 no-print">
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-200 underline text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Whiteboard Viewer Canvas (5 cols) */}
        <section className="lg:col-span-5 h-[680px] no-print">
          <WhiteboardViewer
            rawImage={currentData?.raw_image}
            enhancedImage={currentData?.enhanced_image}
            regions={currentData?.study_guide?.regions || []}
            selectedRegionId={selectedRegionId}
            onSelectRegion={(id) => setSelectedRegionId(id)}
            metrics={currentData?.opencv_metrics}
          />
        </section>

        {/* Right Column: Tabbed Output (7 cols) */}
        <section className="lg:col-span-7 h-[680px] flex flex-col">
          
          {/* Right Column Tab Switcher */}
          <div className="flex items-center gap-1 mb-2 bg-slate-900 border border-slate-800 p-1 rounded-xl w-fit text-xs no-print">
            <button
              onClick={() => setActiveRightTab('studyGuide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeRightTab === 'studyGuide'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rendered Study Guide</span>
            </button>

            <button
              onClick={() => setActiveRightTab('latex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeRightTab === 'latex'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>LaTeX Source (.tex)</span>
            </button>

            <button
              onClick={() => setActiveRightTab('inspector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activeRightTab === 'inspector'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-yellow-400" />
              <span>CV Pipeline Inspector</span>
            </button>
          </div>

          {/* Active Tab Pane */}
          <div className="flex-1 min-h-0">
            {activeRightTab === 'studyGuide' && (
              <StudyGuideViewer
                studyGuide={currentData?.study_guide}
                selectedRegionId={selectedRegionId}
                onSelectRegion={(id) => setSelectedRegionId(id)}
              />
            )}

            {activeRightTab === 'latex' && (
              <LatexEditor
                latexContent={currentData?.study_guide?.latex_full}
                title={currentData?.study_guide?.title}
                onExportTex={handleExportTex}
              />
            )}

            {activeRightTab === 'inspector' && (
              <OpenCVInspector
                metrics={currentData?.opencv_metrics}
                regions={currentData?.study_guide?.regions || []}
              />
            )}
          </div>

        </section>

      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

    </div>
  );
}
