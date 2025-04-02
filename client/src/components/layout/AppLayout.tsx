import React, { useState } from 'react';
import SideNavigation from './SideNavigation';
import AppHeader from './AppHeader';
import { useLocation } from 'wouter';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();
  
  // Determine page title based on current route
  const getPageTitle = () => {
    const routes = {
      '/': 'Dashboard',
      '/dependencies': 'Dependencies',
      '/work-items': 'Work Items',
      '/sprint-timeline': 'Sprint Timeline',
      '/analytics': 'Analytics',
      '/ai-analysis': 'AI Analysis',
      '/alerts': 'Alerts',
      '/settings': 'Settings',
      '/help': 'Help & Support'
    };
    
    return routes[location as keyof typeof routes] || 'ADO-AI Tracker';
  };

  // Mock user data (would come from auth context in a real app)
  const user = {
    name: 'Alex Johnson',
    email: 'alex.j@contoso.com'
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - conditionally rendered based on sidebarOpen state */}
      {sidebarOpen && (
        <SideNavigation user={user} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader 
          title={getPageTitle()} 
          onMenuClick={toggleSidebar} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-neutral-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
