import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCard from '@/components/PricingCard';

const LiveActivityBanner = dynamic(() => import('@/components/LiveActivityBanner'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>QuickReviewAI - AI-Generated Google & Yelp Reviews via QR Code</title>
        <meta name="description" content="Display a QR code at your business. Customers scan it, get an AI-written 5-star review, and post it to Google or Yelp in 30 seconds. Free to start." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50/30">
        <Navbar />

        {/* Hero Section */}
        <section className="px-4 pt-20 pb-12 sm:pt-32 sm:pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 text-gray-900 leading-tight">
              Your customers scan a QR code.
              <br />
              AI writes them a 5-star review.
              <br />
              They copy it, paste it, post it.
            </h1>
            <p className="text-xl text-gray-500 mb-8">That&apos;s the whole product.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Link
                href="/login"
                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30 text-lg"
              >
                Get Your QR Code Free
              </Link>
              <a href="#demo" className="px-8 py-4 text-gray-600 font-medium hover:text-gray-900 transition-colors text-lg">
                See How It Works ↓
              </a>
            </div>
            <p className="text-sm text-gray-400">No credit card required. Free plan available.</p>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section id="demo" className="px-4 py-16 sm:py-24 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">How You Create Our QR Code</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Owner's Side */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-6">Your side (one-time setup)</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">Sign up free</h4>
                      <p className="text-gray-600">Enter your email. Takes 10 seconds.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">Add your store</h4>
                      <p className="text-gray-600">Store name, business type, Google/Yelp review link, and the keywords you want in reviews.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">Print your QR code</h4>
                      <p className="text-gray-600">Put it at your register, on tables, on the door — anywhere customers can reach it.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-gray-500 text-sm text-center mb-4">You&apos;re done. Everything below happens automatically.</p>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-sm">
                      <QRCodeSVG
                        value="https://quickreviewai.vercel.app/r/demo"
                        size={120}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#059669"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">↑ Real QR code. Scan it with your phone to try.</p>
                </div>
              </div>

              {/* Customer's Side - Phone Mockup */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-6">Customer&apos;s side (30 seconds)</h3>

                <div className="relative mx-auto w-[300px] sm:w-[320px]">
                  <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
                    <div className="w-full h-[580px] rounded-[2rem] overflow-hidden bg-white">
                      <iframe
                        src="/r/demo?embed=1"
                        className="border-0 origin-top-left"
                        style={{ width: '430px', height: '850px', transform: 'scale(0.685)', transformOrigin: 'top left' }}
                        title="QuickReviewAI Customer Demo"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4 text-center max-w-xs">
                  ↑ This is the real product. Tap &quot;Copy Review&quot; then &quot;Post on Google&quot;.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Example Reviews Section */}
        <section className="px-4 py-16 sm:py-24 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-900">What the AI Actually Writes</h2>
              <p className="text-lg text-gray-600">Each scan generates a unique review. You pick the keywords.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="mb-3">
                  <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Liquor Store</span>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  &quot;Stopped in looking for a decent bottle of wine and the guy working actually knew his stuff. Way better wine selection than the bigger stores around here. They got a solid craft beer section too.&quot;
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="mb-3">
                  <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Hair Salon</span>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  &quot;Ok so my coworker kept bugging me to try this salon and she was right lol. Got a balayage and the color correction was on point. They actually listened to what I wanted instead of just doing their own thing.&quot;
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="mb-3">
                  <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">Auto Repair</span>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  &quot;Brought my car in for brakes expecting to get ripped off tbh. Was actually surprised by the honest pricing. Dude at the counter explained everything without talking down to me which I appreciated.&quot;
                </p>
              </div>
            </div>

            <p className="text-center text-gray-500 mt-8 text-sm">
              Every review is unique. The AI uses casual language, slang, and varied structure so each one reads like a real person wrote it.
            </p>
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
                  '1 store per account',
                  '15 QR scans per month with AI review generation',
                  '1 extra review regeneration per store',
                  'Target specific keywords for each store',
                  'Set your business type for relevant reviews',
                  'Google & Yelp posting'
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
                  'Unlimited stores',
                  'Unlimited QR scans with AI reviews',
                  'Customers can regenerate reviews until satisfied',
                  'Review Guidance: control exactly what AI highlights',
                  'Target specific keywords for each store',
                  'Google, Yelp, TripAdvisor, Facebook, OpenTable',
                  'Analytics dashboard with conversion tracking'
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
        
        {/* Live Activity Banner - shows recent review activity */}
        <LiveActivityBanner />
      </div>
    </>
  );
}
