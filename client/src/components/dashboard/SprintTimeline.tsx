import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workItemsApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Expand, DownloadIcon } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Work item with risk overlay for the timeline
interface WorkItemRisk {
  id: number;
  adoId: number;
  title: string;
  type: string;
  team: string;
  sprint: string;
  startSprint?: string;
  endSprint?: string;
  risk: number;
  dependencies: number;
  blockedBy?: number[];
  blocking?: number[];
  state: string;
}

const teams = [
  "Product Management",
  "Backend Team",
  "Data Science Team",
  "Database Team",
  "DevOps Team",
  "Frontend Team",
  "UX Team",
  "QA Team",
  "Security Team",
  "Performance Team"
];

// Sample sprint work item data for timeline rendering (demo purpose)
const sprintWorkItems: WorkItemRisk[] = [
  {
    id: 1,
    adoId: 1001,
    title: "Product Roadmap Planning",
    type: "Epic",
    team: "Product Management",
    sprint: "Sprint 7-8",
    risk: 10,
    dependencies: 0,
    state: "Completed"
  },
  {
    id: 2,
    adoId: 1002,
    title: "API Endpoints Design",
    type: "Task",
    team: "Backend Team",
    sprint: "Sprint 7",
    risk: 20,
    dependencies: 1,
    state: "Completed"
  },
  {
    id: 3,
    adoId: 1003,
    title: "Database Schema Migration",
    type: "Task",
    team: "Database Team",
    sprint: "Sprint 8-9",
    risk: 80,
    dependencies: 3,
    blockedBy: [1002],
    state: "In Progress"
  },
  {
    id: 4,
    adoId: 1004,
    title: "User Authentication Service",
    type: "User Story",
    team: "Backend Team",
    sprint: "Sprint 8",
    risk: 30,
    dependencies: 1,
    state: "Completed"
  },
  {
    id: 5,
    adoId: 1005,
    title: "Data Processing Pipeline",
    type: "Task",
    team: "Data Science Team",
    sprint: "Sprint 9-10",
    risk: 65,
    dependencies: 2,
    state: "In Progress"
  },
  {
    id: 6,
    adoId: 1006,
    title: "Frontend Components",
    type: "User Story",
    team: "Frontend Team",
    sprint: "Sprint 9",
    risk: 40,
    dependencies: 1,
    state: "In Progress"
  },
  {
    id: 7,
    adoId: 1007,
    title: "CI/CD Pipeline Setup",
    type: "Task",
    team: "DevOps Team",
    sprint: "Sprint 8-9",
    risk: 25,
    dependencies: 0,
    state: "In Progress"
  },
  {
    id: 8,
    adoId: 1008,
    title: "User Interface Design",
    type: "User Story",
    team: "UX Team",
    sprint: "Sprint 8",
    risk: 15,
    dependencies: 0,
    state: "Completed"
  },
  {
    id: 9,
    adoId: 1009,
    title: "Integration Testing",
    type: "Task",
    team: "QA Team",
    sprint: "Sprint 10",
    risk: 50,
    dependencies: 4,
    blockedBy: [1003, 1004, 1006],
    state: "Planned"
  },
  {
    id: 10,
    adoId: 1010,
    title: "Security Audit",
    type: "Task",
    team: "Security Team",
    sprint: "Sprint 10-11",
    risk: 70,
    dependencies: 3,
    state: "Planned"
  },
  {
    id: 11,
    adoId: 1011,
    title: "Performance Optimization",
    type: "Task",
    team: "Performance Team",
    sprint: "Sprint 11",
    risk: 45,
    dependencies: 2,
    state: "Planned"
  }
];

