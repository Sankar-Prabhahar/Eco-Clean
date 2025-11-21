import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  isAnalyzing: boolean;
  analysisResult: 'success' | 'error' | null;
  label: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, isAnalyzing, analysisResult, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden relative shadow-inner border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={inputRef}
        onChange={handleFileChange}
      />

      {preview ? (
        <>
          <img src={preview} alt="Capture" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </>
      ) : (
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Camera size={32} />
          </div>
          <p className="text-gray-500 text-sm font-medium mb-4">Tap to capture evidence</p>
        </div>
      )}

      {/* Overlay Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        {!isAnalyzing && !analysisResult && (
          <button 
            onClick={triggerCamera}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
          >
            {preview ? <><Upload size={18} /> Retake</> : <><Camera size={18} /> {label}</>}
          </button>
        )}

        {isAnalyzing && (
          <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg flex items-center gap-3 text-emerald-800 font-medium">
            <Loader2 className="animate-spin" size={20} />
            Verifying with AI...
          </div>
        )}

        {analysisResult === 'success' && (
          <div className="bg-green-100 text-green-700 px-6 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold border border-green-200 animate-bounce">
            <CheckCircle size={20} /> Verified!
          </div>
        )}
        
        {analysisResult === 'error' && (
          <div className="bg-red-100 text-red-700 px-6 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold border border-red-200">
            <XCircle size={20} /> Not Recognized
          </div>
        )}
      </div>
    </div>
  );
};
