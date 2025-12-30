import { useState, useRef } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Store } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QRCodeModalProps {
  store: Store;
  onClose: () => void;
}

type PrintSize = 'small' | 'medium' | 'large';

const SIZE_CONFIG: Record<PrintSize, { 
  label: string; 
  description: string;
  titleSize: string;
  subtitleSize: string;
  stepTextSize: string;
  stepNumberSize: string;
  stepNumberDimensions: string;
  padding: string;
  qrBorder: string;
  instructionGap: string;
  qrSize: number;
}> = {
  small: {
    label: 'Small',
    description: '3" × 4" - Table tent',
    titleSize: 'text-sm',
    subtitleSize: 'text-xs',
    stepTextSize: 'text-[10px]',
    stepNumberSize: 'text-[8px]',
    stepNumberDimensions: 'w-3 h-3',
    padding: 'p-2',
    qrBorder: 'border',
    instructionGap: 'gap-0.5',
    qrSize: 80,
  },
  medium: {
    label: 'Medium',
    description: '5" × 7" - Counter display',
    titleSize: 'text-lg',
    subtitleSize: 'text-sm',
    stepTextSize: 'text-xs',
    stepNumberSize: 'text-[10px]',
    stepNumberDimensions: 'w-4 h-4',
    padding: 'p-4',
    qrBorder: 'border-2',
    instructionGap: 'gap-1',
    qrSize: 120,
  },
  large: {
    label: 'Large',
    description: '8.5" × 11" - Poster',
    titleSize: 'text-4xl',
    subtitleSize: 'text-xl',
    stepTextSize: 'text-base',
    stepNumberSize: 'text-sm',
    stepNumberDimensions: 'w-8 h-8',
    padding: 'p-12',
    qrBorder: 'border-4',
    instructionGap: 'gap-3',
    qrSize: 280,
  },
};

