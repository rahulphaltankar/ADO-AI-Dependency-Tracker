import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '../lib/api';

const Settings = () => {
  const { toast } = useToast();
  const [oauthStatus, setOauthStatus] = useState<{oauthConfigured: boolean, message?: string} | null>(null);
  const [authMethod, setAuthMethod] = useState<'oauth' | 'pat'>('pat');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [organization, setOrganization] = useState('contoso');
  const [project, setProject] = useState('ProjectX');
  const [pat, setPat] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch OAuth configuration status
  useEffect(() => {
    const fetchOAuthStatus = async () => {
      try {
        const status = await authApi.getOAuthStatus();
        setOauthStatus(status);
      } catch (error) {
        console.error('Failed to fetch OAuth status:', error);
        setOauthStatus({ oauthConfigured: false, message: 'Failed to check OAuth configuration' });
      }
    };

    const checkAuth = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setIsAuthenticated(userData.authenticated);
        if (userData.authenticated) {
          setUserData(userData.user);
        }
      } catch (error) {
        console.error('Failed to check authentication:', error);
      }
    };

    fetchOAuthStatus();
    checkAuth();
  }, []);

  const handleSaveADOSettings = () => {
    // In a real implementation, this would call the API to save settings
    toast({
      title: "Settings saved",
      description: "Azure DevOps connection settings have been updated.",
    });
  };

  const handleConnectWithOAuth = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        // User is already authenticated, connect ADO using OAuth tokens
        await authApi.connectADO(organization, project);
        toast({
          title: "Connection successful",
          description: "Connected to Azure DevOps using OAuth authentication.",
        });
      } else {
        // Redirect to OAuth flow
        authApi.initiateOAuth('/settings');
      }
    } catch (error) {
      console.error('OAuth connection error:', error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Azure DevOps. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlertSettings = () => {
    toast({
      title: "Alert settings saved",
      description: "Alert configuration has been updated.",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      <Tabs defaultValue="ado">
        <TabsList className="mb-4">
          <TabsTrigger value="ado" className="px-6">Azure DevOps</TabsTrigger>
          <TabsTrigger value="alerts" className="px-6">Alerts</TabsTrigger>
          <TabsTrigger value="ai" className="px-6">AI Configuration</TabsTrigger>
          <TabsTrigger value="account" className="px-6">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="ado">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">Azure DevOps Connection</h3>
            </div>
            <div className="p-5">
              <div className="space-y-4 max-w-2xl">
                {/* Authentication Method Selection */}
                <div className="border p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Authentication Method</h4>
                  <div className="flex space-x-4">
                    <div 
                      className={`p-3 border rounded-lg flex-1 cursor-pointer ${authMethod === 'pat' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                      onClick={() => setAuthMethod('pat')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Personal Access Token</span>
                        {authMethod === 'pat' && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                      </div>
                      <p className="text-xs text-neutral-500">
                        Use a PAT token for direct access to Azure DevOps
                      </p>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-lg flex-1 cursor-pointer ${authMethod === 'oauth' ? 'border-primary bg-primary/5' : 'border-gray-200'} ${!oauthStatus?.oauthConfigured ? 'opacity-50' : ''}`}
                      onClick={() => oauthStatus?.oauthConfigured && setAuthMethod('oauth')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">OAuth 2.0</span>
                        {authMethod === 'oauth' && <div className="h-3 w-3 rounded-full bg-primary"></div>}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-neutral-500">
                          Securely authenticate using your Azure AD account
                        </p>
                        {!oauthStatus?.oauthConfigured && (
                          <Badge variant="outline" className="ml-2 text-xs">Not Configured</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* OAuth Status Message */}
                  {!oauthStatus?.oauthConfigured && (
                    <Alert className="mt-3 bg-amber-50">
                      <AlertTitle className="text-sm font-medium text-amber-800">OAuth Not Configured</AlertTitle>
                      <AlertDescription className="text-xs text-amber-700">
                        {oauthStatus?.message || "To enable OAuth, the server needs to be configured with Azure AD OAuth credentials. Using Personal Access Token for now."}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* User authenticated message */}
                  {authMethod === 'oauth' && isAuthenticated && (
                    <Alert className="mt-3 bg-green-50">
                      <AlertTitle className="text-sm font-medium text-green-800">Authenticated as {userData?.name || 'User'}</AlertTitle>
                      <AlertDescription className="text-xs text-green-700">
                        You're signed in using OAuth. You can now connect to Azure DevOps.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              
                <div>
                  <label className="text-sm font-medium block mb-1">Organization Name</label>
                  <Input 
                    value={organization} 
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="your-organization-name" 
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    The name of your Azure DevOps organization
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Project Name</label>
                  <Input 
                    value={project} 
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="your-project-name" 
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    The name of your Azure DevOps project
                  </p>
                </div>

                {/* PAT input when PAT method selected */}
                {authMethod === 'pat' && (
                  <div>
                    <label className="text-sm font-medium block mb-1">Personal Access Token</label>
                    <Input 
                      type="password"
                      value={pat}
                      onChange={(e) => setPat(e.target.value)}
                      placeholder="your-pat-token" 
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      PAT with read access to work items and code
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2 mt-6">
                  {authMethod === 'pat' ? (
                    <>
                      <Button 
                        className="bg-primary hover:bg-primary-dark"
                        onClick={handleSaveADOSettings}
                        disabled={!organization || !project || !pat}
                      >
                        Save Settings
                      </Button>
                      <Button variant="outline">
                        Test Connection
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="bg-primary hover:bg-primary-dark"
                      onClick={handleConnectWithOAuth}
                      disabled={!organization || !project || loading}
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                          Connecting...
                        </div>
                      ) : (
                        <>
                          {isAuthenticated ? 'Connect to Azure DevOps' : 'Sign in with Microsoft'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="mt-6">
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">Sync Settings</h3>
            </div>
            <div className="p-5">
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-Sync Work Items</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Automatically sync work items from Azure DevOps every hour
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Import Existing Links</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Import existing relationships from Azure DevOps as dependencies
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Changes to ADO</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Create links in Azure DevOps when dependencies are added here
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Sync Scope</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" id="epics" className="mr-2" defaultChecked />
                      <label htmlFor="epics" className="text-sm">Epics</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="features" className="mr-2" defaultChecked />
                      <label htmlFor="features" className="text-sm">Features</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="stories" className="mr-2" defaultChecked />
                      <label htmlFor="stories" className="text-sm">User Stories</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="tasks" className="mr-2" defaultChecked />
                      <label htmlFor="tasks" className="text-sm">Tasks</label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="bugs" className="mr-2" defaultChecked />
                      <label htmlFor="bugs" className="text-sm">Bugs</label>
                    </div>
                  </div>
                </div>

                <Button variant="outline">
                  <span className="material-icons mr-2">sync</span>
                  Sync Now
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">Alert Configuration</h3>
            </div>
            <div className="p-5">
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h4 className="font-medium mb-2">Risk Threshold</h4>
                  <div className="flex items-center space-x-4">
                    <Slider
                      defaultValue={[65]}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-[40px]">65%</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Send alerts when dependency risk exceeds this threshold
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Slack Webhook</h4>
                  <Input 
                    defaultValue="https://hooks.slack.com/services/T0123456/B0123456/XXXXXXXX" 
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Webhook URL for sending alerts to Slack
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Microsoft Teams Webhook</h4>
                  <Input 
                    defaultValue="https://outlook.office.com/webhook/12345-abcde/..." 
                    placeholder="https://outlook.office.com/webhook/..."
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Webhook URL for sending alerts to Microsoft Teams
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Alert Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">High risk dependencies</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">New AI-detected dependencies</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Risk threshold changes</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Sprint timeline changes</label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Team velocity alerts</label>
                      <Switch />
                    </div>
                  </div>
                </div>

                <Button 
                  className="bg-primary hover:bg-primary-dark"
                  onClick={handleSaveAlertSettings}
                >
                  Save Alert Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">AI Configuration</h3>
            </div>
            <div className="p-5">
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h4 className="font-medium mb-2">OpenAI API Key</h4>
                  <Input 
                    type="password"
                    defaultValue="sk-●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●" 
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Used for contextual analysis of free-text fields
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-3">AI Analysis Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Dependency Detection</label>
                        <p className="text-xs text-neutral-500">Extract dependencies from text</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Risk Prediction</label>
                        <p className="text-xs text-neutral-500">Use ML for risk assessment</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Auto-Linking</label>
                        <p className="text-xs text-neutral-500">Automatically link detected work items</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Pull Request Analysis</label>
                        <p className="text-xs text-neutral-500">Analyze PRs for dependency impact</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Model Selection</h4>
                  <select className="w-full p-2 border border-neutral-300 rounded text-sm">
                    <option value="gpt-4o">OpenAI GPT-4o (Recommended)</option>
                    <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo (Faster)</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Model used for natural language processing
                  </p>
                </div>

                <Button className="bg-primary hover:bg-primary-dark">
                  Save AI Configuration
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">Account Settings</h3>
            </div>
            <div className="p-5">
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
                    <span className="material-icons text-2xl">person</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Profile Picture</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                      Update your profile picture
                    </p>
                    <div className="mt-2">
                      <Button variant="outline" size="sm">Upload Photo</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Full Name</h4>
                  <Input defaultValue="Alex Johnson" />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Email Address</h4>
                  <Input defaultValue="alex.j@contoso.com" />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Password</h4>
                  <Input type="password" defaultValue="●●●●●●●●●●" />
                  <Button variant="link" className="p-0 h-auto mt-1">
                    Change Password
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Organization</h4>
                  <Input defaultValue="Contoso" />
                </div>

                <Button className="bg-primary hover:bg-primary-dark">
                  Save Account Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
