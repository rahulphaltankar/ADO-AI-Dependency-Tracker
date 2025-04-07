import { spawn } from 'child_process';
import path from 'path';
import { WorkItem, Dependency } from '@shared/schema';

interface RiskFactors {
  teamVelocity: number;
  dependencyComplexity: number;
  resourceAllocation: number;
  teamSize?: number;
  storyPoints?: number;
  buffer?: number;
  time?: number;
  depth?: number;
  usePINN?: boolean;
}

interface Edge {
  source: number;
  target: number;
  weight: number;
  riskScore?: number;
}

interface CascadeImpact {
  affectedItems: number[];
  totalDelay: number;
  physicsEnhancedDelay?: number;
  delayFactors?: {
    teamSize: number;
    buffer: number;
    cascadeDepth: number;
  };
  usedPINN?: boolean;
}

interface RiskPredictionResult {
  risk: number;
  model?: 'traditional' | 'pinn';
  usedFallback?: boolean;
  productivity?: number;
  effectiveDuration?: number;
  delay?: number;
}

interface CriticalPathResult {
  path: number[];
  totalWeight?: number;
  usedPINN?: boolean;
}

interface PINNTrainingResult {
  success: boolean;
  modelName?: string;
  epochs?: number;
  finalLoss?: number;
  error?: string;
}

interface DependencyAnalysisResult {
  entities: Array<{text: string, label: string}>;
  dependencies: Array<{marker: string, sentence: string}>;
  hasDepencyMarkers: boolean;
  physicsInsights?: {
    hasCriticalChainImpact: boolean;
    hasBrooksLawIndicators: boolean;
    delayRiskFactors: string[];
  };
}

interface PINNOptions {
  usePINN: boolean;
  lightweight?: boolean;
}

class PythonAPI {
  private pythonPath: string;
  private scriptPath: string;
  private pinnModelAvailable: boolean;

  constructor() {
    // Use system Python or a specific path
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(process.cwd(), 'server', 'api', 'pythonApi.py');
    
    // Initially assume PINN is not available, will check during first call
    this.pinnModelAvailable = false;
  }

