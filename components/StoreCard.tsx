import { Edit, Trash2, QrCode, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Store } from '@/lib/types';

interface StoreCardProps {
  store: Store;
  onEdit: (store: Store) => void;
  onDelete: (id: string) => void;
  onShowQR: (store: Store) => void;
}

export default function StoreCard({ store, onEdit, onDelete, onShowQR }: StoreCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-emerald-200 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl text-gray-900 mb-1">{store.name}</h3>
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
            {store.businessType}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {store.keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {store.googleUrl && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
            </svg>
            Google
          </div>
        )}
        {store.yelpUrl && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.271 17.018c-.106.04-.219.048-.33.023l-4.047-.903c-.427-.095-.705-.51-.625-.936l.815-4.306c.03-.158.106-.304.22-.42l8.364-8.517c.188-.191.5-.196.695-.01l2.688 2.565c.196.187.203.498.016.694l-7.376 11.42c-.088.136-.232.236-.42.29z" />
            </svg>
            Yelp
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onEdit(store)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onShowQR(store)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
        <Link
          href={`/analytics/${store.id}`}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Link>
        <button
          onClick={() => onDelete(store.id)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}