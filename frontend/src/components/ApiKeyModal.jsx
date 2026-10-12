import React, { useState } from 'react';
import { Key, X, Check, ExternalLink, Shield } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fbf9f4] border-2 border-black rounded-2xl max-w-md w-full p-6 shadow-neo-lg relative text-black">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:bg-[#fde047] p-1.5 rounded-lg border-2 border-black shadow-neo-sm transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#fde047] border-2 border-black shadow-neo-sm flex items-center justify-center text-black">
            <Key className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-black text-lg text-black">Gemini API Key</h3>
            <p className="text-xs font-mono font-bold text-slate-600">Zero-shot multi-modal synthesis</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-700 font-medium leading-relaxed mb-4">
          Notes2TeX includes pre-loaded interactive STEM samples that work instantly with zero setup. 
          To upload and transcribe your own live lecture photos, enter a Google Gemini API key below:
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-sm font-mono text-black shadow-neo-sm focus:outline-none focus:ring-2 focus:ring-[#fde047] transition"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Stored locally in your browser
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black font-bold underline flex items-center gap-0.5 hover:text-slate-700"
            >
              Get free key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-slate-100 border-2 border-black shadow-neo-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-black bg-[#99f6e4] hover:bg-[#5eead4] text-black border-2 border-black shadow-neo-sm transition flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
