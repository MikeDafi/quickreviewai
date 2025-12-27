import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Sparkles, Check, ArrowLeft, Loader2, XCircle } from 'lucide-react';

export default function Upgrade() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cancelled = router.query.cancelled === 'true';
  const hasTriggeredCheckout = useRef(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?plan=pro');
    }
  }, [status, router]);

  // Auto-redirect to Stripe checkout when logged in (unless cancelled)
  useEffect(() => {
    if (session && !cancelled && !hasTriggeredCheckout.current) {
      hasTriggeredCheckout.current = true;
      handleUpgrade('pro');
    }
  }, [session, cancelled]);

  const handleUpgrade = async (plan: 'pro' | 'business') => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session) return null;

  // Show loading while auto-redirecting to Stripe
  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to checkout...</h2>
          <p className="text-gray-600">You&apos;ll be redirected to Stripe to complete your payment.</p>
        </div>
      </div>
    );
  }

  const proFeatures = [
    'Unlimited store locations',
    'Unlimited AI reviews',
    'Unlimited QR scans',
    'All review platforms',
    'Priority support',
    'Analytics dashboard',
  ];

  return (
    <>
      <Head>
        <title>Upgrade to Pro - QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">QuickReviewAI</span>
          </Link>

          {/* Cancelled Notice */}
          {cancelled && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium">Checkout cancelled</p>
                <p className="text-amber-700 text-sm">No worries! You can try again when you&apos;re ready.</p>
              </div>
            </div>
          )}

          {/* Upgrade Card */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-600 p-8 sm:p-10 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium">
              Pro Plan
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Upgrade to Pro</h1>
              <p className="text-gray-600">Unlock unlimited potential for your business</p>
            </div>

            <div className="flex items-baseline justify-center gap-1 mb-8">
              <span className="text-5xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-600">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Continue to Payment
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure payment powered by Stripe
            </p>
            <p className="text-center text-xs text-gray-400 mt-2">
              Full refund available within 3 days via Profile page or quickreviewai@gmail.com
            </p>
          </div>

          <div className="text-center mt-6 space-y-2">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <p className="text-xs text-gray-500">
              Questions? Contact us at quickreviewai@gmail.com
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

