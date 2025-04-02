import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { sprintApi } from '@/lib/api';
import { Card } from '@/components/ui/card';

const DashboardOverview = () => {
  // Fetch sprint status
  const { data: sprintStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['/api/sprint-status'],
    queryFn: () => sprintApi.getStatus('Sprint 12')
  });

  // Fetch team velocity
  const { data: velocityData, isLoading: isLoadingVelocity } = useQuery({
    queryKey: ['/api/team-velocity'],
    queryFn: sprintApi.getVelocity
  });

  // Get the latest sprint data for the velocity chart
  const sprintVelocityData = velocityData?.slice(-5) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Sprint Status Card */}
      <Card className="bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-700">Current Sprint Status</h3>
          <span className="text-xs text-neutral-500">Sprint 12</span>
        </div>
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-primary">
              {isLoadingStatus ? '...' : `${sprintStatus?.completionPercentage || 0}%`}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">
              {isLoadingStatus 
                ? 'Loading...' 
                : `${sprintStatus?.completedStoryPoints || 0}/${sprintStatus?.totalStoryPoints || 0} Story Points Complete`
              }
            </div>
            <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${isLoadingStatus ? 0 : sprintStatus?.completionPercentage || 0}%` }}
              ></div>
            </div>
            <div className="text-xs text-neutral-500 mt-1">5 days remaining</div>
          </div>
        </div>
      </Card>

      {/* Dependency Risk Card */}
      <Card className="bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-700">Dependency Risk</h3>
          <span className="material-icons text-neutral-400 text-lg">info_outline</span>
        </div>
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mr-4">
            <span className="text-xl font-bold text-error">73%</span>
          </div>
          <div>
            <div className="text-sm font-medium mb-1 text-error">High Risk Level</div>
            <div className="text-xs">
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-error mr-2"></span> 4 Critical Dependencies</div>
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-warning mr-2"></span> 8 External Team Dependencies</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Team Velocity Card */}
      <Card className="bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-700">Team Velocity</h3>
          <select className="text-xs text-neutral-500 bg-transparent border-none">
            <option>Last 5 sprints</option>
            <option>Last 10 sprints</option>
          </select>
        </div>
        <div className="h-16 flex items-end justify-between">
          {isLoadingVelocity ? (
            <div className="w-full text-center text-neutral-500">Loading velocity data...</div>
          ) : (
            sprintVelocityData.map((sprint, index) => {
              // Calculate the bar height based on the total completed story points for all teams
              const totalCompleted = sprint.teams.reduce((sum, team) => sum + team.completed, 0);
              // Normalize to a value between 6 and 16 for visual appeal
              const barHeight = Math.max(6, Math.min(16, totalCompleted / 8));
              const isLatest = index === sprintVelocityData.length - 1;
              
              return (
                <div className="flex flex-col items-center" key={sprint.sprint}>
                  <div 
                    className={`h-${barHeight} w-8 ${isLatest ? 'bg-primary' : 'bg-primary-light'} rounded-t`}
                    style={{ height: `${barHeight * 0.25}rem` }}
                  ></div>
                  <div className={`text-xs mt-1 ${isLatest ? 'font-medium' : ''}`}>
                    {sprint.sprint.replace('Sprint ', 'S')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardOverview;
