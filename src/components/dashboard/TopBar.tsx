'use client';

import { Search, Bell } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  onSearch?: (query: string) => void;
}

export function TopBar({ onSearch }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
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
      </div>
    </div>
  );
}
