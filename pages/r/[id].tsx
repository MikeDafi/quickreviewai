import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Copy, RefreshCw, ExternalLink, Check, Clipboard } from 'lucide-react';

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
  "Had an amazing experience at Tony's Pizza! The crust was perfectly crispy and the toppings were so fresh. The staff was incredibly friendly and made sure we had everything we needed. Will definitely be coming back with friends and family!",
  "Tony's Pizza never disappoints! The authentic flavors remind me of the pizzerias I visited in Italy. Generous portions, fair prices, and the cozy atmosphere makes it perfect for a family dinner. Highly recommend the pepperoni special!",
  "Best pizza in town, hands down! The quality of ingredients really shines through in every bite. Fast service even during the busy dinner rush. Tony's has become our go-to spot for pizza night. Five stars well deserved!",
];

export default function LandingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<LandingData | null>(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoCopied, setAutoCopied] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState('');
  const [isFreePlanLimit, setIsFreePlanLimit] = useState(false);
  const [isDemoLimit, setIsDemoLimit] = useState(false);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [demoReviewIndex, setDemoReviewIndex] = useState(0);
  const [demoRegenerateCount, setDemoRegenerateCount] = useState(0);
  const hasAutoCopied = useRef(false);

  const isDemo = id === 'demo';

  // Auto-copy function that shows a notification
  const autoCopyToClipboard = useCallback(async (text: string, trackCopy: boolean = true) => {
    try {
      await navigator.clipboard.writeText(text);
      setAutoCopied(true);
      
      // Track copy for analytics (skip for demo)
      if (trackCopy && !isDemo && id) {
        fetch(`/api/generate?id=${id}&action=copy`, { method: 'POST' }).catch(() => {});
      }
      
      // Hide notification after 3 seconds
      setTimeout(() => setAutoCopied(false), 3000);
      return true;
    } catch (err) {
      // Auto-copy may fail if page isn't focused or clipboard API isn't available
      console.log('Auto-copy not available, user can copy manually');
      return false;
    }
  }, [id, isDemo]);

  useEffect(() => {
    if (id) {
      if (isDemo) {
        // Use demo data
        setData(DEMO_DATA);
        setReview(DEMO_REVIEWS[0]);
        setLoading(false);
        // Auto-copy demo review
        if (!hasAutoCopied.current) {
          hasAutoCopied.current = true;
          setTimeout(() => autoCopyToClipboard(DEMO_REVIEWS[0], false), 500);
        }
      } else {
        fetchLandingPage();
      }
    }
  }, [id, isDemo, autoCopyToClipboard]);

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
      
      // Auto-copy the review to clipboard
      if (result.review && !hasAutoCopied.current) {
        hasAutoCopied.current = true;
        // Small delay to ensure DOM is ready
        setTimeout(() => autoCopyToClipboard(result.review), 500);
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
    
    // Handle demo case - allow only 1 regeneration
    if (isDemo) {
      if (demoRegenerateCount >= 1) {
        setIsDemoLimit(true);
        setGenerating(false);
        return;
      }
      setTimeout(async () => {
        const nextIndex = (demoReviewIndex + 1) % DEMO_REVIEWS.length;
        setDemoReviewIndex(nextIndex);
        setReview(DEMO_REVIEWS[nextIndex]);
        setDemoRegenerateCount(prev => prev + 1);
        setGenerating(false);
        // Auto-copy the new demo review
        await autoCopyToClipboard(DEMO_REVIEWS[nextIndex], false);
      }, 800);
      return;
    }
    
    try {
      const res = await fetch(`/api/generate?id=${id}&regenerate=true`);
      const result = await res.json();
      
      if (res.status === 403 && result.isPlanLimit) {
        setIsFreePlanLimit(true);
        setRateLimitError(result.message || 'Upgrade to Pro for unlimited regenerations!');
        return;
      }
      
      if (res.status === 429) {
        setRateLimitError(result.message || 'Too many regenerations. Please try again later.');
        return;
      }
      
      if (res.ok) {
        setReview(result.review);
        // Auto-copy the newly generated review
        await autoCopyToClipboard(result.review);
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
    // Track copy (skip for demo)
    if (!isDemo) {
    fetch(`/api/generate?id=${id}&action=copy`, { method: 'POST' }).catch(() => {});
    }
    setTimeout(() => setCopied(false), 2000);
  }

  async function trackClick(platform: string) {
    // Skip tracking for demo
    if (!isDemo) {
    fetch(`/api/generate?id=${id}&action=click&platform=${platform}`, { method: 'POST' }).catch(() => {});
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

  return (
    <>
      <Head>
        <title>Leave a Review for {data.store_name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4 py-8">
        {/* Auto-copied toast notification */}
        <div 
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
            autoCopied ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/30">
            <Clipboard className="w-4 h-4" />
            <span className="text-sm font-medium">Review copied to clipboard!</span>
          </div>
        </div>

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

          {/* Review Card */}
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
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40"
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

            {!isFreePlanLimit && !isDemoLimit && (
            <button
              onClick={regenerateReview}
              disabled={generating || !!rateLimitError}
              className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 transition-colors ${
                rateLimitError ? 'text-red-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              Generate Another
            </button>
            )}
            
            {rateLimitError && !isFreePlanLimit && (
              <p className="text-center text-sm text-red-500 mt-2">
                {rateLimitError}
              </p>
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
                  This store is on the Free plan. Pro users get unlimited regenerations!
                </p>
              </div>
            )}
          </div>

          {/* Platform Buttons */}
          <div className="space-y-3 mb-8">
            {data.google_url && (
              <a
                href={data.google_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('google')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
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
                <span className="text-gray-700 font-medium">Post on Google</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}

            {data.yelp_url && (
              <a
                href={data.yelp_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('yelp')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-.314-.365-2.447-3.827l-.633-1.032c-.244-.37-.199-.857.104-1.229.297-.37.756-.478 1.158-.274l1.099.534c3.334 1.62 3.463 1.725 3.553 1.846.219.292.247.657.045 1.225zM18.093 9.944c-.318.396-.79.544-1.197.377l-1.143-.478c-3.521-1.478-3.638-1.562-3.749-1.67-.274-.265-.345-.633-.2-1.22.237-.956 2.454-3.334 3.392-3.636.321-.102.626-.055.856.127.148.116.33.351 2.768 3.66l.723.989c.259.35.243.847-.026 1.231-.181.25-.411.502-1.424.62zM9.839 9.633c.307.395.323.888.041 1.253-.28.36-.729.508-1.134.362L7.6 10.78c-3.442-1.617-3.567-1.713-3.671-1.831-.253-.281-.298-.65-.127-1.221.284-.95 2.598-3.241 3.553-3.499.326-.087.629-.022.848.18.142.127.312.387 2.588 3.888l.69 1.05c.108.178.237.293.358.286zM8.473 15.587c.074.403-.091.802-.434 1.012-.263.166-.539.17-.842.013-.141-.073-.321-.234-2.934-3.537l-.797-1.024c-.283-.343-.295-.82-.031-1.212.265-.396.71-.568 1.124-.428l1.14.42c3.455 1.269 3.579 1.345 3.696 1.459.295.265.389.632.297 1.212l-.219 2.085zM13.548 16.46l.186 2.084c.045.512-.15.917-.515 1.075-.271.118-.538.099-.812-.056-.144-.081-.345-.26-3.215-3.327l-.871-.931c-.31-.318-.374-.796-.161-1.208.21-.407.635-.623 1.072-.541l1.193.211c3.631.657 3.77.708 3.9.814.32.258.434.621.35 1.212-.06.48-.127.667-.127.667z" />
                </svg>
                <span className="text-gray-700 font-medium">Post on Yelp</span>
                <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
              </a>
            )}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Powered by <span className="text-emerald-600 font-medium">QuickReviewAI</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
