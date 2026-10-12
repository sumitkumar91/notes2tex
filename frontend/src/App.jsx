import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import WhiteboardViewer from './components/WhiteboardViewer';
import StudyGuideViewer from './components/StudyGuideViewer';
import LatexEditor from './components/LatexEditor';
import OpenCVInspector from './components/OpenCVInspector';
import ApiKeyModal from './components/ApiKeyModal';
import { BookOpen, FileCode, Cpu, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';

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
    const savedKey = localStorage.getItem('notes2tex_gemini_key') || localStorage.getItem('board2tex_gemini_key');
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

  const [currentFile, setCurrentFile] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFile(file);
    await processFile(file, 1);
  };

  const handlePdfPageChange = async (newPage) => {
    if (!currentFile) return;
    await processFile(currentFile, newPage);
  };

  const processFile = async (file, pageNum = 1) => {
    setProcessing(true);
    setErrorMsg(null);
    setActiveSampleId('custom');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('page', pageNum);

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
        throw new Error(data.detail || 'Failed to process document.');
      }

      setCurrentData({
        raw_image: data.rectified_image,
        enhanced_image: data.enhanced_image,
        opencv_metrics: data.opencv_metrics,
        pdf_info: data.pdf_info,
        study_guide: data.study_guide
      });
      setSelectedRegionId(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error processing document. Check backend connection.');
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
      localStorage.setItem('notes2tex_gemini_key', newKey);
    } else {
      localStorage.removeItem('notes2tex_gemini_key');
      localStorage.removeItem('board2tex_gemini_key');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-grid-notebook text-slate-900 selection:bg-[#fde047] selection:text-black">
      
      {/* Hidden File Input (Images & PDF) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf,.pdf"
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

      {/* Hero / Quick Features Cards (matching reference image style) */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-5 pb-1 no-print">
        <div className="mb-3">
          <span className="text-[10px] font-mono font-bold tracking-widest text-slate-600 uppercase block mb-0.5">
            THE PIPELINE
          </span>
          <h2 className="text-xl font-black text-black tracking-tight">
            Turn lecture scribbles into publication-grade LaTeX
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
          {/* Yellow Card */}
          <div className="p-3.5 rounded-xl bg-[#fef08a] border-2 border-black shadow-neo-sm transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo">
            <h3 className="font-black text-sm text-black mb-1">Perspective Keystoning</h3>
            <p className="text-xs text-slate-800 leading-snug font-medium">
              OpenCV 4-point homography straightens angled photos and desk snapshots into orthogonal planes.
            </p>
          </div>

          {/* Mint Teal Card */}
          <div className="p-3.5 rounded-xl bg-[#99f6e4] border-2 border-black shadow-neo-sm transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo">
            <h3 className="font-black text-sm text-black mb-1">KaTeX & Synthetic TikZ</h3>
            <p className="text-xs text-slate-800 leading-snug font-medium">
              Transcribes mathematical proofs and redraws diagram boxes into editable, vector TikZ graphics.
            </p>
          </div>

          {/* White Card */}
          <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-neo-sm transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo">
            <h3 className="font-black text-sm text-black mb-1">1-Click Overleaf & PDF</h3>
            <p className="text-xs text-slate-800 leading-snug font-medium">
              Multi-page PDF slide deck pagination, plus Chrome extension that injects directly into Overleaf.
            </p>
          </div>
        </div>
      </div>

      {/* Processing Pipeline Modal */}
      {processing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-[#fbf9f4] border-2 border-black rounded-2xl max-w-md w-full p-6 shadow-neo-lg space-y-5 animate-fade-in text-black">
            
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 text-black animate-spin" />
                <h3 className="font-black text-base text-black">Compiling Notes to LaTeX</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#fde047] text-black border border-black shadow-sm">
                {elapsedSeconds}s elapsed
              </span>
            </div>

            {/* Stepper Stages */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg border border-black flex items-center justify-center font-black text-xs shadow-sm ${
                  elapsedSeconds >= 1.5 ? 'bg-[#bbf7d0] text-black' : 'bg-[#fde047] text-black animate-pulse'
                }`}>
                  {elapsedSeconds >= 1.5 ? '✓' : '1'}
                </span>
                <span className={elapsedSeconds >= 1.5 ? 'text-slate-800 font-bold' : 'text-black font-black'}>
                  OpenCV 4-Point Homography & Keystoning
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg border border-black flex items-center justify-center font-black text-xs shadow-sm ${
                  elapsedSeconds >= 3.0 ? 'bg-[#bbf7d0] text-black' : elapsedSeconds >= 1.5 ? 'bg-[#fde047] text-black animate-pulse' : 'bg-white text-slate-400'
                }`}>
                  {elapsedSeconds >= 3.0 ? '✓' : '2'}
                </span>
                <span className={elapsedSeconds >= 3.0 ? 'text-slate-800 font-bold' : elapsedSeconds >= 1.5 ? 'text-black font-black' : 'text-slate-500'}>
                  CLAHE Glare Suppression & Ink Normalization
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg border border-black flex items-center justify-center font-black text-xs shadow-sm ${
                  elapsedSeconds >= 14.0 ? 'bg-[#bbf7d0] text-black' : elapsedSeconds >= 3.0 ? 'bg-[#fde047] text-black animate-pulse' : 'bg-white text-slate-400'
                }`}>
                  {elapsedSeconds >= 14.0 ? '✓' : '3'}
                </span>
                <span className={elapsedSeconds >= 14.0 ? 'text-slate-800 font-bold' : elapsedSeconds >= 3.0 ? 'text-black font-black' : 'text-slate-500'}>
                  Multimodal Vision: Transcribing Math Proofs
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg border border-black flex items-center justify-center font-black text-xs shadow-sm ${
                  elapsedSeconds >= 17.0 ? 'bg-[#fde047] text-black animate-pulse' : 'bg-white text-slate-400'
                }`}>
                  4
                </span>
                <span className={elapsedSeconds >= 17.0 ? 'text-black font-black' : 'text-slate-500'}>
                  Assembling LaTeX Document & KaTeX Engine
                </span>
              </div>
            </div>

            {/* Progress Bar & ETA */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-white h-3 rounded-full overflow-hidden border-2 border-black p-0.5 shadow-sm">
                <div
                  className="bg-[#fde047] h-full rounded-full transition-all duration-300 border border-black"
                  style={{ width: `${Math.min(95, Math.max(10, Math.round((elapsedSeconds / 18.0) * 90)))}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-slate-600 text-center font-bold">
                Generating full academic LaTeX study guide (~15-18s)...
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3 no-print">
          <div className="p-3.5 bg-[#fecaca] border-2 border-black rounded-xl text-black text-xs flex items-center justify-between shadow-neo-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
              <span className="font-bold">{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-black hover:underline font-bold text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Fallback Notice (if Gemini was rate-limited or offline) */}
      {currentData?.study_guide?.is_fallback && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3 no-print">
          <div className="p-3.5 bg-[#fef08a] border-2 border-black rounded-xl text-black text-xs flex items-center justify-between shadow-neo-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-black flex-shrink-0" />
              <span>
                <strong>Offline OCR Fallback Active:</strong> Gemini AI API quota was reached (429 Resource Exhausted). This page was parsed using local offline Tesseract OCR. For full AI precision, paragraph formatting, and TikZ vector diagrams, provide your Gemini API key in the top bar.
              </span>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="text-black underline font-black text-xs ml-4 whitespace-nowrap bg-white px-2 py-1 rounded border border-black shadow-sm"
            >
              Add API Key
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
            pdfInfo={currentData?.pdf_info}
            onPageChange={handlePdfPageChange}
          />
        </section>

        {/* Right Column: Tabbed Output (7 cols) */}
        <section className="lg:col-span-7 h-[680px] flex flex-col">
          
          {/* Right Column Tab Switcher */}
          <div className="flex items-center gap-2 mb-2 p-1 rounded-xl w-fit text-xs no-print">
            <button
              onClick={() => setActiveRightTab('studyGuide')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition font-bold border-2 ${
                activeRightTab === 'studyGuide'
                  ? 'bg-[#fef08a] border-black text-black shadow-neo-sm'
                  : 'bg-white border-black text-slate-700 hover:text-black shadow-sm'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-black" />
              <span>Rendered Study Guide</span>
            </button>

            <button
              onClick={() => setActiveRightTab('latex')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition font-bold border-2 ${
                activeRightTab === 'latex'
                  ? 'bg-[#99f6e4] border-black text-black shadow-neo-sm'
                  : 'bg-white border-black text-slate-700 hover:text-black shadow-sm'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-black" />
              <span>LaTeX Source (.tex)</span>
            </button>

            <button
              onClick={() => setActiveRightTab('inspector')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition font-bold border-2 ${
                activeRightTab === 'inspector'
                  ? 'bg-[#fed7aa] border-black text-black shadow-neo-sm'
                  : 'bg-white border-black text-slate-700 hover:text-black shadow-sm'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-black" />
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
