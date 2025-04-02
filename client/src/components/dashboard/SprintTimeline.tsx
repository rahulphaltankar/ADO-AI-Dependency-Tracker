import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workItemsApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SprintTimeline = () => {
  const { data: workItems, isLoading } = useQuery({
    queryKey: ['/api/work-items'],
    queryFn: workItemsApi.getAll
  });

  // Organize work items by team and sprint
  const organizeByTeamAndSprint = () => {
    if (!workItems) return {};

    const teams: Record<string, any> = {};
    
    workItems.forEach(item => {
      const team = item.team || 'Unassigned';
      if (!teams[team]) {
        teams[team] = { name: team, items: [] };
      }
      teams[team].items.push(item);
    });

    return teams;
  };

  const teams = organizeByTeamAndSprint();
  const sprints = ['Sprint 7', 'Sprint 8', 'Sprint 9', 'Sprint 10', 'Sprint 11'];
  
  // Determine the current sprint based on the date
  const currentSprint = 'Sprint 9'; // In a real app, calculate this from the date
  
  // Find the position of the current date based on the sprint
  const currentSprintIndex = sprints.indexOf(currentSprint);
  const currentDatePosition = 20 + (currentSprintIndex * 20) + 10; // 20% per sprint + 10% within the current sprint

  return (
    <Card className="mt-6">
      <div className="p-5 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Sprint Timeline with Risk Overlay</h3>
          <div className="flex items-center space-x-2">
            <select className="text-sm border border-neutral-300 rounded-md py-1 px-2">
              <option>Current Quarter</option>
              <option>Next Quarter</option>
              <option>Custom Range</option>
            </select>
            <button className="text-sm text-primary hover:underline flex items-center">
              <span className="material-icons text-sm align-text-bottom mr-1">fullscreen</span>
              Expand
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-5 overflow-x-auto">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="min-w-[900px] relative">
            {/* Timeline header */}
            <div className="flex border-b border-neutral-200 pb-2">
              <div className="w-32"></div>
              <div className="flex-1 flex">
                {sprints.map((sprint, index) => {
                  const status = index < currentSprintIndex 
                    ? '(Completed)' 
                    : index === currentSprintIndex 
                      ? '(In Progress)' 
                      : '(Planned)';
                      
                  return (
                    <div key={sprint} className="flex-1 text-xs font-medium text-center">
                      {sprint}<br/>{status}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Timeline rows */}
            <div className="mt-4">
              {Object.values(teams).map((team: any, teamIndex) => (
                <div className="flex items-center mb-4" key={team.name}>
                  <div className="w-32 text-sm font-medium">{team.name}</div>
                  <div className="flex-1 flex relative h-8">
                    {team.items.map((item: any) => {
                      // Determine the sprint range
                      let sprintRange = item.sprint;
                      let startSprint = sprintRange;
                      let endSprint = sprintRange;
                      
                      if (sprintRange.includes('-')) {
                        [startSprint, endSprint] = sprintRange.split('-');
                      }
                      
                      // Calculate the position and width
                      const startIndex = sprints.indexOf(startSprint);
                      const endIndex = sprints.indexOf(endSprint);
                      const left = startIndex * 20; // 20% per sprint
                      const width = ((endIndex - startIndex) + 1) * 20; // 20% per sprint
                      
                      // Determine the color based on risk
                      let bgColor = 'bg-primary bg-opacity-20';
                      let textColor = 'text-primary';
                      let hasWarning = false;
                      
                      if (item.adoId === 456 || item.adoId === 457) {
                        bgColor = 'bg-error bg-opacity-20';
                        textColor = 'text-error';
                        hasWarning = true;
                      } else if (item.adoId === 234) {
                        bgColor = 'bg-warning bg-opacity-20';
                        textColor = 'text-warning';
                        hasWarning = true;
                      }
                      
                      const isDone = startIndex < currentSprintIndex;
                      if (isDone) {
                        bgColor = 'bg-success bg-opacity-20';
                        textColor = 'text-success';
                        hasWarning = false;
                      }
                      
                      return (
                        <div 
                          key={item.id}
                          className={`absolute h-full ${bgColor} rounded flex items-center justify-center ${hasWarning ? 'border border-dashed' : ''} ${hasWarning && !isDone ? (item.adoId === 456 ? 'border-error' : 'border-warning') : ''}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          <span className={`text-xs ${textColor} font-medium`}>
                            {item.adoId}
                          </span>
                          {hasWarning && !isDone && (
                            <span className={`material-icons text-xs ml-1 ${item.adoId === 456 ? 'text-error' : 'text-warning'}`}>
                              warning
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Current date marker */}
            <div 
              className="absolute h-[200px] border-l-2 border-primary border-dashed"
              style={{ left: `${currentDatePosition}%`, top: '40px' }}
            >
              <div className="absolute -top-6 -left-16 text-xs font-medium bg-primary text-white rounded-full px-2 py-0.5">
                Current Date
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SprintTimeline;
