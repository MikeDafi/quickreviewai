import Head from 'next/head';
import Link from 'next/link';
import { Sparkles, QrCode, TrendingUp, Zap, Shield, BarChart3, Check, Store, Smartphone, Star, ExternalLink } from 'lucide-react';
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
        <section className="px-4 pt-20 pb-24 sm:pt-32 sm:pb-40">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Boost Your Google Rankings • 100% FREE to Start</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 max-w-4xl mx-auto leading-tight">
              Rank for Keywords You&apos;re Missing Out On
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Every review is SEO gold. When customers mention &quot;best pizza downtown&quot; or &quot;fast friendly service&quot;, 
              Google indexes those keywords for YOUR business. Start ranking for searches you never showed up for.
            </p>
            
            <div className="flex justify-center">
              <Link 
                href="/login" 
                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40"
              >
                Get Started Free
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full mr-2">✓ No credit card required</span>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">✓ Free forever plan</span>
            </p>

            {/* Demo QR Code Section */}
            <div className="mt-12 max-w-md mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-4 text-center">
                  📱 Scan or click to see what your customers will experience
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="bg-white p-3 rounded-xl border-2 border-emerald-100 shadow-sm">
                    <QRCodeSVG 
                      value="https://quickreviewai.vercel.app/r/demo"
                      size={120}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#059669"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-gray-700 font-medium mb-3">
                      Try it yourself!
                    </p>
                    <Link
                      href={DEMO_LANDING_PAGE_URL}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Demo Page
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="features" className="px-4 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
              <p className="text-xl text-gray-600">Turn every happy customer into an SEO asset</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 mb-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium mb-4">Step 1</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Add Your Keywords</h3>
                <p className="text-gray-600">
                  Tell us what searches you want to rank for. &quot;Best tacos in Austin&quot;? &quot;Emergency plumber&quot;? Our AI weaves them naturally into reviews.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium mb-4">Step 2</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Display QR Code</h3>
                <p className="text-gray-600">
                  Print it on receipts, table tents, or your counter. Happy customers scan in seconds.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium mb-4">Step 3</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Watch Rankings Climb</h3>
                <p className="text-gray-600">
                  Every review posted to Google, Yelp, or TripAdvisor builds your keyword authority. More reviews = more visibility = more customers.
                </p>
              </div>
            </div>

            {/* Visual Demo */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 sm:p-8 lg:p-12">
              <h3 className="text-2xl font-semibold text-center mb-8 text-gray-900">See It In Action</h3>
              
              <div className="max-w-5xl mx-auto">
                {/* Top Row */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-4">
                  {/* Card 1: Business Dashboard */}
                  <div className="w-full md:w-80 bg-white rounded-2xl p-5 shadow-lg border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Store className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm text-emerald-600 font-medium">Business Dashboard</span>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Store Name</div>
                        <div className="text-sm text-gray-900 font-medium">Tony&apos;s Pizza</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Keywords</div>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">authentic</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">delicious</span>
                        </div>
                      </div>
                      <div className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium text-center cursor-default select-none">
                        Generate QR Code
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow Right */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-lg">→</span>
                    </div>
                  </div>
                  <div className="md:hidden flex items-center justify-center">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-lg">↓</span>
                    </div>
                  </div>
                  
                  {/* Card 2: QR Code Ready */}
                  <div className="w-full md:w-80 bg-white rounded-2xl p-5 shadow-lg border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm text-emerald-600 font-medium">QR Code Ready</span>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl p-6 flex flex-col items-center">
                      <div className="w-28 h-28 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center mb-3">
                        <QrCode className="w-20 h-20 text-gray-800" />
                      </div>
                      <p className="text-sm text-gray-600">Display at location</p>
                    </div>
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">↓</span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex flex-col-reverse md:flex-row items-center justify-center gap-4 md:gap-6">
                  {/* Card 3: Customer Scans */}
                  <div className="w-full md:w-80 bg-white rounded-2xl p-5 shadow-lg border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm text-emerald-600 font-medium">Customer Scans</span>
                    </div>
                    <div className="bg-gradient-to-b from-emerald-50 to-teal-50 rounded-xl p-4">
                      <p className="text-xs text-gray-600 text-center mb-2">Tony&apos;s Pizza</p>
                      <p className="text-sm text-gray-800 text-center leading-relaxed mb-3">
                        &quot;Amazing experience! The authentic pizza was delicious...&quot;
                      </p>
                      <div className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 font-medium cursor-default select-none">
                        <Check className="w-4 h-4" />
                        Copy Review
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow Right */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-lg">→</span>
                    </div>
                  </div>
                  <div className="md:hidden flex items-center justify-center">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-lg">↓</span>
                    </div>
                  </div>
                  
                  {/* Card 4: Posted Review */}
                  <div className="w-full md:w-80 bg-white rounded-2xl p-5 shadow-lg border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-yellow-600 font-medium">Post Your Review</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        &quot;Amazing experience! The authentic pizza was delicious...&quot;
                      </p>
                      <div className="flex flex-col gap-2 pt-2">
                        <a
                          href="https://g.page/r/CYbhqyxqIqguEBM/review"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Post on Google
                        </a>
                        <a
                          href="https://www.yelp.com/writeareview/biz/dx3-uI6A5bIXptySpOSaZg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-.314-.365-2.447-3.827l-.633-1.032c-.244-.37-.199-.857.104-1.229.297-.37.756-.478 1.158-.274l1.099.534c3.334 1.62 3.463 1.725 3.553 1.846.219.292.247.657.045 1.225z"/>
                          </svg>
                          Post on Yelp
                        </a>
                      </div>
                    </div>
                  </div>
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
              <p className="text-xl text-gray-600">Every review is content that Google indexes for your business</p>
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
                  '1 keyword-rich review per hour',
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
                  'Unlimited keyword-rich reviews',
                  'Unlimited QR scans',
                  'Target specific keywords you want to rank for',
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
              Full refund available within 3 days via your Profile page or by emailing quickreviewai@gmail.com
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
