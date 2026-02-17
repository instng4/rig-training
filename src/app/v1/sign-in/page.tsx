'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function V1SignInPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Successful sign in, redirect handled by middleware or context usually, 
      // but explicit push is good practice here as per original file.
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="v1-card w-full max-w-6xl overflow-hidden flex flex-col lg:flex-row animate-blur-in bg-white/80 border-white/20 border rounded-3xl shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      {/* Left / Form */}
      <div className="w-full lg:w-1/2 sm:p-8 md:p-12 lg:p-16 pt-6 pr-6 pb-6 pl-6">
        {/* Brand */}
        <div className="inline-flex items-center px-3 py-1 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-medium mb-12 font-geist animate-fade-up delay-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
            <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
            <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
          </svg>
          RTMS
        </div>

        {/* Header */}
        <h1 className="text-3xl lg:text-4xl text-slate-900 tracking-tight font-space-grotesk animate-fade-up delay-200">Welcome Back</h1>
        <p className="text-slate-600 mt-2 text-base font-geist animate-fade-up delay-300">Sign in to your account</p>

        {/* Error Message */}
        {error && (
          <div className="animate-fade-up delay-300 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-geist">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <div className="animate-slide-right delay-400">
            <label className="sr-only font-geist" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="Email address"
              className="w-full rounded-xl py-3 px-4 border border-slate-200 bg-white/50 placeholder-slate-400 text-slate-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative animate-slide-right delay-500">
            <label className="sr-only font-geist" htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full rounded-xl py-3 px-4 pr-12 border border-slate-200 bg-white/50 placeholder-slate-400 text-slate-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 inset-y-0 my-auto h-full flex items-center justify-center text-slate-400 hover:text-violet-600 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-end animate-slide-right delay-500">
            <Link href="/v1/forgot-password" className="text-sm text-violet-600 hover:text-violet-700 font-medium font-geist">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full hover:from-violet-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 animate-scale-up delay-600 font-medium text-white font-geist bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl pt-3 pr-6 pb-3 pl-6 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(to right, #7c3aed, #9333ea)', color: 'white' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          
          {/* Social login buttons removed as per request */ }
        </form>

        {/* Footer Links */}
        <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 space-y-3 sm:space-y-0 animate-fade-up delay-900">
          <span className="font-geist">Don't have an account? <Link href="/v1/sign-up" className="text-violet-600 hover:text-violet-700 font-medium font-geist">Sign up</Link></span>
          <a href="#" className="hover:text-slate-700 underline font-geist">Terms & Privacy</a>
        </div>
      </div>

      {/* Right / Illustration */}
      <div className="w-full lg:w-1/2 relative min-h-[16rem] sm:min-h-[20rem] lg:min-h-[36rem] overflow-hidden animate-blur-in delay-200 bg-[url(https://cdn.midjourney.com/ddbd3d4d-dfb1-47cc-9964-ea9c84f0faa9/0_3.png?w=800&q=80)] bg-cover bg-center">
        {/* Animated Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-violet-900/60 to-violet-900/20"></div>

        {/* content container */}
        <div className="absolute inset-0 p-12 flex flex-col justify-end z-20">
            <h2 className="text-3xl font-bold text-white mb-4 font-space-grotesk animate-fade-up delay-400">Rig Training <br/> Management System</h2>
            <p className="text-white/80 text-base mb-8 font-geist max-w-md animate-fade-up delay-500">
                Centralized Workforce Training Intelligence Platform. Track training records, manage expiry dates, and plan training batches intelligently.
            </p>

            <div className="flex gap-3 flex-wrap animate-fade-up delay-600">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-medium font-geist">Employee Profiles</span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-medium font-geist">Automated Reminders</span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-medium font-geist">Smart Dashboards</span>
            </div>
        </div>
        
        {/* Compliance Card */}
        <div className="absolute top-8 right-8 glass-card z-10 animate-slide-right delay-600 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] text-white rounded-xl pt-4 pr-5 pb-4 pl-5">
          <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-sm text-white/70 font-geist mb-1">Compliance Rate</p>
                <h3 className="text-2xl font-bold font-space-grotesk">98%</h3>
            </div>
            <div className="flex items-center text-emerald-300 text-xs font-medium bg-emerald-500/20 px-2 py-1 rounded-lg">
                <span className="mr-1">↑</span> 2.1%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
