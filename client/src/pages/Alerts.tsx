import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Alerts = () => {
  const alerts = [
    {
      id: 1,
      type: 'high_risk',
      title: 'High Risk Dependency Detected',
      description: 'DB-456 is at 68% risk of delay, potentially impacting 3 work items',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false
    },
    {
      id: 2,
      type: 'new_dependency',
      title: 'New AI-Detected Dependency',
      description: 'AUTH-234 has a new dependency detected from natural language analysis',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: false
    },
    {
      id: 3,
      type: 'threshold_crossed',
      title: 'Risk Threshold Crossed',
      description: 'INFRA-203 risk increased from 58% to 82%, exceeding alert threshold',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      read: false
    },
    {
      id: 4,
      type: 'cascade_risk',
      title: 'Cascade Delay Risk',
      description: 'DB-457 delay may cascade to 5 other work items with cumulative 9-day delay',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      read: true
    },
    {
      id: 5,
      type: 'velocity_decrease',
      title: 'Team Velocity Decrease',
      description: 'Database Team velocity decreased by 30% this sprint',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      read: true
    }
  ];

  const alertSettings = [
    {
      id: 1,
      name: 'High Risk Dependencies',
      description: 'Alert when risk score exceeds threshold',
      enabled: true,
      threshold: 65
    },
    {
      id: 2,
      name: 'New AI-Detected Dependencies',
      description: 'Alert when AI identifies new dependencies',
      enabled: true,
      threshold: null
    },
    {
      id: 3,
      name: 'Cascade Delay Risk',
      description: 'Alert when cascade impact exceeds 3 days',
      enabled: true,
      threshold: 3
    },
    {
      id: 4,
      name: 'Team Velocity Changes',
      description: 'Alert on significant team velocity changes',
      enabled: false,
      threshold: 20
    },
    {
      id: 5,
      name: 'Critical Path Changes',
      description: 'Alert when critical path changes',
      enabled: true,
      threshold: null
    }
  ];

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
  };

  // Get icon for alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'high_risk':
        return <span className="material-icons text-error">warning</span>;
      case 'new_dependency':
        return <span className="material-icons text-primary">add_link</span>;
      case 'threshold_crossed':
        return <span className="material-icons text-warning">trending_up</span>;
      case 'cascade_risk':
        return <span className="material-icons text-warning">account_tree</span>;
      case 'velocity_decrease':
        return <span className="material-icons text-warning">speed</span>;
      default:
        return <span className="material-icons text-neutral-500">notifications</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Alerts & Notifications</h1>
        <Button className="bg-primary hover:bg-primary-dark">
          <span className="material-icons mr-2">mark_email_read</span>
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList className="mb-4">
          <TabsTrigger value="notifications" className="px-6">Notifications</TabsTrigger>
          <TabsTrigger value="settings" className="px-6">Alert Settings</TabsTrigger>
          <TabsTrigger value="integrations" className="px-6">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Recent Notifications</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-neutral-500">
                    Showing {alerts.filter(a => !a.read).length} unread of {alerts.length} total
                  </span>
                  <Button variant="outline" size="sm">
                    <span className="material-icons text-sm mr-1">filter_list</span>
                    Filter
                  </Button>
                </div>
              </div>
            </div>
            <div className="divide-y divide-neutral-200">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={`flex items-start p-4 ${!alert.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="mr-4 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{alert.title}</h4>
                      <span className="text-xs text-neutral-500">{formatTime(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">{alert.description}</p>
                    <div className="flex mt-2 space-x-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      {!alert.read && (
                        <Button variant="ghost" size="sm">Mark as Read</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">Alert Settings</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertSettings.map(setting => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.name}</TableCell>
                    <TableCell>{setting.description}</TableCell>
                    <TableCell>
                      {setting.threshold !== null ? (
                        setting.threshold + (setting.id === 1 ? '%' : ' days')
                      ) : (
                        <span className="text-neutral-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={setting.enabled} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">Integration Settings</h3>
            </div>
            <div className="p-5 space-y-6">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center shadow-sm">
                      <span className="material-icons text-[#4A154B]">slack</span>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">Slack Integration</h4>
                      <p className="text-sm text-neutral-500">Send alerts to Slack channels</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <input 
                      type="text" 
                      className="flex-1 p-2 text-sm border border-neutral-300 rounded"
                      placeholder="Webhook URL (https://hooks.slack.com/...)"
                      value="https://hooks.slack.com/services/T0123456/B0123456/XXXXXXXX"
                    />
                    <Button variant="outline" size="sm">Test</Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notification Level</label>
                    <select className="mt-1 block w-full p-2 text-sm border border-neutral-300 rounded">
                      <option>All alerts</option>
                      <option>High risk only ({'>'}65%)</option>
                      <option>Critical only ({'>'}85%)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center shadow-sm">
                      <span className="material-icons text-[#4050B5]">teams</span>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">Microsoft Teams Integration</h4>
                      <p className="text-sm text-neutral-500">Send alerts to Teams channels</p>
                    </div>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <input 
                      type="text" 
                      className="flex-1 p-2 text-sm border border-neutral-300 rounded"
                      placeholder="Webhook URL (https://outlook.office.com/webhook/...)"
                      value="https://outlook.office.com/webhook/12345-abcde/..."
                    />
                    <Button variant="outline" size="sm">Test</Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notification Level</label>
                    <select className="mt-1 block w-full p-2 text-sm border border-neutral-300 rounded">
                      <option>All alerts</option>
                      <option>High risk only ({'>'}65%)</option>
                      <option>Critical only ({'>'}85%)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center shadow-sm">
                      <span className="material-icons">email</span>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-neutral-500">Send alerts via email</p>
                    </div>
                  </div>
                  <Switch checked={false} />
                </div>
                <div className="mt-4 space-y-4 opacity-50">
                  <div className="flex items-center space-x-4">
                    <input 
                      type="text" 
                      className="flex-1 p-2 text-sm border border-neutral-300 rounded"
                      placeholder="Recipient Email Addresses (comma separated)"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notification Level</label>
                    <select className="mt-1 block w-full p-2 text-sm border border-neutral-300 rounded" disabled>
                      <option>All alerts</option>
                      <option>High risk only ({'>'}65%)</option>
                      <option>Critical only ({'>'}85%)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alerts;