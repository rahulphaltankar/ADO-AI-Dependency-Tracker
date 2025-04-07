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
          
          <Link href="/">
            <a className={`flex items-center ${isActive('/') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">dashboard</span>
              <span>Dashboard</span>
            </a>
          </Link>
          
          <Link href="/dependencies">
            <a className={`flex items-center ${isActive('/dependencies') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">account_tree</span>
              <span>Dependencies</span>
            </a>
          </Link>
          
          <Link href="/work-items">
            <a className={`flex items-center ${isActive('/work-items') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">view_kanban</span>
              <span>Work Items</span>
            </a>
          </Link>
          
          <Link href="/sprint-timeline">
            <a className={`flex items-center ${isActive('/sprint-timeline') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">timeline</span>
              <span>Sprint Timeline</span>
            </a>
          </Link>
          
          <Link href="/analytics">
            <a className={`flex items-center ${isActive('/analytics') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">analytics</span>
              <span>Analytics</span>
            </a>
          </Link>
          
          <div className="text-neutral-500 text-xs font-medium uppercase px-3 py-2 mt-4">AI Tools</div>
          
          <Link href="/ai-analysis">
            <a className={`flex items-center ${isActive('/ai-analysis') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">psychology</span>
              <span>AI Analysis</span>
            </a>
          </Link>
          
          <Link href="/physics-settings">
            <a className={`flex items-center ${isActive('/physics-settings') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">science</span>
              <span>Physics Settings</span>
              <span className="ml-auto bg-primary text-white text-xs px-2 py-0.5 rounded-full">New</span>
            </a>
          </Link>
          
          <Link href="/alerts">
            <a className={`flex items-center ${isActive('/alerts') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">notifications</span>
              <span>Alerts</span>
              <span className="ml-auto bg-error text-white text-xs px-2 py-0.5 rounded-full">3</span>
            </a>
          </Link>
          
          <div className="text-neutral-500 text-xs font-medium uppercase px-3 py-2 mt-4">Configuration</div>
          
          <Link href="/settings">
            <a className={`flex items-center ${isActive('/settings') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">settings</span>
              <span>Settings</span>
            </a>
          </Link>
          
          <Link href="/help">
            <a className={`flex items-center ${isActive('/help') ? 'text-primary bg-blue-50' : 'text-neutral-700 hover:bg-neutral-100'} rounded-md px-3 py-2 mb-1`}>
              <span className="material-icons text-sm mr-3">help_outline</span>
              <span>Help & Support</span>
            </a>
          </Link>
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
          <Link href="/settings">
            <a className="ml-auto text-neutral-400 hover:text-neutral-600">
              <span className="material-icons text-lg">settings</span>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SideNavigation;
