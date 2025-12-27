import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText,
  Copy, 
  ExternalLink, 
  TrendingUp, 
  Calendar,
  Tag,
  CheckCircle2,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Globe
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
    // Previous period comparison
    prevTotalReviews: number;
    prevCopiedCount: number;
    prevTotalPasted: number;
  };
  keywordStats: {
    keyword: string;
    usageCount: number;
    copiedCount: number;
    pastedCount: number;
  }[];
  lengthStats: {
    lengthType: string;
    count: number;
    copiedCount: number;
  }[];
  hourlyStats: {
    hour: number;
    count: number;
  }[];
  dailyStats: {
    dayOfWeek: number;
    generated: number;
    pasted: number;
  }[];
  recentReviews: ReviewEvent[];
}

interface ReviewEvent {
  id: string;
  reviewText: string;
  keywordsUsed: string[];
  lengthType: string;
  wasCopied: boolean;
  wasPastedGoogle: boolean;
  wasPastedYelp: boolean;
  createdAt: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Generate dynamic time periods based on current date
function getTimePeriods() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // This week (Sunday to Saturday containing today)
  const dayOfWeek = today.getDay();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - dayOfWeek);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  
  // Last week
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  const lastWeekStart = new Date(lastWeekEnd);
  lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
  
  // This month
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  
  // Two months ago
  const twoMonthsAgoStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const twoMonthsAgoEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0);
  
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const toISODate = (d: Date) => d.toISOString().split('T')[0];
  
  return [
    {
      value: `${toISODate(thisWeekStart)}_${toISODate(thisWeekEnd)}`,
      label: `This Week (${formatDate(thisWeekStart)} - ${formatDate(thisWeekEnd)})`
    },
    {
      value: `${toISODate(lastWeekStart)}_${toISODate(lastWeekEnd)}`,
      label: `Last Week (${formatDate(lastWeekStart)} - ${formatDate(lastWeekEnd)})`
    },
    {
      value: `${toISODate(thisMonthStart)}_${toISODate(thisMonthEnd)}`,
      label: MONTH_NAMES[today.getMonth()]
    },
    {
      value: `${toISODate(lastMonthStart)}_${toISODate(lastMonthEnd)}`,
      label: MONTH_NAMES[lastMonthStart.getMonth()]
    },
    {
      value: `${toISODate(twoMonthsAgoStart)}_${toISODate(twoMonthsAgoEnd)}`,
      label: MONTH_NAMES[twoMonthsAgoStart.getMonth()]
    },
  ];
}

function getPercentChange(current: number, previous: number): { value: number; isNew: boolean } {
  if (previous === 0) {
    // No previous data - mark as "new" rather than showing misleading percentage
    return { value: current > 0 ? 100 : 0, isNew: true };
  }
  return { value: Math.round(((current - previous) / previous) * 100), isNew: false };
}

