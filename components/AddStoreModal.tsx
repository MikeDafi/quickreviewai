import { useState, KeyboardEvent } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Store } from '@/lib/types';

interface AddStoreModalProps {
  store?: Store;
  onClose: () => void;
  onSave: (store: Store | Omit<Store, 'id'>) => void;
}

const businessTypes = [
  // Food & Beverage
  'Restaurant',
  'Cafe',
  'Coffee Shop',
  'Bakery',
  'Bar',
  'Brewery',
  'Food Truck',
  'Catering',
  'Ice Cream Shop',
  'Juice Bar',
  'Pizza Shop',
  'Deli',
  'Fast Food',
  'Fine Dining',
  // Health & Beauty
  'Salon',
  'Barbershop',
  'Spa',
  'Nail Salon',
  'Med Spa',
  'Massage Therapy',
  'Tattoo Studio',
  'Waxing Studio',
  'Skincare Clinic',
  'Tanning Salon',
  // Fitness & Wellness
  'Gym',
  'Yoga Studio',
  'Pilates Studio',
  'CrossFit Box',
  'Martial Arts Studio',
  'Dance Studio',
  'Personal Training',
  'Physical Therapy',
  'Chiropractic',
  // Automotive
  'Auto Shop',
  'Car Wash',
  'Auto Detailing',
  'Tire Shop',
  'Oil Change',
  'Body Shop',
  'Car Dealership',
  'Motorcycle Shop',
  'RV Dealer',
  // Retail
  'Retail Store',
  'Boutique',
  'Clothing Store',
  'Jewelry Store',
  'Shoe Store',
  'Pet Store',
  'Furniture Store',
  'Electronics Store',
  'Bookstore',
  'Florist',
  'Gift Shop',
  'Thrift Store',
  'Sporting Goods',
  'Hardware Store',
  'Liquor Store',
  'Smoke Shop',
  'Convenience Store',
  'Grocery Store',
  // Professional Services
  'Law Firm',
  'Accounting Firm',
  'Insurance Agency',
  'Real Estate Agency',
  'Financial Advisor',
  'Marketing Agency',
  'IT Services',
  'Consulting',
  'Architecture Firm',
  'Engineering Firm',
  // Home Services
  'Plumber',
  'Electrician',
  'HVAC',
  'Roofing',
  'Landscaping',
  'Lawn Care',
  'Cleaning Service',
  'Pest Control',
  'Moving Company',
  'Handyman',
  'Interior Design',
  'Pool Service',
  'Painting',
  'Flooring',
  'Fencing',
  // Medical & Dental
  'Doctor',
  'Dentist',
  'Orthodontist',
  'Optometrist',
  'Veterinarian',
  'Urgent Care',
  'Mental Health',
  'Pediatrician',
  'Dermatologist',
  'Pharmacy',
  // Education & Childcare
  'Daycare',
  'Preschool',
  'Tutoring',
  'Music School',
  'Art School',
  'Driving School',
  'Language School',
  'Test Prep',
  // Entertainment & Recreation
  'Movie Theater',
  'Bowling Alley',
  'Arcade',
  'Escape Room',
  'Amusement Park',
  'Golf Course',
  'Mini Golf',
  'Laser Tag',
  'Trampoline Park',
  'Go Kart',
  'Axe Throwing',
  // Hospitality & Travel
  'Hotel',
  'Motel',
  'Bed & Breakfast',
  'Vacation Rental',
  'Travel Agency',
  'Tour Operator',
  'Wedding Venue',
  'Event Venue',
  // Photography & Creative
  'Photography Studio',
  'Video Production',
  'Graphic Design',
  'Printing Shop',
  'Sign Shop',
  'Music Studio',
  // Other
  'Dry Cleaner',
  'Laundromat',
  'Tailor',
  'Locksmith',
  'Storage Facility',
  'Shipping Store',
  'Pawn Shop',
  'Gun Shop',
  'Vape Shop',
  'Other'
];

