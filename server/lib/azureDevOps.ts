import axios from 'axios';
import { WorkItem, InsertWorkItem, AdoSettings } from '@shared/schema';

interface AdoWorkItem {
  id: number;
  fields: {
    'System.Title': string;
    'System.WorkItemType': string;
    'System.State': string;
    'System.AssignedTo'?: { displayName: string };
    'System.TeamProject': string;
    'System.IterationPath': string;
    'Microsoft.VSTS.Scheduling.StoryPoints'?: number;
    'System.Description'?: string;
    [key: string]: any;
  };
  relations?: Array<{
    rel: string;
    url: string;
    attributes: {
      name?: string;
      comment?: string;
    };
  }>;
}

interface AdoRelation {
  sourceId: number;
  targetId: number;
  relationType: string;
}

export class AzureDevOpsClient {
  private baseUrl: string;
  private organization: string;
  private project: string;
  
  // Authentication
  private useOAuth: boolean;
  private pat?: string;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiresAt?: Date;
  
  constructor(organization: string, project: string, authOptions: {
    useOAuth: boolean;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
  }) {
    this.organization = organization;
    this.project = project;
    this.baseUrl = `https://dev.azure.com/${organization}/${project}/_apis`;
    
    // Auth setup
    this.useOAuth = authOptions.useOAuth;
    this.pat = authOptions.token;
    this.accessToken = authOptions.accessToken;
    this.refreshToken = authOptions.refreshToken;
    this.tokenExpiresAt = authOptions.tokenExpiresAt;
  }
  
  // Factory method from ADO settings
  static fromAdoSettings(settings: AdoSettings): AzureDevOpsClient {
    return new AzureDevOpsClient(
      settings.organization,
      settings.project,
      {
        useOAuth: settings.useOAuth ?? false,
        token: settings.token ?? undefined,
        accessToken: settings.accessToken ?? undefined,
        refreshToken: settings.refreshToken ?? undefined,
        tokenExpiresAt: settings.tokenExpiresAt ?? undefined
      }
    );
  }

  private getAuthHeader() {
    if (this.useOAuth) {
      if (!this.accessToken) {
        throw new Error('OAuth access token is required when useOAuth is true');
      }
      
      // Check if token is expired and should be refreshed
      if (this.tokenExpiresAt && new Date() > this.tokenExpiresAt) {
        throw new Error('OAuth token expired - token refresh required');
      }
      
      return {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      };
    } else {
      // Legacy PAT authentication
      if (!this.pat) {
        throw new Error('Personal Access Token is required when useOAuth is false');
      }
      const encodedPat = Buffer.from(':' + this.pat).toString('base64');
      return {
        'Authorization': `Basic ${encodedPat}`,
        'Content-Type': 'application/json'
      };
    }
  }

  // Fetch work items by IDs
  async getWorkItemsById(ids: number[]): Promise<WorkItem[]> {
    if (ids.length === 0) return [];

    try {
      const response = await axios.get(
        `${this.baseUrl}/wit/workitems?ids=${ids.join(',')}&api-version=6.0`,
        { headers: this.getAuthHeader() }
      );

      return response.data.value.map(this.mapAdoWorkItem);
    } catch (error) {
      console.error('Error fetching work items by IDs:', error);
      throw new Error('Failed to fetch work items from Azure DevOps');
    }
  }

  // Fetch work items by iteration path (sprint)
  async getWorkItemsByIteration(iterationPath: string): Promise<WorkItem[]> {
    try {
      // First, get the iteration ID
      const iterResponse = await axios.get(
        `${this.baseUrl}/work/teamsettings/iterations?api-version=6.0`,
        { headers: this.getAuthHeader() }
      );

      const iteration = iterResponse.data.value.find((iter: any) => 
        iter.path.endsWith(`/${iterationPath}`)
      );
      
      if (!iteration) {
        throw new Error(`Iteration ${iterationPath} not found`);
      }

      // Then, get work items for that iteration
      const wiqlQuery = {
        query: `SELECT [System.Id] FROM WorkItems WHERE [System.IterationPath] = '${this.project}\\${iterationPath}' ORDER BY [System.Id]`
      };

      const wiqlResponse = await axios.post(
        `${this.baseUrl}/wit/wiql?api-version=6.0`,
        wiqlQuery,
        { headers: this.getAuthHeader() }
      );

      const workItemIds = wiqlResponse.data.workItems.map((wi: any) => wi.id);
      
      if (workItemIds.length === 0) {
        return [];
      }

      return await this.getWorkItemsById(workItemIds);
    } catch (error) {
      console.error('Error fetching work items by iteration:', error);
      throw new Error('Failed to fetch work items from Azure DevOps');
    }
  }

