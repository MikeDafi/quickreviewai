import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BarChart3, 
  Copy, 
  ExternalLink, 
  TrendingUp, 
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  store: {
    id: string;
    name: string;
    keywords: string[];
    reviewExpectations: string[];
  };
  period: string;
  days: number;
  summary: {
    totalReviews: number;
    copiedCount: number;
    pastedGoogle: number;
    pastedYelp: number;
    totalPasted: number;
    copyRate: string;
    pasteRate: string;
    conversionRate: string;
  };
  keywordStats: {
    keyword: string;
    usageCount: number;
    copiedCount: number;
    pastedCount: number;
  }[];
  expectationStats: {
    expectation: string;
    usageCount: number;
    copiedCount: number;
    pastedCount: number;
  }[];
  lengthStats: {
    lengthType: string;
    count: number;
    copiedCount: number;
  }[];
  dailyStats: {
    date: string;
    reviewsGenerated: number;
    copied: number;
    pasted: number;
  }[];
  successfulReviews: ReviewEvent[];
  recentReviews: ReviewEvent[];
}

interface ReviewEvent {
  id: string;
  reviewText: string;
  keywordsUsed: string[];
  expectationsUsed: string[];
  lengthType: string;
  wasCopied: boolean;
  wasPastedGoogle: boolean;
  wasPastedYelp: boolean;
  createdAt: string;
}

const TIME_PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export default function StoreAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { storeId } = router.query;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchAnalytics = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/analytics/${storeId}?period=${period}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Store not found');
        } else {
          setError('Failed to load analytics');
        }
        return;
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [storeId, period]);

  useEffect(() => {
    if (session && storeId) {
      fetchAnalytics();
    }
  }, [session, storeId, fetchAnalytics]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <Link href="/dashboard" className="text-emerald-600 hover:text-emerald-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <Head>
        <title>Analytics - {data.store.name} | QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{data.store.name}</h1>
                <p className="text-gray-600">Analytics & Review Performance</p>
              </div>
              
              {/* Time Period Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                >
                  {TIME_PERIODS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Reviews Generated</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.summary.totalReviews}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Copied</span>
                <Copy className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.summary.copiedCount}</div>
              <div className="text-sm text-gray-500">{data.summary.copyRate}% copy rate</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Pasted to Platform</span>
                <ExternalLink className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.summary.totalPasted}</div>
              <div className="text-sm text-gray-500">
                {data.summary.pastedGoogle} Google • {data.summary.pastedYelp} Yelp
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Conversion Rate</span>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.summary.conversionRate}%</div>
              <div className="text-sm text-gray-500">Generated → Pasted</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Keyword Performance */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Keyword Performance</h2>
              </div>
              
              {data.keywordStats.length === 0 ? (
                <p className="text-gray-500 text-sm">No keyword data yet. Reviews will be tracked as they are generated.</p>
              ) : (
                <div className="space-y-3">
                  {data.keywordStats.map((stat) => (
                    <div key={stat.keyword} className="flex items-center gap-4">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm min-w-0 truncate">
                        {stat.keyword}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(stat.pastedCount / Math.max(stat.usageCount, 1)) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        {stat.pastedCount}/{stat.usageCount} pasted
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Expectations Performance */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Review Expectations</h2>
              </div>
              
              {data.expectationStats.length === 0 ? (
                <p className="text-gray-500 text-sm">No expectation data yet. Add review expectations to your store to track them.</p>
              ) : (
                <div className="space-y-3">
                  {data.expectationStats.map((stat) => (
                    <div key={stat.expectation} className="flex items-center gap-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm min-w-0 truncate">
                        {stat.expectation}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(stat.pastedCount / Math.max(stat.usageCount, 1)) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        {stat.pastedCount}/{stat.usageCount} pasted
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Review Length Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Review Length Distribution</h2>
            </div>
            
            {data.lengthStats.length === 0 ? (
              <p className="text-gray-500 text-sm">No review length data yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {data.lengthStats.map((stat) => (
                  <div key={stat.lengthType} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                    <div className="text-sm text-gray-600 capitalize">{stat.lengthType}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stat.copiedCount} copied
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Successful Reviews (Pasted) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Reviews That Got Pasted</h2>
              <span className="text-sm text-gray-500">({data.successfulReviews.length} reviews)</span>
            </div>
            
            {data.successfulReviews.length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews have been pasted yet. Keep generating!</p>
            ) : (
              <div className="space-y-4">
                {data.successfulReviews.slice(0, 10).map((review) => (
                  <div 
                    key={review.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-gray-800 ${expandedReview === review.id ? '' : 'line-clamp-2'}`}>
                          {review.reviewText}
                        </p>
                        {review.reviewText.length > 150 && (
                          <button
                            onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 mt-1"
                          >
                            {expandedReview === review.id ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {review.wasPastedGoogle && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Google</span>
                        )}
                        {review.wasPastedYelp && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Yelp</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {review.keywordsUsed.length > 0 && (
                        <span>Keywords: {review.keywordsUsed.join(', ')}</span>
                      )}
                      <span className="capitalize">{review.lengthType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
              <span className="text-sm text-gray-500">({data.recentReviews.length} reviews)</span>
            </div>
            
            {data.recentReviews.length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews generated yet in this time period.</p>
            ) : (
              <div className="space-y-3">
                {data.recentReviews.slice(0, 20).map((review) => (
                  <div 
                    key={review.id} 
                    className={`border rounded-lg p-3 ${
                      review.wasPastedGoogle || review.wasPastedYelp 
                        ? 'border-emerald-200 bg-emerald-50/50' 
                        : review.wasCopied 
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-700 line-clamp-1 flex-1">
                        {review.reviewText}
                      </p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {review.wasPastedGoogle || review.wasPastedYelp ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : review.wasCopied ? (
                          <Copy className="w-4 h-4 text-blue-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

