import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAnalysisApi, workItemsApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const AiAnalysis = () => {
  const [inputText, setInputText] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['/api/ai-analyses'],
    queryFn: aiAnalysisApi.getAll
  });

  const { data: workItems, isLoading: isLoadingWorkItems } = useQuery({
    queryKey: ['/api/work-items'],
    queryFn: workItemsApi.getAll
  });

  const analysisMutation = useMutation({
    mutationFn: aiAnalysisApi.analyzeText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-analyses'] });
      setInputText('');
      toast({
        title: "Analysis complete",
        description: "Dependency analysis has been processed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter text to analyze dependencies.",
        variant: "destructive",
      });
      return;
    }
    
    analysisMutation.mutate(inputText);
  };

  // Get work item title by ADO ID
  const getWorkItemTitle = (adoId: number) => {
    const workItem = workItems?.find(item => item.adoId === adoId);
    return workItem?.title || `Work Item ${adoId}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">AI Dependency Analysis</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <h3 className="font-semibold">Analyze Text</h3>
            </div>
            <div className="p-5">
              <Textarea 
                className="min-h-40 mb-4"
                placeholder="Enter dependency text to analyze. For example: 'We can't deploy until the database team finishes migration (Expected: Sprint 8)'..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <Button 
                className="w-full bg-primary hover:bg-primary-dark flex items-center justify-center"
                onClick={handleAnalyze}
                disabled={analysisMutation.isPending}
              >
                {analysisMutation.isPending ? (
                  <>
                    <span className="material-icons mr-2 animate-spin">refresh</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">psychology</span>
                    Analyze with AI
                  </>
                )}
              </Button>

              <div className="mt-5">
                <h4 className="text-sm font-medium mb-2">What This Does</h4>
                <ul className="text-sm text-neutral-600 space-y-2 list-disc pl-5">
                  <li>Extracts dependency relationships from free text</li>
                  <li>Identifies related work items in Azure DevOps</li>
                  <li>Assesses risk based on historical data</li>
                  <li>Predicts potential delay impact</li>
                  <li>Creates dependency links automatically</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="p-5 border-b border-neutral-200">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Analysis Results</h3>
                <Button variant="outline" size="sm">
                  <span className="material-icons text-sm mr-1">history</span>
                  View History
                </Button>
              </div>
            </div>
            <div className="p-5">
              {isLoadingAnalyses ? (
                <div className="text-center py-8">Loading analysis history...</div>
              ) : !analyses || analyses.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No analyses yet. Use the form on the left to analyze dependency text.
                </div>
              ) : (
                <div className="space-y-6">
                  {analyses.slice(0, 5).map(analysis => (
                    <div key={analysis.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                      <div className="bg-neutral-50 p-4 border-b border-neutral-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{new Date(analysis.createdAt).toLocaleString()}</h4>
                            <p className="text-sm text-neutral-600 mt-1">"{analysis.inputText}"</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            analysis.riskAssessment?.riskScore >= 65 
                              ? 'bg-error text-white' 
                              : analysis.riskAssessment?.riskScore >= 35 
                                ? 'bg-warning text-white' 
                                : 'bg-success text-white'
                          }`}>
                            {analysis.riskAssessment?.riskScore || 0}% Risk
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Detected Dependencies</h5>
                          <ul className="text-sm space-y-1 pl-5 list-disc">
                            {analysis.dependencyEntities?.map((entity, idx) => (
                              <li key={idx}>
                                <span className="font-medium">{entity.entity}</span> 
                                <span className="text-neutral-500"> ({entity.relation})</span>
                                <span className="text-xs text-neutral-400 ml-1">
                                  {Math.round(entity.confidence * 100)}% confidence
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="mb-4">
                          <h5 className="text-sm font-medium mb-2">Related Work Items</h5>
                          {analysis.relatedWorkItemIds?.length ? (
                            <ul className="text-sm space-y-1 pl-5 list-disc">
                              {analysis.relatedWorkItemIds.map(id => (
                                <li key={id}>
                                  <span className="font-medium">{id}</span> 
                                  <span className="text-neutral-500"> - {getWorkItemTitle(id)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-neutral-500">No related work items found</p>
                          )}
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium mb-2">Risk Assessment</h5>
                          <div className="bg-neutral-50 p-3 rounded-md text-sm">
                            <div className="flex justify-between mb-1">
                              <span>Risk Score:</span>
                              <span className="font-medium">{analysis.riskAssessment?.riskScore || 0}%</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>Expected Delay:</span>
                              <span className="font-medium">{analysis.riskAssessment?.expectedDelay || 0} days</span>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs font-medium">Contributing Factors:</span>
                              <ul className="text-xs pl-5 list-disc mt-1">
                                {analysis.riskAssessment?.factors?.map((factor, idx) => (
                                  <li key={idx}>{factor}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button variant="outline" size="sm">
                            <span className="material-icons text-sm mr-1">add_link</span>
                            Create Dependencies
                          </Button>
                          <Button variant="outline" size="sm">
                            <span className="material-icons text-sm mr-1">share</span>
                            Share Analysis
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiAnalysis;
