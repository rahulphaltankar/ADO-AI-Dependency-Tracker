import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { riskApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

const WorkItems = () => {
  // Fetch high risk dependencies
  const { data: highRiskDeps, isLoading: isLoadingRisk } = useQuery({
    queryKey: ['/api/high-risk-dependencies'],
    queryFn: riskApi.getHighRiskDependencies
  });

  // Recent changes - normally this would come from an API endpoint
  // but we'll create a simple mock version for the UI
  const recentChanges = [
    {
      id: 1,
      type: 'new_dependency',
      title: 'New Dependency',
      source: 'TEST-567',
      target: 'API-123',
      createdBy: 'Alex Johnson',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    },
    {
      id: 2,
      type: 'risk_increased',
      title: 'Risk Increased',
      workItem: 'DB-456',
      oldRisk: 45,
      newRisk: 68,
      reason: 'Team velocity decrease',
      createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) // 26 hours ago
    },
    {
      id: 3,
      type: 'dependency_resolved',
      title: 'Dependency Resolved',
      source: 'UI-345',
      target: 'API-102',
      resolvedBy: 'Sarah Chen',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* High Risk Dependencies */}
      <Card>
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold text-error flex items-center">
            <span className="material-icons text-lg mr-2">warning</span>
            High Risk Dependencies
          </h3>
        </div>
        <div className="p-3">
          {isLoadingRisk ? (
            <>
              <Skeleton className="h-20 w-full mb-3" />
              <Skeleton className="h-20 w-full mb-3" />
              <Skeleton className="h-20 w-full" />
            </>
          ) : !highRiskDeps || highRiskDeps.length === 0 ? (
            <div className="text-center p-6 text-neutral-500">
              No high risk dependencies found
            </div>
          ) : (
            highRiskDeps.slice(0, 3).map((item, index) => (
              <div 
                key={item.dependency.id}
                className={`${index < highRiskDeps.slice(0, 3).length - 1 ? 'border-b border-neutral-100' : ''} p-3 hover:bg-neutral-50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="material-icons text-error mr-2">error_outline</span>
                    <span className="font-medium">{item.target?.adoId}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-error bg-opacity-10 text-error rounded-full">
                    {item.dependency.riskScore}% Risk
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">{item.target?.title}</p>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-neutral-500">Assigned: {item.target?.assignedTo || 'Unassigned'}</div>
                  <div className="text-xs text-error">
                    {item.target?.sprint} (Expected delay: {item.dependency.expectedDelay} days)
                  </div>
                </div>
              </div>
            ))
          )}
          
          <div className="flex justify-center p-3 border-t border-neutral-200">
            <button className="text-primary text-sm hover:underline flex items-center">
              <span className="material-icons text-sm mr-1">visibility</span>
              View All High Risk Items
            </button>
          </div>
        </div>
      </Card>
      
      {/* Recent Dependency Changes */}
      <Card>
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold flex items-center">
            <span className="material-icons text-lg mr-2">update</span>
            Recent Dependency Changes
          </h3>
        </div>
        <div className="p-3">
          {recentChanges.map((change, index) => (
            <div 
              key={change.id}
              className={`${index < recentChanges.length - 1 ? 'border-b border-neutral-100' : ''} p-3 hover:bg-neutral-50`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {change.type === 'new_dependency' && (
                    <span className="material-icons text-primary mr-2">fiber_new</span>
                  )}
                  {change.type === 'risk_increased' && (
                    <span className="material-icons text-warning mr-2">trending_up</span>
                  )}
                  {change.type === 'dependency_resolved' && (
                    <span className="material-icons text-success mr-2">done_all</span>
                  )}
                  <span className="font-medium">{change.title}</span>
                </div>
                <span className="text-xs text-neutral-500">
                  {formatDistanceToNow(change.createdAt, { addSuffix: true })}
                </span>
              </div>
              
              {change.type === 'new_dependency' && (
                <p className="text-sm text-neutral-600 mt-1">
                  <span className="font-medium">{change.source}</span> now depends on 
                  <span className="font-medium"> {change.target}</span>
                </p>
              )}
              
              {change.type === 'risk_increased' && (
                <p className="text-sm text-neutral-600 mt-1">
                  <span className="font-medium">{change.workItem}</span> risk increased from 
                  <span className="text-warning"> {change.oldRisk}%</span> to 
                  <span className="text-error"> {change.newRisk}%</span>
                </p>
              )}
              
              {change.type === 'dependency_resolved' && (
                <p className="text-sm text-neutral-600 mt-1">
                  <span className="font-medium">{change.source}</span> dependency on 
                  <span className="font-medium"> {change.target}</span> resolved
                </p>
              )}
              
              <div className="mt-2 text-xs text-neutral-500">
                {change.type === 'new_dependency' && `Added by: ${change.createdBy}`}
                {change.type === 'risk_increased' && `Due to: ${change.reason}`}
                {change.type === 'dependency_resolved' && `Resolved by: ${change.resolvedBy}`}
              </div>
            </div>
          ))}
          
          <div className="flex justify-center p-3 border-t border-neutral-200">
            <button className="text-primary text-sm hover:underline flex items-center">
              <span className="material-icons text-sm mr-1">history</span>
              View Change History
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WorkItems;
