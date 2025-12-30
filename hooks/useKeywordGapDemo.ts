import { useState, useEffect, useRef, useCallback } from 'react';
import { getRandomDemoKeywords } from '@/lib/businessData';

// ============ Types ============

export interface YelpBusiness {
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

export interface SearchResult {
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

// ============ Constants ============

const MILES_TO_METERS = 1609;
export const SEARCH_RADIUS_METERS = MILES_TO_METERS; // 1 mile radius
const DEBOUNCE_MS = 600;
const MAX_KEYWORD_SEARCHES = 3;
const GEOLOCATION_TIMEOUT = 5000;
const GEOLOCATION_CACHE_MS = 600000; // 10 minutes

// Coordinate offsets for multi-location search
// 1 degree latitude ≈ 69 miles, so 1 mile ≈ 0.0145 degrees
// 1 degree longitude ≈ 53-69 miles (varies by latitude), using 0.0189 for mid-latitudes
const TWO_MILES_LAT = 0.029;
const TWO_MILES_LNG = 0.0378;
const THREE_MILES_LAT = 0.0435;
const THREE_MILES_LNG = 0.0567;

// Common US cities - if query contains one, skip geolocation and let Yelp match by name
const COMMON_CITIES = [
  'chicago', 'new york', 'nyc', 'los angeles', 'houston', 'phoenix',
  'philadelphia', 'san antonio', 'san diego', 'dallas', 'austin', 'san jose',
  'fort worth', 'jacksonville', 'columbus', 'charlotte', 'indianapolis',
  'san francisco', 'seattle', 'denver', 'boston', 'nashville', 'detroit',
  'portland', 'las vegas', 'memphis', 'louisville', 'baltimore', 'milwaukee',
  'albuquerque', 'tucson', 'fresno', 'sacramento', 'atlanta', 'miami',
  'oakland', 'minneapolis', 'tulsa', 'cleveland', 'new orleans', 'tampa',
  'honolulu', 'anaheim', 'st louis', 'pittsburgh', 'cincinnati', 'orlando',
  'brooklyn', 'manhattan', 'queens', 'bronx',
];

// Category keywords -> Business type mapping
// More specific patterns first to avoid false matches
const CATEGORY_TO_TYPE_MAP: Array<{ keywords: string[]; type: string }> = [
  // Specific restaurant types (check before generic 'restaurant')
  { keywords: ['pizza'], type: 'Pizzeria' },
  { keywords: ['mexican'], type: 'Mexican Restaurant' },
  { keywords: ['chinese'], type: 'Chinese Restaurant' },
  { keywords: ['italian'], type: 'Italian Restaurant' },
  { keywords: ['thai'], type: 'Thai Restaurant' },
  { keywords: ['sushi', 'japanese'], type: 'Sushi Bar' },
  { keywords: ['vietnamese', 'pho'], type: 'Vietnamese Restaurant' },
  { keywords: ['indian'], type: 'Indian Restaurant' },
  { keywords: ['greek'], type: 'Greek Restaurant' },
  { keywords: ['bbq', 'barbecue'], type: 'BBQ Restaurant' },
  { keywords: ['seafood'], type: 'Seafood Restaurant' },
  { keywords: ['steakhouse', 'steak house'], type: 'Steakhouse' },
  
  // Food & Beverage
  { keywords: ['coffee', 'cafe', 'espresso'], type: 'Cafe' },
  { keywords: ['bakery', 'bakeries'], type: 'Bakery' },
  { keywords: ['bar', 'pub', 'nightlife', 'cocktail'], type: 'Bar' },
  { keywords: ['brewery', 'taproom'], type: 'Brewery' },
  { keywords: ['winery', 'wine bar'], type: 'Winery' },
  { keywords: ['ice cream', 'gelato', 'frozen yogurt'], type: 'Ice Cream Shop' },
  { keywords: ['juice', 'smoothie'], type: 'Juice Bar' },
  { keywords: ['tea', 'boba', 'bubble tea'], type: 'Bubble Tea' },
  { keywords: ['deli', 'sandwich'], type: 'Deli' },
  { keywords: ['donut', 'doughnut'], type: 'Donut Shop' },
  { keywords: ['bagel'], type: 'Bagel Shop' },
  { keywords: ['food truck'], type: 'Food Truck' },
  { keywords: ['restaurant', 'food', 'dining'], type: 'Restaurant' },
  
  // Health & Beauty
  { keywords: ['hair', 'salon', 'barber', 'haircut'], type: 'Salon' },
  { keywords: ['nail'], type: 'Nail Salon' },
  { keywords: ['spa', 'massage', 'wellness'], type: 'Spa' },
  { keywords: ['tattoo', 'piercing'], type: 'Tattoo Parlor' },
  { keywords: ['lash', 'eyelash'], type: 'Lash Studio' },
  { keywords: ['brow', 'eyebrow'], type: 'Brow Bar' },
  { keywords: ['wax', 'waxing'], type: 'Waxing Studio' },
  
  // Automotive
  { keywords: ['auto', 'car repair', 'mechanic', 'automotive'], type: 'Auto Shop' },
  { keywords: ['car wash', 'carwash'], type: 'Car Wash' },
  { keywords: ['tire'], type: 'Tire Shop' },
  { keywords: ['oil change'], type: 'Oil Change' },
  { keywords: ['body shop', 'collision'], type: 'Body Shop' },
  
  // Healthcare
  { keywords: ['dentist', 'dental'], type: 'Dental Office' },
  { keywords: ['vet', 'veterinary', 'animal hospital'], type: 'Veterinarian' },
  { keywords: ['chiropractor', 'chiropractic'], type: 'Chiropractor' },
  { keywords: ['optometrist', 'eye doctor', 'optical'], type: 'Optometrist' },
  { keywords: ['physical therapy', 'physiotherapy'], type: 'Physical Therapy' },
  { keywords: ['pharmacy', 'drugstore'], type: 'Pharmacy' },
  
  // Fitness
  { keywords: ['gym', 'fitness', 'workout'], type: 'Gym' },
  { keywords: ['yoga'], type: 'Yoga Studio' },
  { keywords: ['pilates'], type: 'Pilates Studio' },
  { keywords: ['crossfit'], type: 'CrossFit' },
  { keywords: ['martial arts', 'karate', 'jiu jitsu', 'mma'], type: 'Martial Arts' },
  { keywords: ['boxing'], type: 'Boxing Gym' },
  { keywords: ['dance'], type: 'Dance Studio' },
  
  // Retail
  { keywords: ['pet store', 'pet shop', 'pet supplies'], type: 'Pet Store' },
  { keywords: ['florist', 'flower'], type: 'Florist' },
  { keywords: ['jewelry', 'jeweler'], type: 'Jewelry Store' },
  { keywords: ['bookstore', 'book shop'], type: 'Bookstore' },
  
  // Hospitality
  { keywords: ['hotel', 'lodging', 'motel'], type: 'Hotel' },
  { keywords: ['bed and breakfast', 'b&b', 'inn'], type: 'Bed & Breakfast' },
];

// ============ Rate Limit Handler ============

interface ApiResult<T> {
  data: T | null;
  rateLimited: boolean;
  error: string | null;
}

async function fetchWithRateLimit<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url);
    
