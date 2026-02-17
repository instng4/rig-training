'use client';

import { Search, Bell, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';

interface TopBarProps {
  onSearch?: (query: string) => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="top-bar">
      <form onSubmit={handleSearch} className="search-input" style={{ maxWidth: '400px', flex: 1 }}>
        <Search className="search-icon" size={16} />
        <input
          type="text"
          placeholder="Search employees, training..."
          className="input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="flex items-center gap-3">
        <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <Bell size={20} />
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleSignOut}
          title="Sign out"
          style={{ 
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <LogOut size={18} />
          <span className="logout-text" style={{ fontSize: '0.875rem' }}>Logout</span>
        </button>
      </div>
    </div>
  );
}
