import { useState, useEffect } from 'react';
import { X, Wand2, Lightbulb, Save } from 'lucide-react';
import { Store } from '@/lib/types';

interface GuidanceModalProps {
  store: Store;
  onClose: () => void;
  onSave: (guidance: string) => void;
  saving?: boolean;
}

const EXAMPLE_GUIDANCE = [
  "We just finished renovations with a beautiful new outdoor patio",
  "Our head chef trained in Italy and makes fresh pasta daily",
  "We're known for our fast, friendly service and family atmosphere",
  "Mention our famous garlic knots and wood-fired pizza",
  "We have the best happy hour deals in the neighborhood",
  "Our new ownership has improved quality and cleanliness",
];

export default function GuidanceModal({ store, onClose, onSave, saving }: GuidanceModalProps) {
  const [guidance, setGuidance] = useState(store.reviewExpectations?.[0] || '');
  const maxLength = 200;

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  function handleSave() {
    onSave(guidance.trim());
  }

  function useExample(example: string) {
    setGuidance(example);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Review Guidance</h2>
              <p className="text-sm text-gray-500">{store.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Explanation */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-violet-800">
                <p className="font-medium mb-1">What is Review Guidance?</p>
                <p className="text-violet-700">
                  Tell the AI what to naturally mention in generated reviews. Great for highlighting 
                  recent renovations, special dishes, new services, or anything unique about your business.
                </p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Guidance
            </label>
            <textarea
              value={guidance}
              onChange={(e) => setGuidance(e.target.value.slice(0, maxLength))}
              placeholder="e.g., We just finished renovations with a beautiful new outdoor patio area..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none h-28"
            />
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-500">
                This will be incorporated naturally into AI-generated reviews
              </p>
              <span className={`text-xs ${guidance.length >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
                {guidance.length}/{maxLength}
              </span>
            </div>
          </div>

          {/* Example Ideas */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Need ideas? Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_GUIDANCE.slice(0, 4).map((example, i) => (
                <button
                  key={i}
                  onClick={() => useExample(example)}
                  className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-left"
                >
                  {example.length > 40 ? example.slice(0, 40) + '...' : example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Guidance
          </button>
        </div>
      </div>
    </div>
  );
}

