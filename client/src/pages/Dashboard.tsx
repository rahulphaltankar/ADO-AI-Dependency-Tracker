import React from 'react';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DependencyGraph from '@/components/dashboard/DependencyGraph';
import AIConsole from '@/components/dashboard/AIConsole';
import SprintTimeline from '@/components/dashboard/SprintTimeline';
import WorkItems from '@/components/dashboard/WorkItems';

const Dashboard = () => {
  return (
    <div>
      <DashboardOverview />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <DependencyGraph />
        <AIConsole />
      </div>

      <SprintTimeline />
      <WorkItems />
    </div>
  );
};

export default Dashboard;