    if (res.status === 429) {
      return {
        data: null,
        rateLimited: true,
        error: 'Search limit reached. Sign up for unlimited searches!',
      };
    }
    
    if (!res.ok) {
      return {
        data: null,
        rateLimited: false,
        error: 'Request failed',
      };
    }
    
    const data = await res.json();
    return { data, rateLimited: false, error: null };
  } catch (err) {
    console.error('API fetch error:', err);
    return { data: null, rateLimited: false, error: 'Network error' };
  }
}

// ============ Business Type Detection ============

export function detectBusinessType(categories: string[]): string {
  if (!categories || categories.length === 0) return '';
  
  const lowerCategories = categories.map(c => c.toLowerCase());
  
  for (const mapping of CATEGORY_TO_TYPE_MAP) {
    const match = mapping.keywords.some(keyword =>
      lowerCategories.some(cat => cat.includes(keyword))
    );
    if (match) return mapping.type;
  }
  
  return '';
}

// ============ useGeolocation Hook ============

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.log('Geolocation not available:', error.message);
      },
      { timeout: GEOLOCATION_TIMEOUT, maximumAge: GEOLOCATION_CACHE_MS }
    );
  }, []);

  return location;
}

// ============ useBusinessSearch Hook ============

interface BusinessSearchState {
  query: string;
  results: YelpBusiness[];
  loading: boolean;
  error: string;
  rateLimited: boolean;
  selectedBusiness: YelpBusiness | null;
}

