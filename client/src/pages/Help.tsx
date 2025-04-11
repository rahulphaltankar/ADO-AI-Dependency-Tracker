import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  HelpCircle, 
  Settings, 
  Activity, 
  BarChart, 
  Network, 
  Brain, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Clock,
  Cpu
} from 'lucide-react';

const Help = () => {
  const [activeTab, setActiveTab] = useState('faqs');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Help & Support</h1>
        <p className="text-muted-foreground mt-1">Get help with using the ADO-AI Dependency Tracker</p>
      </div>

      <Tabs defaultValue="faqs" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="faqs"><HelpCircle className="h-4 w-4 mr-2" />FAQs</TabsTrigger>
          <TabsTrigger value="userguide"><FileText className="h-4 w-4 mr-2" />User Guide</TabsTrigger>
          <TabsTrigger value="contact"><AlertCircle className="h-4 w-4 mr-2" />Contact Support</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <div className="p-5 border-b border-neutral-200">
                  <h3 className="font-semibold">Frequently Asked Questions</h3>
                </div>
                <div className="p-5">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        How does the AI dependency detection work?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-neutral-600">
                          The AI dependency detection uses a combination of spaCy for natural language processing 
                          and OpenAI's GPT-3.5-turbo for contextual analysis. When you provide free-text descriptions 
                          of dependencies, the system:
                        </p>
                        <ol className="list-decimal pl-6 mt-2 space-y-1 text-neutral-600">
                          <li>Extracts key entities and dependency phrases using spaCy</li>
                          <li>Identifies dependency relationships and work items references</li>
                          <li>Maps the relationships to actual Azure DevOps work items</li>
                          <li>Analyzes the potential impact and risk using historical data</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger>
                        How is the risk score calculated?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-neutral-600">
                          Risk scores are calculated using a machine learning model trained on historical sprint data.
                          The model considers several factors:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-neutral-600">
                          <li>Team velocity history (consistency and trends)</li>
                          <li>Dependency chain complexity (number and structure of dependencies)</li>
                          <li>Resource allocation (availability and expertise)</li>
                          <li>Historical performance on similar work items</li>
                          <li>Sprint timeline constraints</li>
                        </ul>
                        <p className="mt-2 text-neutral-600">
                          Risk scores range from 0-100%, with higher scores indicating higher risk.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger>
                        How do I connect to Azure DevOps?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-neutral-600">
                          To connect to Azure DevOps, go to the Settings page and select the Azure DevOps tab. 
                          You'll need to provide:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-neutral-600">
                          <li>Your organization name (e.g., "contoso")</li>
                          <li>Project name (e.g., "ProjectX")</li>
                          <li>Personal Access Token (PAT) with read access to work items and code</li>
                        </ul>
                        <p className="mt-2 text-neutral-600">
                          After saving, you can test the connection and then sync work items from your Azure DevOps project.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger>
                        What types of notifications can I receive?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-neutral-600">
                          The system can send notifications for various events:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-neutral-600">
                          <li>High-risk dependencies (when risk exceeds your set threshold)</li>
                          <li>New AI-detected dependencies from text analysis</li>
                          <li>Risk threshold changes (when a work item's risk changes significantly)</li>
                          <li>Dependency chain impacts (cascade effects)</li>
                          <li>Team velocity changes</li>
                        </ul>
                        <p className="mt-2 text-neutral-600">
                          Notifications can be sent to Slack, Microsoft Teams, or viewed in the application.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger>
                        Can I export the dependency graph?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-neutral-600">
                          Yes, you can export the dependency graph in several formats:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-neutral-600">
                          <li>PNG/SVG image for presentations</li>
                          <li>JSON format for further analysis</li>
                          <li>CSV file of all dependencies</li>
                          <li>PDF report with graph and analysis</li>
                        </ul>
                        <p className="mt-2 text-neutral-600">
                          To export, click the "Export" button in the top right corner of the Dependency Graph component.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="mb-6">
                <div className="p-5 border-b border-neutral-200">
                  <h3 className="font-semibold">Quick Links</h3>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    <li>
                      <a href="#" className="flex items-center text-primary hover:underline">
                        <FileText className="h-4 w-4 mr-2" />
                        User Documentation
                      </a>
                    </li>
                    <li>
                      <a href="#" className="flex items-center text-primary hover:underline">
                        <Activity className="h-4 w-4 mr-2" />
                        Video Tutorials
                      </a>
                    </li>
                    <li>
                      <a href="#" className="flex items-center text-primary hover:underline">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Getting Started Guide
                      </a>
                    </li>
                    <li>
                      <a href="#" className="flex items-center text-primary hover:underline">
                        <Settings className="h-4 w-4 mr-2" />
                        API Documentation
                      </a>
                    </li>
                    <li>
                      <a href="#" className="flex items-center text-primary hover:underline">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Release Notes
                      </a>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="userguide">
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">User Guide for ADO-AI Dependency Tracker</h2>
              <p className="text-muted-foreground mb-4">
                This comprehensive guide helps you understand all the features and functionalities of the ADO-AI Dependency Tracker.
              </p>

              <div className="space-y-8">
                {/* Main Navigation Menu Section */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Network className="mr-2 h-5 w-5 text-primary" />
                    Main Navigation Menu
                  </h3>
                  
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="dashboard">
                      <AccordionTrigger className="font-medium">
                        <BarChart className="mr-2 h-4 w-4 text-primary" />
                        Dashboard
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p><strong>Purpose:</strong> Provides an overview of project status and key metrics</p>
                        <p><strong>How to use:</strong> Click on the "Dashboard" link in the navigation menu</p>
                        <p><strong>What to expect:</strong> Displays Sprint Status, Team Velocity, and Dependency Graph visualizations</p>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-medium">Key elements:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Sprint Status Card:</strong> Shows completion percentage of current sprint</li>
                            <li><strong>Team Velocity Chart:</strong> Displays team performance trends across sprints</li>
                            <li><strong>Dependency Graph:</strong> Interactive visualization of work item dependencies</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="workitems">
                      <AccordionTrigger className="font-medium">
                        <FileText className="mr-2 h-4 w-4 text-primary" />
                        Work Items
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p><strong>Purpose:</strong> View and manage all work items in the system</p>
                        <p><strong>How to use:</strong> Click on the "Work Items" link in the navigation menu</p>
                        <p><strong>What to expect:</strong> A filterable table of all work items with details</p>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-medium">Actions:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Filter dropdown:</strong> Select to filter items by team, status, or type</li>
                            <li><strong>Work Item Cards:</strong> Click to view details or click edit icon to modify</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="dependencies">
                      <AccordionTrigger className="font-medium">
                        <Network className="mr-2 h-4 w-4 text-primary" />
                        Dependencies
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p><strong>Purpose:</strong> Visualize and manage dependencies between work items</p>
                        <p><strong>How to use:</strong> Click on the "Dependencies" link in the navigation menu</p>
                        <p><strong>What to expect:</strong> A detailed view of all dependencies with risk scores</p>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-medium">Actions:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Add Dependency Button:</strong> Click to create a new dependency</li>
                            <li><strong>Dependency Cards:</strong> Click to view details or edit</li>
                            <li><strong>Risk Indicators:</strong> Color-coded indicators showing dependency risk levels</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="aianalysis">
                      <AccordionTrigger className="font-medium">
                        <Brain className="mr-2 h-4 w-4 text-primary" />
                        AI Analysis
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p><strong>Purpose:</strong> Run AI-based analysis on work item descriptions</p>
                        <p><strong>How to use:</strong> Click on the "AI Analysis" link in the navigation menu</p>
                        <p><strong>What to expect:</strong> A page with text input and analysis results</p>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-medium">Actions:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Text Input Field:</strong> Enter work item descriptions or requirements</li>
                            <li><strong>Analyze Button:</strong> Click to run AI analysis</li>
                            <li><strong>Results Panel:</strong> View dependency suggestions and risk assessments</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="physicssettings">
                      <AccordionTrigger className="font-medium">
                        <Cpu className="mr-2 h-4 w-4 text-primary" />
                        Physics Settings
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p><strong>Purpose:</strong> Configure physics-informed neural network settings</p>
                        <p><strong>How to use:</strong> Click on the "Physics Settings" link in the navigation menu</p>
                        <p><strong>What to expect:</strong> A tabbed interface with basic and advanced settings</p>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-medium">Tabs:</p>
                          <ul className="list-disc pl-6 space-y-3">
                            <li>
                              <strong>Basic Settings:</strong> Toggle PINN and Lightweight Mode
                              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                                <li><strong>Enable PINN Switch:</strong> Activates physics-based modeling</li>
                                <li><strong>Lightweight Mode Switch:</strong> Enables resource-efficient mode</li>
                                <li><strong>Train Model Button:</strong> Initializes model training (must be done first)</li>
                                <li><strong>Create Lightweight Model:</strong> Creates a compressed version of the model</li>
                              </ul>
                            </li>
                            
                            <li>
                              <strong>Advanced Settings:</strong> Configure specialized options
                              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                                <li><strong>Julia Integration Switch:</strong> Enables high-performance differential equation solving</li>
                                <li><strong>Implicit Dependency Detection Switch:</strong> Activates NLP-based dependency discovery</li>
                                <li><strong>Dependency Optimization Engine Switch:</strong> Enables AI recommendations for dependency network</li>
                                <li><strong>Computation Mode Selector:</strong> Choose between Full (all features), Selective (balanced), or Minimal (performance-focused)</li>
                                <li><strong>Apply Advanced Settings Button:</strong> Saves all advanced settings at once</li>
                              </ul>
                            </li>
                            
                            <li>
                              <strong>About PINNs:</strong> Information about physics-informed neural networks
                              <ul className="list-[circle] pl-6 space-y-1 mt-1">
                                <li><strong>Informational Content:</strong> Read about the science behind PINNs</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="sprinttimeline">
                      <AccordionTrigger className="font-medium">
                        <Calendar className="mr-2 h-4 w-4 text-primary" />
                        Sprint Timeline
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p><strong>Purpose:</strong> View work items on a timeline with risk overlay</p>
                        <p><strong>How to use:</strong> Click on the "Sprint Timeline" link in the navigation menu</p>
                        <p><strong>What to expect:</strong> A timeline visualization showing work items by team</p>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-medium">Actions:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Timeline Items:</strong> Click to view details</li>
                            <li><strong>Risk Indicators:</strong> Color highlighting shows risk levels</li>
                            <li><strong>Sprint Selector:</strong> Change the displayed sprint</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="alerts">
                      <AccordionTrigger className="font-medium">
                        <AlertCircle className="mr-2 h-4 w-4 text-primary" />
                        Alerts
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p><strong>Purpose:</strong> Configure and view system alerts for high-risk dependencies</p>
                        <p><strong>How to use:</strong> Click on the "Alerts" link in the navigation menu</p>
                        <p><strong>What to expect:</strong> Configuration options and recent alerts</p>
                        
                        <div className="space-y-1 mt-2">
                          <p className="font-medium">Actions:</p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Alert Threshold Slider:</strong> Adjust risk threshold</li>
                            <li><strong>Notification Settings:</strong> Configure email alerts</li>
                            <li><strong>Alert History:</strong> View past alerts</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Step-by-Step Usage Guide */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    Step-by-Step Usage Guide
                  </h3>
                  
                  <Card className="p-5 border-l-4 border-primary">
                    <h4 className="font-semibold mb-3">For First-Time Users:</h4>
                    <ol className="list-decimal pl-6 space-y-4">
                      <li>
                        <p className="font-medium">Initial Setup:</p>
                        <ul className="list-disc pl-6">
                          <li>Navigate to "Physics Settings"</li>
                          <li>Click "Train Model" button in the Basic Settings tab</li>
                          <li>Wait for model training to complete (indicated by success toast)</li>
                          <li>Toggle "Enable PINN" switch to ON</li>
                        </ul>
                      </li>
                      
                      <li>
                        <p className="font-medium">Configure Advanced Settings:</p>
                        <ul className="list-disc pl-6">
                          <li>Navigate to the "Advanced Settings" tab</li>
                          <li>Toggle desired features:
                            <ul className="list-[circle] pl-6">
                              <li>"Julia Integration" for faster differential equation solving</li>
                              <li>"Implicit Dependency Detection" to find hidden dependencies</li>
                              <li>"Dependency Optimization Engine" for AI recommendations</li>
                            </ul>
                          </li>
                          <li>Select appropriate "Computation Mode" based on your needs</li>
                          <li>Click "Apply Advanced Settings" button</li>
                        </ul>
                      </li>
                      
                      <li>
                        <p className="font-medium">Analyze Work Items:</p>
                        <ul className="list-disc pl-6">
                          <li>Navigate to "AI Analysis"</li>
                          <li>Enter work item description text</li>
                          <li>Click "Analyze" button</li>
                          <li>Review detected dependencies and recommendations</li>
                        </ul>
                      </li>
                      
                      <li>
                        <p className="font-medium">View Dependency Graph:</p>
                        <ul className="list-disc pl-6">
                          <li>Return to "Dashboard"</li>
                          <li>Interact with Dependency Graph by:
                            <ul className="list-[circle] pl-6">
                              <li>Hovering over nodes to see details</li>
                              <li>Clicking nodes to select</li>
                              <li>Using zoom controls for better visibility</li>
                              <li>Toggling filters to focus on specific teams or types</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      
                      <li>
                        <p className="font-medium">Check Risk Assessments:</p>
                        <ul className="list-disc pl-6">
                          <li>Navigate to "Dependencies"</li>
                          <li>Review color-coded risk indicators</li>
                          <li>Sort by risk score to identify highest risks</li>
                          <li>Click on high-risk dependencies for mitigation recommendations</li>
                        </ul>
                      </li>
                      
                      <li>
                        <p className="font-medium">Monitor Timeline:</p>
                        <ul className="list-disc pl-6">
                          <li>Navigate to "Sprint Timeline"</li>
                          <li>View work items organized by team with risk overlay</li>
                          <li>Identify potential timeline conflicts based on color coding</li>
                        </ul>
                      </li>
                      
                      <li>
                        <p className="font-medium">Set Up Alerts:</p>
                        <ul className="list-disc pl-6">
                          <li>Navigate to "Alerts"</li>
                          <li>Configure risk threshold for notifications</li>
                          <li>Set up email settings for automatic alerts</li>
                          <li>Review alert history</li>
                        </ul>
                      </li>
                    </ol>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-5 border-b border-neutral-200">
                <h3 className="font-semibold">Contact Support</h3>
              </div>
              <div className="p-5">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <input 
                      type="text" 
                      className="w-full p-2 text-sm border border-neutral-300 rounded"
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      className="w-full p-2 text-sm border border-neutral-300 rounded h-32"
                      placeholder="Please provide details about your issue..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select className="w-full p-2 text-sm border border-neutral-300 rounded">
                      <option>Low - General question</option>
                      <option>Medium - Issue affecting some functionality</option>
                      <option>High - Major feature not working</option>
                      <option>Critical - System down or unusable</option>
                    </select>
                  </div>
                  <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded text-sm">
                    Submit Ticket
                  </button>
                </form>

                <div className="mt-6 text-sm text-neutral-500">
                  <p>Alternatively, you can email us at:</p>
                  <a href="mailto:support@ado-ai-tracker.com" className="text-primary">
                    support@ado-ai-tracker.com
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Help;