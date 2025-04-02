import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workItemsApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const WorkItems = () => {
  const { data: workItems, isLoading } = useQuery({
    queryKey: ['/api/work-items'],
    queryFn: workItemsApi.getAll
  });

  // Function to determine state color
  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-success text-white';
      case 'in progress':
      case 'active':
        return 'bg-primary text-white';
      case 'not started':
      case 'new':
        return 'bg-neutral-200 text-neutral-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Work Items</h1>
        <Button className="bg-primary hover:bg-primary-dark">
          <span className="material-icons mr-2">add</span>
          Add Work Item
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input 
              placeholder="Search work items..." 
              className="w-64"
            />
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sprints</SelectItem>
                <SelectItem value="sprint-8">Sprint 8</SelectItem>
                <SelectItem value="sprint-9">Sprint 9</SelectItem>
                <SelectItem value="sprint-10">Sprint 10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <span className="material-icons text-sm mr-1">sync_alt</span>
              Sync with ADO
            </Button>
            <Button variant="outline" size="sm">
              <span className="material-icons text-sm mr-1">refresh</span>
              Refresh
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Sprint</TableHead>
              <TableHead>Story Points</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  Loading work items...
                </TableCell>
              </TableRow>
            ) : !workItems || workItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  No work items found. Sync with Azure DevOps to import work items.
                </TableCell>
              </TableRow>
            ) : (
              workItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.adoId}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStateColor(item.state)}`}>
                      {item.state}
                    </span>
                  </TableCell>
                  <TableCell>{item.assignedTo || 'Unassigned'}</TableCell>
                  <TableCell>{item.team || 'N/A'}</TableCell>
                  <TableCell>{item.sprint}</TableCell>
                  <TableCell className="text-center">{item.storyPoints || 0}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <span className="material-icons text-sm">visibility</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <span className="material-icons text-sm">edit</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default WorkItems;
