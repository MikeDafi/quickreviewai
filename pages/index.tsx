import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FiStar, FiZap, FiLink, FiCheckCircle } from 'react-icons/fi'

export default function Home() {
  const { data: session } = useSession()

  return (
    <>
      <Head>
        <title>QuickReviewAI - Turn Happy Customers into 5-Star Reviews</title>
        <meta name="description" content="Generate pre-written reviews for your customers with AI. Boost your Google and Yelp ratings effortlessly." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-base-200">
        {/* Navbar */}
        <div className="navbar bg-base-100 shadow-lg">
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl font-bold">
              QuickReview<span className="text-primary">AI</span>
            </Link>
          </div>
          <div className="flex-none gap-2">
            {session ? (
              <Link href="/dashboard" className="btn btn-primary">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="hero min-h-[70vh] bg-base-200">
          <div className="hero-content text-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold leading-tight">
                Turn Happy Customers into{' '}
                <span className="text-primary">5-Star Reviews</span>
              </h1>
              <p className="py-6 text-lg text-base-content/70">
                Generate AI-powered review suggestions for your customers. 
                They scan your QR code, see a ready-to-post review, and click to leave it on Google or Yelp.
              </p>
              <Link href="/login" className="btn btn-primary btn-lg">
                Start Free
              </Link>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="py-20 px-4 bg-base-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card bg-base-200">
                <div className="card-body items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="card-title">Set Up Your Store</h3>
                  <p className="text-base-content/70">
                    Add your business details, keywords, and preferred review tone.
                  </p>
                </div>
              </div>
              <div className="card bg-base-200">
                <div className="card-body items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="card-title">Share Your QR Code</h3>
                  <p className="text-base-content/70">
                    Print or display the QR code at checkout, on receipts, or at your entrance.
                  </p>
                </div>
              </div>
              <div className="card bg-base-200">
                <div className="card-body items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="card-title">Collect Reviews</h3>
                  <p className="text-base-content/70">
                    Customers see a pre-written review and post it to Google or Yelp in one tap.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-20 px-4 bg-base-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why QuickReviewAI?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: FiStar, title: 'AI-Generated Reviews', desc: 'Natural-sounding reviews tailored to your business' },
                { icon: FiZap, title: 'Instant Setup', desc: 'Create your first landing page in under 2 minutes' },
                { icon: FiLink, title: 'Multi-Platform', desc: 'Support for Google, Yelp, TripAdvisor, and more' },
                { icon: FiCheckCircle, title: 'Analytics', desc: 'Track views, copies, and click-through rates' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-6 bg-base-100 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-base-content/70">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="py-20 px-4 bg-base-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
            <p className="text-center text-base-content/70 mb-12">Start free, upgrade when you need more</p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card bg-base-200 border border-base-300">
                <div className="card-body">
                  <h3 className="card-title">Free</h3>
                  <p className="text-3xl font-bold">$0<span className="text-sm font-normal text-base-content/70">/mo</span></p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2"><FiCheckCircle className="text-success" /> 1 store</li>
                    <li className="flex items-center gap-2"><FiCheckCircle className="text-success" /> 1 landing page</li>
                    <li className="flex items-center gap-2"><FiCheckCircle className="text-success" /> Basic analytics</li>
                  </ul>
                  <div className="card-actions mt-6">
                    <Link href="/login" className="btn btn-outline btn-block">Get Started</Link>
                  </div>
                </div>
              </div>
              <div className="card bg-primary text-primary-content border-2 border-primary">
                <div className="card-body">
                  <div className="badge badge-secondary mb-2">Popular</div>
                  <h3 className="card-title">Pro</h3>
                  <p className="text-3xl font-bold">$19<span className="text-sm font-normal opacity-70">/mo</span></p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2"><FiCheckCircle /> 5 stores</li>
                    <li className="flex items-center gap-2"><FiCheckCircle /> 25 landing pages</li>
                    <li className="flex items-center gap-2"><FiCheckCircle /> Advanced analytics</li>
                    <li className="flex items-center gap-2"><FiCheckCircle /> Custom slugs</li>
                  </ul>
                  <div className="card-actions mt-6">
                    <Link href="/login" className="btn btn-secondary btn-block">Start Pro</Link>
                  </div>
                </div>
              </div>
              <div className="card bg-base-200 border border-base-300">
                <div className="card-body">
                  <h3 className="card-title">Business</h3>
                  <p className="text-3xl font-bold">$49<span className="text-sm font-normal text-base-content/70">/mo</span></p>
                  <ul className="mt-4 space-y-2">
                    <li className="flex items-center gap-2"><FiCheckCircle className="text-success" /> Unlimited stores</li>
                    <li className="flex items-center gap-2"><FiCheckCircle className="text-success" /> Unlimited pages</li>
                    <li className="flex items-center gap-2"><FiCheckCircle className="text-success" /> White-label</li>
                    <li className="flex items-center gap-2"><FiCheckCircle className="text-success" /> API access</li>
                  </ul>
                  <div className="card-actions mt-6">
                    <Link href="/login" className="btn btn-outline btn-block">Contact Sales</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer footer-center p-10 bg-base-200 text-base-content">
          <div>
            <p className="font-bold text-lg">
              QuickReview<span className="text-primary">AI</span>
            </p>
            <p className="text-base-content/70">Turn happy customers into 5-star reviews</p>
            <p className="text-sm text-base-content/50 mt-4">© 2024 QuickReviewAI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

