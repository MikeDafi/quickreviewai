import { Sparkles, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-gray-900">QuickReviewAI</span>
          </div>
          <p className="text-gray-600 text-sm max-w-xs mx-auto mb-6">
            AI-powered review generation for local businesses.
          </p>
          
          {/* Contact Email */}
          <a 
            href="mailto:quickreviewai@gmail.com" 
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm"
          >
            <Mail className="w-4 h-4" />
            quickreviewai@gmail.com
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>&copy; 2025 QuickReviewAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
