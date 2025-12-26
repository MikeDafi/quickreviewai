import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { FiPlus, FiTrash2, FiEdit2, FiCopy, FiExternalLink, FiBarChart2, FiLogOut } from 'react-icons/fi'

interface Store {
  id: string
  name: string
  business_type: string
  keywords: string[]
  tone: string
  google_url: string
  yelp_url: string
  landing_page_count: number
}

interface LandingPage {
  id: string
  view_count: number
  copy_count: number
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState<string | null>(null)
  const [editingStore, setEditingStore] = useState<Store | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    keywords: '',
    tone: 'friendly',
    promptGuidance: '',
    googleUrl: '',
    yelpUrl: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchStores()
    }
  }, [session])

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores')
      if (res.ok) {
        const data = await res.json()
        setStores(data.stores || [])
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setFormData({ name: '', businessType: '', keywords: '', tone: 'friendly', promptGuidance: '', googleUrl: '', yelpUrl: '' })
        fetchStores()
      }
    } catch (error) {
      console.error('Failed to create store:', error)
    }
  }

  async function handleUpdateStore(e: React.FormEvent) {
    e.preventDefault()
    if (!editingStore) return
    try {
      const res = await fetch(`/api/stores?id=${editingStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      })
      if (res.ok) {
        setEditingStore(null)
        setFormData({ name: '', businessType: '', keywords: '', tone: 'friendly', promptGuidance: '', googleUrl: '', yelpUrl: '' })
        fetchStores()
      }
    } catch (error) {
      console.error('Failed to update store:', error)
    }
  }

  async function handleDeleteStore(storeId: string) {
    if (!confirm('Are you sure you want to delete this store?')) return
    try {
      const res = await fetch(`/api/stores?id=${storeId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchStores()
      }
    } catch (error) {
      console.error('Failed to delete store:', error)
    }
  }

  function openEditModal(store: Store) {
    setEditingStore(store)
    setFormData({
      name: store.name,
      businessType: store.business_type || '',
      keywords: store.keywords?.join(', ') || '',
      tone: store.tone || 'friendly',
      promptGuidance: '',
      googleUrl: store.google_url || '',
      yelpUrl: store.yelp_url || '',
    })
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!session) return null

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <>
      <Head>
        <title>Dashboard - QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-base-200">
        {/* Navbar */}
        <div className="navbar bg-base-100 shadow-sm">
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl font-bold">
              QuickReview<span className="text-primary">AI</span>
            </Link>
          </div>
          <div className="flex-none gap-2">
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-10">
                  <span>{session.user?.name?.[0] || session.user?.email?.[0] || '?'}</span>
                </div>
              </label>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li className="menu-title px-4 py-2">
                  <span className="text-xs text-base-content/70">{session.user?.email}</span>
                </li>
                <li><button onClick={() => signOut({ callbackUrl: '/' })}><FiLogOut /> Sign Out</button></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Stats */}
          <div className="stats shadow mb-8 w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <FiBarChart2 className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Stores</div>
              <div className="stat-value text-primary">{stores.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Total Landing Pages</div>
              <div className="stat-value">{stores.reduce((acc, s) => acc + (s.landing_page_count || 0), 0)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Plan</div>
              <div className="stat-value text-secondary">Free</div>
              <div className="stat-desc">
                <Link href="#" className="link link-primary">Upgrade</Link>
              </div>
            </div>
          </div>

          {/* Stores Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Your Stores</h1>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <FiPlus className="w-4 h-4" /> Add Store
            </button>
          </div>

          {/* Stores Grid */}
          {stores.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-16">
                <h3 className="text-xl font-semibold mb-2">No stores yet</h3>
                <p className="text-base-content/70 mb-4">Create your first store to start generating review pages</p>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <FiPlus className="w-4 h-4" /> Create Store
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div key={store.id} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title">{store.name}</h2>
                    {store.business_type && (
                      <p className="text-sm text-base-content/70">{store.business_type}</p>
                    )}
                    {store.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {store.keywords.slice(0, 3).map((kw, i) => (
                          <span key={i} className="badge badge-outline badge-sm">{kw}</span>
                        ))}
                        {store.keywords.length > 3 && (
                          <span className="badge badge-ghost badge-sm">+{store.keywords.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {store.google_url && <span className="badge badge-primary badge-sm">Google</span>}
                      {store.yelp_url && <span className="badge badge-error badge-sm">Yelp</span>}
                    </div>
                    <div className="card-actions justify-end mt-4">
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowQRModal(store.id)}>
                        QR Code
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(store)}>
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDeleteStore(store.id)}>
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Store Modal */}
        <dialog className={`modal ${showCreateModal ? 'modal-open' : ''}`}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Store</h3>
            <form onSubmit={handleCreateStore}>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Store Name *</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Business Type</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g., Restaurant, Salon, Auto Shop"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Keywords (comma-separated)</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g., friendly staff, great food, clean"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Tone</span></label>
                <select
                  className="select select-bordered"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Google Review URL</span></label>
                <input
                  type="url"
                  className="input input-bordered"
                  placeholder="https://g.page/..."
                  value={formData.googleUrl}
                  onChange={(e) => setFormData({ ...formData, googleUrl: e.target.value })}
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Yelp URL</span></label>
                <input
                  type="url"
                  className="input input-bordered"
                  placeholder="https://yelp.com/biz/..."
                  value={formData.yelpUrl}
                  onChange={(e) => setFormData({ ...formData, yelpUrl: e.target.value })}
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Store</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowCreateModal(false)}>close</button>
          </form>
        </dialog>

        {/* Edit Store Modal */}
        <dialog className={`modal ${editingStore ? 'modal-open' : ''}`}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit Store</h3>
            <form onSubmit={handleUpdateStore}>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Store Name *</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Business Type</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Keywords (comma-separated)</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Tone</span></label>
                <select
                  className="select select-bordered"
                  value={formData.tone}
                  onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Google Review URL</span></label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={formData.googleUrl}
                  onChange={(e) => setFormData({ ...formData, googleUrl: e.target.value })}
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Yelp URL</span></label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={formData.yelpUrl}
                  onChange={(e) => setFormData({ ...formData, yelpUrl: e.target.value })}
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setEditingStore(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setEditingStore(null)}>close</button>
          </form>
        </dialog>

        {/* QR Code Modal */}
        <dialog className={`modal ${showQRModal ? 'modal-open' : ''}`}>
          <div className="modal-box text-center">
            <h3 className="font-bold text-lg mb-4">QR Code</h3>
            {showQRModal && (
              <>
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={`${baseUrl}/r/${showQRModal}`} size={200} />
                </div>
                <p className="text-sm text-base-content/70 mb-4">
                  Scan to open the review page
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    value={`${baseUrl}/r/${showQRModal}`}
                    readOnly
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => copyToClipboard(`${baseUrl}/r/${showQRModal}`)}
                  >
                    <FiCopy />
                  </button>
                  <a
                    href={`${baseUrl}/r/${showQRModal}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-ghost"
                  >
                    <FiExternalLink />
                  </a>
                </div>
              </>
            )}
            <div className="modal-action justify-center">
              <button className="btn" onClick={() => setShowQRModal(null)}>Close</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowQRModal(null)}>close</button>
          </form>
        </dialog>
      </div>
    </>
  )
}

