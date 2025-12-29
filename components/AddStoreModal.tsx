import { useState, KeyboardEvent, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Lightbulb, Plus, HelpCircle, ExternalLink, ChevronDown, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { Store } from '@/lib/types';
import { SubscriptionTier } from '@/lib/constants';
import { BUSINESS_TYPES, keywordSuggestions } from '@/lib/businessData';
import { validateUrl } from '@/lib/validation';
import { useBusinessLookup } from '@/hooks/useBusinessLookup';

// ============================================================================
// Types
// ============================================================================

interface AddStoreModalProps {
  store?: Store;
  tier?: SubscriptionTier;
  onClose: () => void;
  onSave: (store: Store | Omit<Store, 'id'>) => void;
}

interface UrlFieldState {
  error: string;
  showHelp: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_BUSINESS_TYPES = 3;

// ============================================================================
// Sub-Components
// ============================================================================

interface TagListProps {
  items: string[];
  onRemove: (item: string) => void;
  className?: string;
}

function TagList({ items, onRemove, className = '' }: TagListProps) {
  if (items.length === 0) return null;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm rounded-full"
        >
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

interface ProFeatureBannerProps {
  visible: boolean;
}

function ProFeatureBanner({ visible }: ProFeatureBannerProps) {
  if (!visible) return null;
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-emerald-50 border border-purple-100 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Unlock Review Guidance with Pro</h3>
          <p className="text-sm text-gray-600 mb-3">
            Write custom instructions that tell the AI exactly what to highlight in every review—your 
            award-winning dishes, friendly service, or unique atmosphere.
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-3">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              &ldquo;Mention our new outdoor patio&rdquo;
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              &ldquo;Highlight our family-owned history since 1985&rdquo;
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              &ldquo;Talk about our quick lunch service&rdquo;
            </li>
          </ul>
          <Link
            href="/upgrade?returnUrl=/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Upgrade to Pro
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface UrlInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string;
  showHelp: boolean;
  onToggleHelp: () => void;
  autoFilled: boolean;
  placeholder: string;
  helpContent: React.ReactNode;
  verifyButtonColor: 'blue' | 'red';
}

function UrlInputField({
  label,
  value,
  onChange,
  error,
  showHelp,
  onToggleHelp,
  autoFilled,
  placeholder,
  helpContent,
  verifyButtonColor,
}: UrlInputFieldProps) {
  const buttonColorClasses = verifyButtonColor === 'blue'
    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    : 'bg-red-50 text-red-700 hover:bg-red-100';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          {autoFilled && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ✓ Auto-filled
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleHelp}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <HelpCircle className="w-3 h-3" />
          How to find this
        </button>
      </div>
      {showHelp && helpContent}
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={2000}
          className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
            error 
              ? 'border-red-300 focus:ring-red-600' 
              : 'border-gray-300 focus:ring-emerald-600'
          }`}
        />
        {value && !error && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-3 rounded-lg transition-colors text-sm font-medium flex items-center gap-1 ${buttonColorClasses}`}
          >
            <ExternalLink className="w-4 h-4" />
            Verify
          </a>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AddStoreModal({ store, tier = SubscriptionTier.FREE, onClose, onSave }: AddStoreModalProps) {
  // Form state
  const [name, setName] = useState(store?.name || '');
  const [keywords, setKeywords] = useState<string[]>(store?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [reviewGuidance, setReviewGuidance] = useState<string>(store?.reviewExpectations?.[0] || '');
  
  // Business types state
  const initialBusinessTypes = store?.businessType 
    ? store.businessType.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  const [businessTypes, setBusinessTypes] = useState<string[]>(initialBusinessTypes);
  const [businessTypeInput, setBusinessTypeInput] = useState('');
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);
  
  // UI toggle state (grouped)
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [googleUrlField, setGoogleUrlField] = useState<UrlFieldState>({ error: '', showHelp: false });
  const [yelpUrlField, setYelpUrlField] = useState<UrlFieldState>({ error: '', showHelp: false });
  
  // Refs
  const formRef = useRef<HTMLFormElement>(null);
  const businessTypeRef = useRef<HTMLDivElement>(null);

  // Custom hook for business lookup
  const { 
    state: lookupState, 
    urls, 
    setUrls,
  } = useBusinessLookup(name, {
    existingUrls: { googleUrl: store?.googleUrl, yelpUrl: store?.yelpUrl },
  });

  // ============================================================================
  // Derived State
  // ============================================================================
  
  const currentKeywordSuggestions = businessTypes.length > 0
    ? [...new Set(businessTypes.flatMap(type => keywordSuggestions[type] || []))]
    : [];
  
  const filteredBusinessTypes = BUSINESS_TYPES.filter(type => 
    !businessTypes.includes(type) &&
    (!businessTypeInput || type.toLowerCase().includes(businessTypeInput.toLowerCase()))
  );

  const isFormValid = name && businessTypes.length > 0 && !googleUrlField.error && !yelpUrlField.error;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleGoogleUrlChange = useCallback((value: string) => {
    setUrls({ googleUrl: value });
    const validation = validateUrl(value);
    setGoogleUrlField(prev => ({ ...prev, error: validation.error }));
  }, [setUrls]);

  const handleYelpUrlChange = useCallback((value: string) => {
    setUrls({ yelpUrl: value });
    const validation = validateUrl(value);
    setYelpUrlField(prev => ({ ...prev, error: validation.error }));
  }, [setUrls]);

  const handleBusinessTypeSelect = useCallback((type: string) => {
    if (businessTypes.length >= MAX_BUSINESS_TYPES || businessTypes.includes(type)) return;
    
    const newBusinessTypes = [...businessTypes, type];
    setBusinessTypes(newBusinessTypes);
    setBusinessTypeInput('');
    setShowBusinessTypeDropdown(false);
    
    // Auto-prefill keywords from suggestions for this business type
    const suggestedKeywords = keywordSuggestions[type] || [];
    if (suggestedKeywords.length > 0) {
      if (keywords.length === 0) {
        setKeywords(suggestedKeywords);
      } else {
        const newKeywords = suggestedKeywords.filter(k => !keywords.includes(k));
        if (newKeywords.length > 0) {
          setKeywords(prev => [...prev, ...newKeywords]);
        }
      }
    }
  }, [businessTypes, keywords]);
  
  const removeBusinessType = useCallback((type: string) => {
    setBusinessTypes(prev => prev.filter(t => t !== type));
  }, []);

  const handleBusinessTypeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (businessTypeInput.trim() && businessTypes.length < MAX_BUSINESS_TYPES) {
        const exactMatch = BUSINESS_TYPES.find(
          type => type.toLowerCase() === businessTypeInput.toLowerCase()
        );
        if (exactMatch && !businessTypes.includes(exactMatch)) {
          handleBusinessTypeSelect(exactMatch);
        }
      }
    }
  };

  const addKeywords = useCallback((input: string) => {
    if (!input.trim()) return;
    
    const newKeywords = input
      .split(',')
      .map(k => k.trim())
      .filter(k => k && !keywords.includes(k));
    
    if (newKeywords.length > 0) {
      setKeywords(prev => [...prev, ...newKeywords]);
    }
    setKeywordInput('');
  }, [keywords]);

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeywords(keywordInput);
    }
  };

  const removeKeyword = useCallback((keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  }, []);

  const addSuggestedKeyword = useCallback((keyword: string) => {
    if (!keywords.includes(keyword)) {
      setKeywords(prev => [...prev, keyword]);
    }
  }, [keywords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeData = {
      name,
      businessType: businessTypes.join(', '),
      keywords,
      reviewExpectations: reviewGuidance.trim() ? [reviewGuidance.trim()] : [],
      googleUrl: urls.googleUrl || undefined,
      yelpUrl: urls.yelpUrl || undefined
    };

    if (store) {
      onSave({ ...storeData, id: store.id });
    } else {
      onSave(storeData);
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (businessTypeRef.current && !businessTypeRef.current.contains(event.target as Node)) {
        setShowBusinessTypeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pro Feature Banner */}
          <ProFeatureBanner visible={tier === SubscriptionTier.FREE} />

          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tony's Pizza Palace (include city for better URL lookup)"
              required
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Include city in the name (e.g. &quot;Joe&apos;s Pizza Seattle&quot;) to help auto-find your review URLs
            </p>
          </div>

          {/* Business Type */}
          <div ref={businessTypeRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type(s) * <span className="font-normal text-gray-500">(up to {MAX_BUSINESS_TYPES})</span>
            </label>
            
            <TagList 
              items={businessTypes} 
              onRemove={removeBusinessType} 
              className="mb-2" 
            />
            
            {businessTypes.length < MAX_BUSINESS_TYPES && (
              <div className="relative">
                <input
                  type="text"
                  value={businessTypeInput}
                  onChange={(e) => {
                    setBusinessTypeInput(e.target.value);
                    setShowBusinessTypeDropdown(true);
                  }}
                  onKeyDown={handleBusinessTypeKeyDown}
                  onFocus={() => setShowBusinessTypeDropdown(true)}
                  placeholder={businessTypes.length === 0 ? "Type or select your business type..." : "Add another business type..."}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${showBusinessTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
            
            {/* Dropdown List */}
            {showBusinessTypeDropdown && filteredBusinessTypes.length > 0 && businessTypes.length < MAX_BUSINESS_TYPES && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBusinessTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleBusinessTypeSelect(type)}
                    className="w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors text-gray-700"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
            
            {/* No match hint */}
            {businessTypeInput && !BUSINESS_TYPES.some(t => t.toLowerCase().includes(businessTypeInput.toLowerCase())) && (
              <p className="text-xs text-amber-600 mt-1">
                No matching business type found. Please select from the list above.
              </p>
            )}
            
            <input type="hidden" value={businessTypes.length > 0 ? businessTypes.join(',') : ''} required />
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Keywords
              </label>
              {businessTypes.length > 0 && currentKeywordSuggestions.length > 0 && (
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
                <p className="text-xs text-emerald-700 mb-2">Suggested keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {currentKeywordSuggestions.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => addSuggestedKeyword(keyword)}
                      disabled={keywords.includes(keyword)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        keywords.includes(keyword)
                          ? 'bg-emerald-200 text-emerald-600 cursor-not-allowed'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      + {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TagList items={keywords} onRemove={removeKeyword} className="mb-2" />

            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Type keyword and press Enter"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => addKeywords(keywordInput)}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to add. Separate multiple with commas.
            </p>
          </div>

          {/* Rate limit warning */}
          {lookupState.rateLimited && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700">Could auto-fill URLs, but rate limited. Please wait a moment and try again.</p>
              </div>
            </div>
          )}
          
          {/* Loading indicator for URL lookup */}
          {lookupState.loading && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <p className="text-sm text-emerald-700">Searching for review URLs...</p>
              </div>
            </div>
          )}

          {/* Google Review URL */}
          <UrlInputField
            label="Google Review URL"
            value={urls.googleUrl}
            onChange={handleGoogleUrlChange}
            error={googleUrlField.error}
            showHelp={googleUrlField.showHelp}
            onToggleHelp={() => setGoogleUrlField(prev => ({ ...prev, showHelp: !prev.showHelp }))}
            autoFilled={lookupState.googleAutoFilled}
            placeholder="https://g.page/r/..."
            verifyButtonColor="blue"
            helpContent={
              <div className="mb-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <p className="font-medium mb-2">To get your Google Review link:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Business Profile</a></li>
                  <li>Select your business</li>
                  <li>Click &quot;Get more reviews&quot; or &quot;Share review form&quot;</li>
                  <li>Copy the link provided</li>
                </ol>
                <p className="mt-2 text-blue-600">
                  Or search your business on Google Maps, click &quot;Write a review&quot;, and copy the URL.
                </p>
              </div>
            }
          />

          {/* Yelp Review URL */}
          <UrlInputField
            label="Yelp Review URL"
            value={urls.yelpUrl}
            onChange={handleYelpUrlChange}
            error={yelpUrlField.error}
            showHelp={yelpUrlField.showHelp}
            onToggleHelp={() => setYelpUrlField(prev => ({ ...prev, showHelp: !prev.showHelp }))}
            autoFilled={lookupState.yelpAutoFilled}
            placeholder="https://www.yelp.com/biz/..."
            verifyButtonColor="red"
            helpContent={
              <div className="mb-3 p-3 bg-red-50 rounded-lg text-xs text-red-800">
                <p className="font-medium mb-2">To get your Yelp Review link:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://biz.yelp.com" target="_blank" rel="noopener noreferrer" className="underline">Yelp for Business</a></li>
                  <li>Log in to your business account</li>
                  <li>Go to your business page on Yelp</li>
                  <li>Copy the URL (e.g., yelp.com/biz/your-business-name)</li>
                </ol>
                <p className="mt-2 text-red-600">
                  Or simply search for your business on Yelp and copy the page URL.
                </p>
              </div>
            }
          />

          {/* Submit Buttons */}
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
              disabled={!isFormValid}
              className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {store ? 'Save Changes' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
