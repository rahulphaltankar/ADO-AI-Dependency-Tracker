import { WorkItem, Dependency } from '@shared/schema';
import { pythonAPI } from './pythonAPI';

interface TeamVelocity {
  team: string;
  sprints: {
    sprintName: string;
    completed: number;
    planned: number;
  }[];
}

interface RiskFactors {
  teamVelocity: number; // 0-100
  dependencyComplexity: number; // 0-100
  resourceAllocation: number; // 0-100
  teamSize?: number; // Number of people in the team
  storyPoints?: number; // Story points for the work item
  buffer?: number; // Buffer size (0-1)
  time?: number; // Time factor (0-1)
  depth?: number; // Dependency depth (0-1)
  usePINN?: boolean; // Whether to use PINN for prediction
}

interface RiskPredictionResult {
  riskScore: number;
  expectedDelay: number;
  productivityImpact?: number;
  modelUsed: 'traditional' | 'pinn';
}

export class RiskPredictionService {
  private pinnEnabled: boolean = true; // Flag to enable/disable PINN usage
  private lightweightMode: boolean = false; // Flag for resource-constrained environments
  
  /**
   * Configure the risk prediction service
   */
  configure(options: { 
    usePINN?: boolean;
    lightweightMode?: boolean;
  }): void {
    if (options.usePINN !== undefined) {
      this.pinnEnabled = options.usePINN;
    }
    
    if (options.lightweightMode !== undefined) {
      this.lightweightMode = options.lightweightMode;
    }
  }
  
  /**
   * Get current configuration
   */
  getConfiguration(): { 
    pinnEnabled: boolean; 
    lightweightMode: boolean;
    pinnAvailable: boolean;
  } {
    return {
      pinnEnabled: this.pinnEnabled,
      lightweightMode: this.lightweightMode,
      pinnAvailable: pythonAPI.isPINNAvailable()
    };
  }

  /**
   * Predict risk percentage for a specific dependency
   */
  async predictDependencyRisk(
    dependency: Dependency,
    sourceItem: WorkItem,
    targetItem: WorkItem,
    teamVelocities: TeamVelocity[]
  ): Promise<RiskPredictionResult> {
    // Extract risk factors
    const riskFactors = this.extractRiskFactors(
      dependency,
      sourceItem,
      targetItem,
      teamVelocities
    );
    
    // Decide whether to use PINN based on configuration
    const usePINN = this.pinnEnabled && !dependency.aiSuspect;
    riskFactors.usePINN = usePINN;
    
    try {
      // Use the Python API to predict risk
      const prediction = await pythonAPI.predictRisk(riskFactors);
      
      // Extract prediction results
      const riskScore = prediction.risk;
      let expectedDelay: number;
      
      if (prediction.model === 'pinn' && prediction.effectiveDuration) {
        // Use physics-informed delay estimation if available
        expectedDelay = prediction.delay !== undefined
          ? Math.round(prediction.delay)
          : this.estimateDelay(riskScore, targetItem);
      } else {
        // Use traditional delay estimation
        expectedDelay = this.estimateDelay(riskScore, targetItem);
      }
      
      return {
        riskScore: Math.round(riskScore),
        expectedDelay,
        productivityImpact: prediction.productivity,
        modelUsed: prediction.model || 'traditional'
      };
    } catch (error) {
      console.error('Error predicting risk with ML/PINN model:', error);
      
      // Fallback risk calculation if models fail
      const riskScore = this.calculateFallbackRisk(riskFactors);
      const expectedDelay = this.estimateDelay(riskScore, targetItem);
      
      return {
        riskScore,
        expectedDelay,
        modelUsed: 'traditional'
      };
    }
  }

  /**
   * Estimate delay days based on risk score and work item attributes
   */
  estimateDelay(riskScore: number, workItem: WorkItem): number {
    // Basic formula: Higher risk & story points lead to longer delays
    const storyPoints = workItem.storyPoints || 1;
    const baseDelay = (riskScore / 20); // 0-5 days for 0-100% risk
    
    // Scale by story points (larger items have more potential for delay)
    const scaleFactor = storyPoints <= 3 ? 0.5 : 
                        storyPoints <= 8 ? 1.0 : 
                        storyPoints <= 13 ? 1.5 : 2.0;
                        
    return Math.round(baseDelay * scaleFactor);
  }
  
