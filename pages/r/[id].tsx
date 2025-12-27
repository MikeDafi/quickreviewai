import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Copy, RefreshCw, ExternalLink, Check, ArrowDown, X, AlertCircle } from 'lucide-react';
import { Platform } from '@/lib/constants';

// Toast component - prominent notification
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className="fixed top-4 left-1/2 z-[9999] flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-2xl border-2 border-amber-300 max-w-md"
      style={{ transform: 'translateX(-50%)' }}
    >
      <AlertCircle className="w-6 h-6 flex-shrink-0" />
      <span className="font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

interface LandingData {
  id: string;
  store_name: string;
  business_type: string;
  google_url: string;
  yelp_url: string;
}

// Demo data for the homepage preview
const DEMO_DATA: LandingData = {
  id: 'demo',
  store_name: "Tony's Pizza",
  business_type: 'Pizzeria',
  google_url: 'https://g.page/r/CYbhqyxqIqguEBM/review',
  yelp_url: 'https://www.yelp.com/writeareview/biz/dx3-uI6A5bIXptySpOSaZg',
};

const DEMO_REVIEWS = [
  "Finally tried this place after walking past it forever. Gotta say the pizza was legit - that crust tho! Staff was super chill and didn't rush us even when it got busy. Def coming back next week with my friends.",
  "Ok so my coworker kept bugging me to try Tony's and she was right lol. The pepperoni was on point and they actually use real cheese, not that processed stuff. New favorite spot for sure. Already planning my next visit.",
  "Brought my parents here for their anniversary dinner. Dad's picky about pizza but even he admitted this was great. The margherita was fresh and the garlic knots... chef's kiss. Mom wants to come back already.",
  "Been coming here for like 2 years now and it's consistently good. Not the cheapest but worth it imo. The lunch special is clutch if you're on a budget. Staff remembers my usual order which is a nice touch.",
  "Stopped by on a whim after the gym and no regrets. Quick service, tasty slice, friendly people. What more do you need honestly. The guy at the counter even gave me extra napkins without asking haha.",
];

