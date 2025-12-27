import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Copy, RefreshCw, ExternalLink, Check, Sparkles } from 'lucide-react';

const DEMO_REVIEWS = [
  "Had an amazing experience at Tony's Pizza! The crust was perfectly crispy and the toppings were so fresh. Our server was incredibly friendly and made great recommendations. Will definitely be back with friends and family!",
  "Best pizza in town, hands down! The authentic Italian flavors really shine through. Love the cozy atmosphere and quick service. Already planning my next visit!",
  "Tony's Pizza exceeded all expectations! The wood-fired oven makes such a difference - you can taste the quality in every bite. Great value for the portion sizes too. Highly recommend the margherita!",
  "What a gem! Fresh ingredients, generous portions, and that perfect char on the crust. The staff clearly takes pride in what they do. This is my new go-to pizza spot!",
  "Absolutely delicious! The pizza here is authentic and flavorful. Loved the family-friendly atmosphere and attentive service. Can't wait to try more items on the menu!"
];

const MAX_DEMO_REGENERATIONS = 3;

export default function DemoLandingPage() {
  const [review, setReview] = useState(DEMO_REVIEWS[0]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [regenerationCount, setRegenerationCount] = useState(0);

  function regenerateReview() {
    if (regenerationCount >= MAX_DEMO_REGENERATIONS) return;
    
    setGenerating(true);
    setTimeout(() => {
      const nextIndex = (reviewIndex + 1) % DEMO_REVIEWS.length;
      setReviewIndex(nextIndex);
      setReview(DEMO_REVIEWS[nextIndex]);
      setRegenerationCount(prev => prev + 1);
      setGenerating(false);
    }, 800);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Head>
        <title>Demo - Leave a Review for Tony&apos;s Pizza</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Demo Banner */}
          <div className="bg-amber-100 border border-amber-300 rounded-xl p-3 mb-6 text-center">
            <p className="text-amber-800 text-sm font-medium">
              🎯 Demo Mode - This is what your customers will see!
            </p>
          </div>

          {/* Business Name */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tony&apos;s Pizza</h1>
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
              
              <p className="text-gray-800 leading-relaxed">
                {review}
              </p>
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

            <button
              onClick={regenerateReview}
              disabled={generating}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              Generate Another
            </button>
          </div>

          {/* Platform Buttons */}
          <div className="space-y-3 mb-8">
            <a
              href="https://g.page/r/CYbhqyxqIqguEBM/review"
              target="_blank"
              rel="noopener noreferrer"
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

            <a
              href="https://www.yelp.com/writeareview/biz/dx3-uI6A5bIXptySpOSaZg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-.314-.365-2.447-3.827l-.633-1.032c-.244-.37-.199-.857.104-1.229.297-.37.756-.478 1.158-.274l1.099.534c3.334 1.62 3.463 1.725 3.553 1.846.219.292.247.657.045 1.225zM18.093 9.944c-.318.396-.79.544-1.197.377l-1.143-.478c-3.521-1.478-3.638-1.562-3.749-1.67-.274-.265-.345-.633-.2-1.22.237-.956 2.454-3.334 3.392-3.636.321-.102.626-.055.856.127.148.116.33.351 2.768 3.66l.723.989c.259.35.243.847-.026 1.231-.181.25-.411.502-1.424.62zM9.839 9.633c.307.395.323.888.041 1.253-.28.36-.729.508-1.134.362L7.6 10.78c-3.442-1.617-3.567-1.713-3.671-1.831-.253-.281-.298-.65-.127-1.221.284-.95 2.598-3.241 3.553-3.499.326-.087.629-.022.848.18.142.127.312.387 2.588 3.888l.69 1.05c.108.178.237.293.358.286zM8.473 15.587c.074.403-.091.802-.434 1.012-.263.166-.539.17-.842.013-.141-.073-.321-.234-2.934-3.537l-.797-1.024c-.283-.343-.295-.82-.031-1.212.265-.396.71-.568 1.124-.428l1.14.42c3.455 1.269 3.579 1.345 3.696 1.459.295.265.389.632.297 1.212l-.219 2.085zM13.548 16.46l.186 2.084c.045.512-.15.917-.515 1.075-.271.118-.538.099-.812-.056-.144-.081-.345-.26-3.215-3.327l-.871-.931c-.31-.318-.374-.796-.161-1.208.21-.407.635-.623 1.072-.541l1.193.211c3.631.657 3.77.708 3.9.814.32.258.434.621.35 1.212-.06.48-.127.667-.127.667z" />
              </svg>
              <span className="text-gray-700 font-medium">Post on Yelp</span>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
            </a>
          </div>

          {/* CTA to Sign Up */}
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Want this for your business?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your own QR code and start collecting 5-star reviews today.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all"
            >
              Get Started Free
            </Link>
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

