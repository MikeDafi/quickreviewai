import { useState, useRef } from 'react';
import { X, ExternalLink, Download, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Store } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QRCodeModalProps {
  store: Store;
  onClose: () => void;
}

export default function QRCodeModal({ store, onClose }: QRCodeModalProps) {
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Debug: log if landing_page_id is missing
  if (!store.landing_page_id) {
    console.warn('QRCodeModal: landing_page_id is missing for store:', store.id, store.name);
  }
  
  const landingUrl = `${window.location.origin}/r/${store.landing_page_id}`;

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
      pdf.save(`${store.name.replace(/[^a-z0-9]/gi, '-')}-qr-code.pdf`);
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
          {/* Printable Template */}
          <div 
            ref={printRef}
            className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-200 mb-6"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{store.name}</h3>
              <p className="text-gray-600 text-lg">We&apos;d love your feedback!</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border-4 border-emerald-500 rounded-2xl shadow-lg">
            <QRCodeSVG
              value={landingUrl}
                  size={180}
              level="H"
              includeMargin={false}
            />
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className="text-gray-700 font-medium">Scan to leave a review</p>
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xs font-bold">1</span>
                  <span className="text-sm text-gray-600">Scan QR</span>
                </div>
                <span className="text-gray-300">→</span>
                <div className="flex items-center gap-1">
                  <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xs font-bold">2</span>
                  <span className="text-sm text-gray-600">Copy review</span>
                </div>
                <span className="text-gray-300">→</span>
                <div className="flex items-center gap-1">
                  <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xs font-bold">3</span>
                  <span className="text-sm text-gray-600">Post it!</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Powered by <a href="https://quickreviewai.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 hover:underline">QuickReviewAI</a></p>
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
                  Download PDF
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
