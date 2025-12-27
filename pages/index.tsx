import Head from 'next/head';
import Link from 'next/link';
import { Sparkles, QrCode, TrendingUp, Zap, Shield, BarChart3, Check, Store, Smartphone, Star, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';

export default function Home() {
  return (
    <>
      <Head>
        <title>QuickReviewAI - Turn Happy Customers into 5-Star Reviews</title>
        <meta name="description" content="AI-powered review generation for local businesses. Help customers share positive experiences with QR codes." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50/30">
        <Navbar />
        
        {/* Hero Section */}
        <section className="px-4 pt-20 pb-24 sm:pt-32 sm:pb-40">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Review Generation • 100% FREE to Start</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 max-w-4xl mx-auto leading-tight">
              Turn Happy Customers into 5-Star Reviews
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Help your customers share their positive experiences with AI-generated review suggestions. 
              Simple QR codes, instant setup, real results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/login" 
                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40"
              >
                Get Started Free
              </Link>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all border border-gray-200">
                View Demo
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full mr-2">✓ No credit card required</span>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">✓ Free forever plan</span>
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="features" className="px-4 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
              <p className="text-xl text-gray-600">Three simple steps to boost your online reputation</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 mb-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium mb-4">Step 1</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Setup Your Store</h3>
                <p className="text-gray-600">
                  Add your business details and let our AI generate personalized review templates based on your keywords and tone.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium mb-4">Step 2</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Share QR Code</h3>
                <p className="text-gray-600">
                  Display your unique QR code on receipts, table tents, or store windows. Customers scan and go.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium mb-4">Step 3</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Collect Reviews</h3>
                <p className="text-gray-600">
                  Customers copy the suggested review and post directly to Google or Yelp. Watch your ratings soar.
                </p>
              </div>
            </div>

            {/* Visual Demo */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 sm:p-8 lg:p-12">
              <h3 className="text-2xl font-semibold text-center mb-4 text-gray-900">See It In Action</h3>
              <div className="flex justify-center mb-8">
                <ChevronDown className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>
              
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
                      <button className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium">
                        Generate QR Code
                      </button>
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
                <div className="flex justify-center md:justify-end md:pr-40 mb-4">
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
                      <button className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 font-medium">
                        <Check className="w-4 h-4" />
                        Copy Review
                      </button>
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
                      <span className="text-sm text-yellow-600 font-medium">Posted Review</span>
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
                      <div className="flex items-center gap-2 pt-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full"></div>
                        <span className="text-sm text-gray-600">Sarah M. • Google</span>
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
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">Everything You Need</h2>
              <p className="text-xl text-gray-600">Powerful features to grow your online presence</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Sparkles className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">AI-Generated Reviews</h3>
                <p className="text-gray-600">Smart, authentic-sounding reviews tailored to your business</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Zap className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Instant Setup</h3>
                <p className="text-gray-600">Get your first QR code in under 2 minutes</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <Shield className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Multi-Platform</h3>
                <p className="text-gray-600">Works with Google, Yelp, and other review sites</p>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <BarChart3 className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Analytics</h3>
                <p className="text-gray-600">Track scans, conversions, and review performance</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-4 py-24 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-600">Choose the plan that fits your business</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <PricingCard
                name="Free"
                price="$0"
                period="forever"
                features={[
                  '1 store location',
                  '1 new AI review per hour',
                  '15 QR scans per month',
                  'Google & Yelp links',
                  'Email support'
                ]}
                buttonText="Start Free"
                buttonVariant="secondary"
              />
              
              <PricingCard
                name="Pro"
                price="$9.99"
                period="month"
                features={[
                  'Unlimited store locations',
                  'Unlimited AI reviews',
                  'Unlimited QR scans',
                  'All platforms',
                  'Priority support',
                  'Custom branding',
                  'Analytics dashboard'
                ]}
                buttonText="Start Pro Trial"
                buttonVariant="primary"
                popular
              />
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