export default function QRCodeModal({ store, onClose }: QRCodeModalProps) {
  const [generating, setGenerating] = useState(false);
  const [printSize, setPrintSize] = useState<PrintSize>('medium');
  const printRef = useRef<HTMLDivElement>(null);
  
  // Debug: log if landing_page_id is missing
  if (!store.landing_page_id) {
    console.warn('QRCodeModal: landing_page_id is missing for store:', store.id, store.name);
  }
  
  const landingUrl = `${window.location.origin}/r/${store.landing_page_id}`;
  const previewConfig = SIZE_CONFIG['medium']; // Always use medium for preview
  const printConfig = SIZE_CONFIG[printSize]; // Use selected size for PDF

  const handlePrintPDF = async () => {
    if (!printRef.current) return;
    
    setGenerating(true);
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
      });
      
      // Calculate dimensions to fit on page with margins
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 0.5;
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(maxWidth / (imgWidth / 96), maxHeight / (imgHeight / 96));
      
      const finalWidth = (imgWidth / 96) * ratio;
      const finalHeight = (imgHeight / 96) * ratio;
      
      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`${store.name.replace(/[^a-z0-9]/gi, '-')}-qr-code-${printSize}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full my-8">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-gray-900">QR Code</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Size Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Print Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(SIZE_CONFIG) as PrintSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setPrintSize(size)}
                  className={`px-3 py-2 rounded-lg border-2 text-center transition-all ${
                    printSize === size
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-medium text-sm">{SIZE_CONFIG[size].label}</div>
                  <div className="text-xs opacity-70">{SIZE_CONFIG[size].description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Template - Always Medium */}
          <div 
            className={`bg-white ${previewConfig.padding} rounded-xl border-2 border-dashed border-gray-200 mb-6`}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className={`${previewConfig.titleSize} font-bold text-gray-900 mb-2`}>{store.name}</h3>
              <p className={`text-gray-600 ${previewConfig.subtitleSize}`}>We&apos;d love your feedback!</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className={`p-4 bg-white ${previewConfig.qrBorder} border-emerald-500 rounded-2xl shadow-lg`}>
                <QRCodeSVG
                  value={landingUrl}
                  size={previewConfig.qrSize}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className={`text-gray-700 font-medium ${previewConfig.stepTextSize}`}>Scan to leave a review</p>
              <div className={`flex items-center justify-center ${previewConfig.instructionGap}`}>
                <div className={`flex items-center ${previewConfig.instructionGap}`}>
                  <span className={`${previewConfig.stepNumberDimensions} bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 ${previewConfig.stepNumberSize} font-bold`} style={{ paddingBottom: '2px' }}>1</span>
                  <span className={`${previewConfig.stepTextSize} text-gray-600`}>Scan QR</span>
                </div>
                <span className="text-gray-300">→</span>
                <div className={`flex items-center ${previewConfig.instructionGap}`}>
                  <span className={`${previewConfig.stepNumberDimensions} bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 ${previewConfig.stepNumberSize} font-bold`} style={{ paddingBottom: '2px' }}>2</span>
                  <span className={`${previewConfig.stepTextSize} text-gray-600`}>Copy review</span>
                </div>
                <span className="text-gray-300">→</span>
                <div className={`flex items-center ${previewConfig.instructionGap}`}>
                  <span className={`${previewConfig.stepNumberDimensions} bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 ${previewConfig.stepNumberSize} font-bold`} style={{ paddingBottom: '2px' }}>3</span>
                  <span className={`${previewConfig.stepTextSize} text-gray-600`}>Post it!</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Powered by <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 hover:underline">QuickReviewAI</a></p>
            </div>
          </div>

          {/* Hidden PDF Template - Uses Selected Size */}
          <div 
            ref={printRef}
            className={`bg-white ${printConfig.padding} rounded-xl absolute -left-[9999px]`}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className={`${printConfig.titleSize} font-bold text-gray-900 mb-2`}>{store.name}</h3>
              <p className={`text-gray-600 ${printConfig.subtitleSize}`}>We&apos;d love your feedback!</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className={`p-4 bg-white ${printConfig.qrBorder} border-emerald-500 rounded-2xl shadow-lg`}>
                <QRCodeSVG
                  value={landingUrl}
                  size={printConfig.qrSize}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className={`text-gray-700 font-medium ${printConfig.stepTextSize}`}>Scan to leave a review</p>
              <div className={`flex items-center justify-center ${printConfig.instructionGap}`}>
                <div className={`flex items-center ${printConfig.instructionGap}`}>
                  <span className={`${printConfig.stepNumberDimensions} bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 ${printConfig.stepNumberSize} font-bold leading-none`} style={{ paddingBottom: '12px' }}>1</span>
                  <span className={`${printConfig.stepTextSize} text-gray-600`}>Scan QR</span>
                </div>
                <span className="text-gray-300">→</span>
                <div className={`flex items-center ${printConfig.instructionGap}`}>
                  <span className={`${printConfig.stepNumberDimensions} bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 ${printConfig.stepNumberSize} font-bold leading-none`} style={{ paddingBottom: '12px' }}>2</span>
                  <span className={`${printConfig.stepTextSize} text-gray-600`}>Copy review</span>
                </div>
                <span className="text-gray-300">→</span>
                <div className={`flex items-center ${printConfig.instructionGap}`}>
                  <span className={`${printConfig.stepNumberDimensions} bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 ${printConfig.stepNumberSize} font-bold leading-none`} style={{ paddingBottom: '12px' }}>3</span>
                  <span className={`${printConfig.stepTextSize} text-gray-600`}>Post it!</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Powered by <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 hover:underline">QuickReviewAI</a></p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrintPDF}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF ({printConfig.label})
                </>
              )}
            </button>
            <a
              href={landingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Preview
            </a>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Download and print this QR code to display at your location
          </p>
        </div>
      </div>
    </div>
  );
}
