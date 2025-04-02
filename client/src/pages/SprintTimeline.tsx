import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import SprintTimelineComponent from '@/components/dashboard/SprintTimeline';

const SprintTimeline = () => {
  const [timeframe, setTimeframe] = useState('current');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Sprint Timeline</h1>
        <div className="flex items-center space-x-3">
          <Select 
            defaultValue={timeframe}
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Quarter</SelectItem>
              <SelectItem value="next">Next Quarter</SelectItem>
              <SelectItem value="previous">Previous Quarter</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <span className="material-icons mr-2">print</span>
            Export Timeline
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold">Overview</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-xs text-neutral-500">Total Work Items</div>
            <div className="text-2xl font-semibold text-primary mt-1">42</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-xs text-neutral-500">On Track</div>
            <div className="text-2xl font-semibold text-success mt-1">28</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-xs text-neutral-500">At Risk</div>
            <div className="text-2xl font-semibold text-warning mt-1">8</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-xs text-neutral-500">Delayed</div>
            <div className="text-2xl font-semibold text-error mt-1">6</div>
          </div>
        </div>
      </Card>

      <SprintTimelineComponent />

      <Card className="mt-6">
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold">Critical Path Analysis</h3>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 px-4 text-sm font-medium text-neutral-500">Work Item</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-neutral-500">Title</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-neutral-500">Sprint</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-neutral-500">Dependencies</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-neutral-500">Risk</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-neutral-500">Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 text-sm font-medium">API-123</td>
                  <td className="py-3 px-4 text-sm">API Feature Implementation</td>
                  <td className="py-3 px-4 text-sm">Sprint 9</td>
                  <td className="py-3 px-4 text-sm">2 blockers</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="bg-warning text-white text-xs px-2 py-0.5 rounded-full">Medium</span>
                  </td>
                  <td className="py-3 px-4 text-sm">3 dependent items</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 text-sm font-medium">DB-456</td>
                  <td className="py-3 px-4 text-sm">Database Migration</td>
                  <td className="py-3 px-4 text-sm">Sprint 8</td>
                  <td className="py-3 px-4 text-sm">0 blockers</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="bg-error text-white text-xs px-2 py-0.5 rounded-full">High</span>
                  </td>
                  <td className="py-3 px-4 text-sm">5 dependent items</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 text-sm font-medium">AUTH-234</td>
                  <td className="py-3 px-4 text-sm">Authentication Service</td>
                  <td className="py-3 px-4 text-sm">Sprint 8-9</td>
                  <td className="py-3 px-4 text-sm">1 blocker</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="bg-warning text-white text-xs px-2 py-0.5 rounded-full">Medium</span>
                  </td>
                  <td className="py-3 px-4 text-sm">2 dependent items</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SprintTimeline;
