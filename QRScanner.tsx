
import React, { useEffect, useState, useRef } from 'react';
import { ScanLine, X, QrCode, AlertTriangle, Upload, Image as ImageIcon, Loader2, Camera } from 'lucide-react';
import gsap from 'gsap';
import { Submission } from '../types';

interface QRScannerProps {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
  bins?: Submission[]; // Optional list of bins to enable smart simulation
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose, bins }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    // Entrance Animation
    gsap.fromTo(".qr-overlay", 
      { opacity: 0, scale: 0.95 }, 
      { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
    );

    // Animate the scanning line
    gsap.to(".scan-line", {
      top: "90%",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
  }, []);

  const handleSimulateScan = (type: 'valid' | 'invalid') => {
    if (type === 'valid') {
      // Smart Simulation: Scan the most recently created/active bin if available
      // This helps testing location verification by picking a bin that likely matches recent context
      const targetBinId = bins && bins.length > 0 ? bins[0].id : "b3";
      onScanSuccess(`ecoclean:bin:${targetBinId}`);
    } else {
      onScanSuccess("ecoclean:bin:invalid_id");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      
      // Simulate processing delay for "Reading QR"
      setTimeout(() => {
        console.log("File processed:", file.name);
        setIsProcessing(false);
        
        // Also use smart simulation for file upload
        const targetBinId = bins && bins.length > 0 ? bins[0].id : "b3";
        onScanSuccess(`ecoclean:bin:${targetBinId}`);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col items-center justify-center qr-overlay backdrop-blur-sm overflow-y-auto py-10">
      <div className="absolute top-6 right-6">
        <button onClick={onClose} className="text-white/80 hover:text-white p-2 bg-white/10 rounded-full transition-colors">
          <X size={28} />
        </button>
      </div>

      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Camera size={24} className="text-emerald-400" /> Scan QR Code
      </h3>

      <div className="relative w-72 h-72 border-2 border-emerald-500/50 rounded-3xl overflow-hidden bg-gray-900 shadow-[0_0_50px_rgba(16,185,129,0.3)] mb-6 group shrink-0">
        {/* Mock Camera Feed Background */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1530587191325-3fdbfd2d6284?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center mix-blend-luminosity grayscale"></div>
        
        {/* Corners */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

        {/* Scan Line */}
        {!isProcessing && (
           <div className="scan-line absolute top-[10%] left-[10%] right-[10%] h-0.5 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)]"></div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center animate-pulse text-emerald-400">
               <Loader2 size={48} className="animate-spin mb-2" />
               <span className="text-xs font-mono uppercase tracking-widest">Analyzing Image...</span>
            </div>
          ) : (
            <ScanLine className="text-white/30 w-32 h-32 animate-pulse" />
          )}
        </div>
      </div>

      <div className="text-center space-y-6 max-w-xs w-full px-4">
        <div className="flex items-center gap-4 w-full">
           <div className="h-px bg-gray-700 flex-1"></div>
           <span className="text-gray-500 text-xs font-bold uppercase">Or</span>
           <div className="h-px bg-gray-700 flex-1"></div>
        </div>

        {/* File Upload Button */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 border border-slate-600 shadow-lg"
        >
          <ImageIcon size={18} className="text-emerald-400" />
          Upload QR Image
        </button>

        {/* Simulation Controls for Demo */}
        <div className="bg-white/5 rounded-xl p-4 backdrop-blur-md border border-white/5 mt-2">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-3 tracking-wider">Dev Simulation</p>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleSimulateScan('valid')}
                    disabled={isProcessing}
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <QrCode size={14} /> Valid QR
                </button>
                <button 
                    onClick={() => handleSimulateScan('invalid')}
                    disabled={isProcessing}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <AlertTriangle size={14} /> Invalid QR
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
