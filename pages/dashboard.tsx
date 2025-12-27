import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { QrCode, Copy, Zap, Plus, User, LogOut, Sparkles, Store as StoreIcon } from 'lucide-react';
import { Store } from '@/lib/types';
import StoreCard from '@/components/StoreCard';
import AddStoreModal from '@/components/AddStoreModal';
import QRCodeModal from '@/components/QRCodeModal';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [qrCodeStore, setQrCodeStore] = useState<Store | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [stats, setStats] = useState({ totalScans: 0, reviewsCopied: 0, tier: 'free', reviewLimit: 50 });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchStores();
      fetchStats();
    }
  }, [session]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        // Map DB fields to component fields
        const mappedStores = (data.stores || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          name: s.name,
          businessType: s.business_type || '',
          keywords: s.keywords || [],
          reviewExpectations: s.review_expectations || [],
          googleUrl: s.google_url,
          yelpUrl: s.yelp_url,
          landing_page_count: s.landing_page_count,
        }));
        setStores(mappedStores);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStore(store: Omit<Store, 'id'>) {
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchStores();
      }
    } catch (error) {
      console.error('Failed to create store:', error);
    }
  }

  async function handleEditStore(store: Store) {
    try {
      const res = await fetch(`/api/stores?id=${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });
      if (res.ok) {
        setEditingStore(null);
        fetchStores();
      }
    } catch (error) {
      console.error('Failed to update store:', error);
    }
  }

  async function handleDeleteStore(id: string) {
    if (!confirm('Are you sure you want to delete this store?')) return;
    try {
      const res = await fetch(`/api/stores?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStores();
      }
    } catch (error) {
      console.error('Failed to delete store:', error);
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
              <div className="text-3xl font-bold text-gray-900">{stats.totalScans.toLocaleString()}</div>
              <p className="text-sm text-gray-500 mt-1">Total landing page views</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Reviews Copied</span>
                <Copy className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.reviewsCopied.toLocaleString()}</div>
              <p className="text-sm text-gray-500 mt-1">AI reviews used by customers</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Plan Usage</span>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.tier === 'free' ? (
                  <span>{stats.reviewsCopied}<span className="text-lg text-gray-400">/{stats.reviewLimit}</span></span>
                ) : (
                  <span className="capitalize">{stats.tier}</span>
                )}
              </div>
              {stats.tier === 'free' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.reviewsCopied / stats.reviewLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <button className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 font-medium">
                    Upgrade for unlimited
                  </button>
                </div>
              )}
            </div>
          </div>

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map(store => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onEdit={setEditingStore}
                  onDelete={handleDeleteStore}
                  onShowQR={setQrCodeStore}
                />
              ))}
            </div>
          )}
        </main>

        {/* Modals */}
        {isAddModalOpen && (
          <AddStoreModal
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddStore}
          />
        )}

        {editingStore && (
          <AddStoreModal
            store={editingStore}
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
      </div>
    </>
  );
}
