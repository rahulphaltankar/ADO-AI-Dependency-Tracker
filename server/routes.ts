import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { workItems, dependencies, insertWorkItemSchema, insertDependencySchema, aiAnalysis, insertAiAnalysisSchema } from "@shared/schema";
import { createAdoClient } from "./lib/azureDevOps";
import { analyzeDependencyText } from "./lib/openai";
import { dependencyAnalyzer } from "./lib/dependencyAnalysis";
import { notificationService } from "./lib/notification";
import { riskPredictionService } from "./lib/riskPrediction";

export async function registerRoutes(app: Express): Promise<Server> {
  // ------------------ API ROUTES ------------------
  
  // Get all work items
  app.get('/api/work-items', async (req, res) => {
    try {
      const items = await storage.getWorkItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch work items', error: error.message });
    }
  });
  
  // Get work item by ID
  app.get('/api/work-items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getWorkItem(id);
      
      if (!item) {
        return res.status(404).json({ message: 'Work item not found' });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch work item', error: error.message });
    }
  });
  
  // Create work item
  app.post('/api/work-items', async (req, res) => {
    try {
      const validatedData = insertWorkItemSchema.parse(req.body);
      const newItem = await storage.createWorkItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create work item', error: error.message });
    }
  });
  
  // Update work item
  app.patch('/api/work-items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkItemSchema.partial().parse(req.body);
      
      const updatedItem = await storage.updateWorkItem(id, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Work item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update work item', error: error.message });
    }
  });
  
  // Get all dependencies
  app.get('/api/dependencies', async (req, res) => {
    try {
      const deps = await storage.getDependencies();
      res.json(deps);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dependencies', error: error.message });
    }
  });
  
  // Get dependencies for a work item
  app.get('/api/work-items/:id/dependencies', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deps = await storage.getDependenciesByWorkItem(id);
      res.json(deps);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dependencies', error: error.message });
    }
  });
  
  // Create dependency
  app.post('/api/dependencies', async (req, res) => {
    try {
      const validatedData = insertDependencySchema.parse(req.body);
      
      // Verify that source and target work items exist
      const sourceItem = await storage.getWorkItem(validatedData.sourceId);
      const targetItem = await storage.getWorkItem(validatedData.targetId);
      
      if (!sourceItem || !targetItem) {
        return res.status(404).json({ 
          message: 'Source or target work item not found',
          sourceExists: !!sourceItem,
          targetExists: !!targetItem
        });
      }
      
      // If risk score is not provided, calculate it
      if (!validatedData.riskScore) {
        // In a real app, we would have team velocity data from ADO
        const teamVelocities = []; 
        const riskScore = await riskPredictionService.predictDependencyRisk(
          validatedData, 
          sourceItem, 
          targetItem, 
          teamVelocities
        );
        validatedData.riskScore = riskScore;
        
        // Calculate expected delay based on risk score
        validatedData.expectedDelay = riskPredictionService.estimateDelay(riskScore, targetItem);
      }
      
      const newDependency = await storage.createDependency(validatedData);
      
      // Send notification if risk is above threshold
      if (newDependency.riskScore && newDependency.riskScore >= 60) {
        await notificationService.sendDependencyAlert(newDependency, sourceItem, targetItem);
      }
      
      res.status(201).json(newDependency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create dependency', error: error.message });
    }
  });
  
  // Update dependency
  app.patch('/api/dependencies/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDependencySchema.partial().parse(req.body);
      
      const updatedDependency = await storage.updateDependency(id, validatedData);
      
      if (!updatedDependency) {
        return res.status(404).json({ message: 'Dependency not found' });
      }
      
      res.json(updatedDependency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update dependency', error: error.message });
    }
  });
  
  // Get dependency graph
  app.get('/api/dependency-graph', async (req, res) => {
    try {
      const workItems = await storage.getWorkItems();
      const dependencies = await storage.getDependencies();
      
      const graph = dependencyAnalyzer.buildDependencyGraph(workItems, dependencies);
      const d3Graph = dependencyAnalyzer.exportToD3Format(graph);
      
      res.json(d3Graph);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate dependency graph', error: error.message });
    }
  });
  
  // Analyze text for dependencies
  app.post('/api/analyze-text', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: 'Text is required' });
      }
      
      // Get work items for context
      const workItems = await storage.getWorkItems();
      
      // Analyze text with OpenAI
      const analysis = await analyzeDependencyText(text, workItems);
      
      // Store the analysis
      const newAnalysis = await storage.createAiAnalysis({
        inputText: text,
        dependencyEntities: analysis.dependencyEntities,
        relatedWorkItemIds: analysis.relatedWorkItems,
        riskAssessment: analysis.riskAssessment
      });
      
      // If high risk, send notification
      if (analysis.riskAssessment?.riskScore >= 60 && analysis.relatedWorkItems?.length > 0) {
        await notificationService.sendAiAnalysisAlert(
          text,
          analysis.relatedWorkItems,
          analysis.riskAssessment.riskScore,
          analysis.riskAssessment.expectedDelay
        );
      }
      
      res.json(newAnalysis);
    } catch (error) {
      res.status(500).json({ message: 'Failed to analyze text', error: error.message });
    }
  });
  
  // Get previous AI analyses
  app.get('/api/ai-analyses', async (req, res) => {
    try {
      const analyses = await storage.getAiAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch AI analyses', error: error.message });
    }
  });
  
  // Sync with Azure DevOps
  app.post('/api/ado/sync', async (req, res) => {
    try {
      // In a real app, this would fetch data from Azure DevOps API
      // Using ado settings from the database
      
      // For the prototype, we'll just return success
      res.json({ 
        message: 'Sync completed successfully',
        stats: {
          workItemsImported: 12,
          dependenciesDetected: 8,
          highRiskDependencies: 3
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to sync with Azure DevOps', error: error.message });
    }
  });
  
  // Get sprint status
  app.get('/api/sprint-status', async (req, res) => {
    try {
      // Calculate sprint metrics
      const sprint = req.query.sprint?.toString() || 'Sprint 9';
      const workItems = await storage.getWorkItemsBySprint(sprint);
      
      const totalItems = workItems.length;
      const completedItems = workItems.filter(item => item.state === 'Completed').length;
      
      const totalStoryPoints = workItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
      const completedStoryPoints = workItems
        .filter(item => item.state === 'Completed')
        .reduce((sum, item) => sum + (item.storyPoints || 0), 0);
      
      res.json({
        sprint,
        totalItems,
        completedItems,
        totalStoryPoints,
        completedStoryPoints,
        completionPercentage: totalStoryPoints > 0 
          ? Math.round((completedStoryPoints / totalStoryPoints) * 100) 
          : 0
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sprint status', error: error.message });
    }
  });
  
  // Get team velocity
  app.get('/api/team-velocity', async (req, res) => {
    try {
      // In a real app, this would calculate from historical data
      // For the prototype, return mock data
      res.json([
        {
          sprint: 'Sprint 8',
          teams: [
            { name: 'API Team', completed: 18, planned: 21 },
            { name: 'UI Team', completed: 13, planned: 13 },
            { name: 'Database Team', completed: 8, planned: 13 },
            { name: 'DevOps Team', completed: 5, planned: 8 }
          ]
        },
        {
          sprint: 'Sprint 9',
          teams: [
            { name: 'API Team', completed: 21, planned: 21 },
            { name: 'UI Team', completed: 13, planned: 13 },
            { name: 'Database Team', completed: 11, planned: 13 },
            { name: 'DevOps Team', completed: 8, planned: 8 }
          ]
        },
        {
          sprint: 'Sprint 10',
          teams: [
            { name: 'API Team', completed: 18, planned: 21 },
            { name: 'UI Team', completed: 13, planned: 13 },
            { name: 'Database Team', completed: 8, planned: 13 },
            { name: 'DevOps Team', completed: 5, planned: 8 }
          ]
        },
        {
          sprint: 'Sprint 11',
          teams: [
            { name: 'API Team', completed: 24, planned: 21 },
            { name: 'UI Team', completed: 18, planned: 21 },
            { name: 'Database Team', completed: 13, planned: 21 },
            { name: 'DevOps Team', completed: 8, planned: 13 }
          ]
        },
        {
          sprint: 'Sprint 12',
          teams: [
            { name: 'API Team', completed: 21, planned: 21 },
            { name: 'UI Team', completed: 16, planned: 21 },
            { name: 'Database Team', completed: 16, planned: 21 },
            { name: 'DevOps Team', completed: 13, planned: 13 }
          ]
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch team velocity', error: error.message });
    }
  });
  
  // Get high risk dependencies
  app.get('/api/high-risk-dependencies', async (req, res) => {
    try {
      const allDeps = await storage.getDependencies();
      const highRiskDeps = allDeps.filter(dep => (dep.riskScore || 0) >= 65);
      
      // Get associated work items
      const workItemIds = new Set<number>();
      highRiskDeps.forEach(dep => {
        workItemIds.add(dep.sourceId);
        workItemIds.add(dep.targetId);
      });
      
      const workItems = await Promise.all(
        Array.from(workItemIds).map(id => storage.getWorkItem(id))
      );
      
      // Create result with work item details
      const result = await Promise.all(
        highRiskDeps.map(async (dep) => {
          const source = workItems.find(item => item?.id === dep.sourceId);
          const target = workItems.find(item => item?.id === dep.targetId);
          
          return {
            dependency: dep,
            source: source || null,
            target: target || null
          };
        })
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch high risk dependencies', error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
