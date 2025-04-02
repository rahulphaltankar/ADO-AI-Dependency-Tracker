import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dependenciesApi, workItemsApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  sourceId: z.number().min(1, 'Please select a source work item'),
  targetId: z.number().min(1, 'Please select a target work item'),
  dependencyType: z.string().min(1, 'Please select a dependency type'),
  aiDetected: z.boolean().default(false),
  detectionSource: z.string().default('Manual'),
});

const Dependencies = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceId: 0,
      targetId: 0,
      dependencyType: '',
      aiDetected: false,
      detectionSource: 'Manual',
    },
  });

  const { data: dependencies, isLoading: isLoadingDeps } = useQuery({
    queryKey: ['/api/dependencies'],
    queryFn: dependenciesApi.getAll
  });

  const { data: workItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/work-items'],
    queryFn: workItemsApi.getAll
  });

  const mutation = useMutation({
    mutationFn: dependenciesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dependencies'] });
      setOpen(false);
      form.reset();
      toast({
        title: "Dependency created",
        description: "New dependency has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create dependency",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate({
      sourceId: values.sourceId,
      targetId: values.targetId,
      dependencyType: values.dependencyType,
      aiDetected: values.aiDetected,
      detectionSource: values.detectionSource,
      riskScore: 0,
      expectedDelay: 0
    });
  };

  // Get work item by ID for display
  const getWorkItemById = (id: number) => {
    return workItems?.find(item => item.id === id);
  };

  // Function to determine risk level color
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 65) return 'text-error';
    if (riskScore >= 35) return 'text-warning';
    return 'text-success';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dependencies</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark">
              <span className="material-icons mr-2">add</span>
              Add Dependency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dependency</DialogTitle>
              <DialogDescription>
                Define a relationship between two work items.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="sourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Work Item</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a work item" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workItems?.map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.adoId}: {item.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The work item that depends on another
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Work Item</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a work item" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workItems?.filter(item => item.id !== form.getValues().sourceId).map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.adoId}: {item.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The work item that is depended upon
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dependencyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependency Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dependency type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Blocks">Blocks</SelectItem>
                          <SelectItem value="Depends on">Depends on</SelectItem>
                          <SelectItem value="Related to">Related to</SelectItem>
                          <SelectItem value="Requires">Requires</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    {mutation.isPending ? 'Creating...' : 'Create Dependency'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Input 
              placeholder="Filter dependencies..." 
              className="w-64"
            />
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <span className="material-icons text-sm mr-1">file_download</span>
              Export
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
              <TableHead>Source</TableHead>
              <TableHead>Dependency Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Detection</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Expected Delay</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingDeps || isLoadingItems ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading dependencies...
                </TableCell>
              </TableRow>
            ) : !dependencies || dependencies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No dependencies found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              dependencies.map(dep => {
                const sourceItem = getWorkItemById(dep.sourceId);
                const targetItem = getWorkItemById(dep.targetId);
                const riskClass = getRiskColor(dep.riskScore || 0);

                return (
                  <TableRow key={dep.id}>
                    <TableCell>
                      <div className="font-medium">{sourceItem?.adoId}</div>
                      <div className="text-xs text-neutral-500">{sourceItem?.title}</div>
                    </TableCell>
                    <TableCell>
                      {dep.dependencyType}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{targetItem?.adoId}</div>
                      <div className="text-xs text-neutral-500">{targetItem?.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {dep.aiDetected ? (
                          <>
                            <span className="material-icons text-sm mr-1">psychology</span>
                            <span>AI Detected</span>
                          </>
                        ) : (
                          <>
                            <span className="material-icons text-sm mr-1">person</span>
                            <span>Manual</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${riskClass} bg-opacity-10`}>
                        {dep.riskScore || 0}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {dep.expectedDelay || 0} days
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Dependencies;
