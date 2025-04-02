import { 
  users, User, InsertUser, 
  adoSettings, AdoSettings, InsertAdoSettings,
  alertSettings, AlertSettings, InsertAlertSettings,
  workItems, WorkItem, InsertWorkItem,
  dependencies, Dependency, InsertDependency,
  aiAnalysis, AiAnalysis, InsertAiAnalysis
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // ADO Settings operations
  getAdoSettings(userId: number): Promise<AdoSettings | undefined>;
  createAdoSettings(settings: InsertAdoSettings): Promise<AdoSettings>;
  updateAdoSettings(id: number, settings: Partial<InsertAdoSettings>): Promise<AdoSettings | undefined>;
  
  // Alert Settings operations
  getAlertSettings(userId: number): Promise<AlertSettings | undefined>;
  createAlertSettings(settings: InsertAlertSettings): Promise<AlertSettings>;
  updateAlertSettings(id: number, settings: Partial<InsertAlertSettings>): Promise<AlertSettings | undefined>;
  
  // Work Item operations
  getWorkItem(id: number): Promise<WorkItem | undefined>;
  getWorkItemByAdoId(adoId: number): Promise<WorkItem | undefined>;
  getWorkItems(): Promise<WorkItem[]>;
  getWorkItemsBySprint(sprint: string): Promise<WorkItem[]>;
  createWorkItem(workItem: InsertWorkItem): Promise<WorkItem>;
  updateWorkItem(id: number, workItem: Partial<InsertWorkItem>): Promise<WorkItem | undefined>;
  
  // Dependency operations
  getDependency(id: number): Promise<Dependency | undefined>;
  getDependencies(): Promise<Dependency[]>;
  getDependenciesByWorkItem(workItemId: number): Promise<Dependency[]>;
  createDependency(dependency: InsertDependency): Promise<Dependency>;
  updateDependency(id: number, dependency: Partial<InsertDependency>): Promise<Dependency | undefined>;
  
  // AI Analysis operations
  getAiAnalysis(id: number): Promise<AiAnalysis | undefined>;
  getAiAnalyses(): Promise<AiAnalysis[]>;
  createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private adoSettings: Map<number, AdoSettings>;
  private alertSettings: Map<number, AlertSettings>;
  private workItems: Map<number, WorkItem>;
  private dependencies: Map<number, Dependency>;
  private aiAnalyses: Map<number, AiAnalysis>;
  
  private currentUserId: number;
  private currentAdoSettingsId: number;
  private currentAlertSettingsId: number;
  private currentWorkItemId: number;
  private currentDependencyId: number;
  private currentAiAnalysisId: number;

  constructor() {
    this.users = new Map();
    this.adoSettings = new Map();
    this.alertSettings = new Map();
    this.workItems = new Map();
    this.dependencies = new Map();
    this.aiAnalyses = new Map();
    
    this.currentUserId = 1;
    this.currentAdoSettingsId = 1;
    this.currentAlertSettingsId = 1;
    this.currentWorkItemId = 1;
    this.currentDependencyId = 1;
    this.currentAiAnalysisId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  // ADO Settings operations
  async getAdoSettings(userId: number): Promise<AdoSettings | undefined> {
    return Array.from(this.adoSettings.values()).find(
      (settings) => settings.userId === userId,
    );
  }
  
  async createAdoSettings(settings: InsertAdoSettings): Promise<AdoSettings> {
    const id = this.currentAdoSettingsId++;
    const adoSetting: AdoSettings = { ...settings, id };
    this.adoSettings.set(id, adoSetting);
    return adoSetting;
  }
  
  async updateAdoSettings(id: number, settings: Partial<InsertAdoSettings>): Promise<AdoSettings | undefined> {
    const currentSettings = this.adoSettings.get(id);
    if (!currentSettings) return undefined;
    
    const updatedSettings: AdoSettings = { ...currentSettings, ...settings };
    this.adoSettings.set(id, updatedSettings);
    return updatedSettings;
  }
  
  // Alert Settings operations
  async getAlertSettings(userId: number): Promise<AlertSettings | undefined> {
    return Array.from(this.alertSettings.values()).find(
      (settings) => settings.userId === userId,
    );
  }
  
  async createAlertSettings(settings: InsertAlertSettings): Promise<AlertSettings> {
    const id = this.currentAlertSettingsId++;
    const alertSetting: AlertSettings = { ...settings, id };
    this.alertSettings.set(id, alertSetting);
    return alertSetting;
  }
  
  async updateAlertSettings(id: number, settings: Partial<InsertAlertSettings>): Promise<AlertSettings | undefined> {
    const currentSettings = this.alertSettings.get(id);
    if (!currentSettings) return undefined;
    
    const updatedSettings: AlertSettings = { ...currentSettings, ...settings };
    this.alertSettings.set(id, updatedSettings);
    return updatedSettings;
  }
  
  // Work Item operations
  async getWorkItem(id: number): Promise<WorkItem | undefined> {
    return this.workItems.get(id);
  }
  
  async getWorkItemByAdoId(adoId: number): Promise<WorkItem | undefined> {
    return Array.from(this.workItems.values()).find(
      (item) => item.adoId === adoId,
    );
  }
  
  async getWorkItems(): Promise<WorkItem[]> {
    return Array.from(this.workItems.values());
  }
  
  async getWorkItemsBySprint(sprint: string): Promise<WorkItem[]> {
    return Array.from(this.workItems.values()).filter(
      (item) => item.sprint === sprint,
    );
  }
  
  async createWorkItem(insertWorkItem: InsertWorkItem): Promise<WorkItem> {
    const id = this.currentWorkItemId++;
    const now = new Date();
    const workItem: WorkItem = { 
      ...insertWorkItem, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.workItems.set(id, workItem);
    return workItem;
  }
  
  async updateWorkItem(id: number, workItemUpdate: Partial<InsertWorkItem>): Promise<WorkItem | undefined> {
    const currentWorkItem = this.workItems.get(id);
    if (!currentWorkItem) return undefined;
    
    const now = new Date();
    const updatedWorkItem: WorkItem = { 
      ...currentWorkItem, 
      ...workItemUpdate, 
      updatedAt: now 
    };
    this.workItems.set(id, updatedWorkItem);
    return updatedWorkItem;
  }
  
  // Dependency operations
  async getDependency(id: number): Promise<Dependency | undefined> {
    return this.dependencies.get(id);
  }
  
  async getDependencies(): Promise<Dependency[]> {
    return Array.from(this.dependencies.values());
  }
  
  async getDependenciesByWorkItem(workItemId: number): Promise<Dependency[]> {
    return Array.from(this.dependencies.values()).filter(
      (dependency) => dependency.sourceId === workItemId || dependency.targetId === workItemId,
    );
  }
  
  async createDependency(insertDependency: InsertDependency): Promise<Dependency> {
    const id = this.currentDependencyId++;
    const now = new Date();
    const dependency: Dependency = { 
      ...insertDependency, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.dependencies.set(id, dependency);
    return dependency;
  }
  
  async updateDependency(id: number, dependencyUpdate: Partial<InsertDependency>): Promise<Dependency | undefined> {
    const currentDependency = this.dependencies.get(id);
    if (!currentDependency) return undefined;
    
    const now = new Date();
    const updatedDependency: Dependency = { 
      ...currentDependency, 
      ...dependencyUpdate, 
      updatedAt: now 
    };
    this.dependencies.set(id, updatedDependency);
    return updatedDependency;
  }
  
  // AI Analysis operations
  async getAiAnalysis(id: number): Promise<AiAnalysis | undefined> {
    return this.aiAnalyses.get(id);
  }
  
  async getAiAnalyses(): Promise<AiAnalysis[]> {
    return Array.from(this.aiAnalyses.values());
  }
  
  async createAiAnalysis(insertAiAnalysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const id = this.currentAiAnalysisId++;
    const now = new Date();
    const aiAnalysis: AiAnalysis = { 
      ...insertAiAnalysis, 
      id, 
      createdAt: now 
    };
    this.aiAnalyses.set(id, aiAnalysis);
    return aiAnalysis;
  }
  
  // Initialize with sample data
  private initializeSampleData() {
    // Create a sample user
    const user: InsertUser = {
      username: 'alex.j',
      password: 'password123',
      email: 'alex.j@contoso.com',
      fullName: 'Alex Johnson',
      organization: 'Contoso'
    };
    this.createUser(user);
    
    // Create sample ADO settings
    const adoSetting: InsertAdoSettings = {
      userId: 1,
      organization: 'contoso',
      project: 'ProjectX',
      token: 'sample-token'
    };
    this.createAdoSettings(adoSetting);
    
    // Create sample alert settings
    const alertSetting: InsertAlertSettings = {
      userId: 1,
      slackWebhook: 'https://hooks.slack.com/services/sample',
      teamsWebhook: 'https://outlook.office.com/webhook/sample',
      riskThreshold: 65
    };
    this.createAlertSettings(alertSetting);
    
    // Create sample work items
    const workItemsData: InsertWorkItem[] = [
      {
        adoId: 123,
        title: 'API Feature Implementation',
        type: 'User Story',
        state: 'In Progress',
        assignedTo: 'Alex Johnson',
        team: 'API Team',
        sprint: 'Sprint 9',
        storyPoints: 8,
        description: 'Implement the core API features for data processing'
      },
      {
        adoId: 456,
        title: 'Database Migration',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'Database Team',
        team: 'Database Team',
        sprint: 'Sprint 8',
        storyPoints: 13,
        description: 'Database migration for customer data'
      },
      {
        adoId: 789,
        title: 'UI Component Development',
        type: 'User Story',
        state: 'In Progress',
        assignedTo: 'Sarah Chen',
        team: 'UI Team',
        sprint: 'Sprint 9',
        storyPoints: 5,
        description: 'Develop the UI components for the dashboard'
      },
      {
        adoId: 234,
        title: 'Authentication Service',
        type: 'Task',
        state: 'In Progress',
        assignedTo: 'Security Team',
        team: 'Security Team',
        sprint: 'Sprint 8-9',
        storyPoints: 8,
        description: 'Implement authentication service with Azure AD'
      },
      {
        adoId: 567,
        title: 'Testing Framework',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'QA Team',
        team: 'QA Team',
        sprint: 'Sprint 9-10',
        storyPoints: 5,
        description: 'Set up the testing framework for the application'
      },
      {
        adoId: 457,
        title: 'Performance Optimization',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'Database Team',
        team: 'Database Team',
        sprint: 'Sprint 9',
        storyPoints: 8,
        description: 'Performance optimization for reporting queries'
      },
      {
        adoId: 203,
        title: 'Kubernetes Setup',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'DevOps Team',
        team: 'DevOps Team',
        sprint: 'Sprint 10',
        storyPoints: 13,
        description: 'Setup of production Kubernetes cluster'
      }
    ];
    
    for (const item of workItemsData) {
      this.createWorkItem(item);
    }
    
    // Create sample dependencies
    const dependenciesData: InsertDependency[] = [
      {
        sourceId: 1, // API Feature
        targetId: 2, // Database Migration
        dependencyType: 'Blocked by',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 68,
        expectedDelay: 4
      },
      {
        sourceId: 1, // API Feature
        targetId: 4, // Authentication Service
        dependencyType: 'Depends on',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 42,
        expectedDelay: 2
      },
      {
        sourceId: 3, // UI Component
        targetId: 1, // API Feature
        dependencyType: 'Blocked by',
        aiDetected: false,
        detectionSource: 'Manual',
        riskScore: 30,
        expectedDelay: 1
      },
      {
        sourceId: 5, // Testing Framework
        targetId: 1, // API Feature
        dependencyType: 'Depends on',
        aiDetected: false,
        detectionSource: 'ADO',
        riskScore: 25,
        expectedDelay: 0
      },
      {
        sourceId: 2, // Database Migration
        targetId: 6, // Performance Optimization
        dependencyType: 'Blocks',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 75,
        expectedDelay: 3
      }
    ];
    
    for (const dep of dependenciesData) {
      this.createDependency(dep);
    }
    
    // Create sample AI analyses
    const aiAnalysesData: InsertAiAnalysis[] = [
      {
        inputText: "We can't deploy until the database team finishes migration (Expected: Sprint 8)",
        dependencyEntities: [
          {
            entity: "database team",
            relation: "dependency",
            confidence: 0.95
          },
          {
            entity: "Sprint 8",
            relation: "timeframe",
            confidence: 0.9
          }
        ],
        relatedWorkItemIds: [456], // DB-456
        riskAssessment: {
          riskScore: 68,
          expectedDelay: 4,
          factors: [
            "Database team's historical velocity",
            "Complexity of migration task",
            "Dependencies on other tasks"
          ]
        }
      },
      {
        inputText: "Authentication service requires Azure AD configuration before final testing",
        dependencyEntities: [
          {
            entity: "Authentication service",
            relation: "dependency",
            confidence: 0.92
          },
          {
            entity: "Azure AD configuration",
            relation: "requirement",
            confidence: 0.85
          },
          {
            entity: "final testing",
            relation: "timeframe",
            confidence: 0.78
          }
        ],
        relatedWorkItemIds: [234], // AUTH-234
        riskAssessment: {
          riskScore: 42,
          expectedDelay: 2,
          factors: [
            "Security team's availability",
            "Azure AD setup complexity"
          ]
        }
      }
    ];
    
    for (const analysis of aiAnalysesData) {
      this.createAiAnalysis(analysis);
    }
  }
}

export const storage = new MemStorage();
