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
      project: 'CloudOps',
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
    
    // ELEVATOR PITCH SCENARIO: A Cross-Team E-Commerce Platform Launch
    // Create sample work items representing a complete cross-team dependency flow
    const workItemsData: InsertWorkItem[] = [
      // High-level Feature Epic
      {
        adoId: 1001,
        title: 'E-Commerce Platform Launch',
        type: 'Epic',
        state: 'In Progress',
        assignedTo: 'Maria Lopez',
        team: 'Product Management',
        sprint: 'Sprint 12-15',
        storyPoints: 34,
        description: 'Launch the next-generation e-commerce platform with AI recommendations and real-time inventory'
      },
      
      // Backend Services (Current Sprint)
      {
        adoId: 1023,
        title: 'Product Catalog Microservice',
        type: 'User Story',
        state: 'In Progress',
        assignedTo: 'Alex Johnson',
        team: 'Backend Team',
        sprint: 'Sprint 12',
        storyPoints: 8,
        description: 'Implement the product catalog microservice with caching and search capabilities'
      },
      {
        adoId: 1024,
        title: 'Payment Processing Service',
        type: 'User Story',
        state: 'In Progress',
        assignedTo: 'James Wilson',
        team: 'Backend Team',
        sprint: 'Sprint 12',
        storyPoints: 13,
        description: 'Implement the payment processing service with multiple gateway integrations'
      },
      {
        adoId: 1025,
        title: 'AI Recommendation Engine',
        type: 'User Story',
        state: 'Not Started',
        assignedTo: 'Priya Sharma',
        team: 'Data Science Team',
        sprint: 'Sprint 12',
        storyPoints: 13,
        description: 'Build recommendation engine with ML models based on user browsing history and purchases'
      },

      // Database & Infrastructure (Current Sprint)
      {
        adoId: 1031,
        title: 'Product Database Schema Migration',
        type: 'Task',
        state: 'In Progress',
        assignedTo: 'Sofia Chen',
        team: 'Database Team',
        sprint: 'Sprint 12',
        storyPoints: 5,
        description: 'Migrate the product database schema to support new attributes and relationships'
      },
      {
        adoId: 1032,
        title: 'High-Availability Database Setup',
        type: 'Task',
        state: 'At Risk',
        assignedTo: 'Carlos Rodriguez',
        team: 'Database Team',
        sprint: 'Sprint 12',
        storyPoints: 8,
        description: 'Configure database clusters for high availability and implement sharding strategy'
      },
      {
        adoId: 1033,
        title: 'Kubernetes Deployment Configuration',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'Ahmed Patel',
        team: 'DevOps Team',
        sprint: 'Sprint 12',
        storyPoints: 5,
        description: 'Set up Kubernetes configuration for microservices deployment and auto-scaling'
      },

      // Frontend & UX (Current and Next Sprint)
      {
        adoId: 1041,
        title: 'Product Listing Component',
        type: 'User Story',
        state: 'In Progress',
        assignedTo: 'Emma Taylor',
        team: 'Frontend Team',
        sprint: 'Sprint 12',
        storyPoints: 5,
        description: 'Develop the product listing component with filtering and sorting capabilities'
      },
      {
        adoId: 1042,
        title: 'Shopping Cart Experience',
        type: 'User Story', 
        state: 'Not Started',
        assignedTo: 'David Kim',
        team: 'Frontend Team',
        sprint: 'Sprint 12-13',
        storyPoints: 8,
        description: 'Implement the shopping cart experience with real-time inventory checks'
      },
      {
        adoId: 1043,
        title: 'Checkout Flow Redesign',
        type: 'User Story',
        state: 'Not Started',
        assignedTo: 'Sophia Martinez',
        team: 'UX Team',
        sprint: 'Sprint 13',
        storyPoints: 13,
        description: 'Redesign the checkout flow to reduce cart abandonment and improve conversion'
      },

      // Testing & Compliance (Next Sprint)
      {
        adoId: 1051,
        title: 'End-to-End Testing Suite',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'Li Wei',
        team: 'QA Team',
        sprint: 'Sprint 13',
        storyPoints: 8,
        description: 'Develop end-to-end testing suite for the complete purchase flow'
      },
      {
        adoId: 1052,
        title: 'Payment Security Compliance',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'Olivia Brown',
        team: 'Security Team',
        sprint: 'Sprint 13',
        storyPoints: 5,
        description: 'Ensure payment processing meets PCI DSS compliance requirements'
      },
      {
        adoId: 1053,
        title: 'Performance Load Testing',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'Michael Johnson',
        team: 'Performance Team',
        sprint: 'Sprint 13',
        storyPoints: 8,
        description: 'Conduct load testing to ensure system handles peak traffic during promotional events'
      },

      // Production Deployment (Future Sprint)
      {
        adoId: 1061,
        title: 'Production Environment Setup',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'DevOps Team',
        team: 'DevOps Team',
        sprint: 'Sprint 14',
        storyPoints: 8,
        description: 'Configure production environment with monitoring, logging, and alerting'
      },
      {
        adoId: 1062,
        title: 'Data Migration to Production',
        type: 'Task',
        state: 'Not Started',
        assignedTo: 'Database Team',
        team: 'Database Team',
        sprint: 'Sprint 14',
        storyPoints: 5,
        description: 'Migrate existing product and customer data to new production environment'
      }
    ];
    
    for (const item of workItemsData) {
      this.createWorkItem(item);
    }
    
    // Create realistic cross-team dependencies
    const dependenciesData: InsertDependency[] = [
      // Critical path for current sprint
      {
        sourceId: 2, // Product Catalog Microservice
        targetId: 5, // Product Database Schema Migration
        dependencyType: 'Blocked by',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 75,
        expectedDelay: 3
      },
      {
        sourceId: 2, // Product Catalog Microservice
        targetId: 6, // High-Availability Database Setup
        dependencyType: 'Depends on',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 85,
        expectedDelay: 5
      },
      {
        sourceId: 3, // Payment Processing Service
        targetId: 6, // High-Availability Database Setup
        dependencyType: 'Blocked by',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 70,
        expectedDelay: 4
      },
      {
        sourceId: 8, // Product Listing Component
        targetId: 2, // Product Catalog Microservice
        dependencyType: 'Blocked by',
        aiDetected: false,
        detectionSource: 'Manual',
        riskScore: 65,
        expectedDelay: 2
      },
      {
        sourceId: 9, // Shopping Cart Experience
        targetId: 2, // Product Catalog Microservice
        dependencyType: 'Blocked by',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 60,
        expectedDelay: 3
      },
      {
        sourceId: 9, // Shopping Cart Experience
        targetId: 3, // Payment Processing Service
        dependencyType: 'Blocked by',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 55,
        expectedDelay: 2
      },
      
      // Dependencies for next sprint
      {
        sourceId: 10, // Checkout Flow Redesign
        targetId: 9, // Shopping Cart Experience
        dependencyType: 'Depends on',
        aiDetected: false,
        detectionSource: 'ADO',
        riskScore: 45,
        expectedDelay: 2
      },
      {
        sourceId: 11, // End-to-End Testing Suite
        targetId: 8, // Product Listing Component
        dependencyType: 'Depends on',
        aiDetected: false,
        detectionSource: 'ADO',
        riskScore: 35,
        expectedDelay: 0
      },
      {
        sourceId: 11, // End-to-End Testing Suite
        targetId: 9, // Shopping Cart Experience
        dependencyType: 'Depends on',
        aiDetected: false,
        detectionSource: 'ADO',
        riskScore: 40,
        expectedDelay: 1
      },
      {
        sourceId: 12, // Payment Security Compliance
        targetId: 3, // Payment Processing Service
        dependencyType: 'Depends on',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 80,
        expectedDelay: 4
      },
      {
        sourceId: 13, // Performance Load Testing
        targetId: 7, // Kubernetes Deployment Configuration
        dependencyType: 'Depends on',
        aiDetected: false,
        detectionSource: 'Manual',
        riskScore: 30,
        expectedDelay: 1
      },
      
      // Future sprint dependencies
      {
        sourceId: 14, // Production Environment Setup
        targetId: 7, // Kubernetes Deployment Configuration
        dependencyType: 'Depends on',
        aiDetected: false,
        detectionSource: 'ADO',
        riskScore: 50,
        expectedDelay: 2
      },
      {
        sourceId: 15, // Data Migration to Production
        targetId: 5, // Product Database Schema Migration
        dependencyType: 'Depends on',
        aiDetected: true,
        detectionSource: 'NLP',
        riskScore: 60,
        expectedDelay: 3
      }
    ];
    
    for (const dep of dependenciesData) {
      this.createDependency(dep);
    }
    
    // Create sample AI analyses from team discussions and comments
    const aiAnalysesData: InsertAiAnalysis[] = [
      {
        inputText: "The product catalog service deployment is blocked until the database team completes the schema migration and high-availability setup. Their sprint velocity has been slower than expected.",
        dependencyEntities: [
          {
            entity: "product catalog service",
            relation: "dependent",
            confidence: 0.95
          },
          {
            entity: "database team",
            relation: "blocker",
            confidence: 0.92
          },
          {
            entity: "schema migration",
            relation: "task",
            confidence: 0.90
          },
          {
            entity: "high-availability setup",
            relation: "task",
            confidence: 0.88
          }
        ],
        relatedWorkItemIds: [1023, 1031, 1032],
        riskAssessment: {
          riskScore: 78,
          expectedDelay: 4,
          factors: [
            "Database team's historical velocity below target",
            "Complex schema changes requiring data transformation",
            "Multiple team dependencies on these tasks",
            "Technical debt in existing database structure"
          ]
        }
      },
      {
        inputText: "Frontend team is waiting on the product catalog API endpoints before they can complete the product listing components. This is becoming urgent for Sprint 12 completion.",
        dependencyEntities: [
          {
            entity: "Frontend team",
            relation: "dependent",
            confidence: 0.94
          },
          {
            entity: "product catalog API",
            relation: "blocker",
            confidence: 0.91
          },
          {
            entity: "product listing components",
            relation: "task",
            confidence: 0.89
          },
          {
            entity: "Sprint 12",
            relation: "timeframe",
            confidence: 0.92
          }
        ],
        relatedWorkItemIds: [1023, 1041],
        riskAssessment: {
          riskScore: 65,
          expectedDelay: 3,
          factors: [
            "API documentation delays",
            "Shifting requirements for product attributes",
            "Resource allocation across multiple features"
          ]
        }
      },
      {
        inputText: "The high-availability database configuration is showing signs of performance issues during testing. This could impact both the catalog service and payment processing within Sprint 12.",
        dependencyEntities: [
          {
            entity: "high-availability database",
            relation: "blocker",
            confidence: 0.96
          },
          {
            entity: "performance issues",
            relation: "problem",
            confidence: 0.93
          },
          {
            entity: "catalog service",
            relation: "dependent",
            confidence: 0.88
          },
          {
            entity: "payment processing",
            relation: "dependent",
            confidence: 0.87
          },
          {
            entity: "Sprint 12",
            relation: "timeframe",
            confidence: 0.90
          }
        ],
        relatedWorkItemIds: [1032, 1023, 1024],
        riskAssessment: {
          riskScore: 85,
          expectedDelay: 5,
          factors: [
            "Complex sharding strategy implementation",
            "Unexpected performance regression",
            "Multiple critical dependencies on this infrastructure",
            "Limited expertise in the team for troubleshooting"
          ]
        }
      },
      {
        inputText: "Security team raised concerns about the payment processing service compliance with PCI requirements. We need to address this before the checkout flow can be completed in Sprint 13.",
        dependencyEntities: [
          {
            entity: "Security team",
            relation: "stakeholder",
            confidence: 0.92
          },
          {
            entity: "payment processing service",
            relation: "component",
            confidence: 0.94
          },
          {
            entity: "PCI requirements",
            relation: "compliance",
            confidence: 0.96
          },
          {
            entity: "checkout flow",
            relation: "dependent",
            confidence: 0.89
          },
          {
            entity: "Sprint 13",
            relation: "timeframe",
            confidence: 0.91
          }
        ],
        relatedWorkItemIds: [1024, 1043, 1052],
        riskAssessment: {
          riskScore: 80,
          expectedDelay: 4,
          factors: [
            "Compliance requirements complexity",
            "Security team bandwidth limitations",
            "Payment gateway integration challenges",
            "Cross-team coordination needed"
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