export default function LandingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<LandingData | null>(null);
  const [review, setReview] = useState('');
  const [reviewEventId, setReviewEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState('');
  const [isFreePlanLimit, setIsFreePlanLimit] = useState(false);
  const [isDemoLimit, setIsDemoLimit] = useState(false);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [demoReviewIndex, setDemoReviewIndex] = useState(0);
  const [demoRegenerateCount, setDemoRegenerateCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const isDemo = id === 'demo';
  
  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (id) {
      if (isDemo) {
        // Use demo data with random starting review
        const randomIndex = Math.floor(Math.random() * DEMO_REVIEWS.length);
        setDemoReviewIndex(randomIndex);
        setData(DEMO_DATA);
        setReview(DEMO_REVIEWS[randomIndex]);
        setLoading(false);
      } else {
        fetchLandingPage();
      }
    }
  }, [id, isDemo]);

  async function fetchLandingPage() {
    try {
      const res = await fetch(`/api/generate?id=${id}`);
      const result = await res.json();
      
      // Handle scan limit reached (403 with limitReached flag)
      if (res.status === 403 && result.limitReached) {
        setData(result.landing);
        setScanLimitReached(true);
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setError('Landing page not found');
        setLoading(false);
        return;
      }
      
      setData(result.landing);
      setReview(result.review);
      if (result.reviewEventId) {
        setReviewEventId(result.reviewEventId);
      }
    } catch (err) {
      setError('Failed to load landing page');
    } finally {
      setLoading(false);
    }
  }

  async function regenerateReview() {
    if (!id) return;
    setGenerating(true);
    setRateLimitError('');
    setCopied(false); // Reset copied state when generating new review
    
    // Handle demo case - allow only 3 regenerations with unique reviews
    if (isDemo) {
      if (demoRegenerateCount >= 3) {
        showToast("You've seen all demo reviews! Sign up to create your own.");
        setIsDemoLimit(true);
        setGenerating(false);
        return;
      }
      setTimeout(() => {
        const nextIndex = (demoReviewIndex + 1) % DEMO_REVIEWS.length;
        setDemoReviewIndex(nextIndex);
        setReview(DEMO_REVIEWS[nextIndex]);
        setDemoRegenerateCount(prev => prev + 1);
        setGenerating(false);
      }, 800);
      return;
    }
    
    try {
      const res = await fetch(`/api/generate?id=${id}&regenerate=true`);
      const result = await res.json();
      
      // Handle rate limits (429) - check isPlanLimit for free plan specific messaging
      if (res.status === 429) {
        if (result.isPlanLimit) {
          // Free plan reached their 1 regeneration limit
          showToast("Reached Max Generations for Free plan!");
          setIsFreePlanLimit(true);
          setRateLimitError(result.message || 'Upgrade to Pro for more regenerations!');
        } else {
          // General rate limit (Pro users hitting their limit)
          showToast(result.message || "Rate limit reached. Try again later.");
          setRateLimitError(result.message || 'Too many regenerations. Please try again later.');
        }
        setGenerating(false);
        return;
      }
      
      // Handle 403 as a fallback for other forbidden scenarios
      if (res.status === 403 && result.isPlanLimit) {
        showToast("Reached Max Generations for Free plan!");
        setIsFreePlanLimit(true);
        setRateLimitError(result.message || 'Upgrade to Pro for unlimited regenerations!');
        setGenerating(false);
        return;
      }
      
      if (res.ok) {
        setReview(result.review);
        if (result.reviewEventId) {
          setReviewEventId(result.reviewEventId);
        }
      }
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(review);
    setCopied(true);
    // Track copy (skip for demo) - include reviewEventId for analytics
    if (!isDemo) {
      fetch(`/api/generate?id=${id}&action=copy`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewEventId })
      }).catch(() => {});
    }
    // Keep copied state for 30 seconds so user has time to click a button
    setTimeout(() => setCopied(false), 30000);
  }

  function trackClick(platform: Platform) {
    // Skip tracking for demo - include reviewEventId for analytics
    if (!isDemo && reviewEventId) {
      // Use sendBeacon for reliable tracking even when navigating away
      const url = `/api/generate?id=${id}&action=click&platform=${platform}`
      const data = JSON.stringify({ reviewEventId })
      
      // Try sendBeacon first (most reliable for navigation tracking)
      if (navigator.sendBeacon) {
        const blob = new Blob([data], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      } else {
        // Fallback to fetch with keepalive
        fetch(url, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        }).catch(() => {})
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store not found</h1>
          <p className="text-gray-600">{error || 'This review page doesn\'t exist.'}</p>
        </div>
      </div>
    );
  }

  // Check which platforms are available
  const hasGoogle = !!data.google_url;
  const hasYelp = !!data.yelp_url;
  const hasPlatforms = hasGoogle || hasYelp;

  return (
    <>
      <Head>
        <title>Leave a Review for {data.store_name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Demo Banner */}
          {isDemo && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-sm text-amber-800">
                📱 <strong>Demo Mode</strong> — This is what your customers will see!
              </p>
              <a href="/" className="text-xs text-amber-600 hover:text-amber-700 underline">
                ← Back to homepage
              </a>
            </div>
          )}

          {/* Business Name */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.store_name}</h1>
            <p className="text-lg text-gray-600">
              Thank you for visiting! 🙏
            </p>
          </div>

          {/* Review Card - or Scan Limit Message */}
          {scanLimitReached ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  No AI Generations Left!
                </h2>
                <p className="text-gray-600 mb-4">
                  This business has used all their AI review generations for the month.
                  <br />
                  <span className="text-amber-600 font-medium">Let the owner know so they can upgrade!</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  You can still leave a review using the links below 👇
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">AI-Generated Review</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>
                
                <div className="relative">
                  {generating && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Generating...</span>
                      </div>
                    </div>
                  )}
                  <p className={`text-gray-800 leading-relaxed ${generating ? 'opacity-30' : ''}`}>
                  {review}
                </p>
                </div>
              </div>

              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all ${
                  copied 
                    ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/30' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Review
                  </>
                )}
              </button>

              {!isDemoLimit && !isFreePlanLimit && (
                <>
                  <button
                    onClick={regenerateReview}
                    disabled={generating || !!rateLimitError}
                    className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 transition-colors ${
                      rateLimitError ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    Generate Another
                  </button>
                  {rateLimitError && (
                    <p className="text-center text-sm text-amber-600 mt-2">
                      {rateLimitError}
                    </p>
                  )}
                </>
              )}
              
              {isDemoLimit && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm text-blue-800 mb-2">
                    🎯 You&apos;ve seen how it works!
                  </p>
                  <div className="text-xs text-blue-600 space-y-1">
                    <p><strong>Demo:</strong> 1 regeneration</p>
                    <p><strong>Free plan:</strong> 0 regenerations</p>
                    <p><strong>Pro plan:</strong> Unlimited regenerations</p>
                  </div>
                  <a 
                    href="/login" 
                    className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started Free →
                  </a>
                </div>
              )}
              
              {isFreePlanLimit && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                  <p className="text-sm text-amber-800 mb-1">
                    ✨ Want more review options?
                  </p>
                  <p className="text-xs text-amber-600">
                    Let the owner know they can upgrade for unlimited regenerations!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instruction after copying */}
          {copied && hasPlatforms && (
            <div className="mb-4 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                <ArrowDown className="w-4 h-4 animate-bounce" />
                Now click one of these to paste your review!
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          )}

          {/* Platform Buttons */}
          <div className="space-y-3 mb-8">
            {/* Show message if no review platforms configured */}
            {!hasPlatforms && (
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-600 text-sm">No review platforms configured for this store.</p>
              </div>
            )}

            {hasGoogle && (
              <a
                href={data.google_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(Platform.GOOGLE)}
                className={`flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl border-2 transition-all ${
                  copied 
                    ? 'border-blue-400 shadow-lg shadow-blue-200 animate-bounce-gentle ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className={`font-medium ${copied ? 'text-blue-700' : 'text-gray-700'}`}>
                  Paste on Google Review
                </span>
                <ExternalLink className={`w-4 h-4 ml-auto ${copied ? 'text-blue-400' : 'text-gray-400'}`} />
              </a>
            )}

            {hasYelp && (
              <a
                href={data.yelp_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(Platform.YELP)}
                className={`flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl border-2 transition-all ${
                  copied 
                    ? 'border-red-400 shadow-lg shadow-red-200 animate-bounce-gentle ring-2 ring-red-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-.314-.365-2.447-3.827l-.633-1.032c-.244-.37-.199-.857.104-1.229.297-.37.756-.478 1.158-.274l1.099.534c3.334 1.62 3.463 1.725 3.553 1.846.219.292.247.657.045 1.225zM18.093 9.944c-.318.396-.79.544-1.197.377l-1.143-.478c-3.521-1.478-3.638-1.562-3.749-1.67-.274-.265-.345-.633-.2-1.22.237-.956 2.454-3.334 3.392-3.636.321-.102.626-.055.856.127.148.116.33.351 2.768 3.66l.723.989c.259.35.243.847-.026 1.231-.181.25-.411.502-1.424.62zM9.839 9.633c.307.395.323.888.041 1.253-.28.36-.729.508-1.134.362L7.6 10.78c-3.442-1.617-3.567-1.713-3.671-1.831-.253-.281-.298-.65-.127-1.221.284-.95 2.598-3.241 3.553-3.499.326-.087.629-.022.848.18.142.127.312.387 2.588 3.888l.69 1.05c.108.178.237.293.358.286zM8.473 15.587c.074.403-.091.802-.434 1.012-.263.166-.539.17-.842.013-.141-.073-.321-.234-2.934-3.537l-.797-1.024c-.283-.343-.295-.82-.031-1.212.265-.396.71-.568 1.124-.428l1.14.42c3.455 1.269 3.579 1.345 3.696 1.459.295.265.389.632.297 1.212l-.219 2.085zM13.548 16.46l.186 2.084c.045.512-.15.917-.515 1.075-.271.118-.538.099-.812-.056-.144-.081-.345-.26-3.215-3.327l-.871-.931c-.31-.318-.374-.796-.161-1.208.21-.407.635-.623 1.072-.541l1.193.211c3.631.657 3.77.708 3.9.814.32.258.434.621.35 1.212-.06.48-.127.667-.127.667z" />
                </svg>
                <span className={`font-medium ${copied ? 'text-red-700' : 'text-gray-700'}`}>
                  Paste on Yelp Review
                </span>
                <ExternalLink className={`w-4 h-4 ml-auto ${copied ? 'text-red-400' : 'text-gray-400'}`} />
              </a>
            )}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Powered by <a href="https://quickreviewai.vercel.app" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium hover:text-emerald-700 hover:underline">QuickReviewAI</a>
            </p>
          </div>
        </div>
      </div>
      
      {/* Toast notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