export function useBusinessSearch(userLocation: { lat: number; lng: number } | null) {
  const [state, setState] = useState<BusinessSearchState>({
    query: '',
    results: [],
    loading: false,
    error: '',
    rateLimited: false,
    selectedBusiness: null,
  });
  
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    // Don't search if business already selected or query too short
    if (state.selectedBusiness || state.query.length < 3) {
      setState(s => ({ ...s, results: [] }));
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setState(s => ({ ...s, loading: true }));
      
      // Check if query contains a city name - if so, don't use geolocation
      const queryLower = state.query.toLowerCase();
      const hasLocationHint = COMMON_CITIES.some(city => queryLower.includes(city));
      
      let url = `/api/yelp-business-search?name=${encodeURIComponent(state.query)}`;
      
      // Only use geolocation if query doesn't contain a city name
      if (userLocation && !hasLocationHint) {
        url += `&latitude=${userLocation.lat}&longitude=${userLocation.lng}`;
      }
      
      const result = await fetchWithRateLimit<{ businesses: YelpBusiness[] }>(url);
      
      setState(s => ({
        ...s,
        loading: false,
        results: result.data?.businesses || [],
        rateLimited: result.rateLimited || s.rateLimited,
        error: result.error || '',
      }));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state.query, state.selectedBusiness, userLocation]);

  const setQuery = useCallback((query: string) => {
    setState(s => ({
      ...s,
      query,
      // Clear selection when user types
      selectedBusiness: query !== s.selectedBusiness?.name ? null : s.selectedBusiness,
    }));
  }, []);

  const selectBusiness = useCallback((business: YelpBusiness) => {
    setState(s => ({
      ...s,
      query: business.name,
      results: [],
      selectedBusiness: business,
      error: '',
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(s => ({
      ...s,
      selectedBusiness: null,
      results: [],
    }));
  }, []);

  return {
    ...state,
    setQuery,
    selectBusiness,
    clearSelection,
  };
}

// ============ useYelpRanking Hook ============

interface RankingState {
  results: SearchResult[];
  userRank: number | null;
  currentKeyword: string;
  searchCount: number;
  loading: boolean;
  error: string;
  rateLimited: boolean;
}

export function useYelpRanking() {
  const [state, setState] = useState<RankingState>({
    results: [],
    userRank: null,
    currentKeyword: '',
    searchCount: 0,
    loading: false,
    error: '',
    rateLimited: false,
  });

  const searchForKeyword = useCallback(async (
    keyword: string,
    business: YelpBusiness
  ): Promise<{ rank: number | null; results: SearchResult[] }> => {
    // Define search locations with matching radius: center (1mi radius), 2 miles N/S (2mi radius), 3 miles N/S (3mi radius)
    const searchLocations = [
      { lat: business.lat, lng: business.lng, name: 'center', radius: MILES_TO_METERS },
      // 2 mile searches (N/S only) with 2 mile radius
      { lat: business.lat + TWO_MILES_LAT, lng: business.lng, name: '2mi-N', radius: MILES_TO_METERS * 2 },
      { lat: business.lat - TWO_MILES_LAT, lng: business.lng, name: '2mi-S', radius: MILES_TO_METERS * 2 },
      // 3 mile searches (N/S only) with 3 mile radius
      { lat: business.lat + THREE_MILES_LAT, lng: business.lng, name: '3mi-N', radius: MILES_TO_METERS * 3 },
      { lat: business.lat - THREE_MILES_LAT, lng: business.lng, name: '3mi-S', radius: MILES_TO_METERS * 3 },
    ];
    
    // Search from all locations with their respective radius
    const searchPromises = searchLocations.map(async (location) => {
      const url = `/api/yelp-search?term=${encodeURIComponent(keyword)}&latitude=${location.lat}&longitude=${location.lng}&radius=${location.radius}`;
      return fetchWithRateLimit<{ results: SearchResult[] }>(url);
    });
    
    const results = await Promise.all(searchPromises);
    
    // Check for rate limiting
    const rateLimited = results.some(r => r.rateLimited);
    if (rateLimited) {
      const errorResult = results.find(r => r.rateLimited);
      setState(s => ({
        ...s,
        rateLimited: true,
        error: errorResult?.error || '',
      }));
      return { rank: null, results: [] };
    }
    
    // Take top 4 results from each location to ensure geographic diversity
    // This way we get businesses from all areas: center, 1mi N/S, 2mi N/S
    const uniqueResultsMap = new Map<string, SearchResult>();
    
    results.forEach(locationResults => {
      const locationData = locationResults.data?.results || [];
      // Take top 4 from each location
      locationData.slice(0, 4).forEach(result => {
        if (!uniqueResultsMap.has(result.id)) {
          uniqueResultsMap.set(result.id, result);
        }
      });
    });
    
    const searchResults = Array.from(uniqueResultsMap.values());
    
    // Sort by rating and review count for final ranking
    searchResults.sort((a, b) => {
      // Higher rating first
      if (b.rating !== a.rating) return b.rating - a.rating;
      // Then by review count
      return b.reviewCount - a.reviewCount;
    });
    
    // Re-rank based on combined results
    searchResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    // Find user's business in results
    const userIndex = searchResults.findIndex((r) =>
      r.id === business.id ||
      r.name.toLowerCase().includes(business.name.toLowerCase()) ||
      business.name.toLowerCase().includes(r.name.toLowerCase())
    );
    
    return {
      rank: userIndex >= 0 ? userIndex + 1 : null,
      results: searchResults,
    };
  }, []);

  const performSearch = useCallback(async (
    business: YelpBusiness,
    businessType: string,
    isRetry: boolean = false
  ) => {
    setState(s => ({
      ...s,
      loading: true,
      error: '',
      searchCount: isRetry ? s.searchCount + 1 : 1,
    }));

    // Get 2 random keywords for this business type
    const keywords = getRandomDemoKeywords(businessType, 2);
    
    // Search first keyword
    const result1 = await searchForKeyword(keywords[0], business);
    
    // If found in top 20, try second keyword to find a worse result
    if (result1.rank !== null && result1.rank <= 20 && keywords[1]) {
      const result2 = await searchForKeyword(keywords[1], business);
      
      // Use the worse result (higher rank or not found)
      if (result2.rank === null || (result1.rank !== null && result2.rank > result1.rank)) {
        setState(s => ({
          ...s,
          loading: false,
          results: result2.results,
          userRank: result2.rank,
          currentKeyword: keywords[1],
        }));
        return;
      }
    }
    
    // Use first result
    setState(s => ({
      ...s,
      loading: false,
      results: result1.results,
      userRank: result1.rank,
      currentKeyword: keywords[0],
    }));
  }, [searchForKeyword]);

  const resetSearch = useCallback(() => {
    setState({
      results: [],
      userRank: null,
      currentKeyword: '',
      searchCount: 0,
      loading: false,
      error: '',
      rateLimited: false,
    });
  }, []);

  const canRetry = state.searchCount < MAX_KEYWORD_SEARCHES;

  return {
    ...state,
    performSearch,
    resetSearch,
    canRetry,
    maxSearches: MAX_KEYWORD_SEARCHES,
  };
}

// ============ URL Builders ============

export function buildGoogleMapsUrl(business: YelpBusiness | null, keyword: string, offsetLat: number = 0, offsetLng: number = 0): string {
  if (!business || !keyword) return '';
  // Use coordinates offset by the specified amount (e.g., 2 miles north)
  const searchLat = business.lat + offsetLat;
  const searchLng = business.lng + offsetLng;
  // Zoom 12 shows ~3-5 mile radius area
  return `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${searchLat},${searchLng},12z`;
}

export function buildYelpSearchUrl(business: YelpBusiness | null, keyword: string, offsetLat: number = 0, offsetLng: number = 0): string {
  if (!business || !keyword) return '';
  // Use coordinates offset by the specified amount (e.g., 10 miles north)
  const searchLat = business.lat + offsetLat;
  const searchLng = business.lng + offsetLng;
  return `https://www.yelp.com/search?find_desc=${encodeURIComponent(keyword)}&find_loc=${searchLat},${searchLng}`;
}

// ============ Rank Badge Styling ============

export function getRankBadgeStyle(rank: number): string {
  if (rank === 1) return 'bg-yellow-400 text-yellow-900';
  if (rank === 2) return 'bg-gray-300 text-gray-700';
  if (rank === 3) return 'bg-amber-600 text-white';
  return 'bg-gray-200 text-gray-600';
}

export function getBannerStyle(userRank: number | null): string {
  if (userRank === null) return 'bg-red-50 border-red-300';
  if (userRank <= 5) return 'bg-emerald-50 border-emerald-300';
  return 'bg-amber-50 border-amber-300';
}

export function isUserBusiness(result: SearchResult, selectedBusiness: YelpBusiness | null): boolean {
  if (!selectedBusiness) return false;
  return (
    result.id === selectedBusiness.id ||
    result.name.toLowerCase().includes(selectedBusiness.name.toLowerCase()) ||
    selectedBusiness.name.toLowerCase().includes(result.name.toLowerCase())
  );
}

