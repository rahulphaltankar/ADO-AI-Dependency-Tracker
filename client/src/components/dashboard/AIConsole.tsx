import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAnalysisApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const AIConsole = () => {
  const [inputText, setInputText] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['/api/ai-analyses'],
    queryFn: aiAnalysisApi.getAll
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

  // Sort analyses by date, most recent first
  const sortedAnalyses = [...(analyses || [])].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get the two most recent analyses
  const recentAnalyses = sortedAnalyses.slice(0, 2);

  return (
    <div className="xl:col-span-1">
      <Card>
        <div className="p-5 border-b border-neutral-200">
          <h3 className="font-semibold">AI Dependency Analysis</h3>
        </div>
        <div className="p-5">
          <Textarea
            className="w-full border border-neutral-300 rounded-md p-3 h-32 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Describe a dependency e.g., 'We can't deploy until the database team finishes migration (Expected: Sprint 8)'"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <Button 
            className="mt-3 w-full bg-primary text-white py-2.5 rounded-md hover:bg-primary-dark flex items-center justify-center"
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
                Analyze Dependencies
              </>
            )}
          </Button>
          
          <div className="mt-5">
            <div className="text-sm font-medium mb-2">Recent Analysis</div>
            
            {isLoading ? (
              <>
                <Skeleton className="h-40 w-full mb-3" />
                <Skeleton className="h-40 w-full" />
              </>
            ) : recentAnalyses.length === 0 ? (
              <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4 text-center text-neutral-500">
                No recent analyses. Try analyzing some text!
              </div>
            ) : (
              recentAnalyses.map((analysis) => {
                const isHighRisk = analysis.riskAssessment?.riskScore >= 65;
                const isMediumRisk = analysis.riskAssessment?.riskScore >= 35 && analysis.riskAssessment?.riskScore < 65;
                
                return (
                  <div key={analysis.id} className="bg-neutral-50 border border-neutral-200 rounded-md p-4 mb-3">
                    <div className="flex items-start">
                      <span className={`material-icons mr-2 mt-0.5 ${isHighRisk ? 'text-error' : isMediumRisk ? 'text-warning' : 'text-primary'}`}>
                        {isHighRisk ? 'warning' : isMediumRisk ? 'info' : 'check_circle'}
                      </span>
                      <div>
                        <div className="text-sm font-medium">
                          {isHighRisk ? 'High-Risk' : isMediumRisk ? 'Medium-Risk' : 'Low-Risk'} Dependency Detected
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          "{analysis.inputText}"
                        </p>
                        
                        <div className="mt-3 p-3 bg-white border border-neutral-200 rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-medium">
                              Linked to: {analysis.relatedWorkItemIds?.map(id => (
                                <span key={id} className="text-primary ml-1">{id}</span>
                              ))}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isHighRisk 
                                ? 'bg-error bg-opacity-10 text-error' 
                                : isMediumRisk 
                                  ? 'bg-warning bg-opacity-10 text-warning' 
                                  : 'bg-primary bg-opacity-10 text-primary'
                            }`}>
                              {analysis.riskAssessment?.riskScore}% Risk
                            </span>
                          </div>
                          
                          <div className="text-xs text-neutral-600">
                            <div className="flex items-center mb-1">
                              <span className="material-icons text-xs mr-1">schedule</span>
                              Potential {analysis.riskAssessment?.expectedDelay}-day cascade delay
                            </div>
                            <div className="flex items-center">
                              <span className="material-icons text-xs mr-1">people</span>
                              {analysis.dependencyEntities?.[0]?.entity ? (
                                `Depends on: ${analysis.dependencyEntities[0].entity}`
                              ) : 'No specific team dependency detected'}
                            </div>
                          </div>
                          
                          <div className="mt-2 flex justify-end">
                            <button className="text-primary text-xs hover:underline">View Details</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIConsole;
