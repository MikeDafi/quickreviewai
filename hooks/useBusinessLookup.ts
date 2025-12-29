import { useState, useEffect, useCallback, useRef } from 'react';

interface BusinessUrls {
  googleUrl: string;
  yelpUrl: string;
}

interface LookupState {
  loading: boolean;
  result: string | null;
  rateLimited: boolean;
  googleAutoFilled: boolean;
  yelpAutoFilled: boolean;
}

interface UseBusinessLookupOptions {
  /** Delay in ms before auto-lookup triggers (default: 3000) */
  autoLookupDelay?: number;
  /** Minimum name length to trigger auto-lookup (default: 5) */
  minNameLength?: number;
  /** Skip auto-lookup if editing existing store with URLs */
  existingUrls?: { googleUrl?: string; yelpUrl?: string };
}

interface UseBusinessLookupReturn {
  state: LookupState;
  lookupBusinessUrls: (name: string) => Promise<void>;
  setUrls: (urls: Partial<BusinessUrls>) => void;
  urls: BusinessUrls;
  clearResult: () => void;
}

const DEFAULT_OPTIONS: Required<UseBusinessLookupOptions> = {
  autoLookupDelay: 3000,
  minNameLength: 5,
  existingUrls: {},
};

/**
 * Custom hook for business URL lookup functionality
 * Handles both auto-lookup on name change and manual lookup
 */
export function useBusinessLookup(
  storeName: string,
  options: UseBusinessLookupOptions = {}
): UseBusinessLookupReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [urls, setUrlsState] = useState<BusinessUrls>({
    googleUrl: opts.existingUrls?.googleUrl || '',
    yelpUrl: opts.existingUrls?.yelpUrl || '',
  });
  
  const [state, setState] = useState<LookupState>({
    loading: false,
    result: null,
    rateLimited: false,
    googleAutoFilled: false,
    yelpAutoFilled: false,
  });
  
  // Track if auto-lookup has already been performed
  const hasAutoLookedUp = useRef(false);
  
  // Reset when existingUrls change (e.g., editing a different store)
  useEffect(() => {
    setUrlsState({
      googleUrl: opts.existingUrls?.googleUrl || '',
      yelpUrl: opts.existingUrls?.yelpUrl || '',
    });
    hasAutoLookedUp.current = !!opts.existingUrls?.googleUrl || !!opts.existingUrls?.yelpUrl;
  }, [opts.existingUrls?.googleUrl, opts.existingUrls?.yelpUrl]);

  const setUrls = useCallback((newUrls: Partial<BusinessUrls>) => {
    setUrlsState(prev => ({ ...prev, ...newUrls }));
    // Clear auto-filled flags when user manually changes URLs
    if (newUrls.googleUrl !== undefined) {
      setState(prev => ({ ...prev, googleAutoFilled: false }));
    }
    if (newUrls.yelpUrl !== undefined) {
      setState(prev => ({ ...prev, yelpAutoFilled: false }));
    }
  }, []);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, result: null }));
  }, []);

  const performLookup = useCallback(async (name: string, isAuto: boolean): Promise<void> => {
    if (!name.trim()) {
      if (!isAuto) {
        setState(prev => ({ ...prev, result: 'Please enter a store name first' }));
      }
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      result: isAuto ? prev.result : null,
      rateLimited: false 
    }));

    try {
      const res = await fetch('/api/lookup-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        let foundGoogle = false;
        let foundYelp = false;

        setUrlsState(prev => {
          const newUrls = { ...prev };
          if (data.googleUrl && !prev.googleUrl) {
            newUrls.googleUrl = data.googleUrl;
            foundGoogle = true;
          }
          if (data.yelpUrl && !prev.yelpUrl) {
            newUrls.yelpUrl = data.yelpUrl;
            foundYelp = true;
          }
          return newUrls;
        });

        setState(prev => ({
          ...prev,
          loading: false,
          googleAutoFilled: foundGoogle || prev.googleAutoFilled,
          yelpAutoFilled: foundYelp || prev.yelpAutoFilled,
          result: foundGoogle || foundYelp
            ? isAuto ? 'Auto-filled review URLs!' : 'Found! Review the URLs below.'
            : isAuto ? null : 'Could not find business. Try adding city to your name (e.g. "Joe\'s Pizza Seattle") or enter URLs manually.',
        }));
      } else if (res.status === 429) {
        setState(prev => ({
          ...prev,
          loading: false,
          rateLimited: true,
          result: isAuto ? 'Rate limited - try again later' : 'Lookup rate limited. Please try again in a moment.',
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          result: isAuto ? null : 'Lookup failed. Please enter URLs manually.',
        }));
      }
    } catch (error) {
      console.error('Business lookup error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        result: isAuto ? null : 'Lookup failed. Please enter URLs manually.',
      }));
    }
  }, []);

  const lookupBusinessUrls = useCallback(async (name: string) => {
    hasAutoLookedUp.current = true;
    await performLookup(name, false);
  }, [performLookup]);

  // Auto-lookup effect
  useEffect(() => {
    // Skip if already looked up, URLs already filled, or editing existing store with URLs
    if (hasAutoLookedUp.current || urls.googleUrl || urls.yelpUrl) {
      return;
    }

    // Only auto-lookup if name meets minimum length
    if (!storeName.trim() || storeName.trim().length < opts.minNameLength) {
      return;
    }

    const timer = setTimeout(() => {
      // Double-check URLs aren't filled (could have changed during timeout)
      if (!urls.googleUrl && !urls.yelpUrl && !hasAutoLookedUp.current) {
        hasAutoLookedUp.current = true;
        performLookup(storeName, true);
      }
    }, opts.autoLookupDelay);

    return () => clearTimeout(timer);
  }, [storeName, urls.googleUrl, urls.yelpUrl, opts.minNameLength, opts.autoLookupDelay, performLookup]);

  return {
    state,
    lookupBusinessUrls,
    setUrls,
    urls,
    clearResult,
  };
}

