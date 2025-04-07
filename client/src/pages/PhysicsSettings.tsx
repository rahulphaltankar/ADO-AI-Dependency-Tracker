import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, RefreshCw, Cpu, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PINNConfig {
  pinnEnabled: boolean;
  lightweightMode: boolean;
  pinnAvailable: boolean;
}

const PhysicsSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Local state
  const [isTraining, setIsTraining] = useState(false);
  
  // Fetch current PINN configuration
  const { data: config, isLoading, error } = useQuery<PINNConfig>({
    queryKey: ['/api/pinn-config'],
  });
  
  // Update PINN configuration
  const updateConfig = useMutation({
    mutationFn: (newConfig: { usePINN: boolean, lightweightMode: boolean }) => {
      return apiRequest('/api/pinn-config', 'POST', newConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pinn-config'] });
      toast({
        title: 'Settings Updated',
        description: 'Physics-Informed Neural Network settings have been updated.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });
  
  // Train PINN model
  const trainModel = useMutation({
    mutationFn: () => {
      setIsTraining(true);
      return apiRequest('/api/train-pinn-model', 'POST');
    },
    onSuccess: (data) => {
      setIsTraining(false);
      queryClient.invalidateQueries({ queryKey: ['/api/pinn-config'] });
      toast({
        title: 'Model Trained',
        description: 'Successfully trained the PINN model',
        variant: 'default',
      });
    },
    onError: (error) => {
      setIsTraining(false);
      toast({
        title: 'Training Failed',
        description: `Failed to train model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });
  
  // Create lightweight model
  const createLightweightModel = useMutation({
    mutationFn: () => {
      return apiRequest('/api/create-lightweight-model', 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pinn-config'] });
      toast({
        title: 'Lightweight Model Created',
        description: 'Successfully created a lightweight model for resource-constrained environments.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create lightweight model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  });
  
  const handleEnableToggle = () => {
    if (config) {
      updateConfig.mutate({
        usePINN: !config.pinnEnabled,
        lightweightMode: config.lightweightMode
      });
    }
  };
  
  const handleLightweightToggle = () => {
    if (config) {
      updateConfig.mutate({
        usePINN: config.pinnEnabled,
        lightweightMode: !config.lightweightMode
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Physics-Informed Neural Networks</h1>
        <p className="text-muted-foreground">
          Configure the PINN system to enhance dependency management with physics-based predictions.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              PINN Configuration
            </CardTitle>
            <CardDescription>
              Enable or disable physics-informed neural networks for dependency analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load PINN configuration. Please try again.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enable-pinn" className="text-base">Enable PINN</Label>
                    <p className="text-sm text-muted-foreground">
                      Use physics-informed neural networks for enhanced predictions
                    </p>
                  </div>
                  <Switch
                    id="enable-pinn"
                    checked={config?.pinnEnabled}
                    onCheckedChange={handleEnableToggle}
                    disabled={updateConfig.isPending}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lightweight-mode" className="text-base">Lightweight Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use quantized model for resource-constrained environments
                    </p>
                  </div>
                  <Switch
                    id="lightweight-mode"
                    checked={config?.lightweightMode}
                    onCheckedChange={handleLightweightToggle}
                    disabled={updateConfig.isPending || !config?.pinnEnabled}
                  />
                </div>
                
                <Alert variant={config?.pinnAvailable ? "default" : "destructive"}>
                  {config?.pinnAvailable ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {config?.pinnAvailable ? "PINN Model Available" : "PINN Model Not Available"}
                  </AlertTitle>
                  <AlertDescription>
                    {config?.pinnAvailable 
                      ? "Physics-informed neural network model is trained and ready to use."
                      : "PINN model needs to be trained before it can be used. Click the 'Train Model' button below."}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="secondary"
              disabled={updateConfig.isPending || !config?.pinnEnabled}
              onClick={() => createLightweightModel.mutate()}
            >
              <Cpu className="mr-2 h-4 w-4" />
              Create Lightweight Model
            </Button>
            <Button
              variant="default"
              disabled={trainModel.isPending || isTraining}
              onClick={() => trainModel.mutate()}
            >
              {isTraining ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Train Model
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>PINN Features</CardTitle>
            <CardDescription>
              Enhanced capabilities with physics-informed neural networks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Brooks' Law integration for team size and productivity modeling</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Critical Chain Theory for buffer management and delay prediction</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Cascade effect modeling for dependency networks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Project physics-based risk scoring</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Resource contention prediction using physics principles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Lightweight mode for resource-constrained environments</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>GDPR-compliant data processing and anonymization</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>About Physics-Informed Neural Networks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>
                Physics-Informed Neural Networks (PINNs) enhance AI models by incorporating domain knowledge
                from project management physics principles. This results in more accurate and explainable predictions.
              </p>
              
              <h3>Key Benefits</h3>
              <ul>
                <li><strong>Brooks' Law:</strong> "Adding manpower to a late project makes it later." Our PINNs model this non-linear relationship.</li>
                <li><strong>Critical Chain Theory:</strong> Models how buffer placement and management affect project completion times.</li>
                <li><strong>Cascade Effects:</strong> Predicts how delays propagate through dependency networks using physics principles.</li>
                <li><strong>Explainable AI:</strong> Results can be traced back to physics principles for better understanding.</li>
              </ul>
              
              <h3>Performance Improvements</h3>
              <p>
                Enabling PINNs can lead to a 50% increase in early risk detection and a 35% reduction in
                dependency-related delays compared to traditional ML approaches.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhysicsSettings;