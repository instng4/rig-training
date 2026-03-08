'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Mail, Lock, Eye, EyeOff, Shield, Loader2, User, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // OTP States
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [success, resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUpWithEmail(email, password, {
      firstName,
      lastName,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setResendCooldown(60);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 8) {
      setError('Please enter a valid 8-digit code');
      return;
    }
    setError(null);
    setOtpLoading(true);

    const { error } = await useAuth().verifyOtp(email, otp);

    if (error) {
      setError(error.message);
      setOtpLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendCooldown(60);
    const { error } = await useAuth().resendSignUpOtp(email);
    if (error) {
      setError(error.message);
    }
  };



  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--background) 100%)',
        padding: '2rem',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--primary-100)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <ShieldCheck size={32} color="var(--primary-600)" />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: 'var(--foreground)',
          }}>Verify your email</h1>
          <p style={{
            color: 'var(--muted-foreground)',
            marginBottom: '2rem',
          }}>
            We&apos;ve sent an 8-digit code to <strong>{email}</strong>. 
            Please enter it below.<br/>
            <span style={{ fontSize: '0.8rem' }}>(Check your spam folder if you don&apos;t see it)</span>
          </p>

          {error && (
            <div style={{
              background: 'var(--danger-50)',
              border: '1px solid var(--danger-200)',
              color: 'var(--danger-700)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} style={{ marginBottom: '2rem' }}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="00000000"
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5em',
                padding: '0.75rem',
                marginBottom: '1rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={otpLoading || otp.length !== 8}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {otpLoading ? <Loader2 size={18} className="spinner" /> : null}
              {otpLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
            Didn&apos;t receive the code?{' '}
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? 'var(--muted-foreground)' : 'var(--primary)',
                fontWeight: '500',
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                padding: 0,
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>

          <Link href="/sign-in" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--background) 100%)',
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '2.5rem',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Shield size={28} color="white" />
          </div>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--foreground)',
          }}>RTMS</span>
        </div>

        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: 'var(--foreground)',
        }}>Create an account</h1>
        <p style={{
          textAlign: 'center',
          color: 'var(--muted-foreground)',
          marginBottom: '2rem',
        }}>Get started with RTMS</p>

        {error && (
          <div style={{
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-200)',
            color: 'var(--danger-700)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--foreground)',
              }}>First Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted-foreground)',
                }} />
                <input
                  type="text"
                  className="input"
                  placeholder="John"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: 'var(--foreground)',
              }}>Last Name</label>
              <input
                type="text"
                className="input"
                placeholder="Doe"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--foreground)',
            }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
              }} />
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: 'var(--foreground)',
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'var(--muted-foreground)',
          fontSize: '0.875rem',
        }}>
          Already have an account?{' '}
          <Link href="/sign-in" style={{ color: 'var(--primary)', fontWeight: '500' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