export default function StoreAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { storeId } = router.query;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const timePeriods = useMemo(() => getTimePeriods(), []);
  const [period, setPeriod] = useState('');
  const [activeTab, setActiveTab] = useState<'pasted' | 'copied' | 'generated'>('pasted');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  
  // Set default period once time periods are calculated
  useEffect(() => {
    if (timePeriods.length > 0 && !period) {
      setPeriod(timePeriods[0].value);
    }
  }, [timePeriods, period]);

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

  // Calculate changes
  const generatedChange = getPercentChange(data.summary.totalReviews, data.summary.prevTotalReviews);
  const copiedChange = getPercentChange(data.summary.copiedCount, data.summary.prevCopiedCount);
  const pastedChange = getPercentChange(data.summary.totalPasted, data.summary.prevTotalPasted);
  const prevConversionRate = data.summary.prevTotalReviews > 0 
    ? (data.summary.prevTotalPasted / data.summary.prevTotalReviews) * 100 
    : 0;
  const conversionChange = getPercentChange(parseFloat(data.summary.conversionRate), prevConversionRate);

  // Filter reviews by tab
  const filteredReviews = data.recentReviews.filter(r => {
    if (activeTab === 'pasted') return r.wasPastedGoogle || r.wasPastedYelp;
    if (activeTab === 'copied') return r.wasCopied && !r.wasPastedGoogle && !r.wasPastedYelp;
    return !r.wasCopied; // 'generated' tab shows reviews that weren't copied
  });

  const pastedCount = data.recentReviews.filter(r => r.wasPastedGoogle || r.wasPastedYelp).length;
  const copiedOnlyCount = data.recentReviews.filter(r => r.wasCopied && !r.wasPastedGoogle && !r.wasPastedYelp).length;
  const generatedOnlyCount = data.recentReviews.filter(r => !r.wasCopied).length;

  // Funnel calculations
  const copiedPercentage = data.summary.totalReviews > 0 
    ? Math.round((data.summary.copiedCount / data.summary.totalReviews) * 100) 
    : 0;
  const pastedPercentage = data.summary.totalReviews > 0 
    ? Math.round((data.summary.totalPasted / data.summary.totalReviews) * 100) 
    : 0;

  // Get max values for charts
  const maxHourly = Math.max(...(data.hourlyStats?.map(h => h.count) || [1]), 1);
  const maxDaily = Math.max(...(data.dailyStats?.map(d => d.generated) || [1]), 1);

  // Find best performing day
  const bestDay = data.dailyStats?.reduce((best, curr) => 
    (curr.generated > 0 && (curr.pasted / curr.generated) > (best.pasted / Math.max(best.generated, 1))) 
      ? curr : best
  , { dayOfWeek: 0, generated: 0, pasted: 0 });

  return (
    <>
      <Head>
        <title>Analytics - {data.store.name} | QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-[1280px] mx-auto">
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
                  {timePeriods.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-[1280px] mx-auto px-6 py-8">
          {/* Key Metrics - Option 1 Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Reviews Generated */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-gray-500 text-sm">Reviews Generated</span>
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900 tabular-nums">{data.summary.totalReviews.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {generatedChange.isNew ? (
                  <span className="text-sm text-blue-600">New this period</span>
                ) : generatedChange.value >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      {generatedChange.value}% vs previous period
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">
                      {Math.abs(generatedChange.value)}% vs previous period
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Copied to Clipboard */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-gray-500 text-sm">Copied to Clipboard</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900 tabular-nums">{data.summary.copiedCount.toLocaleString()}</span>
                <span className="text-xl text-emerald-600 ml-2 tabular-nums">{data.summary.copyRate}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                {copiedChange.isNew ? (
                  <span className="text-sm text-blue-600">New this period</span>
                ) : copiedChange.value >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      {copiedChange.value}% vs previous period
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">
                      {Math.abs(copiedChange.value)}% vs previous period
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Pasted to Platform */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-gray-500 text-sm">Pasted to Platform</span>
                <ExternalLink className="w-5 h-5 text-purple-600" />
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900 tabular-nums">{data.summary.totalPasted.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-gray-600">Google: <span className="text-gray-900 tabular-nums">{data.summary.pastedGoogle}</span></span>
                <span className="text-sm text-gray-600">Yelp: <span className="text-gray-900 tabular-nums">{data.summary.pastedYelp}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                {pastedChange.isNew ? (
                  <span className="text-sm text-blue-600">New this period</span>
                ) : pastedChange.value >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      {pastedChange.value}% vs previous period
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">
                      {Math.abs(pastedChange.value)}% vs previous period
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-gray-500 text-sm">Conversion Rate</span>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900 tabular-nums">{data.summary.conversionRate}%</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">Generated → Pasted</div>
              <div className="flex items-center gap-1.5">
                {conversionChange.isNew ? (
                  <span className="text-sm text-blue-600">New this period</span>
                ) : conversionChange.value >= 0 ? (
                  <>
                    <ArrowUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      {conversionChange.value}% vs previous period
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">
                      {Math.abs(conversionChange.value)}% vs previous period
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Review Activity Feed - Second Row */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Review Activity Feed</h2>
                <p className="text-gray-600 text-sm">Real-time customer engagement tracking</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('pasted')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'pasted'
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                Pasted ({pastedCount})
              </button>
              <button
                onClick={() => setActiveTab('copied')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'copied'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                Copied Only ({copiedOnlyCount})
              </button>
              <button
                onClick={() => setActiveTab('generated')}
                className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'generated'
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                Generated ({generatedOnlyCount})
              </button>
            </div>

            {/* Reviews - show 3 before scroll */}
            {filteredReviews.length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews in this category yet.</p>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                {filteredReviews.slice(0, 10).map((review) => {
                  const isExpanded = expandedReview === review.id;
                  const isTruncated = review.reviewText.length > 100;
                  const displayText = isExpanded || !isTruncated ? review.reviewText : review.reviewText.slice(0, 100) + '...';

                  return (
                    <div
                      key={review.id}
                      className={`p-3 rounded-xl border transition-all hover:shadow-md ${
                        activeTab === 'pasted'
                          ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30 border-emerald-200'
                          : activeTab === 'copied'
                          ? 'border-l-4 border-l-blue-500 bg-blue-50/30 border-blue-200'
                          : 'border-l-4 border-l-amber-500 bg-amber-50/30 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${
                          activeTab === 'pasted' 
                            ? 'text-emerald-600' 
                            : activeTab === 'copied' 
                            ? 'text-blue-600' 
                            : 'text-amber-600'
                        }`}>
                          {activeTab === 'pasted' && <CheckCircle2 className="w-4 h-4" />}
                          {activeTab === 'copied' && <Copy className="w-4 h-4" />}
                          {activeTab === 'generated' && <FileText className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {displayText}
                            {isTruncated && (
                              <button
                                onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                                className="text-blue-600 hover:text-blue-700 ml-1"
                              >
                                {isExpanded ? 'less' : 'more'}
                              </button>
                            )}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              {review.keywordsUsed && review.keywordsUsed.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  • {review.keywordsUsed.slice(0, 2).join(', ')}
                                </span>
                              )}
                            </div>
                            {(review.wasPastedGoogle || review.wasPastedYelp) && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  review.wasPastedGoogle
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {review.wasPastedGoogle ? 'Google' : 'Yelp'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conversion Funnel - Option 1 Style */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Conversion Funnel</h2>
            
            <div className="space-y-6">
              {/* Generated Stage */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Reviews Generated</span>
                  <span className="text-gray-900 font-medium tabular-nums">{data.summary.totalReviews.toLocaleString()}</span>
                </div>
                <div className="h-14 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <span className="text-white font-bold relative z-10 tabular-nums">100%</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                </div>
              </div>

              {/* Drop-off indicator */}
              <div className="flex items-center gap-2 pl-4">
                <div className="w-px h-8 bg-gray-300"></div>
                <span className="text-sm text-amber-600">
                  {data.summary.totalReviews - data.summary.copiedCount} reviews not copied ({100 - copiedPercentage}% drop-off)
                </span>
              </div>

              {/* Copied Stage */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Copied to Clipboard</span>
                  <span className="text-gray-900 font-medium tabular-nums">{data.summary.copiedCount.toLocaleString()}</span>
                </div>
                <div 
                  className="h-14 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-700"
                  style={{ width: `${Math.max(copiedPercentage, 5)}%` }}
                >
                  <span className="text-white font-bold relative z-10 tabular-nums">{copiedPercentage}%</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                </div>
              </div>

              {/* Drop-off indicator */}
              <div className="flex items-center gap-2 pl-4">
                <div className="w-px h-8 bg-gray-300"></div>
                <span className="text-sm text-amber-600">
                  {data.summary.copiedCount - data.summary.totalPasted} reviews copied but not pasted ({copiedPercentage - pastedPercentage}% drop-off)
                </span>
              </div>

              {/* Pasted Stage */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Pasted to Platform</span>
                  <span className="text-gray-900 font-medium tabular-nums">{data.summary.totalPasted.toLocaleString()}</span>
                </div>
                <div 
                  className="h-14 bg-gradient-to-r from-emerald-600 to-emerald-200 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-700"
                  style={{ width: `${Math.max(pastedPercentage, 5)}%` }}
                >
                  <span className="text-white font-bold relative z-10 tabular-nums">{pastedPercentage}%</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                </div>
              </div>

              {/* Success Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                <p className="text-emerald-900 text-sm">
                  <span className="font-bold tabular-nums">{pastedPercentage}%</span> of generated reviews successfully reached review platforms
                </p>
              </div>
            </div>
          </div>

          {/* Two Column: Keyword Performance + Platform Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Keyword Performance - Option 1 Style */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">Keyword Performance</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">Which keywords lead to reviews being used</p>
              
              {data.keywordStats.length === 0 ? (
                <p className="text-gray-500 text-sm">No keyword data yet. Reviews will be tracked as they are generated.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {data.keywordStats.map((stat, index) => {
                    const percentage = stat.usageCount > 0 ? (stat.pastedCount / stat.usageCount) * 100 : 0;
                    const isTopPerformer = percentage >= 75;
                    
                    return (
                      <div key={index} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                            isTopPerformer 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {stat.keyword}
                          </span>
                          <span className="text-sm text-gray-600 tabular-nums">
                            {stat.pastedCount}/{stat.usageCount} pasted
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                              isTopPerformer 
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' 
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform Breakdown - Option 2 Style */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Platform Breakdown</h2>
                  <p className="text-gray-600 text-sm">Where reviews are being pasted</p>
                </div>
                <Globe className="w-5 h-5 text-blue-600" />
              </div>

              {data.summary.totalPasted === 0 ? (
                <p className="text-gray-500 text-sm">No reviews pasted yet.</p>
              ) : (
                <>
                  {/* Visual representation */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-8 rounded-lg overflow-hidden flex">
                      <div 
                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(data.summary.pastedGoogle / data.summary.totalPasted) * 100}%` }}
                      >
                        {data.summary.pastedGoogle > 0 && `${Math.round((data.summary.pastedGoogle / data.summary.totalPasted) * 100)}%`}
                      </div>
                      <div 
                        className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(data.summary.pastedYelp / data.summary.totalPasted) * 100}%` }}
                      >
                        {data.summary.pastedYelp > 0 && `${Math.round((data.summary.pastedYelp / data.summary.totalPasted) * 100)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-gray-700">Google</span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 text-lg font-medium tabular-nums">{data.summary.pastedGoogle}</div>
                        <div className="text-gray-500 text-sm">{data.summary.totalPasted > 0 ? Math.round((data.summary.pastedGoogle / data.summary.totalPasted) * 100) : 0}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-gray-700">Yelp</span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 text-lg font-medium tabular-nums">{data.summary.pastedYelp}</div>
                        <div className="text-gray-500 text-sm">{data.summary.totalPasted > 0 ? Math.round((data.summary.pastedYelp / data.summary.totalPasted) * 100) : 0}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Pasted</span>
                      <span className="text-gray-900 text-lg font-medium tabular-nums">{data.summary.totalPasted}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Time-Based Patterns + Review Length - Option 2 Style */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Time-Based Patterns */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Time-Based Patterns</h2>
                <p className="text-gray-600 text-sm">When customers are most engaged</p>
              </div>

              {/* Peak Hours */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-gray-900 font-medium">Peak Hours</h3>
                </div>
                
                {data.hourlyStats && data.hourlyStats.length > 0 ? (
                  <>
                    <div className="grid grid-cols-8 gap-2">
                      {data.hourlyStats.map((item, index) => {
                        const height = maxHourly > 0 ? (item.count / maxHourly) * 100 : 0;
                        const isHot = item.count > maxHourly * 0.7;
                        
                        return (
                          <div key={index} className="text-center">
                            <div className="h-20 flex items-end justify-center mb-2">
                              <div 
                                className={`w-full rounded-t-lg transition-all ${
                                  isHot 
                                    ? 'bg-gradient-to-t from-amber-500 to-amber-400' 
                                    : 'bg-gradient-to-t from-blue-500 to-blue-400'
                                }`}
                                style={{ height: `${Math.max(height, 5)}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600">{HOUR_LABELS[index] || `${item.hour}:00`}</div>
                            <div className="text-xs text-gray-900 tabular-nums">{item.count}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {data.hourlyStats.some(h => h.count > 0) && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-800 text-sm">
                          🔥 Peak activity: {HOUR_LABELS[data.hourlyStats.reduce((max, h, i, arr) => h.count > arr[max].count ? i : max, 0)] || 'N/A'}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No hourly data yet.</p>
                )}
              </div>

              {/* Day of Week */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h3 className="text-gray-900 font-medium">Day of Week</h3>
                </div>

                {data.dailyStats && data.dailyStats.length > 0 ? (
                  <div className="space-y-3">
                    {data.dailyStats.map((item, index) => {
                      const pasteRate = item.generated > 0 ? (item.pasted / item.generated) * 100 : 0;
                      const isBest = bestDay && item.dayOfWeek === bestDay.dayOfWeek && item.generated > 0;
                      
                      return (
                        <div key={index} className={`p-3 rounded-lg transition-all ${isBest ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 w-12">{DAY_NAMES[item.dayOfWeek]}</span>
                              {isBest && (
                                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">Best</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="text-gray-900 tabular-nums">{item.pasted}</span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="tabular-nums">{item.generated}</span>
                            </div>
                          </div>
                          
                          <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full ${
                                isBest 
                                  ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}
                              style={{ width: `${pasteRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No daily data yet.</p>
                )}
              </div>
            </div>

            {/* Review Length Distribution - Option 2 Style */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Review Length Distribution</h2>
                  <p className="text-gray-600 text-sm">Which lengths get pasted most</p>
                </div>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>

              {data.lengthStats.length === 0 ? (
                <p className="text-gray-500 text-sm">No review length data yet.</p>
              ) : (
                <>
                  {/* Bar Chart */}
                  <div className="space-y-4 mb-6">
                    {data.lengthStats.map((stat, index) => {
                      const maxCount = Math.max(...data.lengthStats.map(s => s.count), 1);
                      const width = (stat.count / maxCount) * 100;
                      const pasteRate = stat.count > 0 ? Math.round((stat.copiedCount / stat.count) * 100) : 0;
                      const isBest = stat.lengthType === 'medium';
                      
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 capitalize">{stat.lengthType}</span>
                            <span className="text-sm text-gray-600 tabular-nums">{stat.count}</span>
                          </div>
                          <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                            <div 
                              className={`absolute inset-y-0 left-0 rounded-lg ${
                                isBest ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <div className={`text-xs mt-1 ${isBest ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {pasteRate}% pasted
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Best performer insight */}
                  {data.lengthStats.length > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-emerald-600 mt-0.5">💡</div>
                        <p className="text-emerald-800 text-sm">
                          {(() => {
                            const best = data.lengthStats.reduce((max, s) => 
                              s.count > 0 && (s.copiedCount / s.count) > (max.copiedCount / Math.max(max.count, 1)) ? s : max
                            );
                            const rate = best.count > 0 ? Math.round((best.copiedCount / best.count) * 100) : 0;
                            return `${best.lengthType.charAt(0).toUpperCase() + best.lengthType.slice(1)} reviews have the highest completion rate at ${rate}%`;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
