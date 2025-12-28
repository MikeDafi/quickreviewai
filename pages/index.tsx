import Head from 'next/head';
import Link from 'next/link';
import { Sparkles, QrCode, TrendingUp, Shield, BarChart3, Check, Smartphone, Star, ExternalLink, Copy, MousePointerClick, ClipboardPaste, Send } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';

const DEMO_LANDING_PAGE_URL = '/r/demo';

export default function Home() {
  return (
    <>
      <Head>
        <title>QuickReviewAI - Rank for Keywords You&apos;re Missing | Local SEO Through Reviews</title>
        <meta name="description" content="Turn customer reviews into SEO gold. AI-generated reviews mention YOUR keywords so you rank for searches you never showed up for. Free to start." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50/30">
        <Navbar />
        
        {/* Hero Section */}
        <section className="px-4 pt-20 pb-12 sm:pt-32 sm:pb-16">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">✓ No credit card required • ✓ Free forever plan</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 max-w-4xl mx-auto leading-tight">
              Have Your Google Business Show Up Everywhere
            </h1>
          </div>
        </section>

        {/* How It Works - Simple Steps */}
        <section id="features" className="px-4 py-16 sm:py-24 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">How Business Owners Use QuickReviewAI</h2>
              <p className="text-lg text-gray-600">Simple for customers, powerful for your business</p>
            </div>
            
            {/* Steps Flow */}
            <div className="relative">
              {/* Connection Line - Desktop */}
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 -translate-y-1/2 z-0" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative z-10">
                {/* Step 1 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 relative">
                  <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    1
                  </div>
                  <div className="mt-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <QrCode className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Display QR Code</h3>
                    <p className="text-sm text-gray-600">
                      Put up the QR code QuickReviewAI generates at your register, table, or door
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 relative">
                  <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    2
                  </div>
                  <div className="mt-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <Smartphone className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customer Scans</h3>
                    <p className="text-sm text-gray-600">
                      Happy customers scan the code with their phone camera
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 relative">
                  <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    3
                  </div>
                  <div className="mt-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">AI Writes Review</h3>
                    <p className="text-sm text-gray-600">
                      QuickReviewAI instantly generates a keyword-rich review they can personalize
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 relative">
                  <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    4
                  </div>
                  <div className="mt-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <Copy className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Copy Review</h3>
                    <p className="text-sm text-gray-600">
                      One tap copies the review to their clipboard
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Steps 5-7 */}
            <div className="mt-6 lg:mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-4 max-w-4xl mx-auto">
                {/* Step 5 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 relative">
                  <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    5
                  </div>
                  <div className="mt-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <MousePointerClick className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Click Post</h3>
                    <p className="text-sm text-gray-600">
                      Tap &quot;Post on Google&quot; or &quot;Post on Yelp&quot; button
                    </p>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 relative">
                  <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    6
                  </div>
                  <div className="mt-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <ClipboardPaste className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Paste Review</h3>
                    <p className="text-sm text-gray-600">
                      Paste the AI-generated review into Google or Yelp
                    </p>
                  </div>
                </div>

                {/* Step 7 */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 relative">
                  <div className="absolute -top-3 left-6 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    7
                  </div>
                  <div className="mt-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                      <Send className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Done!</h3>
                    <p className="text-sm text-gray-600">
                      Post submitted! Your business gets keyword-rich reviews effortlessly
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Result Banner */}
            <div className="mt-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 text-center text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-emerald-200" />
                  <span className="font-medium">No headache for customers</span>
                </div>
                <div className="hidden sm:block w-px h-6 bg-emerald-400/50" />
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-emerald-200" />
                  <span className="font-medium">Perfect reviews for owners</span>
                </div>
                <div className="hidden sm:block w-px h-6 bg-emerald-400/50" />
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                  <span className="font-medium">Higher Google rankings</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Try It Yourself - Separate Section */}
        <section className="px-4 py-16 bg-white">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">Try It Yourself</h2>
              <p className="text-lg text-gray-600">Experience what your customers will see</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-xl border border-emerald-100 p-8">
              <div className="flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-sm">
                  <QRCodeSVG 
                    value="https://quickreviewai.vercel.app/r/demo"
                    size={160}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#059669"
                  />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium mb-4">
                    Scan the QR code or click the button below
                  </p>
                  <Link
                    href={DEMO_LANDING_PAGE_URL}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Demo Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">Why Reviews = Free SEO</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                When customers search for &quot;best pizza downtown&quot; or &quot;fast friendly service&quot;, Google looks for those keywords in your reviews. QuickReviewAI helps you rank for searches you never showed up for.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <TrendingUp className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Rank for New Keywords</h3>
                <p className="text-gray-600">When reviews mention &quot;best brunch spot&quot; or &quot;affordable mechanic&quot;, you start ranking for those searches</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Sparkles className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Fresh Content Daily</h3>
                <p className="text-gray-600">Google rewards businesses with recent activity. New reviews signal you&apos;re active and relevant</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Shield className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Build Trust Signals</h3>
                <p className="text-gray-600">More 5-star reviews = higher click-through rates from search results</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <BarChart3 className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Outrank Competitors</h3>
                <p className="text-gray-600">The business with more recent, keyword-rich reviews wins the local pack</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-4 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">Cheaper Than SEO Agencies</h2>
              <p className="text-xl text-gray-600">Get ongoing keyword-rich content for a fraction of the cost</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <PricingCard
                name="Free"
                price="$0"
                period="forever"
                features={[
                  '1 store location',
                  '1 keyword-rich review per user',
                  '15 QR scans per month',
                  'Google & Yelp posting',
                  'Email support'
                ]}
                buttonText="Start Free"
                buttonVariant="secondary"
                href="/login"
              />
              
              <PricingCard
                name="Pro"
                price="$9.99"
                period="month"
                features={[
                  'Unlimited locations',
                  'Customers get unlimited review regenerations',
                  'Unlimited QR scans',
                  'Target specific keywords you want to rank for',
                  'Tell the AI exactly what to highlight in every review',
                  'Google, Yelp, TripAdvisor, Facebook, OpenTable',
                  'Analytics dashboard',
                  'Priority support'
                ]}
                buttonText="Get Pro"
                buttonVariant="primary"
                href="/login?plan=pro"
                popular
              />
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-8">
              Full refund available within 3 days via your Profile page or by emailing quickreviewsai@gmail.com
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