  // Call Python script with specific command and arguments
  private async callPython(command: string, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      // Prepare arguments for Python script
      const scriptArgs = [this.scriptPath, command, ...args.map(arg => JSON.stringify(arg))];
      
      // Spawn Python process
      const pythonProcess = spawn(this.pythonPath, scriptArgs);
      
      let outputData = '';
      let errorData = '';
      
      // Collect stdout data
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      // Collect stderr data
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        
        // Check if PINN is available based on error messages
        if (command === 'train_pinn_model' && errorData.includes('PINN dependencies not available')) {
          this.pinnModelAvailable = false;
        }
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${errorData}`));
        } else {
          try {
            const result = JSON.parse(outputData);
            
            // If a PINN command succeeds, mark PINN as available
            if (['train_pinn_model', 'predict_pinn_risk', 'quantize_model'].includes(command) && 
                result.success !== false) {
              this.pinnModelAvailable = true;
            }
            
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Python output: ${error.message}`));
          }
        }
      });
      
      // Handle process errors
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  // Predict risk using machine learning model (traditional or PINN)
  async predictRisk(factors: RiskFactors): Promise<RiskPredictionResult> {
    try {
      const result = await this.callPython('predict_risk', [factors]);
      return result;
    } catch (error) {
      console.error('Error calling predict_risk:', error);
      throw error;
    }
  }

  // Analyze text for dependencies using NLP & physics-enhanced models
  async analyzeDependency(text: string): Promise<DependencyAnalysisResult> {
    try {
      const result = await this.callPython('analyze_dependency', [text]);
      return result;
    } catch (error) {
      console.error('Error calling analyze_dependency:', error);
      throw error;
    }
  }

  // Find critical path in dependency network using NetworkX & physics-enhancement
  async findCriticalPath(
    nodes: number[], 
    edges: Edge[], 
    options?: PINNOptions
  ): Promise<CriticalPathResult> {
    try {
      const args = [nodes, edges];
      if (options) args.push(options);
      
      const result = await this.callPython('find_critical_path', args);
      return result;
    } catch (error) {
      console.error('Error calling find_critical_path:', error);
      throw error;
    }
  }

  // Calculate cascade impact if a work item is delayed
  async calculateCascadeImpact(
    workItemId: number, 
    nodes: number[], 
    edges: Edge[],
    options?: PINNOptions
  ): Promise<CascadeImpact> {
    try {
      const args = [workItemId, nodes, edges];
      if (options) args.push(options);
      
      const result = await this.callPython(
        'calculate_cascade_impact', 
        args
      );
      
      // Convert from snake_case to camelCase
      return {
        affectedItems: result.affected_items,
        totalDelay: result.total_delay,
        physicsEnhancedDelay: result.physics_enhanced_delay,
        delayFactors: result.delay_factors ? {
          teamSize: result.delay_factors.team_size,
          buffer: result.delay_factors.buffer,
          cascadeDepth: result.delay_factors.cascade_depth
        } : undefined,
        usedPINN: result.usedPINN
      };
    } catch (error) {
      console.error('Error calling calculate_cascade_impact:', error);
      throw error;
    }
  }
  
  // Train a PINN model using work items and dependencies
  async trainPINNModel(
    workItems: WorkItem[], 
    dependencies: Dependency[], 
    teamVelocities: any[],
    modelName: string = 'dependency_pinn',
    epochs: number = 50
  ): Promise<PINNTrainingResult> {
    try {
      const workItemsJson = JSON.stringify(workItems);
      const dependenciesJson = JSON.stringify(dependencies);
      const teamVelocitiesJson = JSON.stringify(teamVelocities);
      
      const result = await this.callPython(
        'train_pinn_model', 
        [workItemsJson, dependenciesJson, teamVelocitiesJson, modelName, epochs]
      );
      
      return {
        success: result.success || false,
        modelName: result.model_name,
        epochs: result.epochs,
        finalLoss: result.final_loss,
        error: result.error
      };
    } catch (error) {
      console.error('Error training PINN model:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a quantized version of a PINN model for lightweight mode
  async createQuantizedModel(modelName: string): Promise<PINNTrainingResult> {
    try {
      const result = await this.callPython('quantize_model', [modelName]);
      
      return {
        success: result.success || false,
        modelName: result.model_name,
        error: result.error
      };
    } catch (error) {
      console.error('Error creating quantized model:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Anonymize data for GDPR compliance
  async anonymizeData(
    data: any, 
    fieldsToAnonymize?: string[]
  ): Promise<{success: boolean, anonymizedData?: any, error?: string}> {
    try {
      const args = [JSON.stringify(data)];
      if (fieldsToAnonymize) args.push(JSON.stringify(fieldsToAnonymize));
      
      const result = await this.callPython('anonymize_data', args);
      
      return {
        success: result.success || false,
        anonymizedData: result.anonymized_data,
        error: result.error
      };
    } catch (error) {
      console.error('Error anonymizing data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Check if PINN capabilities are available
  isPINNAvailable(): boolean {
    return this.pinnModelAvailable;
  }
}

export const pythonAPI = new PythonAPI();

// Enhanced NetworkX wrapper for dependency analysis
export default {
  findCriticalPath: async (nodes: number[], edges: Edge[], usePINN: boolean = false): Promise<CriticalPathResult> => {
    return await pythonAPI.findCriticalPath(nodes, edges, {usePINN});
  },
  
  calculateCascadeImpact: async (
    workItemId: number, 
    nodes: number[], 
    edges: Edge[],
    usePINN: boolean = false
  ): Promise<CascadeImpact> => {
    return await pythonAPI.calculateCascadeImpact(workItemId, nodes, edges, {usePINN});
  },
  
  trainPINNModel: async (
    workItems: WorkItem[], 
    dependencies: Dependency[], 
    teamVelocities: any[]
  ): Promise<PINNTrainingResult> => {
    return await pythonAPI.trainPINNModel(workItems, dependencies, teamVelocities);
  }
};
