import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, ChevronRight } from 'lucide-react';

interface MostRecent {
  createdAt: string;
  storeName: string;
  businessType: string;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return 'recently';
}

export default function LiveActivityBanner() {
  const [mostRecent, setMostRecent] = useState<MostRecent | null>(null);
  const [stats, setStats] = useState<{ totalPosted24h: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    async function fetchActivity() {
      try {
        // checkNotification=true tells the API to check if this IP has been notified before
        const res = await fetch('/api/global-feed?limit=1&checkNotification=true');
        if (res.ok) {
          const data = await res.json();
          // Only show if: has real data AND this IP hasn't been notified before
          if (data.mostRecent && data.shouldShowNotification) {
            setMostRecent(data.mostRecent);
            setStats(data.stats);
            setShouldShow(true);
            // Show banner after a short delay for effect
            setTimeout(() => setVisible(true), 1500);
          }
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      }
    }
    fetchActivity();
  }, []);

  // Don't show if no data, already dismissed, or IP was already notified
  if (!mostRecent || dismissed || !shouldShow) return null;

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-24 sm:w-80 z-30 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Green pulse header */}
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-white text-xs font-medium">Live Activity</span>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{mostRecent.storeName}</span>
                {' '}posted a review
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {timeAgo(mostRecent.createdAt)} • {mostRecent.businessType}
              </p>
              {stats && stats.totalPosted24h > 1 && (
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  +{stats.totalPosted24h - 1} more reviews posted today
                </p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Dismiss
            </button>
            <Link
              href="/global-feed"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View all activity
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

