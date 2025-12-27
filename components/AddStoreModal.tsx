import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Store } from '@/lib/types';

interface AddStoreModalProps {
  store?: Store;
  onClose: () => void;
  onSave: (store: Store | Omit<Store, 'id'>) => void;
}

const keywordSuggestions: Record<string, string[]> = {
  'Restaurant': ['delicious', 'authentic', 'family-friendly', 'fresh ingredients', 'cozy atmosphere'],
  'Salon': ['professional', 'relaxing', 'modern', 'skilled stylists', 'luxurious'],
  'Auto Shop': ['reliable', 'trustworthy', 'quick service', 'honest pricing', 'expert mechanics'],
  'Retail': ['quality products', 'great selection', 'helpful staff', 'affordable', 'convenient'],
  'Cafe': ['cozy', 'artisanal', 'fresh', 'friendly service', 'best coffee'],
  'Gym': ['motivating', 'clean', 'professional trainers', 'state-of-the-art', 'welcoming'],
  'Spa': ['relaxing', 'rejuvenating', 'professional', 'tranquil', 'top-notch service'],
  'Other': ['excellent', 'professional', 'friendly', 'high-quality', 'recommended']
};

const reviewPromptSuggestions: Record<string, string[]> = {
  'Restaurant': [
    'Focus on food quality and taste',
    'Highlight atmosphere and service',
    'Mention specific dishes loved',
    'Emphasize value for money'
  ],
  'Salon': [
    'Describe the transformation/results',
    'Mention stylist expertise',
    'Highlight relaxing experience',
    'Focus on professionalism'
  ],
  'Auto Shop': [
    'Emphasize honesty and transparency',
    'Highlight quick turnaround time',
    'Mention fair pricing',
    'Focus on quality of work'
  ],
  'Retail': [
    'Highlight product quality',
    'Mention helpful staff',
    'Focus on selection variety',
    'Emphasize great prices'
  ],
  'Cafe': [
    'Describe coffee/beverage quality',
    'Mention cozy atmosphere',
    'Highlight friendly baristas',
    'Focus on perfect spot to work/relax'
  ],
  'Gym': [
    'Mention clean facilities',
    'Highlight helpful trainers',
    'Focus on results achieved',
    'Emphasize welcoming community'
  ],
  'Spa': [
    'Describe relaxation experience',
    'Highlight professional staff',
    'Mention treatments enjoyed',
    'Focus on peaceful atmosphere'
  ],
  'Other': [
    'Emphasize quality of service',
    'Highlight professionalism',
    'Mention positive experience',
    'Focus on recommending to others'
  ]
};

export default function AddStoreModal({ store, onClose, onSave }: AddStoreModalProps) {
  const [name, setName] = useState(store?.name || '');
  const [businessType, setBusinessType] = useState(store?.businessType || '');
  const [keywords, setKeywords] = useState(store?.keywords.join(', ') || '');
  const [tone, setTone] = useState(store?.tone || 'friendly');
  const [googleUrl, setGoogleUrl] = useState(store?.googleUrl || '');
  const [yelpUrl, setYelpUrl] = useState(store?.yelpUrl || '');
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);

  const currentKeywordSuggestions = businessType ? keywordSuggestions[businessType] || [] : [];
  const currentPromptSuggestions = businessType ? reviewPromptSuggestions[businessType] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeData = {
      name,
      businessType,
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      tone,
      googleUrl: googleUrl || undefined,
      yelpUrl: yelpUrl || undefined
    };

    if (store) {
      onSave({ ...storeData, id: store.id });
    } else {
      onSave(storeData);
    }
  };

  const addSuggestedKeyword = (keyword: string) => {
    const currentKeywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    if (!currentKeywords.includes(keyword)) {
      setKeywords(currentKeywords.concat(keyword).join(', '));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl text-gray-900">
            {store ? 'Edit Store' : 'Add New Store'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tony's Pizza Palace"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Business Type *
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            >
              <option value="">Select a type</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Salon">Salon</option>
              <option value="Auto Shop">Auto Shop</option>
              <option value="Retail">Retail</option>
              <option value="Cafe">Cafe</option>
              <option value="Gym">Gym</option>
              <option value="Spa">Spa</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700">
                Keywords *
              </label>
              {businessType && currentKeywordSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowKeywordSuggestions(!showKeywordSuggestions)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Lightbulb className="w-3 h-3" />
                  {showKeywordSuggestions ? 'Hide' : 'Show'} suggestions
                </button>
              )}
            </div>
            {showKeywordSuggestions && currentKeywordSuggestions.length > 0 && (
              <div className="mb-2 p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-emerald-700 mb-2">Suggested keywords for {businessType}:</p>
                <div className="flex flex-wrap gap-2">
                  {currentKeywordSuggestions.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => addSuggestedKeyword(keyword)}
                      className="text-xs px-2 py-1 bg-white text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                    >
                      + {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. authentic, family-friendly, delicious"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate keywords with commas
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700">
                Review Tone *
              </label>
              {businessType && currentPromptSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPromptSuggestions(!showPromptSuggestions)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Lightbulb className="w-3 h-3" />
                  Review tips
                </button>
              )}
            </div>
            {showPromptSuggestions && currentPromptSuggestions.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 mb-2">Review generation tips for {businessType}:</p>
                <ul className="space-y-1">
                  {currentPromptSuggestions.map((tip, index) => (
                    <li key={index} className="text-xs text-blue-700 flex items-start gap-2">
                      <span>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {['friendly', 'professional', 'casual', 'enthusiastic'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all capitalize ${
                    tone === t
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Google Review URL
            </label>
            <input
              type="url"
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="https://www.google.com/maps/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Yelp Review URL
            </label>
            <input
              type="url"
              value={yelpUrl}
              onChange={(e) => setYelpUrl(e.target.value)}
              placeholder="https://www.yelp.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {store ? 'Save Changes' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}