import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { FiCopy, FiCheck, FiRefreshCw, FiExternalLink } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { SiYelp } from 'react-icons/si'

interface LandingData {
  id: string
  store_name: string
  business_type: string
  google_url: string
  yelp_url: string
  cached_review: string
}

export default function ReviewLanding() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState<LandingData | null>(null)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchLandingPage()
    }
  }, [id])

  async function fetchLandingPage() {
    try {
      const res = await fetch(`/api/generate?id=${id}`)
      if (!res.ok) {
        setError('Landing page not found')
        setLoading(false)
        return
      }
      const result = await res.json()
      setData(result.landing)
      setReview(result.review)
    } catch (err) {
      setError('Failed to load landing page')
    } finally {
      setLoading(false)
    }
  }

  async function regenerateReview() {
    if (!id) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/generate?id=${id}&regenerate=true`)
      if (res.ok) {
        const result = await res.json()
        setReview(result.review)
      }
    } catch (err) {
      console.error('Failed to regenerate:', err)
    } finally {
      setGenerating(false)
    }
  }

  async function copyReview() {
    await navigator.clipboard.writeText(review)
    setCopied(true)
    // Track copy
    fetch(`/api/generate?id=${id}&action=copy`, { method: 'POST' }).catch(() => {})
    setTimeout(() => setCopied(false), 2000)
  }

  async function trackClick(platform: string) {
    fetch(`/api/generate?id=${id}&action=click&platform=${platform}`, { method: 'POST' }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-base-content/70">{error || 'This review page does not exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Leave a Review for {data.store_name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-base-200 flex flex-col">
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-4">
          <h1 className="text-2xl font-bold">{data.store_name}</h1>
          {data.business_type && (
            <p className="text-base-content/70">{data.business_type}</p>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md">
            {/* Thank You Message */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🙏</div>
              <h2 className="text-xl font-semibold">Thank you for visiting!</h2>
              <p className="text-base-content/70 text-sm mt-1">
                We&apos;d love to hear about your experience
              </p>
            </div>

            {/* Review Card */}
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-base-content/50">Suggested review:</span>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={regenerateReview}
                    disabled={generating}
                  >
                    <FiRefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
                    New
                  </button>
                </div>
                <p className="text-lg leading-relaxed">{review}</p>
                <div className="card-actions justify-end mt-4">
                  <button
                    className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                    onClick={copyReview}
                  >
                    {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Review'}
                  </button>
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <p className="text-center text-sm text-base-content/70 mb-4">
                Copy the review above, then post it on:
              </p>
              
              {data.google_url && (
                <a
                  href={data.google_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('google')}
                  className="btn btn-outline btn-block gap-2"
                >
                  <FcGoogle className="w-5 h-5" />
                  Post on Google
                  <FiExternalLink className="w-4 h-4 ml-auto opacity-50" />
                </a>
              )}
              
              {data.yelp_url && (
                <a
                  href={data.yelp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClick('yelp')}
                  className="btn btn-outline btn-block gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <SiYelp className="w-5 h-5" />
                  Post on Yelp
                  <FiExternalLink className="w-4 h-4 ml-auto opacity-50" />
                </a>
              )}
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs text-base-content/40 mt-8">
              Feel free to edit the review to match your experience
            </p>
          </div>
        </div>

        {/* Powered By */}
        <div className="text-center pb-4">
          <p className="text-xs text-base-content/30">
            Powered by QuickReviewAI
          </p>
        </div>
      </div>
    </>
  )
}

