import { useState, useEffect, useCallback, useRef } from 'react';

interface BusinessUrls {
  googleUrl: string;
  yelpUrl: string;
}

interface LookupState {
  loading: boolean;
  googleLoading: boolean;
  yelpLoading: boolean;
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
  existingUrls?: { googleUrl?: string | null; yelpUrl?: string | null };
}

interface UseBusinessLookupReturn {
  state: LookupState;
  lookupBusinessUrls: (name: string) => Promise<void>;
  lookupGoogleUrl: (name: string) => Promise<void>;
  lookupYelpUrl: (name: string) => Promise<void>;
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
    googleLoading: false,
    yelpLoading: false,
    result: null,
    rateLimited: false,
    googleAutoFilled: false,
    yelpAutoFilled: false,
  });
  
  // Track if auto-lookup has already been performed
  const hasAutoLookedUp = useRef(!!opts.existingUrls?.googleUrl || !!opts.existingUrls?.yelpUrl);
  
  // Track if user has manually modified URLs (to prevent resetting)
  const userHasModifiedUrls = useRef(false);
  
  // Track the previous store's URLs to detect when editing a different store
  const prevExistingUrls = useRef({ googleUrl: opts.existingUrls?.googleUrl, yelpUrl: opts.existingUrls?.yelpUrl });
  
  // Reset only when editing a DIFFERENT store (not on every render)
  useEffect(() => {
    const prevGoogle = prevExistingUrls.current.googleUrl;
    const prevYelp = prevExistingUrls.current.yelpUrl;
    const newGoogle = opts.existingUrls?.googleUrl;
    const newYelp = opts.existingUrls?.yelpUrl;
    
    // Only reset if we're editing a different store (URLs changed from external source)
    // AND user hasn't manually modified the URLs yet
    const isEditingDifferentStore = prevGoogle !== newGoogle || prevYelp !== newYelp;
    
    if (isEditingDifferentStore && !userHasModifiedUrls.current) {
      setUrlsState({
        googleUrl: newGoogle || '',
        yelpUrl: newYelp || '',
      });
      hasAutoLookedUp.current = !!newGoogle || !!newYelp;
    }
    
    prevExistingUrls.current = { googleUrl: newGoogle, yelpUrl: newYelp };
  }, [opts.existingUrls?.googleUrl, opts.existingUrls?.yelpUrl]);

  const setUrls = useCallback((newUrls: Partial<BusinessUrls>) => {
    setUrlsState(prev => ({ ...prev, ...newUrls }));
    // Mark that user has manually modified URLs (prevents auto-reset)
    userHasModifiedUrls.current = true;
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

  // Platform-specific lookup for Google
  const lookupGoogleUrl = useCallback(async (name: string) => {
    if (!name.trim()) {
      setState(prev => ({ ...prev, result: 'Please enter a store name first' }));
      return;
    }

    setState(prev => ({ ...prev, googleLoading: true, result: null }));

    try {
      const res = await fetch('/api/lookup-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), platform: 'google' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.googleUrl) {
          setUrlsState(prev => ({ ...prev, googleUrl: data.googleUrl }));
          setState(prev => ({
            ...prev,
            googleLoading: false,
            googleAutoFilled: true,
            result: 'Found Google review URL!',
          }));
        } else {
          setState(prev => ({
            ...prev,
            googleLoading: false,
            result: 'Could not find Google URL. Try adding city to your name or enter manually.',
          }));
        }
      } else if (res.status === 429) {
        setState(prev => ({ ...prev, googleLoading: false, rateLimited: true, result: 'Rate limited. Try again later.' }));
      } else {
        setState(prev => ({ ...prev, googleLoading: false, result: 'Lookup failed. Please enter URL manually.' }));
      }
    } catch (error) {
      console.error('Google lookup error:', error);
      setState(prev => ({ ...prev, googleLoading: false, result: 'Lookup failed. Please enter URL manually.' }));
    }
  }, []);

  // Platform-specific lookup for Yelp
  const lookupYelpUrl = useCallback(async (name: string) => {
    if (!name.trim()) {
      setState(prev => ({ ...prev, result: 'Please enter a store name first' }));
      return;
    }

    setState(prev => ({ ...prev, yelpLoading: true, result: null }));

    try {
      const res = await fetch('/api/lookup-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), platform: 'yelp' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.yelpUrl) {
          setUrlsState(prev => ({ ...prev, yelpUrl: data.yelpUrl }));
          setState(prev => ({
            ...prev,
            yelpLoading: false,
            yelpAutoFilled: true,
            result: 'Found Yelp review URL!',
          }));
        } else {
          setState(prev => ({
            ...prev,
            yelpLoading: false,
            result: 'Could not find Yelp URL. Try adding city to your name or enter manually.',
          }));
        }
      } else if (res.status === 429) {
        setState(prev => ({ ...prev, yelpLoading: false, rateLimited: true, result: 'Rate limited. Try again later.' }));
      } else {
        setState(prev => ({ ...prev, yelpLoading: false, result: 'Lookup failed. Please enter URL manually.' }));
      }
    } catch (error) {
      console.error('Yelp lookup error:', error);
      setState(prev => ({ ...prev, yelpLoading: false, result: 'Lookup failed. Please enter URL manually.' }));
    }
  }, []);

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
    lookupGoogleUrl,
    lookupYelpUrl,
    setUrls,
    urls,
    clearResult,
  };
}