const keywordSuggestions: Record<string, string[]> = {
  'Restaurant': ['delicious', 'authentic', 'family-friendly', 'fresh ingredients', 'cozy atmosphere', 'great service'],
  'Cafe': ['cozy', 'artisanal', 'fresh', 'friendly service', 'best coffee', 'relaxing'],
  'Coffee Shop': ['best coffee', 'friendly baristas', 'cozy', 'great atmosphere', 'quality beans'],
  'Salon': ['professional', 'relaxing', 'modern', 'skilled stylists', 'luxurious', 'friendly'],
  'Barbershop': ['skilled barbers', 'clean', 'great haircut', 'friendly', 'classic'],
  'Spa': ['relaxing', 'rejuvenating', 'professional', 'tranquil', 'luxurious'],
  'Gym': ['motivating', 'clean', 'professional trainers', 'state-of-the-art', 'welcoming'],
  'Auto Shop': ['reliable', 'trustworthy', 'quick service', 'honest pricing', 'expert mechanics'],
  'Retail Store': ['quality products', 'great selection', 'helpful staff', 'affordable', 'convenient'],
  'Dentist': ['gentle', 'professional', 'friendly staff', 'modern equipment', 'pain-free'],
  'Doctor': ['caring', 'professional', 'thorough', 'attentive', 'knowledgeable'],
  'Plumber': ['reliable', 'quick response', 'fair pricing', 'professional', 'expert'],
  'Electrician': ['professional', 'reliable', 'knowledgeable', 'fair pricing', 'safe'],
  'Cleaning Service': ['thorough', 'reliable', 'professional', 'trustworthy', 'detail-oriented'],
  'Hotel': ['comfortable', 'clean', 'great location', 'friendly staff', 'excellent amenities'],
  'default': ['excellent', 'professional', 'friendly', 'high-quality', 'recommended', 'great experience']
};

export default function AddStoreModal({ store, onClose, onSave }: AddStoreModalProps) {
  const [name, setName] = useState(store?.name || '');
  const [businessType, setBusinessType] = useState(store?.businessType || '');
  const [keywords, setKeywords] = useState<string[]>(store?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [googleUrl, setGoogleUrl] = useState(store?.googleUrl || '');
  const [yelpUrl, setYelpUrl] = useState(store?.yelpUrl || '');
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);

  const currentKeywordSuggestions = keywordSuggestions[businessType] || keywordSuggestions['default'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeData = {
      name,
      businessType,
      keywords,
      tone: 'friendly', // Keep a default tone for the API
      googleUrl: googleUrl || undefined,
      yelpUrl: yelpUrl || undefined
    };

    if (store) {
      onSave({ ...storeData, id: store.id });
    } else {
      onSave(storeData);
    }
  };

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeywordsFromInput();
    }
  };

  const addKeywordsFromInput = () => {
    if (!keywordInput.trim()) return;
    
    // Split by comma and add each keyword
    const newKeywords = keywordInput
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k && !keywords.includes(k));
    
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
    }
    setKeywordInput('');
  };

  const addSuggestedKeyword = (keyword: string) => {
    const normalizedKeyword = keyword.toLowerCase();
    if (!keywords.includes(normalizedKeyword)) {
      setKeywords([...keywords, normalizedKeyword]);
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
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
              <option value="" disabled>Select your business type</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-gray-700">
                Keywords *
              </label>
              {currentKeywordSuggestions.length > 0 && (
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
                <p className="text-xs text-emerald-700 mb-2">Click to add:</p>
                <div className="flex flex-wrap gap-2">
                  {currentKeywordSuggestions.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => addSuggestedKeyword(keyword)}
                      disabled={keywords.includes(keyword.toLowerCase())}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        keywords.includes(keyword.toLowerCase())
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      + {keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords display */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              onBlur={addKeywordsFromInput}
              placeholder="Type keyword and press Enter (or comma-separated)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to add • Use commas for multiple keywords
            </p>
            {keywords.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                At least one keyword is required
              </p>
            )}
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
              disabled={keywords.length === 0}
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
