import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { X, Lightbulb, Plus, HelpCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { Store } from '@/lib/types';

interface AddStoreModalProps {
  store?: Store;
  onClose: () => void;
  onSave: (store: Store | Omit<Store, 'id'>) => void;
}

const BUSINESS_TYPES = [
  // Food & Beverage
  'Restaurant', 'Cafe', 'Bar', 'Bakery', 'Food Truck', 'Pizzeria', 'Sushi Bar', 
  'Ice Cream Shop', 'Brewery', 'Winery', 'Juice Bar', 'Deli',
  // Health & Beauty
  'Salon', 'Barbershop', 'Spa', 'Nail Salon', 'Med Spa', 'Massage Therapy',
  'Tattoo Parlor', 'Tanning Salon', 'Skincare Clinic',
  // Automotive
  'Auto Shop', 'Car Wash', 'Auto Detailing', 'Tire Shop', 'Body Shop',
  'Oil Change', 'Car Dealership',
  // Fitness & Recreation
  'Gym', 'Yoga Studio', 'Pilates Studio', 'CrossFit', 'Martial Arts',
  'Dance Studio', 'Golf Course', 'Bowling Alley',
  // Retail
  'Retail Store', 'Boutique', 'Jewelry Store', 'Florist', 'Pet Store',
  'Bookstore', 'Gift Shop', 'Furniture Store', 'Electronics Store',
  // Services
  'Dry Cleaner', 'Laundromat', 'Tailor', 'Locksmith', 'Moving Company',
  'Storage Facility', 'Printing Shop',
  // Professional Services
  'Law Firm', 'Accounting Firm', 'Insurance Agency', 'Real Estate Agency',
  'Marketing Agency', 'Photography Studio', 'Consulting Firm',
  // Healthcare
  'Dental Office', 'Chiropractor', 'Optometrist', 'Veterinarian',
  'Physical Therapy', 'Urgent Care', 'Pharmacy',
  // Home Services
  'Plumber', 'Electrician', 'HVAC', 'Landscaping', 'Cleaning Service',
  'Pest Control', 'Roofing', 'Painting',
  // Entertainment
  'Movie Theater', 'Arcade', 'Escape Room', 'Comedy Club', 'Music Venue',
  // Hospitality
  'Hotel', 'Bed & Breakfast', 'Vacation Rental',
  // Education
  'Tutoring Center', 'Music School', 'Driving School', 'Language School',
  // Other
  'Other'
];

const REVIEW_EXPECTATIONS = [
  'Cleanliness',
  'Customer Service', 
  'Food Quality',
  'Atmosphere',
  'Value for Money',
  'Wait Time',
  'Staff Friendliness',
  'Product Quality',
  'Expertise',
  'Communication',
  'Professionalism',
  'Results',
  'Convenience',
  'Selection',
  'Parking',
];

const keywordSuggestions: Record<string, string[]> = {
  'Restaurant': ['delicious', 'authentic', 'family-friendly', 'fresh ingredients', 'cozy atmosphere'],
  'Salon': ['professional', 'relaxing', 'modern', 'skilled stylists', 'luxurious'],
  'Auto Shop': ['reliable', 'trustworthy', 'quick service', 'honest pricing', 'expert mechanics'],
  'Cafe': ['cozy', 'artisanal', 'fresh', 'friendly service', 'best coffee'],
  'Gym': ['motivating', 'clean', 'professional trainers', 'state-of-the-art', 'welcoming'],
  'Spa': ['relaxing', 'rejuvenating', 'professional', 'tranquil', 'top-notch service'],
  'Dental Office': ['gentle', 'thorough', 'modern equipment', 'friendly staff', 'painless'],
  'Veterinarian': ['caring', 'knowledgeable', 'gentle with pets', 'thorough', 'compassionate'],
  'Plumber': ['prompt', 'professional', 'fair pricing', 'clean work', 'reliable'],
  'Hotel': ['comfortable', 'clean rooms', 'great location', 'friendly staff', 'amenities'],
};

export default function AddStoreModal({ store, onClose, onSave }: AddStoreModalProps) {
  const [name, setName] = useState(store?.name || '');
  const [businessType, setBusinessType] = useState(store?.businessType || '');
  const [businessTypeInput, setBusinessTypeInput] = useState(store?.businessType || '');
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);
  const [keywords, setKeywords] = useState<string[]>(store?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [expectations, setExpectations] = useState<string[]>(store?.reviewExpectations || []);
  const [googleUrl, setGoogleUrl] = useState(store?.googleUrl || '');
  const [yelpUrl, setYelpUrl] = useState(store?.yelpUrl || '');
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);
  const [showYelpHelp, setShowYelpHelp] = useState(false);
  
  const businessTypeRef = useRef<HTMLDivElement>(null);

  const currentKeywordSuggestions = businessType ? keywordSuggestions[businessType] || keywordSuggestions['Restaurant'] || [] : [];
  
  // Filter business types based on input
  const filteredBusinessTypes = businessTypeInput
    ? BUSINESS_TYPES.filter(type => 
        type.toLowerCase().includes(businessTypeInput.toLowerCase())
      )
    : BUSINESS_TYPES;

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

  const handleBusinessTypeSelect = (type: string) => {
    setBusinessType(type);
    setBusinessTypeInput(type);
    setShowBusinessTypeDropdown(false);
    
    // Auto-prefill keywords from suggestions for this business type
    const suggestedKeywords = keywordSuggestions[type] || [];
    if (suggestedKeywords.length > 0 && keywords.length === 0) {
      // Only prefill if no keywords are set yet
      setKeywords(suggestedKeywords);
    }
  };
  
  const handleBusinessTypeInputChange = (value: string) => {
    setBusinessTypeInput(value);
    setShowBusinessTypeDropdown(true);
    
    // If typed value matches a business type exactly, select it
    const exactMatch = BUSINESS_TYPES.find(
      type => type.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setBusinessType(exactMatch);
    } else if (value && !BUSINESS_TYPES.some(t => t.toLowerCase() === value.toLowerCase())) {
      // Allow custom business type
      setBusinessType(value);
    }
  };

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeywords(keywordInput);
    }
  };

  const addKeywords = (input: string) => {
    if (!input.trim()) return;
    
    // Split by comma to handle CSV input
    const newKeywords = input
      .split(',')
      .map(k => k.trim())
      .filter(k => k && !keywords.includes(k));
    
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const addSuggestedKeyword = (keyword: string) => {
    if (!keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
    }
  };

  const toggleExpectation = (expectation: string) => {
    if (expectations.includes(expectation)) {
      setExpectations(expectations.filter(e => e !== expectation));
    } else {
      setExpectations([...expectations, expectation]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeData = {
      name,
      businessType,
      keywords,
      reviewExpectations: expectations,
      googleUrl: googleUrl || undefined,
      yelpUrl: yelpUrl || undefined
    };

    if (store) {
      onSave({ ...storeData, id: store.id });
    } else {
      onSave(storeData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* Business Type */}
          <div ref={businessTypeRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type *
            </label>
            <div className="relative">
              <input
                type="text"
                value={businessTypeInput}
                onChange={(e) => handleBusinessTypeInputChange(e.target.value)}
                onFocus={() => setShowBusinessTypeDropdown(true)}
                placeholder="Type or select your business type..."
                required
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
            
            {/* Dropdown List */}
            {showBusinessTypeDropdown && filteredBusinessTypes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBusinessTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleBusinessTypeSelect(type)}
                    className={`w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors ${
                      businessType === type ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
            
            {/* Custom type hint */}
            {businessTypeInput && !BUSINESS_TYPES.some(t => t.toLowerCase() === businessTypeInput.toLowerCase()) && (
              <p className="text-xs text-gray-500 mt-1">
                Using custom business type: &quot;{businessTypeInput}&quot;
              </p>
            )}
          </div>

          {/* Review Expectations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Expectations
            </label>
            <p className="text-xs text-gray-500 mb-3">
              What should customers focus on in their review?
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_EXPECTATIONS.map(exp => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => toggleExpectation(exp)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                    expectations.includes(exp)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Keywords
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

            {/* Keyword Tags */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

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

          {/* Google Review URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Google Review URL
              </label>
              <button
                type="button"
                onClick={() => setShowGoogleHelp(!showGoogleHelp)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                How to find this
              </button>
            </div>
            {showGoogleHelp && (
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
            )}
            <input
              type="url"
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="https://g.page/r/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          {/* Yelp Review URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Yelp Review URL
              </label>
              <button
                type="button"
                onClick={() => setShowYelpHelp(!showYelpHelp)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                How to find this
              </button>
            </div>
            {showYelpHelp && (
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
            )}
            <input
              type="url"
              value={yelpUrl}
              onChange={(e) => setYelpUrl(e.target.value)}
              placeholder="https://www.yelp.com/biz/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

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
              disabled={!name || !businessType}
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
