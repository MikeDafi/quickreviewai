import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="px-4 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-gray-900">QuickReviewAI</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/#pricing" className="text-gray-600 hover:text-gray-900 hidden sm:block">
            Pricing
          </Link>
          <Link href="/global-feed" className="text-gray-600 hover:text-gray-900 hidden sm:block">
            Global Feed
          </Link>
          <Link 
            href="/login" 
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
