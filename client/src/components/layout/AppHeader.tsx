import React, { useState } from 'react';
import { useLocation } from 'wouter';

interface AppHeaderProps {
  title: string;
  onMenuClick: () => void;
}

const AppHeader = ({ title, onMenuClick }: AppHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="text-neutral-500 hover:text-neutral-700 focus:outline-none"
          >
            <span className="material-icons mr-4">menu</span>
          </button>
          <div className="text-lg font-semibold">{title}</div>
        </div>
        
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Search work items..." 
              className="pl-9 pr-4 py-1.5 rounded-md border border-neutral-300 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-icons text-neutral-400 absolute left-2 top-1.5 text-lg">search</span>
          </form>
          
          <button 
            className="text-neutral-500 hover:bg-neutral-100 rounded-full p-2 focus:outline-none"
            onClick={() => navigate('/help')}
          >
            <span className="material-icons">help_outline</span>
          </button>
          
          <button 
            className="text-neutral-500 hover:bg-neutral-100 rounded-full p-2 relative focus:outline-none"
            onClick={() => navigate('/alerts')}
          >
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