const SprintTimeline = () => {
  const [timeframe, setTimeframe] = useState('current');
  const [expandedView, setExpandedView] = useState(false);
  
  const { data: workItems, isLoading } = useQuery({
    queryKey: ['/api/work-items'],
    queryFn: workItemsApi.getAll
  });

  // Define the sprint range
  const sprints = ['Sprint 7', 'Sprint 8', 'Sprint 9', 'Sprint 10', 'Sprint 11'];
  
  // Determine the current sprint based on the date
  const currentSprint = 'Sprint 9'; // In a real app, calculate this from the date
  
  // Find the position of the current date based on the sprint
  const currentSprintIndex = sprints.indexOf(currentSprint);
  const currentDatePosition = (currentSprintIndex * 20) + 10; // 20% per sprint + 10% within the current sprint

  // Helper function to get risk color
  const getRiskColor = (risk: number) => {
    if (risk >= 70) return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' };
    if (risk >= 40) return { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700' };
    return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' };
  };

  // Helper function to get status text and style
  const getSprintStatus = (sprintIndex: number) => {
    if (sprintIndex < currentSprintIndex) return { text: '(Completed)', class: 'text-green-600' };
    if (sprintIndex === currentSprintIndex) return { text: '(In Progress)', class: 'text-blue-600 font-medium' };
    return { text: '(Planned)', class: 'text-gray-600' };
  };

  // Calculate timeline items for each team
  const getTeamItems = (teamName: string) => {
    return sprintWorkItems.filter(item => item.team === teamName);
  };

  // Process sprint range for an item
  const processSprints = (sprintRange: string) => {
    if (sprintRange.includes('-')) {
      const [start, end] = sprintRange.split('-');
      return {
        startSprint: start,
        endSprint: end,
        startIndex: sprints.indexOf(`Sprint ${start}`),
        endIndex: sprints.indexOf(`Sprint ${end}`)
      };
    } else {
      return {
        startSprint: sprintRange,
        endSprint: sprintRange,
        startIndex: sprints.indexOf(sprintRange),
        endIndex: sprints.indexOf(sprintRange)
      };
    }
  };

  // Calculate the position and width for a timeline item
  const calculateItemPosition = (sprintRange: string) => {
    let startSprint = sprintRange;
    let endSprint = sprintRange;
    let startIndex = -1;
    let endIndex = -1;
    
    if (sprintRange.includes('-')) {
      [startSprint, endSprint] = sprintRange.split('-');
      startIndex = sprints.indexOf(`Sprint ${startSprint}`);
      endIndex = sprints.indexOf(`Sprint ${endSprint}`);
    } else {
      startIndex = sprints.indexOf(sprintRange);
      endIndex = startIndex;
    }
    
    // If sprints not found in our range, provide fallback
    if (startIndex === -1) startIndex = 0;
    if (endIndex === -1) endIndex = startIndex;
    
    const left = startIndex * 20; // 20% per sprint
    const width = ((endIndex - startIndex) + 1) * 20; // 20% per sprint
    
    return { left, width };
  };

  // Get the state of a work item based on the sprint
  const getWorkItemState = (sprintRange: string) => {
    let startSprint = sprintRange;
    let startIndex = -1;
    
    if (sprintRange.includes('-')) {
      [startSprint] = sprintRange.split('-');
      startIndex = sprints.indexOf(`Sprint ${startSprint}`);
    } else {
      startIndex = sprints.indexOf(sprintRange);
    }
    
    if (startIndex < currentSprintIndex) return 'completed';
    if (startIndex === currentSprintIndex) return 'in-progress';
    return 'planned';
  };

  // Get color and style based on work item state and risk
  const getWorkItemStyle = (item: WorkItemRisk) => {
    const state = getWorkItemState(item.sprint);
    
    if (state === 'completed') {
      return { 
        bg: 'bg-green-100', 
        border: 'border-green-300', 
        text: 'text-green-800',
        hasDashedBorder: false
      };
    }
    
    // For in-progress or planned items, use risk level
    const { bg, border, text } = getRiskColor(item.risk);
    
    return {
      bg,
      border,
      text,
      hasDashedBorder: item.risk >= 40
    };
  };
  
  return (
    <Card className={`mt-6 ${expandedView ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
      <div className="p-5 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Sprint Timeline with Risk Overlay</h3>
          <div className="flex items-center space-x-2">
            <Select 
              defaultValue={timeframe}
              onValueChange={setTimeframe}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Select Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Quarter</SelectItem>
                <SelectItem value="next">Next Quarter</SelectItem>
                <SelectItem value="previous">Previous Quarter</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpandedView(!expandedView)}
              className="h-8"
            >
              <Expand className="h-4 w-4 mr-1" />
              Expand
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-5 overflow-x-auto">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="min-w-[900px] relative">
            {/* Timeline header */}
            <div className="flex border-b border-neutral-200 pb-3">
              <div className="w-44 font-medium"></div>
              <div className="flex-1 flex">
                {sprints.map((sprint, index) => {
                  const status = getSprintStatus(index);
                  const isCurrentSprint = index === currentSprintIndex;
                  
                  return (
                    <div 
                      key={sprint} 
                      className={`flex-1 text-center ${isCurrentSprint ? 'bg-blue-50 rounded-t-lg py-1' : ''}`}
                    >
                      <div className="text-sm font-medium">{sprint}</div>
                      <div className={`text-xs ${status.class}`}>{status.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Timeline rows */}
            <div className="mt-6">
              {teams.map((teamName, teamIndex) => {
                const teamItems = getTeamItems(teamName);
                
                return (
                  <div className="flex items-start mb-8" key={teamName}>
                    <div className="w-44 text-sm font-medium pt-1">{teamName}</div>
                    <div className="flex-1 flex relative h-10">
                      {/* Create grid lines for better visibility */}
                      {sprints.map((sprint, index) => (
                        <div 
                          key={`grid-${sprint}`} 
                          className={`absolute h-full border-l ${index === currentSprintIndex ? 'border-blue-300' : 'border-gray-100'}`}
                          style={{ left: `${index * 20}%` }}
                        />
                      ))}
                      
                      {/* Add a final grid line */}
                      <div 
                        className="absolute h-full border-l border-gray-100"
                        style={{ left: '100%' }}
                      />
                      
                      {/* Work items */}
                      {teamItems.map((item) => {
                        const { left, width } = calculateItemPosition(item.sprint);
                        const style = getWorkItemStyle(item);
                        const itemState = getWorkItemState(item.sprint);
                        
                        return (
                          <TooltipProvider key={item.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={`absolute h-8 ${style.bg} ${style.hasDashedBorder ? 'border-dashed' : 'border-solid'} border rounded-md flex items-center justify-between px-2 cursor-pointer hover:shadow-md transition-shadow duration-150 ${style.border}`}
                                  style={{ left: `${left}%`, width: `${width}%`, top: '0' }}
                                >
                                  <span className={`text-xs font-medium ${style.text} truncate max-w-[80%]`}>
                                    {item.adoId}
                                  </span>
                                  {item.risk >= 40 && itemState !== 'completed' && (
                                    <AlertCircle className={`h-3.5 w-3.5 ${item.risk >= 70 ? 'text-red-500' : 'text-amber-500'}`} />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs mt-1">Type: {item.type}</div>
                                <div className="text-xs">Risk Score: {item.risk}%</div>
                                <div className="text-xs">Dependencies: {item.dependencies}</div>
                                <div className="text-xs">Sprint: {item.sprint}</div>
                                <div className="text-xs">State: {item.state}</div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Current date marker */}
            <div 
              className="absolute h-[400px] border-l-2 border-blue-500 border-dashed z-10"
              style={{ left: `${currentDatePosition}%`, top: '40px' }}
            >
              <div className="absolute -top-6 -translate-x-1/2 text-xs font-medium bg-blue-600 text-white rounded-full px-3 py-1">
                Current Date
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium mb-2">Legend</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div>
                  <span>Low Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-100 border border-amber-300 border-dashed rounded mr-1"></div>
                  <span>Medium Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 border-dashed rounded mr-1"></div>
                  <span>High Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="border-l-2 h-4 border-blue-500 border-dashed mr-1"></div>
                  <span>Current Date</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SprintTimeline;
