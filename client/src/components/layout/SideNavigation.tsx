import React from 'react';
import { Link, useLocation } from 'wouter';

interface SideNavigationProps {
  user: {
    name: string;
    email: string;
  };
}

const SideNavigation = ({ user }: SideNavigationProps) => {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  // Helper function to create navigation items
  const NavItem = ({ to, icon, label, badge }: { to: string, icon: string, label: string, badge?: React.ReactNode }) => (
    <Link href={to}>
      <div className={`flex items-center cursor-pointer ${isActive(to) ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
        <span className="material-icons text-sm mr-3">{icon}</span>
        <span>{label}</span>
        {badge}
      </div>
    </Link>
  );

  return (
    <div className="w-64 h-full bg-white shadow-md flex flex-col z-10">
      <div className="p-4 border-b border-neutral-200 flex items-center">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="material-icons text-white text-xl">bubble_chart</span>
        </div>
        <h1 className="ml-3 font-semibold text-lg">ADO-AI Tracker</h1>
      </div>
      
      <div className="overflow-y-auto scrollbar-thin flex-1">
        <div className="p-2">
          <div className="text-neutral-500 text-xs font-medium uppercase px-3 py-2">Main</div>
          
          <NavItem to="/" icon="dashboard" label="Dashboard" />
          <NavItem to="/dependencies" icon="account_tree" label="Dependencies" />
          <NavItem to="/work-items" icon="view_kanban" label="Work Items" />
          <NavItem to="/sprint-timeline" icon="timeline" label="Sprint Timeline" />
          <NavItem to="/analytics" icon="analytics" label="Analytics" />
          
          <div className="text-neutral-500 text-xs font-medium uppercase px-3 py-2 mt-4">AI Tools</div>
          
          <NavItem to="/ai-analysis" icon="psychology" label="AI Analysis" />
          
          <NavItem 
            to="/physics-settings" 
            icon="science" 
            label="Physics Settings" 
            badge={<span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">New</span>}
          />
          
          <NavItem 
            to="/alerts" 
            icon="notifications" 
            label="Alerts" 
            badge={<span className="ml-auto bg-error text-white text-xs px-2 py-0.5 rounded-full">3</span>}
          />
          
          <div className="text-neutral-500 text-xs font-medium uppercase px-3 py-2 mt-4">Configuration</div>
          
          <NavItem to="/settings" icon="settings" label="Settings" />
          <NavItem to="/help" icon="help_outline" label="Help & Support" />
        </div>
      </div>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
            <span className="material-icons text-sm">person</span>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-neutral-500">{user.email}</div>
          </div>
          <div 
            onClick={() => window.location.href = '/settings'}
            className="ml-auto text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <span className="material-icons text-lg">settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideNavigation;
