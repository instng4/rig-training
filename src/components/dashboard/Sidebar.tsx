'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Settings,
  Shield,
  Building2,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

// Employee-only navigation
const employeeNavItems: NavItem[] = [
  { href: '/my-dashboard', label: 'My Dashboard', icon: <UserCircle size={20} />, roles: ['employee'] },
];

// Admin navigation (rig_admin and super_admin)
const adminNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['rig_admin', 'super_admin'] },
  { href: '/employees', label: 'Employees', icon: <Users size={20} />, roles: ['rig_admin', 'super_admin'] },
  { href: '/training', label: 'Training Records', icon: <GraduationCap size={20} />, roles: ['rig_admin', 'super_admin'] },
];

// Super admin only navigation
const superAdminNavItems: NavItem[] = [
  { href: '/admin/rigs', label: 'Manage Rigs', icon: <Building2 size={20} />, roles: ['super_admin'] },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} />, roles: ['super_admin', 'rig_admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userMetadata, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userRole = userMetadata.role || 'employee';

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const filteredAdminItems = adminNavItems.filter(
    item => !item.roles || item.roles.includes(userRole)
  );

  const filteredSuperAdminItems = superAdminNavItems.filter(
    item => !item.roles || item.roles.includes(userRole)
  );

  // Get main nav items based on role
  const mainNavItems = userRole === 'employee' 
    ? employeeNavItems 
    : filteredAdminItems;

  const displayName = userMetadata.firstName && userMetadata.lastName
    ? `${userMetadata.firstName} ${userMetadata.lastName}`
    : user?.email?.split('@')[0] || 'User';

  // Logo href based on role
  const logoHref = userRole === 'employee' ? '/my-dashboard' : '/dashboard';

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
          <Link href={logoHref} className="sidebar-logo">
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

          {filteredSuperAdminItems.length > 0 && (
            <div className="nav-section">
              <div className="nav-section-title">Administration</div>
              {filteredSuperAdminItems.map(item => (
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

        <div className="sidebar-footer" ref={userMenuRef}>
          <div 
            className="flex items-center gap-3"
            style={{ 
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius)',
              transition: 'background 0.2s',
            }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Avatar 
              photoUrl={userMetadata.avatarUrl} 
              name={displayName} 
              size="sm" 
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-sm font-medium truncate" style={{ maxWidth: '140px' }}>
                {loading ? 'Loading...' : displayName}
              </div>
              <div className="text-xs text-muted">{userRole.replace('_', ' ')}</div>
            </div>
            <ChevronDown 
              size={16} 
              style={{ 
                color: 'var(--muted-foreground)',
                transition: 'transform 0.2s',
                transform: showUserMenu ? 'rotate(180deg)' : 'none',
              }} 
            />
          </div>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '0.75rem',
              right: '0.75rem',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: '0.5rem',
              overflow: 'hidden',
            }}>
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--danger)',
                  fontSize: '0.875rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
