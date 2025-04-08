import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workItemApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const Analytics = () => {
  const { data: workItems, isLoading, error } = useQuery({
    queryKey: ['workItems'],
    queryFn: workItemApi.getWorkItems
  });

  // Process work item status data
  const getWorkItemStatusData = () => {
    if (!workItems?.length) return [];

    const statusDistribution = workItems.reduce((acc: Record<string, number>, item: any) => {
      const status = item.state || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <BarChart2 className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Loading analytics data</h3>
            <p className="mt-1 text-sm text-gray-500">Please wait while we gather the analytics information.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusData = getWorkItemStatusData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Work Item Status Distribution</h2>
          <div className="h-64">
            {/* Add your chart component here */}
            <pre>{JSON.stringify(statusData, null, 2)}</pre>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;