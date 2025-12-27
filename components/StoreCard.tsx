import { useState } from 'react';
import { Edit, Trash2, QrCode, ChevronDown, ChevronUp, Eye, Copy, BarChart3, Lock, MessageSquare } from 'lucide-react';
import { Store } from '@/lib/types';
import { SubscriptionTier } from '@/lib/constants';

interface StoreCardProps {
  store: Store;
  tier: SubscriptionTier;
  onEdit: (store: Store) => void;
  onDelete: (id: string) => void;
  onShowQR: (store: Store) => void;
  onShowAnalytics?: (store: Store) => void;
}

const MAX_VISIBLE_KEYWORDS = 3;

export default function StoreCard({ store, tier, onEdit, onDelete, onShowQR, onShowAnalytics }: StoreCardProps) {
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  
  const visibleKeywords = showAllKeywords 
    ? store.keywords 
    : store.keywords.slice(0, MAX_VISIBLE_KEYWORDS);
  const hiddenCount = store.keywords.length - MAX_VISIBLE_KEYWORDS;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-200 hover:shadow-lg transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="min-w-0">
            <h3 className="text-xl text-gray-900 mb-1 truncate">{store.name}</h3>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
              {store.businessType}
            </span>
          </div>
        </div>
        
        {/* Platform badges - clickable */}
        <div className="flex gap-2 flex-shrink-0">
          {store.googleUrl && (
            <a 
              href={store.googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
              </svg>
              Google
            </a>
          )}
          {store.yelpUrl && (
            <a 
              href={store.yelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.271 17.018c-.106.04-.219.048-.33.023l-4.047-.903c-.427-.095-.705-.51-.625-.936l.815-4.306c.03-.158.106-.304.22-.42l8.364-8.517c.188-.191.5-.196.695-.01l2.688 2.565c.196.187.203.498.016.694l-7.376 11.42c-.088.136-.232.236-.42.29z" />
              </svg>
              Yelp
            </a>
          )}
        </div>
      </div>

      {/* Analytics Row */}
      <div className="flex gap-4 mb-4 py-3 border-y border-gray-100">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-lg font-semibold text-gray-900">{store.viewCount || 0}</div>
            <div className="text-xs text-gray-500">QR Scans</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-lg font-semibold text-gray-900">{store.copyCount || 0}</div>
            <div className="text-xs text-gray-500">Reviews Copied</div>
          </div>
        </div>
        {(store.viewCount || 0) > 0 && (
          <div className="ml-auto text-right">
            <div className="text-lg font-semibold text-emerald-600">
              {Math.round(((store.copyCount || 0) / (store.viewCount || 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-500">Conversion</div>
          </div>
        )}
      </div>

      {/* Keywords Row */}
      {store.keywords.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {visibleKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
              >
                {keyword}
              </span>
            ))}
            {hiddenCount > 0 && !showAllKeywords && (
              <button
                onClick={() => setShowAllKeywords(true)}
                className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-sm hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                +{hiddenCount} more
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
            {showAllKeywords && hiddenCount > 0 && (
              <button
                onClick={() => setShowAllKeywords(false)}
                className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-sm hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                Show less
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review Expectations Row - Pro Only */}
      {tier === SubscriptionTier.PRO && store.reviewExpectations && store.reviewExpectations.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium text-purple-700">Review Focus</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {store.reviewExpectations.map((exp, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm"
              >
                {exp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons - horizontal row for full-width cards */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(store)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onShowQR(store)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
        {tier === SubscriptionTier.PRO ? (
          <button
            onClick={() => onShowAnalytics?.(store)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        ) : (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm group relative select-none"
            title="Pro feature"
          >
            <Lock className="w-4 h-4" />
            <BarChart3 className="w-4 h-4" />
            Analytics
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Pro feature
            </span>
          </div>
        )}
        <button
          onClick={() => onDelete(store.id)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm ml-auto"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}