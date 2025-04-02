import React from 'react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Help = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Help & Support</h1>
      </div>

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
                    <span className="material-icons text-sm mr-2">description</span>
                    User Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <span className="material-icons text-sm mr-2">video_library</span>
                    Video Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <span className="material-icons text-sm mr-2">school</span>
                    Getting Started Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <span className="material-icons text-sm mr-2">build</span>
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <span className="material-icons text-sm mr-2">new_releases</span>
                    Release Notes
                  </a>
                </li>
              </ul>
            </div>
          </Card>

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
      </div>
    </div>
  );
};

export default Help;