  /**
   * Train a PINN model using historical work items and dependencies
   */
  async trainPINNModel(
    workItems: WorkItem[],
    dependencies: Dependency[],
    teamVelocities: TeamVelocity[]
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await pythonAPI.trainPINNModel(
        workItems,
        dependencies,
        teamVelocities
      );
      
      if (result.success) {
        // Update configuration to use PINN since we now have a trained model
        this.pinnEnabled = true;
        return {
          success: true,
          message: `Successfully trained PINN model '${result.modelName}' over ${result.epochs} epochs.`
        };
      } else {
        return {
          success: false,
          message: `Failed to train PINN model: ${result.error}`
        };
      }
    } catch (error) {
      console.error('Error training PINN model:', error);
      return {
        success: false,
        message: `Error training model: ${error.message}`
      };
    }
  }
  
  /**
   * Create a quantized model for resource-constrained environments
   */
  async createLightweightModel(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await pythonAPI.createQuantizedModel('dependency_pinn');
      
      if (result.success) {
        // Update configuration to use lightweight mode
        this.lightweightMode = true;
        return {
          success: true,
          message: `Successfully created lightweight model '${result.modelName}'.`
        };
      } else {
        return {
          success: false,
          message: `Failed to create lightweight model: ${result.error}`
        };
      }
    } catch (error) {
      console.error('Error creating lightweight model:', error);
      return {
        success: false,
        message: `Error creating lightweight model: ${error.message}`
      };
    }
  }

  /**
   * Extract risk factors from work items and dependencies
   */
  private extractRiskFactors(
    dependency: Dependency,
    sourceItem: WorkItem,
    targetItem: WorkItem,
    teamVelocities: TeamVelocity[]
  ): RiskFactors {
    // Calculate team velocity factor
    const targetTeam = targetItem.team || '';
    const teamVelocity = this.calculateTeamVelocityFactor(targetTeam, teamVelocities);
    
    // Dependency complexity is based on the number of dependencies and their risk
    const dependencyComplexity = dependency.aiDetected ? 70 : 50; // AI-detected dependencies tend to be more complex
    
    // Resource allocation factor (simplified)
    const resourceAllocation = this.calculateResourceAllocationFactor(targetItem.assignedTo || '');
    
    // Calculate team size
    const teamSize = this.calculateTeamSize(targetTeam, teamVelocities);
    
    // Calculate buffer based on sprint data
    const buffer = this.calculateBuffer(targetItem, teamVelocities);
    
    // Calculate dependency depth
    const depth = this.calculateDependencyDepth(dependency);
    
    // Calculate time factor (normalized sprint progress)
    const time = this.calculateTimeFactor(targetItem);
    
    // Return all factors
    return {
      teamVelocity,
      dependencyComplexity,
      resourceAllocation,
      teamSize,
      storyPoints: targetItem.storyPoints,
      buffer,
      depth,
      time
    };
  }

  /**
   * Calculate team velocity factor based on historical sprint data
   */
  private calculateTeamVelocityFactor(team: string, teamVelocities: TeamVelocity[]): number {
    const teamData = teamVelocities.find(tv => tv.team === team);
    
    if (!teamData || teamData.sprints.length === 0) {
      return 50; // Default medium velocity
    }
    
    // Calculate completion ratio for each sprint
    const completionRatios = teamData.sprints.map(sprint => {
      if (sprint.planned === 0) return 1;
      return sprint.completed / sprint.planned;
    });
    
    // Recent sprints matter more, so use a weighted average
    const weights = completionRatios.map((_, i) => i + 1); // [1, 2, 3, ...]
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    
    // Calculate weighted average completion ratio
    const weightedRatio = completionRatios.reduce(
      (sum, ratio, i) => sum + (ratio * weights[i]), 0
    ) / weightSum;
    
    // Convert to 0-100 scale (lower completion ratio = higher risk)
    return 100 - Math.round(weightedRatio * 100);
  }

  /**
   * Calculate resource allocation factor
   */
  private calculateResourceAllocationFactor(assignedTo: string): number {
    // In a real system, this would check resource allocation across projects
    // For this prototype, just return a medium value
    return assignedTo ? 40 : 70; // Unassigned items have higher risk
  }

  /**
   * Calculate team size based on team velocities data
   */
  private calculateTeamSize(team: string, teamVelocities: TeamVelocity[]): number {
    // In a real system, this would get actual team size
    // For this prototype, use a default value
    return team ? 5 : 1; // Default team size
  }
  
  /**
   * Calculate buffer based on sprint and work item data
   */
  private calculateBuffer(workItem: WorkItem, teamVelocities: TeamVelocity[]): number {
    // Extract sprint from work item
    const sprint = workItem.sprint || '';
    const sprintMatch = sprint.match(/Sprint (\d+)/);
    
    if (!sprintMatch) {
      return 0.15; // Default buffer
    }
    
    // Higher sprint number means less buffer (time pressure increases)
    const sprintNumber = parseInt(sprintMatch[1], 10);
    const maxSprints = 20; // Assume project has max 20 sprints
    
    // Calculate buffer as percentage (higher sprint = lower buffer)
    return Math.max(0.05, 0.3 - (sprintNumber / maxSprints) * 0.25);
  }
  
  /**
   * Calculate dependency depth
   */
  private calculateDependencyDepth(dependency: Dependency): number {
    // In a real system, this would calculate the actual dependency depth
    // For this prototype, use simple heuristic
    if (dependency.notes && dependency.notes.includes('deep')) {
      return 0.8; // Deep dependency
    } else if (dependency.notes && dependency.notes.includes('shallow')) {
      return 0.2; // Shallow dependency
    }
    
    return 0.5; // Default medium depth
  }
  
  /**
   * Calculate time factor based on sprint progress
   */
  private calculateTimeFactor(workItem: WorkItem): number {
    // Extract sprint from work item
    const sprint = workItem.sprint || '';
    const sprintMatch = sprint.match(/Sprint (\d+)/);
    
    if (!sprintMatch) {
      return 0.5; // Default time factor
    }
    
    // Normalize sprint number to 0-1 range
    const sprintNumber = parseInt(sprintMatch[1], 10);
    const maxSprints = 20; // Assume project has max 20 sprints
    
    return Math.min(1, sprintNumber / maxSprints);
  }

  /**
   * Calculate fallback risk when ML/PINN models fail
   */
  private calculateFallbackRisk(factors: RiskFactors): number {
    // Simple weighted average of risk factors
    const weights = {
      teamVelocity: 0.4,
      dependencyComplexity: 0.4,
      resourceAllocation: 0.2
    };
    
    return Math.round(
      factors.teamVelocity * weights.teamVelocity +
      factors.dependencyComplexity * weights.dependencyComplexity +
      factors.resourceAllocation * weights.resourceAllocation
    );
  }
}

export const riskPredictionService = new RiskPredictionService();
