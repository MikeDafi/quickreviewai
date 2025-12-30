import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, RefreshCw, ChevronDown, Check, AlertCircle, Star, ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';
import { BUSINESS_TYPES } from '@/lib/businessData';
import {
  useGeolocation,
  useBusinessSearch,
  useYelpRanking,
  detectBusinessType,
  buildGoogleMapsUrl,
  buildYelpSearchUrl,
  getRankBadgeStyle,
  getBannerStyle,
  isUserBusiness,
  YelpBusiness,
  SearchResult,
} from '@/hooks/useKeywordGapDemo';

// Dynamically import the map component (Leaflet doesn't work with SSR)
const ResultsMap = dynamic(() => import('./ResultsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent" />
    </div>
  ),
});

// ============ Sub-Components ============

interface BusinessDropdownProps {
  businesses: YelpBusiness[];
  onSelect: (business: YelpBusiness) => void;
}

function BusinessDropdown({ businesses, onSelect }: BusinessDropdownProps) {
  if (businesses.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-20 max-h-72 overflow-y-auto">
      {businesses.map((biz) => (
        <button
          key={biz.id}
          onClick={() => onSelect(biz)}
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
  );
}

interface BusinessTypeDropdownProps {
  selectedType: string;
  typeFilter: string;
  showDropdown: boolean;
  onFilterChange: (filter: string) => void;
  onSelect: (type: string) => void;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

function BusinessTypeDropdown({
  selectedType,
  typeFilter,
  showDropdown,
  onFilterChange,
  onSelect,
  onToggle,
  dropdownRef,
}: BusinessTypeDropdownProps) {
  const filteredTypes = typeFilter
    ? BUSINESS_TYPES.filter((t) => t.toLowerCase().includes(typeFilter.toLowerCase()))
    : BUSINESS_TYPES;

  return (
    <div className="sm:w-56" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">Business type</label>
      <div className="relative">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all text-left"
        >
          <span className={`truncate ${selectedType ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
            {selectedType || 'Select type...'}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${showDropdown ? 'rotate-180' : ''}`}
          />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-30">
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={typeFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                placeholder="Filter..."
                className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => onSelect(type)}
                  className={`w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors text-sm ${
                    selectedType === type ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700'
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
  );
}

interface RankingBannerProps {
  businessName: string;
  userRank: number | null;
  keyword: string;
}

function RankingBanner({ businessName, userRank, keyword }: RankingBannerProps) {
  return (
    <div className={`p-4 rounded-xl border-2 ${getBannerStyle(userRank)}`}>
      {userRank !== null ? (
        <>
          <p className="font-semibold text-lg">
            {userRank <= 5 ? '🎉' : '⚠️'} {businessName} is ranked{' '}
            <span className={`text-2xl ${userRank <= 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
              #{userRank}
            </span>{' '}
            for &ldquo;{keyword}&rdquo;
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {userRank <= 5
              ? "Great! You're in the top 5. Keep collecting keyword-rich reviews to maintain your position!"
              : "You're showing up, but not in the top 5. More reviews with targeted keywords can boost your ranking!"}
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-lg text-red-700">
            😟 {businessName} is <span className="text-red-600">NOT in the top 20</span> for &ldquo;{keyword}&rdquo;
          </p>
          <p className="text-sm text-gray-600 mt-1">
            You&apos;re invisible to customers searching this keyword. Keyword-rich reviews can change that!
          </p>
        </>
      )}
    </div>
  );
}

interface RankingsListProps {
  results: SearchResult[];
  selectedBusiness: YelpBusiness | null;
  userRank: number | null;
}

function RankingsList({ results, selectedBusiness, userRank }: RankingsListProps) {
  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {results.map((result) => {
        const isUser = isUserBusiness(result, selectedBusiness);
        return (
          <div
            key={result.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isUser
                ? userRank !== null && userRank <= 5
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-amber-50 border-amber-300'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getRankBadgeStyle(result.rank)}`}
            >
              {result.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate text-sm flex items-center gap-2">
                {result.name}
                {isUser && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      userRank !== null && userRank <= 5 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
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
  );
}

// ============ Main Component ============

export default function KeywordGapDemo() {
  // Geolocation
  const userLocation = useGeolocation();

  // Business search state
  const businessSearch = useBusinessSearch(userLocation);

  // Ranking search state
  const ranking = useYelpRanking();

  // Local UI state
  const [businessType, setBusinessType] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const typeDropdownRef = useRef<HTMLDivElement>(null);

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

  // Trigger ranking search when business + type are selected
  useEffect(() => {
    if (businessSearch.selectedBusiness && businessType) {
      ranking.performSearch(businessSearch.selectedBusiness, businessType);
    }
  }, [businessSearch.selectedBusiness, businessType]);

  // Handle business selection
  const handleSelectBusiness = useCallback(
    (business: YelpBusiness) => {
      businessSearch.selectBusiness(business);
      ranking.resetSearch();

      // Auto-detect business type from categories
      const detected = detectBusinessType(business.categories || []);
      if (detected) {
        setBusinessType(detected);
      } else {
        setBusinessType('');
      }
    },
    [businessSearch, ranking]
  );

  // Handle search query change
  const handleQueryChange = useCallback(
    (query: string) => {
      businessSearch.setQuery(query);
      if (businessSearch.selectedBusiness && query !== businessSearch.selectedBusiness.name) {
        // User is typing a new query, reset everything
        setBusinessType('');
        ranking.resetSearch();
      }
    },
    [businessSearch, ranking]
  );

  // Handle type selection
  const handleTypeSelect = useCallback(
    (type: string) => {
      setBusinessType(type);
      setShowTypeDropdown(false);
      setTypeFilter('');
      ranking.resetSearch();
    },
    [ranking]
  );

  // Try new keywords
  const handleTryNewKeywords = useCallback(() => {
    if (businessSearch.selectedBusiness && businessType && ranking.canRetry) {
      ranking.performSearch(businessSearch.selectedBusiness, businessType, true);
    }
  }, [businessSearch.selectedBusiness, businessType, ranking]);

  // Derived state
  const isRateLimited = businessSearch.rateLimited || ranking.rateLimited;
  const error = businessSearch.error || ranking.error;
  const showResults =
    businessSearch.selectedBusiness && businessType && ranking.currentKeyword && ranking.results.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          See Your <span className="text-red-500">Yelp Rankings</span> Live
        </h3>
        <p className="text-gray-600">Search for your business and see where you rank against competitors</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
        {/* Search + Business Type Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Find your business</label>
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={businessSearch.query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search your business name (include city for better results)..."
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
                  disabled={isRateLimited}
                />
                {businessSearch.loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent flex-shrink-0" />
                )}
                {businessSearch.selectedBusiness && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              </div>

              <BusinessDropdown businesses={businessSearch.results} onSelect={handleSelectBusiness} />
            </div>
          </div>

          {/* Business Type Dropdown */}
          <BusinessTypeDropdown
            selectedType={businessType}
            typeFilter={typeFilter}
            showDropdown={showTypeDropdown}
            onFilterChange={setTypeFilter}
            onSelect={handleTypeSelect}
            onToggle={() => setShowTypeDropdown(!showTypeDropdown)}
            dropdownRef={typeDropdownRef}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Prompt to select business type */}
        {businessSearch.selectedBusiness && !businessType && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            👆 Please select your business type to see rankings
          </div>
        )}

        {/* Loading Yelp */}
        {ranking.loading && (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-red-600 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600">Analyzing your rankings...</p>
          </div>
        )}

        {/* Results Section */}
        {showResults && !ranking.loading && (
          <div className="space-y-4">
            {/* Keyword + Try Another + Links */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-700">
                  Keyword: <span className="font-bold text-gray-900">&ldquo;{ranking.currentKeyword}&rdquo;</span>
                </span>
                {ranking.canRetry ? (
                  <button
                    onClick={handleTryNewKeywords}
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
                  href={buildYelpSearchUrl(businessSearch.selectedBusiness, ranking.currentKeyword, 0.145, 0)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <img src="https://www.yelp.com/favicon.ico" alt="Yelp" className="w-4 h-4" />
                  Yelp
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={buildGoogleMapsUrl(businessSearch.selectedBusiness, ranking.currentKeyword, 0.145, 0)}
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
            <RankingBanner
              businessName={businessSearch.selectedBusiness?.name || ''}
              userRank={ranking.userRank}
              keyword={ranking.currentKeyword}
            />

            {/* Map + Rankings Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-gray-200 h-[400px]">
                <ResultsMap
                  results={ranking.results}
                  center={{
                    lat: businessSearch.selectedBusiness?.lat || 0,
                    lng: businessSearch.selectedBusiness?.lng || 0,
                  }}
                  userBusinessName={businessSearch.selectedBusiness?.name || ''}
                  userRank={ranking.userRank}
                />
              </div>

              {/* Rankings List */}
              <RankingsList
                results={ranking.results}
                selectedBusiness={businessSearch.selectedBusiness}
                userRank={ranking.userRank}
              />
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-center text-white">
              <h4 className="text-xl font-bold mb-2">
                {ranking.userRank === null
                  ? 'Not ranking? We can help.'
                  : ranking.userRank > 5
                    ? 'Want to crack the top 5?'
                    : 'Keep your top spot!'}
              </h4>
              <p className="text-emerald-100 mb-4">
                QuickReviewAI generates keyword-rich reviews that help you rank for searches like &ldquo;
                {ranking.currentKeyword}&rdquo;
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
        Rankings powered by{' '}
        <a href="https://www.yelp.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">
          Yelp
        </a>{' '}
        • 1 mile radius
      </div>
    </div>
  );
}
