"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight, ArrowRight, Plus, Rocket, MessageCircle, Sun, Moon, Monitor, Users, BarChart3, Bell } from 'lucide-react';
import Footer from '@/components/Footer';

type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('rtms-theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    const apply = theme === 'system' ? getSystemTheme() : theme;
    setResolved(apply);
    localStorage.setItem('rtms-theme', theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') setResolved(getSystemTheme());
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const cycleTheme = () => {
    const order: Theme[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(theme) + 1) % 3];
    setTheme(next);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
  };

  const handleNavClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      document.body.style.overflow = '';
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleNavClick();
  };

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'Tracking', href: '#tracking' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="landing-page" data-theme={resolved}>
      {/* Navigation */}
      <header className={`landing-nav ${isScrolled ? 'landing-nav-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link href="/" className="landing-logo" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
            <div className="landing-logo-icon">R</div>
            <span className="landing-logo-text">RTMS</span>
          </Link>
          <nav className="landing-nav-links">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="landing-nav-link" onClick={handleNavClick}>
                {link.label}
              </a>
            ))}
            <Link href="/sign-up" className="landing-nav-cta" onClick={handleNavClick}>
              Get Started
            </Link>
          </nav>
          <div className="landing-nav-actions">
            <button
              className="theme-toggle"
              onClick={cycleTheme}
              aria-label={`Theme: ${theme}`}
              title={`Theme: ${theme}`}
            >
              <ThemeIcon size={16} />
            </button>
            <Link href="/sign-in" className="landing-nav-login">Log In</Link>
            <button className="landing-nav-menu-btn" onClick={toggleMenu} aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <div className={`landing-mobile-menu ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="landing-mobile-menu-top">
          <Link href="/" className="landing-logo" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
            <div className="landing-logo-icon">R</div>
            <span className="landing-logo-text">RTMS</span>
          </Link>
          <button className="landing-nav-menu-btn" onClick={toggleMenu} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="landing-mobile-menu-links">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="landing-mobile-link" onClick={handleNavClick}>
              {link.label}
            </a>
          ))}
          <Link href="/sign-up" className="landing-mobile-cta" onClick={handleNavClick}>
            Get Started
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <main className="landing-main">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-hero-glow" />
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Live Dashboard
          </div>
          <h1>
            Rig Training <br />
            <span className="landing-hero-gradient">Management</span>{' '}
            <span className="landing-hero-pill">System</span>
          </h1>
          <p>
            Centralized Workforce Training Intelligence Platform. Track training records, 
            manage expiry dates, and plan training batches intelligently.
          </p>
          <div className="landing-hero-ctas">
            <Link href="/sign-up" className="landing-cta-primary">
              Sign Up
              <span className="cta-arrow"><ArrowUpRight size={18} /></span>
            </Link>
            <Link href="/sign-in" className="landing-cta-secondary">
              Sign In
            </Link>
          </div>
        </section>

        {/* Scrolling Marquee */}
        <div className="landing-marquee">
          <div className="landing-marquee-track">
            <span>// 100% Compliance</span>
            <span className="marquee-star">★</span>
            <span>Zero Downtime</span>
            <span className="marquee-star">★</span>
            <span>Automated Safety</span>
            <span className="marquee-star">★</span>
            <span>Real-time Sync</span>
            <span className="marquee-star">★</span>
            <span>// 100% Compliance</span>
            <span className="marquee-star">★</span>
            <span>Zero Downtime</span>
            <span className="marquee-star">★</span>
            <span>Automated Safety</span>
            <span className="marquee-star">★</span>
            <span>Real-time Sync</span>
          </div>
        </div>

        {/* Core Features */}
        <section id="features" className="landing-features">
          <div className="landing-section-header">
            <span className="landing-section-num">01</span>
            <span className="landing-section-line" />
            <span className="landing-section-label">Core Features</span>
          </div>
          <h2>Rig management <br /> made effortless.</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-card-top">
                <div className="landing-feature-icon"><Users size={24} /></div>
                <ArrowRight size={20} className="landing-feature-arrow" />
              </div>
              <h3>Employee Profiles</h3>
              <p>Centralized database for all rig personnel with detailed certification history and skills matrix.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-card-top">
                <div className="landing-feature-icon"><BarChart3 size={24} /></div>
                <ArrowRight size={20} className="landing-feature-arrow" />
              </div>
              <h3>Smart Dashboards</h3>
              <p>Visual analytics of workforce readiness. Spot gaps in training coverage instantly.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-card-top">
                <div className="landing-feature-icon"><Bell size={24} /></div>
                <ArrowRight size={20} className="landing-feature-arrow" />
              </div>
              <h3>Automated Reminders</h3>
              <p>Never miss a renewal. System auto-notifies personnel and managers before certs expire.</p>
            </div>
          </div>
        </section>

        {/* Real-time Status Tracking */}
        <section id="tracking" className="landing-status">
          <div className="landing-status-glow" />
          <div className="landing-status-content">
            <span className="landing-status-badge">Intelligence</span>
            <h2>Real-time Status Tracking</h2>
            <p>Color-coded indicators give you an immediate overview of compliance health across your entire fleet.</p>
            <div className="landing-status-card">
              <div className="landing-status-rows">
                <div className="landing-status-row">
                  <div className="landing-status-row-left">
                    <div className="landing-status-avatar" />
                    <div>
                      <div className="landing-status-name">Drilling Engineer / SIC </div>
                      <div className="landing-status-cert">IWCF Level 3 Certification</div>
                    </div>
                  </div>
                  <span className="landing-status-tag landing-status-tag-safe">VALID</span>
                </div>
                <div className="landing-status-row">
                  <div className="landing-status-row-left">
                    <div className="landing-status-avatar" />
                    <div>
                      <div className="landing-status-name">Installation Manager / DIC</div>
                      <div className="landing-status-cert">IWCF Level 4 Certification</div>
                    </div>
                  </div>
                  <span className="landing-status-tag landing-status-tag-upcoming">UPCOMING</span>
                </div>
                <div className="landing-status-row">
                  <div className="landing-status-row-left">
                    <div className="landing-status-avatar" />
                    <div>
                      <div className="landing-status-name">Deck Crew</div>
                      <div className="landing-status-cert">First Aid Training</div>
                    </div>
                  </div>
                  <span className="landing-status-tag landing-status-tag-overdue">OVERDUE</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="landing-cta-section">
          <div className="cta-texture" />
          <h2>Ready to secure your workforce?</h2>
          <p>Start managing your workforce training intelligence with RTMS today.</p>
          <Link href="/sign-up" className="landing-cta-black">
            Get Started Now
            <Rocket size={20} />
          </Link>
        </section>

        {/* FAQ */}
        <section id="faq" className="landing-faq-section">
          <div className="landing-faq-card">
            <div className="landing-faq-card-inner">
              {/* Left - Intro */}
              <div className="landing-faq-intro">
                <h2 className="landing-faq-title">Questions.</h2>
                <p className="landing-faq-subtitle">
                  Find answers to common questions about the RTMS portal, roles, access, and data security.
                </p>
                <a href="mailto:ongcanktraining@gmail.com" className="landing-faq-contact">
                  <span>Get in touch</span>
                  <MessageCircle size={16} />
                </a>
              </div>

              {/* Right - Accordion */}
              <div className="landing-faq-accordion">
                {[
                  {
                    question: 'Is my data safe on this platform?',
                    answer: 'Yes, absolutely. RTMS is built on Supabase with enterprise-grade security, including row-level security policies, encrypted connections (SSL/TLS), and secure authentication. Your training records and employee data are fully protected and only accessible to authorised personnel based on their role.',
                  },
                  {
                    question: 'What are the different user roles and what access does each role have?',
                    answer: 'RTMS has three roles: Super Admin has full access to all rigs, employees, training records, settings, and rig management. Rig Admin can access the Dashboard, Employees, and Training Records scoped to their assigned rig, along with Settings. Employee can only access their personal dashboard (My Dashboard) to view and update their own training details.',
                  },
                  {
                    question: 'How can I add my details as an employee?',
                    answer: 'After signing up, log in to the portal. You will be directed to "My Dashboard" where you can fill in your personal details such as name, CPF, phone number, address, date of birth, and rig assignment. Your Rig Admin or Super Admin can also add your profile from the Employees section.',
                  },
                  {
                    question: 'Who can be a Super Admin or Rig Admin?',
                    answer: 'The Super Admin role is typically assigned to senior training managers or HQ personnel who oversee all rigs. The Rig Admin role is assigned to rig-level supervisors or training coordinators responsible for a specific rig. These roles are assigned by an existing Super Admin through the employee management system.',
                  },
                  {
                    question: 'My rig is not showing up in the portal. What should I do?',
                    answer: 'Rigs are managed by the Super Admin through the "Manage Rigs" section. If your rig is not listed, please contact your Super Admin to add it. If the issue persists, send an email to ongcanktraining@gmail.com with your rig name and details.',
                  },
                  {
                    question: 'I am unable to access rig employees or other sections. Why?',
                    answer: 'Access is role-based. If you are logged in as an Employee, you can only view your own dashboard. The Employees, Training Records, and Dashboard sections are accessible only to Rig Admins and Super Admins. If you believe your role is incorrect, contact your Rig Admin or Super Admin to update it.',
                  },
                  {
                    question: 'I am facing an issue or need help. How can I get support?',
                    answer: 'For any technical issues, access problems, or general queries, you can directly reach out to us by sending an email to ongcanktraining@gmail.com. Please include a brief description of your issue, your registered email, and screenshots if possible. We will get back to you as soon as we can.',
                  },
                ].map((faq, index) => (
                  <div
                    key={index}
                    className={`landing-faq-item ${openFaq === index ? 'faq-open' : ''}`}
                    onClick={() => toggleFaq(index)}
                  >
                    <button className="landing-faq-item-header" type="button">
                      <span className="landing-faq-question">{faq.question}</span>
                      <Plus size={20} className="faq-icon" />
                    </button>
                    <div className="landing-faq-answer">
                      {faq.answer.split('ongcanktraining@gmail.com').length > 1 ? (
                        <>
                          {faq.answer.split('ongcanktraining@gmail.com')[0]}
                          <a href="mailto:ongcanktraining@gmail.com" className="landing-faq-email-link">ongcanktraining@gmail.com</a>
                          {faq.answer.split('ongcanktraining@gmail.com')[1]}
                        </>
                      ) : faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Chat Button */}
      <button className="landing-chat-fab">
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
