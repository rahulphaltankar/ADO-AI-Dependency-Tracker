import { Dependency, WorkItem } from '@shared/schema';
import * as networkx from './pythonAPI';

interface DependencyNode {
  id: number;
  adoId: number;
  title: string;
  type: string;
  state: string;
  sprint: string;
  team: string;
  riskScore: number;
}

interface DependencyLink {
  source: number;
  target: number;
  type: string;
  riskScore: number;
  expectedDelay: number | null;
}

interface DependencyGraph {
  nodes: DependencyNode[];
  links: DependencyLink[];
}

export class DependencyAnalyzer {
  // Build a dependency graph from work items and dependencies
  buildDependencyGraph(workItems: WorkItem[], dependencies: Dependency[]): DependencyGraph {
    const nodes: DependencyNode[] = workItems.map(item => ({
      id: item.id,
      adoId: item.adoId,
      title: item.title,
      type: item.type,
      state: item.state,
      sprint: item.sprint,
      team: item.team || '',
      riskScore: this.calculateWorkItemRisk(item, dependencies)
    }));

    const links: DependencyLink[] = dependencies.map(dep => ({
      source: dep.sourceId,
      target: dep.targetId,
      type: dep.dependencyType,
      riskScore: dep.riskScore || 0,
      expectedDelay: dep.expectedDelay || null
    }));

    return { nodes, links };
  }

  // Calculate the risk score for a work item based on its dependencies
  private calculateWorkItemRisk(workItem: WorkItem, dependencies: Dependency[]): number {
    // Get dependencies where this work item is the source
    const deps = dependencies.filter(dep => dep.sourceId === workItem.id);
    
    if (deps.length === 0) {
      return 0; // No dependencies, no risk
    }
    
    // Calculate average risk score from dependencies
    const totalRisk = deps.reduce((sum, dep) => sum + (dep.riskScore || 0), 0);
    return Math.round(totalRisk / deps.length);
  }

  // Identify critical path in the dependency network
  async identifyCriticalPath(graph: DependencyGraph): Promise<number[]> {
    try {
      // Convert our graph to the format expected by the Python API
      const nodeIds = graph.nodes.map(node => node.id);
      const edges = graph.links.map(link => ({
        source: link.source,
        target: link.target,
        weight: link.expectedDelay || 1 // Use expected delay as weight
      }));

      // Call the Python API to find the critical path
      const criticalPath = await networkx.findCriticalPath(nodeIds, edges);
      return criticalPath;
    } catch (error) {
      console.error('Error identifying critical path:', error);
      return [];
    }
  }

  // Calculate cascade impact if a specific work item is delayed
  async calculateCascadeImpact(workItemId: number, graph: DependencyGraph): Promise<{
    affectedItems: number[],
    totalDelay: number
  }> {
    try {
      // Convert our graph to the format expected by the Python API
      const nodeIds = graph.nodes.map(node => node.id);
      const edges = graph.links.map(link => ({
        source: link.source,
        target: link.target,
        weight: link.expectedDelay || 1
      }));

      // Call the Python API to calculate cascade impact
      const impact = await networkx.calculateCascadeImpact(workItemId, nodeIds, edges);
      return impact;
    } catch (error) {
      console.error('Error calculating cascade impact:', error);
      return { affectedItems: [], totalDelay: 0 };
    }
  }

  // Export dependency graph to D3.js compatible format
  exportToD3Format(graph: DependencyGraph): any {
    // D3.js force directed graph format
    return {
      nodes: graph.nodes.map(node => ({
        id: node.id,
        adoId: node.adoId,
        label: `${node.adoId}`,
        title: node.title,
        type: node.type,
        state: node.state,
        sprint: node.sprint,
        team: node.team,
        riskScore: node.riskScore,
        // Map risk score to color
        color: this.getRiskColor(node.riskScore)
      })),
      links: graph.links.map(link => ({
        source: link.source,
        target: link.target,
        type: link.type,
        riskScore: link.riskScore,
        expectedDelay: link.expectedDelay,
        // Map risk score to color and width
        color: this.getRiskColor(link.riskScore),
        width: this.getLinkWidth(link.riskScore)
      }))
    };
  }

  // Calculate dependency chain complexity score
  calculateDependencyComplexity(graph: DependencyGraph): number {
    // Network complexity measurements
    const numNodes = graph.nodes.length;
    const numEdges = graph.links.length;
    
    if (numNodes <= 1) {
      return 0;
    }
    
    // Calculate network density (0-100 scale)
    const maxPossibleEdges = numNodes * (numNodes - 1);
    const density = (numEdges / maxPossibleEdges) * 100;
    
    // Calculate average risk score
    const totalRisk = graph.links.reduce((sum, link) => sum + link.riskScore, 0);
    const avgRisk = numEdges > 0 ? totalRisk / numEdges : 0;
    
    // Combine metrics (density contributes 40%, average risk 60%)
    return Math.round((density * 0.4) + (avgRisk * 0.6));
  }

  // Helper functions
  private getRiskColor(riskScore: number): string {
    if (riskScore >= 65) return '#D13438'; // High risk - Red
    if (riskScore >= 35) return '#FFAA44'; // Medium risk - Orange
    return '#0078D4'; // Low risk - Blue
  }

  private getLinkWidth(riskScore: number): number {
    if (riskScore >= 65) return 2.5;
    if (riskScore >= 35) return 2;
    return 1.5;
  }
}

export const dependencyAnalyzer = new DependencyAnalyzer();
