"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const Footer = () => {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { rootMargin: "-100px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <footer
      ref={ref}
      className={`footer-dark ${isInView ? "footer-visible" : ""}`}
    >
      {/* Vertical Lines */}
      <div className="footer-vertical-lines">
        <div className="footer-vline" style={{ left: 0 }} />
        <div className="footer-vline" style={{ left: "33.33%" }} />
        <div className="footer-vline" style={{ left: "66.66%" }} />
        <div className="footer-vline" style={{ right: 0, left: "auto" }} />
      </div>

      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand footer-animate" style={{ animationDelay: "0s" }}>
            <Link href="/" className="footer-logo">
              <Shield size={22} />
              <span>RTMS</span>
            </Link>
            <p className="footer-description">
              Centralized Workforce Training Intelligence Platform. Track training
              records, manage expiry dates, and plan training batches intelligently
              for rig employees.
            </p>
          </div>

          {/* Product Links */}
          <div className="footer-col footer-animate" style={{ animationDelay: "0.1s" }}>
            <h4 className="footer-heading">Features</h4>
            <ul className="footer-links">
              <li>
                <Link href="/#features">Employee Profiles</Link>
              </li>
              <li>
                <Link href="/#features">Training Tracking</Link>
              </li>
              <li>
                <Link href="/#features">Smart Dashboards</Link>
              </li>
              <li>
                <Link href="/#features">Automated Reminders</Link>
              </li>
              <li>
                <Link href="/#status">Expiry Monitoring</Link>
              </li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="footer-col footer-animate" style={{ animationDelay: "0.2s" }}>
            <h4 className="footer-heading">Solutions</h4>
            <ul className="footer-links">
              <li>
                <Link href="/#features">For Drilling Rigs</Link>
              </li>
              <li>
                <Link href="/#features">For Onfshore Crews</Link>
              </li>
              <li>
                <Link href="/#features">For Safety Teams</Link>
              </li>
              <li>
                <Link href="/#features">For Rig Managers</Link>
              </li>
              <li>
                <Link href="/#features">For HR Departments</Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="footer-col footer-animate" style={{ animationDelay: "0.3s" }}>
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li>
                <Link href="/">About</Link>
              </li>
              <li>
                <Link href="/#features">Features</Link>
              </li>
              <li>
                <Link href="/sign-in">Contact</Link>
              </li>
              <li>
                <Link href="/sign-up">Get Started</Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="footer-col footer-animate" style={{ animationDelay: "0.4s" }}>
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li>
                <Link href="#">Privacy</Link>
              </li>
              <li>
                <Link href="#">Terms</Link>
              </li>
              <li>
                <Link href="#">Security</Link>
              </li>
              <li>
                <Link href="#">Cookies</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom footer-animate" style={{ animationDelay: "0.5s" }}>
          <div className="footer-copyright">
            © {new Date().getFullYear()} RTMS. All rights reserved.
          </div>
        </div>

        {/* Giant Background Text */}
        <div className={`footer-bg-text ${isInView ? "footer-bg-text-visible" : ""}`}>
          <span>RTMS</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
