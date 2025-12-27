import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { QrCode, Copy, Zap, Plus, User, LogOut, Sparkles, Store as StoreIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Store } from '@/lib/types';
import StoreCard from '@/components/StoreCard';
import AddStoreModal from '@/components/AddStoreModal';
import QRCodeModal from '@/components/QRCodeModal';
import { SubscriptionTier, PLAN_LIMITS, getPlanLimits } from '@/lib/constants';

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [qrCodeStore, setQrCodeStore] = useState<Store | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [stats, setStats] = useState({ totalScans: 0, reviewsCopied: 0, storeCount: 0, tier: SubscriptionTier.FREE as string });
  
  // Loading states for mutations
  const [savingStore, setSavingStore] = useState(false);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

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
    }
  }, []);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        // Map DB fields to component fields
        const mappedStores = (data.stores || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          name: s.name,
          address: s.address || '',
          businessType: s.business_type || '',
          keywords: s.keywords || [],
          reviewExpectations: s.review_expectations || [],
          googleUrl: s.google_url,
          yelpUrl: s.yelp_url,
          landing_page_count: s.landing_page_count,
          landing_page_id: s.landing_page_id,
          viewCount: s.view_count || 0,
          copyCount: s.copy_count || 0,
          blockedRegenerations: s.blocked_regenerations || 0,
        }));
        setStores(mappedStores);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchStores();
      fetchStats();
    }
  }, [session, fetchStores, fetchStats]);

  async function handleAddStore(store: Omit<Store, 'id'>) {
    if (savingStore) return; // Prevent double-clicks
    setSavingStore(true);
    
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        showToast(data.error || 'Failed to create store', 'error');
        return;
      }
      
      setIsAddModalOpen(false);
      showToast('Store created successfully!', 'success');
      await fetchStores();
      
      // Automatically show QR code modal after creating a store
      if (data.store) {
        const newStore: Store = {
          id: data.store.id,
          name: data.store.name,
          address: data.store.address || '',
          businessType: data.store.business_type || '',
          keywords: data.store.keywords || [],
          reviewExpectations: data.store.review_expectations || [],
          googleUrl: data.store.google_url,
          yelpUrl: data.store.yelp_url,
          landing_page_id: data.store.landing_page_id,
        };
        setQrCodeStore(newStore);
      }
    } catch (error) {
      console.error('Failed to create store:', error);
      showToast('Failed to create store. Please try again.', 'error');
    } finally {
      setSavingStore(false);
    }
  }

  async function handleEditStore(store: Store) {
    if (savingStore) return; // Prevent double-clicks
    setSavingStore(true);
    
    try {
      const res = await fetch(`/api/stores?id=${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });
      
      if (res.ok) {
        setEditingStore(null);
        showToast('Store updated successfully!', 'success');
        fetchStores();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update store', 'error');
      }
    } catch (error) {
      console.error('Failed to update store:', error);
      showToast('Failed to update store. Please try again.', 'error');
    } finally {
      setSavingStore(false);
    }
  }

  async function handleDeleteStore(id: string) {
    if (deletingStoreId) return; // Prevent double-clicks
    if (!confirm('Are you sure you want to delete this store?')) return;
    
    setDeletingStoreId(id);
    
    try {
      const res = await fetch(`/api/stores?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Store deleted', 'success');
        fetchStores();
      } else {
        showToast('Failed to delete store', 'error');
      }
    } catch (error) {
      console.error('Failed to delete store:', error);
      showToast('Failed to delete store. Please try again.', 'error');
    } finally {
      setDeletingStoreId(null);
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

  return (
    <>
      <Head>
        <title>Dashboard - QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuickReviewAI</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:ring-2 hover:ring-emerald-200 transition-all overflow-hidden"
              >
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'Profile'} 
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-700" />
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    {session.user?.image && (
                      <img 
                        src={session.user.image} 
                        alt="" 
                        className="w-8 h-8 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <User className="w-4 h-4" />
                    Account Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">QR Code Scans</span>
                <QrCode className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalScans}
                {stats.tier === SubscriptionTier.FREE && <span className="text-lg text-gray-400">/{getPlanLimits(SubscriptionTier.FREE).scansPerMonth}</span>}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {stats.tier === SubscriptionTier.FREE ? 'This month' : 'Total views'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Reviews Copied</span>
                <Copy className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.reviewsCopied}</div>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Current Plan</span>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 capitalize">{stats.tier}</div>
              {stats.tier === SubscriptionTier.FREE && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">
                    {stores.length}/{getPlanLimits(SubscriptionTier.FREE).stores} store • {getPlanLimits(SubscriptionTier.FREE).scansPerMonth} QR scans/mo
                  </p>
                  <Link 
                    href="/upgrade" 
                    className="inline-block px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Upgrade to Pro →
                  </Link>
                </div>
              )}
              {stats.tier === SubscriptionTier.PRO && (
                <p className="text-sm text-gray-500 mt-1">Unlimited stores, reviews & scans</p>
              )}
            </div>
          </div>

          {/* Pro Features Callout - Only for free users */}
          {stats.tier === SubscriptionTier.FREE && (
            <div className="mb-8 bg-gradient-to-r from-purple-50 via-white to-emerald-50 border border-purple-100 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Unlock the Full Power of QuickReviewAI</h3>
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Review Guidance</p>
                        <p className="text-xs text-gray-600">
                          Tell the AI exactly what to highlight in every review.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Unlimited Scans</p>
                        <p className="text-xs text-gray-600">
                          No monthly scan limits for your customers.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Copy className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Unlimited Regenerations</p>
                        <p className="text-xs text-gray-600">
                          Not limited to 1 review per user. Generate fresh reviews anytime.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/upgrade"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-emerald-700 transition-all shadow-sm"
                  >
                    Upgrade to Pro
                    <span className="text-purple-200">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stores Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Stores</h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Store
            </button>
          </div>

          {/* Stores Grid */}
          {stores.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <StoreIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No stores yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first store location</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Your First Store
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {stores.map(store => (
                <StoreCard
                  key={store.id}
                  store={store}
                  tier={stats.tier as SubscriptionTier}
                  onEdit={setEditingStore}
                  onDelete={handleDeleteStore}
                  onShowQR={setQrCodeStore}
                  onShowAnalytics={(s) => router.push(`/analytics/${s.id}`)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Modals */}
        {isAddModalOpen && (
          <AddStoreModal
            tier={stats.tier as SubscriptionTier}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddStore}
          />
        )}

        {editingStore && (
          <AddStoreModal
            store={editingStore}
            tier={stats.tier as SubscriptionTier}
            onClose={() => setEditingStore(null)}
            onSave={(store) => handleEditStore(store as Store)}
          />
        )}

        {qrCodeStore && (
          <QRCodeModal
            store={qrCodeStore}
            onClose={() => setQrCodeStore(null)}
          />
        )}

        {/* Toast notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </>
  );
}
