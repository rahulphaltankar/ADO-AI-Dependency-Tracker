// Work Item Types
export interface WorkItem {
  id: number;
  adoId: number;
  title: string;
  type: string;
  state: string;
  assignedTo: string;
  team: string;
  sprint: string;
  storyPoints: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Dependency Types
export interface Dependency {
  id: number;
  sourceId: number;
  targetId: number;
  dependencyType: string;
  aiDetected: boolean;
  detectionSource: string;
  riskScore: number;
  expectedDelay: number;
  createdAt: string;
  updatedAt: string;
}

// AI Analysis Types
export interface DependencyEntity {
  entity: string;
  relation: string;
  confidence: number;
}

export interface RiskAssessment {
  riskScore: number;
  expectedDelay: number;
  factors: string[];
}

export interface AiAnalysis {
  id: number;
  inputText: string;
  dependencyEntities: DependencyEntity[];
  relatedWorkItemIds: number[];
  riskAssessment: RiskAssessment;
  createdAt: string;
}

// Dependency Graph Types
export interface DependencyNode {
  id: number;
  adoId: number;
  label: string;
  title: string;
  type: string;
  state: string;
  sprint: string;
  team: string;
  riskScore: number;
  color: string;
}

export interface DependencyLink {
  source: number;
  target: number;
  type: string;
  riskScore: number;
  expectedDelay: number;
  color: string;
  width: number;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  links: DependencyLink[];
}

// Sprint Status Types
export interface SprintStatus {
  sprint: string;
  totalItems: number;
  completedItems: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completionPercentage: number;
}

// Team Velocity Types
export interface TeamVelocity {
  name: string;
  completed: number;
  planned: number;
}

export interface SprintVelocity {
  sprint: string;
  teams: TeamVelocity[];
}

// High Risk Dependency Types
export interface HighRiskDependency {
  dependency: Dependency;
  source: WorkItem | null;
  target: WorkItem | null;
}

// Settings Types
export interface AdoSettings {
  id: number;
  userId: number;
  organization: string;
  project: string;
  token: string;
}

export interface AlertSettings {
  id: number;
  userId: number;
  slackWebhook: string;
  teamsWebhook: string;
  riskThreshold: number;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  organization: string;
}
