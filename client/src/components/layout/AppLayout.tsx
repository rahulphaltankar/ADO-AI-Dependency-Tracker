import React from 'react';
import SideNavigation from './SideNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Mock user data for development - in production this would come from auth
  const user = {
    name: 'Demo User',
    email: 'user@example.com'
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <SideNavigation user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;