import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { FiMail } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'

export default function Login() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Login - QuickReviewAI</title>
      </Head>

      <div className="min-h-screen bg-base-200 flex flex-col">
        {/* Navbar */}
        <div className="navbar bg-base-100 shadow-sm">
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl font-bold">
              QuickReview<span className="text-primary">AI</span>
            </Link>
          </div>
        </div>

        {/* Login Card */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-center justify-center mb-2">
                Welcome Back
              </h2>
              <p className="text-center text-base-content/70 mb-6">
                Sign in to manage your review pages
              </p>

              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="btn btn-outline gap-2"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="divider text-xs text-base-content/50">OR</div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered"
                  disabled
                />
              </div>

              <button className="btn btn-primary mt-4" disabled>
                <FiMail className="w-4 h-4" />
                Continue with Email (Coming Soon)
              </button>

              <p className="text-center text-sm text-base-content/50 mt-6">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

