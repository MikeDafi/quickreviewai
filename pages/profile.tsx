import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  User, 
  CreditCard, 
  Mail, 
  Calendar, 
  Crown, 
  ArrowLeft, 
  ExternalLink,
  Sparkles,
  LogOut,
  Store,
  QrCode,
  Copy,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface UserStats {
  totalScans: number;
  reviewsCopied: number;
  storeCount: number;
  tier: string;
  scanLimit: number;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, fetchStats]);

  async function handleManageBilling() {
    setBillingLoading(true);
    setBillingError('');
    
    try {
      const res = await fetch('/api/create-portal-session', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        setBillingError(data.message || 'Unable to open billing portal');
        return;
      }
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Billing portal error:', error);
      setBillingError('Something went wrong. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const tierColors = {
    free: 'bg-gray-100 text-gray-700',
    pro: 'bg-emerald-100 text-emerald-700',
    business: 'bg-purple-100 text-purple-700',
  };

  const tierBadgeColor = tierColors[stats?.tier as keyof typeof tierColors] || tierColors.free;

  return (
    <>
      <Head>
        <title>Profile - QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuickReviewAI</span>
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>
          
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  Profile
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Profile'} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-emerald-700" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {session.user?.name || 'User'}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Mail className="w-4 h-4" />
                      <span>{session.user?.email}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${tierBadgeColor}`}>
                      <Crown className="w-4 h-4" />
                      {stats?.tier?.charAt(0).toUpperCase()}{stats?.tier?.slice(1) || 'Free'} Plan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-gray-500" />
                  Usage This Month
                </h2>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Store className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats?.storeCount || 0}</div>
                    <div className="text-sm text-gray-600">
                      {stats?.tier === 'free' ? 'Store (1 max)' : 'Stores'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <QrCode className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.totalScans || 0}
                      {stats?.tier === 'free' && <span className="text-lg text-gray-400">/{stats?.scanLimit || 15}</span>}
                    </div>
                    <div className="text-sm text-gray-600">QR Scans</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Copy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats?.reviewsCopied || 0}</div>
                    <div className="text-sm text-gray-600">Reviews Copied</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  Billing
                </h2>
              </div>
              <div className="p-6">
                {stats?.tier === 'free' ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      You&apos;re on the Free Plan
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Upgrade to Pro for unlimited stores, unlimited scans, and priority support.
                    </p>
                    <Link
                      href="/upgrade"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <Crown className="w-5 h-5" />
                      Upgrade to Pro
                    </Link>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-gray-900 font-medium">Current Plan</p>
                        <p className="text-sm text-gray-600">
                          {stats?.tier === 'pro' ? 'Pro' : 'Business'} - Billed monthly
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    </div>
                    
                    {billingError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{billingError}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleManageBilling}
                      disabled={billingLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {billingLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Manage Billing
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Account</h2>
              </div>
              <div className="p-6">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

