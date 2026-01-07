import Link from 'next/link';
import { Shield, Users, GraduationCap, BarChart3, Bell, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div className="flex items-center gap-2">
            <Shield size={28} style={{ color: 'var(--primary-600)' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>RTMS</span>
          </div>
          <div className="flex gap-3">
            <Link href="/sign-in" className="btn btn-secondary">
              Sign In
            </Link>
            <Link href="/sign-up" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        padding: '5rem 1.5rem', 
        textAlign: 'center',
        background: 'linear-gradient(180deg, var(--primary-50) 0%, var(--background) 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 800, 
            lineHeight: 1.2,
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-500) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Rig Training Management System
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--muted)',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem',
          }}>
            Centralized Workforce Training Intelligence Platform. Track training records, 
            manage expiry dates, and plan training batches intelligently.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={20} />
            </Link>
            <Link href="/sign-in" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '3rem',
            fontSize: '2rem',
            fontWeight: 700,
          }}>
            Everything You Need for Training Management
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            <FeatureCard 
              icon={<Users size={24} />}
              title="Employee Profiles"
              description="Maintain comprehensive profiles with personal details, duty patterns, and training history for every rig employee."
            />
            <FeatureCard 
              icon={<GraduationCap size={24} />}
              title="Training Tracking"
              description="Track MVT, IWCF, Fire, First Aid, PME and custom training types with automatic expiry monitoring."
            />
            <FeatureCard 
              icon={<BarChart3 size={24} />}
              title="Smart Dashboards"
              description="Role-based dashboards for employees, rig admins, and super admins with real-time training status."
            />
            <FeatureCard 
              icon={<Bell size={24} />}
              title="Automated Reminders"
              description="PME reminder emails for upcoming and overdue training with customizable templates."
            />
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section style={{ 
        padding: '4rem 1.5rem',
        background: 'var(--card-bg)',
        borderTop: '1px solid var(--card-border)',
        borderBottom: '1px solid var(--card-border)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>
            Intelligent Status Tracking
          </h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '2rem',
            flexWrap: 'wrap',
          }}>
            <StatusIndicator 
              color="var(--status-safe)" 
              bgColor="var(--status-safe-bg)"
              label="SAFE"
              description="Training is valid"
            />
            <StatusIndicator 
              color="var(--status-upcoming)" 
              bgColor="var(--status-upcoming-bg)"
              label="UPCOMING"
              description="Expiring within grace period"
            />
            <StatusIndicator 
              color="var(--status-overdue)" 
              bgColor="var(--status-overdue-bg)"
              label="OVERDUE"
              description="Training has expired"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '2rem 1.5rem',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.875rem',
      }}>
        <p>© {new Date().getFullYear()} RTMS - Rig Training Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '3rem', 
        height: '3rem', 
        borderRadius: 'var(--radius-lg)',
        background: 'var(--primary-100)',
        color: 'var(--primary-600)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem',
      }}>
        {icon}
      </div>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>{title}</h3>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{description}</p>
    </div>
  );
}

function StatusIndicator({ color, bgColor, label, description }: {
  color: string;
  bgColor: string;
  label: string;
  description: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '4rem',
        height: '4rem',
        borderRadius: '50%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 0.75rem',
      }}>
        <div style={{
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '50%',
          background: color,
        }} />
      </div>
      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{description}</div>
    </div>
  );
}
