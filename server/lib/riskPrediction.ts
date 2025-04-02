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
}

export class RiskPredictionService {
  // Predict risk percentage for a specific dependency
  async predictDependencyRisk(
    dependency: Dependency,
    sourceItem: WorkItem,
    targetItem: WorkItem,
    teamVelocities: TeamVelocity[]
  ): Promise<number> {
    // Extract risk factors
    const riskFactors = this.extractRiskFactors(
      dependency,
      sourceItem,
      targetItem,
      teamVelocities
    );
    
    try {
      // Use the Python API to predict risk
      const predictedRisk = await pythonAPI.predictRisk(riskFactors);
      return Math.round(predictedRisk);
    } catch (error) {
      console.error('Error predicting risk with ML model:', error);
      
      // Fallback risk calculation if ML model fails
      return this.calculateFallbackRisk(riskFactors);
    }
  }

  // Estimate delay days based on risk score and work item attributes
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

  // Private methods
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
    
    return {
      teamVelocity,
      dependencyComplexity,
      resourceAllocation
    };
  }

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

  private calculateResourceAllocationFactor(assignedTo: string): number {
    // In a real system, this would check resource allocation across projects
    // For this prototype, just return a medium value
    return assignedTo ? 40 : 70; // Unassigned items have higher risk
  }

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
