import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Activity, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface FeedEvent {
  id: string;
  createdAt: string;
  wasCopied: boolean;
  wasPastedGoogle: boolean;
  wasPastedYelp: boolean;
  storeName: string;
  businessType: string;
  reviewPreview: string;
}

interface GlobalFeedData {
  events: FeedEvent[];
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function GlobalFeed() {
  const [data, setData] = useState<GlobalFeedData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/global-feed?limit=50');
      if (res.ok) {
        const feedData = await res.json();
        setData(feedData);
      }
    } catch (error) {
      console.error('Failed to fetch global feed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    // Refresh every 30 seconds
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return (
    <>
      <Head>
        <title>Global Feed - QuickReviewAI</title>
        <meta name="description" content="See real reviews being posted by businesses using QuickReviewAI" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50/30">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Global Feed</h1>
                <p className="text-gray-600">Real reviews posted by businesses using QuickReviewAI</p>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
              </div>
            ) : data?.events.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posted reviews yet</h3>
                <p className="text-gray-500 px-4">
                  Reviews will appear here once customers copy and post them to Google or Yelp
                </p>
              </div>
            ) : (
              data?.events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Header with store info and timestamp */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{event.storeName}</h3>
                        <span className="text-sm text-gray-500">{event.businessType}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                  
                  {/* Review Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-3 flex-1">
                    <p className="text-gray-700 italic text-sm sm:text-base">
                      &ldquo;{event.reviewPreview}...&rdquo;
                    </p>
                  </div>
                  
                  {/* Posted To */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Posted to:</span>
                    {event.wasPastedGoogle && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        <ExternalLink className="w-3 h-3" />
                        Google
                      </span>
                    )}
                    {event.wasPastedYelp && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                        <ExternalLink className="w-3 h-3" />
                        Yelp
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

