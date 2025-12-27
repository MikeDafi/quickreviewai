import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-gray-900">QuickReviewAI</span>
          </div>
          <p className="text-gray-600 text-sm max-w-xs">
            AI-powered review generation for local businesses.
          </p>
        </div>

        {/* Links - always 3 columns */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <h3 className="mb-3 text-gray-900 text-sm font-medium">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#features" className="text-gray-600 hover:text-gray-900">Features</Link></li>
              <li><Link href="/#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
              <li><Link href="/" className="text-gray-600 hover:text-gray-900">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-gray-900 text-sm font-medium">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-600 hover:text-gray-900">About</Link></li>
              <li><Link href="/" className="text-gray-600 hover:text-gray-900">Blog</Link></li>
              <li><Link href="/" className="text-gray-600 hover:text-gray-900">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-gray-900 text-sm font-medium">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-600 hover:text-gray-900">Privacy</Link></li>
              <li><Link href="/" className="text-gray-600 hover:text-gray-900">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>&copy; 2025 QuickReviewAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
