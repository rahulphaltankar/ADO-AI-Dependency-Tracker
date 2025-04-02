import { apiRequest } from './queryClient';
import {
  WorkItem,
  Dependency,
  AiAnalysis,
  DependencyGraph,
  SprintStatus,
  SprintVelocity,
  HighRiskDependency,
  AdoSettings,
  AlertSettings
} from './types';

// Work Items API
export const workItemsApi = {
  getAll: async (): Promise<WorkItem[]> => {
    const res = await apiRequest('GET', '/api/work-items', undefined);
    return await res.json();
  },
  
  getById: async (id: number): Promise<WorkItem> => {
    const res = await apiRequest('GET', `/api/work-items/${id}`, undefined);
    return await res.json();
  },
  
  create: async (workItem: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkItem> => {
    const res = await apiRequest('POST', '/api/work-items', workItem);
    return await res.json();
  },
  
  update: async (id: number, updates: Partial<WorkItem>): Promise<WorkItem> => {
    const res = await apiRequest('PATCH', `/api/work-items/${id}`, updates);
    return await res.json();
  }
};

// Dependencies API
export const dependenciesApi = {
  getAll: async (): Promise<Dependency[]> => {
    const res = await apiRequest('GET', '/api/dependencies', undefined);
    return await res.json();
  },
  
  getByWorkItem: async (workItemId: number): Promise<Dependency[]> => {
    const res = await apiRequest('GET', `/api/work-items/${workItemId}/dependencies`, undefined);
    return await res.json();
  },
  
  create: async (dependency: Omit<Dependency, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dependency> => {
    const res = await apiRequest('POST', '/api/dependencies', dependency);
    return await res.json();
  },
  
  update: async (id: number, updates: Partial<Dependency>): Promise<Dependency> => {
    const res = await apiRequest('PATCH', `/api/dependencies/${id}`, updates);
    return await res.json();
  }
};

// AI Analysis API
export const aiAnalysisApi = {
  analyzeText: async (text: string): Promise<AiAnalysis> => {
    const res = await apiRequest('POST', '/api/analyze-text', { text });
    return await res.json();
  },
  
  getAll: async (): Promise<AiAnalysis[]> => {
    const res = await apiRequest('GET', '/api/ai-analyses', undefined);
    return await res.json();
  }
};

// Dependency Graph API
export const graphApi = {
  getDependencyGraph: async (): Promise<DependencyGraph> => {
    const res = await apiRequest('GET', '/api/dependency-graph', undefined);
    return await res.json();
  }
};

// Sprint API
export const sprintApi = {
  getStatus: async (sprint?: string): Promise<SprintStatus> => {
    const queryString = sprint ? `?sprint=${encodeURIComponent(sprint)}` : '';
    const res = await apiRequest('GET', `/api/sprint-status${queryString}`, undefined);
    return await res.json();
  },
  
  getVelocity: async (): Promise<SprintVelocity[]> => {
    const res = await apiRequest('GET', '/api/team-velocity', undefined);
    return await res.json();
  }
};

// Risk API
export const riskApi = {
  getHighRiskDependencies: async (): Promise<HighRiskDependency[]> => {
    const res = await apiRequest('GET', '/api/high-risk-dependencies', undefined);
    return await res.json();
  }
};

// Azure DevOps API
export const adoApi = {
  sync: async (): Promise<any> => {
    const res = await apiRequest('POST', '/api/ado/sync', undefined);
    return await res.json();
  }
};

// Settings API
export const settingsApi = {
  getAdoSettings: async (): Promise<AdoSettings> => {
    const res = await apiRequest('GET', '/api/settings/ado', undefined);
    return await res.json();
  },
  
  updateAdoSettings: async (settings: Partial<AdoSettings>): Promise<AdoSettings> => {
    const res = await apiRequest('PATCH', '/api/settings/ado', settings);
    return await res.json();
  },
  
  getAlertSettings: async (): Promise<AlertSettings> => {
    const res = await apiRequest('GET', '/api/settings/alerts', undefined);
    return await res.json();
  },
  
  updateAlertSettings: async (settings: Partial<AlertSettings>): Promise<AlertSettings> => {
    const res = await apiRequest('PATCH', '/api/settings/alerts', settings);
    return await res.json();
  }
};
