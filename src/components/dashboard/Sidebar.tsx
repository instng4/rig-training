'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Settings,
  Shield,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/employees', label: 'Employees', icon: <Users size={20} /> },
  { href: '/training', label: 'Training Records', icon: <GraduationCap size={20} /> },
];

const adminNavItems: NavItem[] = [
  { href: '/admin/rigs', label: 'Manage Rigs', icon: <Building2 size={20} />, roles: ['super_admin'] },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} />, roles: ['super_admin', 'rig_admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('employee');

  // Get role from user metadata
  useEffect(() => {
    if (user?.publicMetadata?.role) {
      setUserRole(user.publicMetadata.role as string);
    }
  }, [user]);

  const filteredAdminItems = adminNavItems.filter(
    item => !item.roles || item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="btn btn-secondary"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 60,
          display: 'none',
        }}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 45,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo">
            <Shield size={24} />
            <span>RTMS</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            {mainNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {filteredAdminItems.length > 0 && (
            <div className="nav-section">
              <div className="nav-section-title">Administration</div>
              {filteredAdminItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div>
              <div className="text-sm font-medium truncate" style={{ maxWidth: '160px' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-muted">{userRole.replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
