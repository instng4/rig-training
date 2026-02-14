'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Mail, Shield, Loader2, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
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
            background: 'var(--success-100)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <Mail size={32} color="var(--success-600)" />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: 'var(--foreground)',
          }}>Check your email</h1>
          <p style={{
            color: 'var(--muted-foreground)',
            marginBottom: '2rem',
          }}>
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
            Please click the link to reset your password.
          </p>
          <Link href="/sign-in" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
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
        }}>Forgot your password?</h1>
        <p style={{
          textAlign: 'center',
          color: 'var(--muted-foreground)',
          marginBottom: '2rem',
        }}>Enter your email and we&apos;ll send you a reset link</p>

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
          <div style={{ marginBottom: '1.5rem' }}>
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spinner" />
                Sending reset link...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'var(--muted-foreground)',
          fontSize: '0.875rem',
        }}>
          <Link href="/sign-in" style={{
            color: 'var(--primary)',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
