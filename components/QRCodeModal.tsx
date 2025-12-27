import { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Store } from '@/lib/types';

interface QRCodeModalProps {
  store: Store;
  onClose: () => void;
}

export default function QRCodeModal({ store, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Debug: log if landing_page_id is missing
  if (!store.landing_page_id) {
    console.warn('QRCodeModal: landing_page_id is missing for store:', store.id, store.name);
  }
  
  const landingUrl = `${window.location.origin}/r/${store.landing_page_id}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(landingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-gray-900">QR Code</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 text-center">
          <h3 className="text-xl text-gray-900 mb-2">{store.name}</h3>
          <p className="text-gray-600 mb-6">
            Customers can scan this QR code to leave a review
          </p>

          <div className="inline-block p-6 bg-white border-4 border-gray-200 rounded-2xl mb-6">
            <QRCodeSVG
              value={landingUrl}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Landing Page URL</p>
            <p className="text-sm text-gray-900 break-all mb-3">{landingUrl}</p>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              <a
                href={landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Link
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Print this QR code and display it at your location, or share the link digitally.
          </p>
        </div>
      </div>
    </div>
  );
}
