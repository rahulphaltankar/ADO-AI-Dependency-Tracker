import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, BarChart2, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics = () => {
  // Fetch work items data
  const { data: workItems, isLoading: workItemsLoading, error: workItemsError } = useQuery({
    queryKey: ['/api/work-items'],
  });

  // Fetch dependencies data
  const { data: dependencies, isLoading: dependenciesLoading, error: dependenciesError } = useQuery({
    queryKey: ['/api/dependency-graph'],
  });

  // Fetch team velocity data
  const { data: velocityData, isLoading: velocityLoading, error: velocityError } = useQuery({
    queryKey: ['/api/team-velocity'],
  });

  const isLoading = workItemsLoading || dependenciesLoading || velocityLoading;
  const hasError = workItemsError || dependenciesError || velocityError;

  // Process data for work item type distribution chart
  const getWorkItemTypeData = () => {
    if (!workItems || !Array.isArray(workItems)) return [];
    
    const typeDistribution = workItems.reduce((acc: Record<string, number>, item: any) => {
      const type = item.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(typeDistribution).map(type => ({
      name: type,
      value: typeDistribution[type]
    }));
  };

  // Process dependency risk data
  const getDependencyRiskData = () => {
    if (!dependencies || !dependencies.links) return [];
    
    const riskDistribution = dependencies.links.reduce((acc: Record<string, number>, edge: any) => {
      let riskLevel = 'Low';
      if (edge.riskScore >= 70) riskLevel = 'High';
      else if (edge.riskScore >= 40) riskLevel = 'Medium';
      
      acc[riskLevel] = (acc[riskLevel] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(riskDistribution).map(risk => ({
      name: risk,
      value: riskDistribution[risk]
    }));
  };

  // Process team velocity data
  const getTeamVelocityData = () => {
    if (!velocityData || !Array.isArray(velocityData)) return [];
    
    return velocityData.map((sprint: any) => {
      const result: Record<string, any> = { name: sprint.sprint };
      
      if (sprint.teams && Array.isArray(sprint.teams)) {
        sprint.teams.forEach((team: any) => {
          // Use completed story points as velocity
          result[team.name] = team.completed;
        });
      }
      
      return result;
    });
  };

  // Process work item status data
  const getWorkItemStatusData = () => {
    if (!workItems || !Array.isArray(workItems)) return [];
    
    const statusDistribution = workItems.reduce((acc: Record<string, number>, item: any) => {
      const status = item.state || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(statusDistribution).map(status => ({
      name: status,
      value: statusDistribution[status]
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

  if (hasError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Project Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics dashboard for your project dependencies and performance metrics
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          <TabsTrigger value="velocity">Team Velocity</TabsTrigger>
          <TabsTrigger value="workItems">Work Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Work Item Type Distribution
                </CardTitle>
                <CardDescription>Distribution of work items by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getWorkItemTypeData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getWorkItemTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Dependency Risk Distribution
                </CardTitle>
                <CardDescription>Distribution of dependencies by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getDependencyRiskData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getDependencyRiskData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'High' ? '#ef4444' : 
                              entry.name === 'Medium' ? '#f97316' : 
                              '#10b981'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="dependencies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Dependency Risk Analysis
              </CardTitle>
              <CardDescription>Risk score distribution across different dependencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dependencies?.links && Array.isArray(dependencies.links) 
                      ? dependencies.links.map((link: any) => ({
                          id: `${link.source}-${link.target}`,
                          sourceId: link.source,
                          targetId: link.target,
                          riskScore: link.riskScore || 0
                        }))
                      : []
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="id" />
                    <YAxis label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value, name, props) => [`${value}`, 'Risk Score']}
                      labelFormatter={(value) => `Dependency: ${value}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="riskScore" 
                      name="Risk Score" 
                      fill="#8884d8"
                      background={{ fill: '#eee' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="velocity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Team Velocity Trends
              </CardTitle>
              <CardDescription>Sprint velocity over time for each team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getTeamVelocityData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {velocityData && Array.isArray(velocityData) && velocityData[0]?.teams && 
                     Array.isArray(velocityData[0].teams) && velocityData[0].teams.map((team: any, index: number) => (
                      <Line 
                        key={team.name}
                        type="monotone" 
                        dataKey={team.name} 
                        stroke={COLORS[index % COLORS.length]} 
                        activeDot={{ r: 8 }} 
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workItems" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Work Item Status
                </CardTitle>
                <CardDescription>Distribution of work items by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getWorkItemStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getWorkItemStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Work Item Complexity
                </CardTitle>
                <CardDescription>Distribution of work items by complexity (story points)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={workItems && Array.isArray(workItems) 
                        ? workItems.map((item: any) => ({
                            id: item.adoId,
                            title: item.title,
                            storyPoints: item.storyPoints || 0
                          }))
                        : []
                      }
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="id" />
                      <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name, props) => [`${value}`, 'Story Points']}
                        labelFormatter={(value) => {
                          if (!workItems || !Array.isArray(workItems)) return `Item ${value}`;
                          const item = workItems.find((i: any) => i.adoId === value);
                          return item ? `${item.title} (${value})` : `Item ${value}`;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="storyPoints" name="Story Points" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;