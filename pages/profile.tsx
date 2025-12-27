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
  AlertCircle,
  CheckCircle,
  Trash2,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { SubscriptionTier } from '@/lib/constants';

interface SubscriptionInfo {
  tier: string;
  hasSubscription: boolean;
  wasEverSubscribed: boolean;
  subscriptionStartedAt?: string;
  firstSubscribedAt?: string;
  memberSinceDays?: number;
  eligibleForRefund?: boolean;
  refundDeadline?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
  accountCreatedAt: string;
}

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchSubscription();
    }
  }, [session, fetchSubscription]);

  async function handleManageBilling() {
    setBillingLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/create-portal-session', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Unable to open billing portal');
        return;
      }
      
      window.location.href = data.url;
    } catch (err) {
      console.error('Billing portal error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleCancelSubscription(immediate: boolean, requestRefund: boolean) {
    setCancelLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate, requestRefund }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Failed to cancel subscription');
        return;
      }
      
      setShowCancelModal(false);
      // Refresh subscription info
      fetchSubscription();
    } catch (err) {
      console.error('Cancel error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmEmail !== session?.user?.email) {
      setError('Email does not match');
      return;
    }
    
    setDeleteLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: deleteConfirmEmail }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Failed to delete account');
        return;
      }
      
      // Sign out and redirect to home
      signOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Delete error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setDeleteLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const tierColors: Record<SubscriptionTier, string> = {
    [SubscriptionTier.FREE]: 'bg-gray-100 text-gray-700',
    [SubscriptionTier.PRO]: 'bg-emerald-100 text-emerald-700',
  };

  const tierBadgeColor = tierColors[(subscription?.tier || SubscriptionTier.FREE) as SubscriptionTier];

  return (
    <>
      <Head>
        <title>Account Settings - QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">QuickReviewAI</span>
              </Link>
              
              {/* Pricing button for free users */}
              {subscription?.tier === SubscriptionTier.FREE && (
                <Link
                  href="/upgrade"
                  className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Pricing
                </Link>
              )}
              
              {/* Tier badge */}
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                subscription?.tier === SubscriptionTier.PRO 
                  ? 'bg-amber-400 text-amber-900' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {subscription?.tier === SubscriptionTier.PRO ? 'Pro' : 'Free'}
              </span>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          )}
          
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
                      {subscription?.tier?.charAt(0).toUpperCase()}{subscription?.tier?.slice(1) || 'Free'} Plan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Section - Only show if user has or had a subscription */}
            {(subscription?.hasSubscription || subscription?.wasEverSubscribed) && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    Billing
                  </h2>
                </div>
                <div className="p-6">
                  {subscription?.tier === SubscriptionTier.FREE ? (
                    // User was subscribed before but now on free tier
                    <div className="space-y-4">
                      {subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd ? (
                        // Subscription cancelled but still active until period end
                        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-800">Pro access until {formatDate(subscription.currentPeriodEnd)}</p>
                            <p className="text-sm text-amber-700 mt-1">
                              Your subscription has been cancelled and will expire on this date.
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Subscription fully expired
                        <div className="text-center py-4">
                          <p className="text-gray-600 mb-4">
                            Your Pro subscription has ended. Resubscribe to regain unlimited access.
                          </p>
                          <Link
                            href="/upgrade"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                          >
                            <Crown className="w-5 h-5" />
                            Resubscribe to Pro
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Active Pro subscription
                    <div className="space-y-6">
                      {/* Subscription Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray-900 font-medium">
                            Pro Plan
                          </p>
                          {subscription?.cancelAtPeriodEnd ? (
                            <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-4 h-4" />
                              Cancels on {subscription?.currentPeriodEnd && formatDate(subscription.currentPeriodEnd)}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600">Billed monthly</p>
                          )}
                        </div>
                        {!subscription?.cancelAtPeriodEnd && (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Active</span>
                          </div>
                        )}
                      </div>

                      {/* Member Since */}
                      {subscription?.subscriptionStartedAt && (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Member since</p>
                            <p className="font-medium text-gray-900">
                              {formatDate(subscription.subscriptionStartedAt)}
                              {subscription.memberSinceDays !== undefined && (
                                <span className="text-gray-500 font-normal ml-2">
                                  ({subscription.memberSinceDays} days)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Next Billing Date */}
                      {subscription?.currentPeriodEnd && !subscription?.cancelAtPeriodEnd && (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                          <Clock className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-600">Next billing date</p>
                            <p className="font-medium text-gray-900">
                              {formatDate(subscription.currentPeriodEnd)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Refund Eligibility Notice */}
                      {subscription?.eligibleForRefund && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>3-day refund available!</strong> As a first-time subscriber, you can get a full refund until{' '}
                            {subscription.refundDeadline && formatDate(subscription.refundDeadline)}.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={handleManageBilling}
                          disabled={billingLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {billingLoading ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                          Manage Payment Method
                        </button>
                        
                        {!subscription?.cancelAtPeriodEnd && (
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Subscription
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Account</h2>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Cancel Subscription</h3>
              
              {subscription?.eligibleForRefund ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    You&apos;re eligible for a full refund since this is your first subscription and it&apos;s within 3 days.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleCancelSubscription(true, true)}
                      disabled={cancelLoading}
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {cancelLoading ? 'Processing...' : 'Cancel & Get Full Refund'}
                    </button>
                    <button
                      onClick={() => handleCancelSubscription(false, false)}
                      disabled={cancelLoading}
                      className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel at Period End (No Refund)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Your subscription will remain active until the end of your current billing period
                    {subscription?.currentPeriodEnd && ` (${formatDate(subscription.currentPeriodEnd)})`}.
                  </p>
                  <button
                    onClick={() => handleCancelSubscription(false, false)}
                    disabled={cancelLoading}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full mt-3 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Keep My Subscription
              </button>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Delete Account</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  This will permanently delete your account, all stores, and all data. 
                  {subscription?.hasSubscription && ' Your subscription will also be cancelled.'}
                </p>
                <p className="text-gray-600">
                  <strong>This action cannot be undone.</strong>
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type your email to confirm
                  </label>
                  <input
                    type="email"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={session.user?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteConfirmEmail !== session.user?.email}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail('');
                }}
                className="w-full mt-3 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
