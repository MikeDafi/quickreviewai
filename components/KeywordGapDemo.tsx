import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, RefreshCw, ChevronDown, Check, AlertCircle, Star, ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';
import { BUSINESS_TYPES, getRandomDemoKeywords } from '@/lib/businessData';

// Dynamically import the map component (Leaflet doesn't work with SSR)
const ResultsMap = dynamic(() => import('./ResultsMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
    </div>
  )
});

// Yelp business search result
interface YelpBusiness {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  imageUrl: string;
  yelpUrl: string;
}

interface SearchResult {
  rank: number;
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  address: string;
  categories: string[];
  distance: number;
  yelpUrl: string;
  imageUrl: string;
}

// 1 mile = ~1609 meters
const SEARCH_RADIUS_METERS = 1609;

export default function KeywordGapDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [businessResults, setBusinessResults] = useState<YelpBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<YelpBusiness | null>(null);
  const [businessType, setBusinessType] = useState<string>('');
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingYelp, setSearchingYelp] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [keywordSearchCount, setKeywordSearchCount] = useState(0); // Track total keyword searches (max 3)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Get user's location on mount for better search results
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation not available:', error.message);
          // Fallback: user can still search by including city in the query
        },
        { timeout: 5000, maximumAge: 600000 } // Cache for 10 minutes
      );
    }
  }, []);

  // Debounced search for businesses via Yelp
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (selectedBusiness) { setBusinessResults([]); return; }
    if (searchQuery.length < 3) { setBusinessResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Build URL with optional location
        let url = `/api/yelp-business-search?name=${encodeURIComponent(searchQuery)}`;
        if (userLocation) {
          url += `&latitude=${userLocation.lat}&longitude=${userLocation.lng}`;
        }
        const res = await fetch(url);
        if (res.status === 429) {
          setRateLimited(true);
          setError('Search limit reached. Sign up for unlimited searches!');
          setBusinessResults([]);
        } else if (res.ok) {
          const data = await res.json();
          setBusinessResults(data.businesses || []);
          setError('');
        }
      } catch (err) {
        console.error('Business search error:', err);
        setBusinessResults([]);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, selectedBusiness]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Yelp and return rank
  const searchYelpForKeyword = useCallback(async (keyword: string, business: YelpBusiness): Promise<{ rank: number | null; results: SearchResult[] }> => {
    try {
      const res = await fetch(
        `/api/yelp-search?term=${encodeURIComponent(keyword)}&latitude=${business.lat}&longitude=${business.lng}&radius=${SEARCH_RADIUS_METERS}`
      );
      
      if (res.status === 429) {
        setRateLimited(true);
        setError('Search limit reached. Sign up for unlimited searches!');
        return { rank: null, results: [] };
      }
      
      if (!res.ok) throw new Error('Search failed');
      
      const data = await res.json();
      const searchResults = data.results || [];
      
      // Check if user's business is in results (match by ID for accuracy)
      const userBusinessIndex = searchResults.findIndex((r: SearchResult) => 
        r.id === business.id ||
        r.name.toLowerCase().includes(business.name.toLowerCase()) ||
        business.name.toLowerCase().includes(r.name.toLowerCase())
      );
      
      return { 
        rank: userBusinessIndex >= 0 ? userBusinessIndex + 1 : null, 
        results: searchResults 
      };
    } catch (err) {
      console.error('Yelp search error:', err);
      return { rank: null, results: [] };
    }
  }, []);

  // Main search function - searches 2 keywords and shows the worse result
  const performSearch = useCallback(async (business: YelpBusiness, type: string, isRetry: boolean = false) => {
    setSearchingYelp(true);
    setError('');
    
    // Increment keyword search count
    if (isRetry) {
      setKeywordSearchCount(prev => prev + 1);
    } else {
      setKeywordSearchCount(1); // First search for this business
    }
    
    // Get 2 random demo keywords for this business type
    const keywords = getRandomDemoKeywords(type, 2);
    
    // Search first keyword
    const result1 = await searchYelpForKeyword(keywords[0], business);
    
    // If found in top 20, try second keyword
    if (result1.rank !== null && result1.rank <= 20 && keywords[1]) {
      const result2 = await searchYelpForKeyword(keywords[1], business);
      
      // Use the worse result (higher rank number or not found)
      if (result2.rank === null || (result1.rank !== null && result2.rank > result1.rank)) {
        setResults(result2.results);
        setUserRank(result2.rank);
        setCurrentKeyword(keywords[1]);
      } else {
        setResults(result1.results);
        setUserRank(result1.rank);
        setCurrentKeyword(keywords[0]);
      }
    } else {
      // First search was bad enough, use it
      setResults(result1.results);
      setUserRank(result1.rank);
      setCurrentKeyword(keywords[0]);
    }
    
    setSearchingYelp(false);
  }, [searchYelpForKeyword]);

  // Trigger search when we have business + type
  useEffect(() => {
    if (selectedBusiness && businessType) {
      performSearch(selectedBusiness, businessType);
    }
  }, [selectedBusiness, businessType, performSearch]);

  // Detect business type from Yelp categories
  const detectBusinessType = (categories: string[]): string => {
    const cats = categories.map(c => c.toLowerCase());
    if (cats.some(c => c.includes('restaurant') || c.includes('food'))) return 'Restaurant';
    if (cats.some(c => c.includes('coffee') || c.includes('cafe'))) return 'Cafe';
    if (cats.some(c => c.includes('hair') || c.includes('salon') || c.includes('barber'))) return 'Salon';
    if (cats.some(c => c.includes('auto') || c.includes('car repair'))) return 'Auto Shop';
    if (cats.some(c => c.includes('dentist') || c.includes('dental'))) return 'Dental Office';
    if (cats.some(c => c.includes('gym') || c.includes('fitness'))) return 'Gym';
    if (cats.some(c => c.includes('bar') || c.includes('pub') || c.includes('nightlife'))) return 'Bar';
    if (cats.some(c => c.includes('bakery') || c.includes('bakeries'))) return 'Bakery';
    if (cats.some(c => c.includes('spa') || c.includes('massage'))) return 'Spa';
    if (cats.some(c => c.includes('vet') || c.includes('animal'))) return 'Veterinarian';
    if (cats.some(c => c.includes('hotel') || c.includes('lodging'))) return 'Hotel';
    if (cats.some(c => c.includes('pizza'))) return 'Pizzeria';
    if (cats.some(c => c.includes('mexican'))) return 'Mexican Restaurant';
    if (cats.some(c => c.includes('chinese'))) return 'Chinese Restaurant';
    if (cats.some(c => c.includes('italian'))) return 'Italian Restaurant';
    if (cats.some(c => c.includes('thai'))) return 'Thai Restaurant';
    if (cats.some(c => c.includes('sushi') || c.includes('japanese'))) return 'Sushi Bar';
    if (cats.some(c => c.includes('nail'))) return 'Nail Salon';
    if (cats.some(c => c.includes('pet'))) return 'Pet Store';
    return '';
  };

  // Select a business from Yelp results
  const selectBusiness = (business: YelpBusiness) => {
    setBusinessResults([]);
    setResults([]);
    setUserRank(null);
    setCurrentKeyword('');
    setKeywordSearchCount(0);
    setSearchQuery(business.name);
    setSelectedBusiness(business);
    
    // Try to detect business type from categories
    const detected = detectBusinessType(business.categories || []);
    if (detected) {
      setBusinessType(detected);
    }
  };

  const handleTypeSelect = (type: string) => {
    setBusinessType(type);
    setShowTypeDropdown(false);
    setTypeFilter('');
    setResults([]);
    setUserRank(null);
    setCurrentKeyword('');
    setKeywordSearchCount(0);
  };

  const tryNewKeywords = () => {
    if (selectedBusiness && businessType && keywordSearchCount < 3) {
      setResults([]);
      setUserRank(null);
      performSearch(selectedBusiness, businessType, true);
    }
  };
  
  const canTryNewKeywords = keywordSearchCount < 3;

  // Build Google Maps search URL
  const getGoogleMapsUrl = () => {
    if (!selectedBusiness || !currentKeyword) return '';
    const keyword = encodeURIComponent(currentKeyword);
    return `https://www.google.com/maps/search/${keyword}/@${selectedBusiness.lat},${selectedBusiness.lng},14z`;
  };

  // Build Yelp search URL
  const getYelpSearchUrl = () => {
    if (!selectedBusiness || !currentKeyword) return '';
    const keyword = encodeURIComponent(currentKeyword);
    return `https://www.yelp.com/search?find_desc=${keyword}&find_loc=${encodeURIComponent(selectedBusiness.address)}`;
  };

  const filteredTypes = typeFilter
    ? BUSINESS_TYPES.filter(t => t.toLowerCase().includes(typeFilter.toLowerCase()))
    : BUSINESS_TYPES;

  const showResults = selectedBusiness && businessType && currentKeyword && results.length > 0;

  // Determine banner color based on rank
  const getBannerStyle = () => {
    if (userRank === null) return 'bg-red-50 border-red-300';
    if (userRank <= 5) return 'bg-emerald-50 border-emerald-300';
    return 'bg-amber-50 border-amber-300'; // 6-20
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          See Your <span className="text-red-500">Yelp Rankings</span> Live
        </h3>
        <p className="text-gray-600">
          Search for your business and see where you rank against competitors
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
        {/* Search + Business Type Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Find your business
            </label>
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedBusiness) {
                      setSelectedBusiness(null);
                      setBusinessType('');
                      setCurrentKeyword('');
                      setResults([]);
                      setUserRank(null);
                      setKeywordSearchCount(0);
                    }
                  }}
                  placeholder="Search your business name (include city for better results)..."
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
                  disabled={rateLimited}
                />
                {loading && <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent flex-shrink-0" />}
                {selectedBusiness && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              </div>

              {businessResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20 max-h-72 overflow-y-auto">
                  {businessResults.map((biz) => (
                    <button
                      key={biz.id}
                      onClick={() => selectBusiness(biz)}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-100 last:border-0 flex items-center gap-3"
                    >
                      {biz.imageUrl && (
                        <img src={biz.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{biz.name}</div>
                        <div className="text-sm text-gray-500 truncate">{biz.address}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {biz.rating}
                          </span>
                          <span>{biz.reviewCount} reviews</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Business Type Dropdown */}
          <div className="sm:w-56" ref={typeDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business type</label>
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all text-left"
              >
                <span className={`truncate ${businessType ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {businessType || 'Select type...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showTypeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-30">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      placeholder="Filter..."
                      className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        className={`w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors text-sm ${
                          businessType === type ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Prompt to select business type */}
        {selectedBusiness && !businessType && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            👆 Please select your business type to see rankings
          </div>
        )}

        {/* Loading Yelp */}
        {searchingYelp && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-red-600 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600">Analyzing your rankings...</p>
          </div>
        )}

        {/* Results Section */}
        {showResults && !searchingYelp && (
          <div className="space-y-4">
            {/* Keyword + Try Another + Links */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-700">
                  Keyword: <span className="font-bold text-gray-900">&ldquo;{currentKeyword}&rdquo;</span>
                </span>
                {canTryNewKeywords ? (
                  <button
                    onClick={tryNewKeywords}
                    className="flex items-center gap-1 px-2 py-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try different keyword
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 ml-2">(demo limit reached)</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={getYelpSearchUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <img src="https://www.yelp.com/favicon.ico" alt="Yelp" className="w-4 h-4" />
                  Yelp
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={getGoogleMapsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <MapPin className="w-4 h-4" />
                  Google
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* User Rank Banner */}
            <div className={`p-4 rounded-xl border-2 ${getBannerStyle()}`}>
              {userRank !== null ? (
                <>
                  <p className="font-semibold text-lg">
                    {userRank <= 5 ? '🎉' : '⚠️'} {selectedBusiness?.name} is ranked{' '}
                    <span className={`text-2xl ${userRank <= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      #{userRank}
                    </span>{' '}
                    for &ldquo;{currentKeyword}&rdquo;
                  </p>
                  {userRank <= 5 ? (
                    <p className="text-sm text-gray-600 mt-1">Great! You&apos;re in the top 5. Keep collecting keyword-rich reviews to maintain your position!</p>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">You&apos;re showing up, but not in the top 5. More reviews with targeted keywords can boost your ranking!</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold text-lg text-red-700">
                    😟 {selectedBusiness?.name} is <span className="text-red-600">NOT in the top 20</span> for &ldquo;{currentKeyword}&rdquo;
                  </p>
                  <p className="text-sm text-gray-600 mt-1">You&apos;re invisible to customers searching this keyword. Keyword-rich reviews can change that!</p>
                </>
              )}
            </div>

            {/* Map + Rankings Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-gray-200 h-[400px]">
                <ResultsMap 
                  results={results} 
                  center={{ lat: selectedBusiness?.lat || 0, lng: selectedBusiness?.lng || 0 }}
                  userBusinessName={selectedBusiness?.name || ''}
                  userRank={userRank}
                />
              </div>

              {/* Rankings List - Show all 20 */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {results.map((result) => {
                  const isUserBusiness = selectedBusiness && (
                    result.id === selectedBusiness.id ||
                    result.name.toLowerCase().includes(selectedBusiness.name.toLowerCase()) ||
                    selectedBusiness.name.toLowerCase().includes(result.name.toLowerCase())
                  );
                  return (
                    <div 
                      key={result.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isUserBusiness 
                          ? userRank !== null && userRank <= 5 
                            ? 'bg-emerald-50 border-emerald-300' 
                            : 'bg-amber-50 border-amber-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        result.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        result.rank === 2 ? 'bg-gray-300 text-gray-700' :
                        result.rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {result.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate text-sm flex items-center gap-2">
                          {result.name}
                          {isUserBusiness && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              userRank !== null && userRank <= 5 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-amber-600 text-white'
                            }`}>
                              You #{userRank}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {result.rating}
                          </span>
                          <span>{result.reviewCount} reviews</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-center text-white">
              <h4 className="text-xl font-bold mb-2">
                {userRank === null ? 'Not ranking? We can help.' : userRank > 5 ? 'Want to crack the top 5?' : 'Keep your top spot!'}
              </h4>
              <p className="text-emerald-100 mb-4">
                QuickReviewAI generates keyword-rich reviews that help you rank for searches like &ldquo;{currentKeyword}&rdquo;
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
              >
                Get Started Free
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Yelp Attribution */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Rankings powered by <a href="https://www.yelp.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">Yelp</a> • 1 mile radius
      </div>
    </div>
  );
}