  // Get relations between work items
  async getWorkItemRelations(): Promise<AdoRelation[]> {
    try {
      // Get all work items first
      const wiqlQuery = {
        query: `SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] <> '' ORDER BY [System.Id]`
      };

      const wiqlResponse = await axios.post(
        `${this.baseUrl}/wit/wiql?api-version=6.0`,
        wiqlQuery,
        { headers: this.getAuthHeader() }
      );

      const workItemIds = wiqlResponse.data.workItems.map((wi: any) => wi.id);
      
      if (workItemIds.length === 0) {
        return [];
      }

      // Fetch all work items with relations
      const workItems = await this.getWorkItemsById(workItemIds);
      
      // Extract relations
      const relations: AdoRelation[] = [];
      
      const adoWorkItems = await axios.get(
        `${this.baseUrl}/wit/workitems?ids=${workItemIds.join(',')}&$expand=relations&api-version=6.0`,
        { headers: this.getAuthHeader() }
      );
      
      adoWorkItems.data.value.forEach((item: AdoWorkItem) => {
        if (item.relations) {
          item.relations.forEach(relation => {
            if (relation.rel === 'System.LinkTypes.Dependency-Forward' || 
                relation.rel === 'System.LinkTypes.Dependency-Reverse') {
              
              // Extract target ID from URL
              const urlParts = relation.url.split('/');
              const targetId = parseInt(urlParts[urlParts.length - 1]);
              
              if (!isNaN(targetId)) {
                relations.push({
                  sourceId: item.id,
                  targetId: targetId,
                  relationType: relation.rel === 'System.LinkTypes.Dependency-Forward' ? 'Depends on' : 'Blocks'
                });
              }
            }
          });
        }
      });
      
      return relations;
    } catch (error) {
      console.error('Error fetching work item relations:', error);
      throw new Error('Failed to fetch work item relations from Azure DevOps');
    }
  }

  // Get pull requests for a repository
  async getPullRequests(repositoryId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/git/repositories/${repositoryId}/pullrequests?api-version=6.0`,
        { headers: this.getAuthHeader() }
      );
      
      return response.data.value;
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw new Error('Failed to fetch pull requests from Azure DevOps');
    }
  }

  // Map ADO work item to our schema
  private mapAdoWorkItem(adoItem: AdoWorkItem): InsertWorkItem {
    // Extract sprint from iteration path
    const iterationPath = adoItem.fields['System.IterationPath'];
    const sprintMatch = iterationPath.match(/Sprint (\d+)/i);
    const sprint = sprintMatch ? `Sprint ${sprintMatch[1]}` : iterationPath.split('\\').pop() || '';
    
    // Extract team from area path
    const areaPath = adoItem.fields['System.AreaPath'];
    const team = areaPath ? areaPath.split('\\').pop() || '' : '';

    return {
      adoId: adoItem.id,
      title: adoItem.fields['System.Title'],
      type: adoItem.fields['System.WorkItemType'],
      state: adoItem.fields['System.State'],
      assignedTo: adoItem.fields['System.AssignedTo']?.displayName || '',
      team: team,
      sprint: sprint,
      storyPoints: adoItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0,
      description: adoItem.fields['System.Description'] || ''
    };
  }
}

// Factory functions to create ADO client
export function createAdoClientWithPAT(organization: string, project: string, token: string): AzureDevOpsClient {
  return new AzureDevOpsClient(organization, project, {
    useOAuth: false,
    token: token
  });
}

export function createAdoClientWithOAuth(
  organization: string, 
  project: string, 
  accessToken: string, 
  refreshToken?: string,
  expiresAt?: Date
): AzureDevOpsClient {
  return new AzureDevOpsClient(organization, project, {
    useOAuth: true,
    accessToken: accessToken,
    refreshToken: refreshToken,
    tokenExpiresAt: expiresAt
  });
}
