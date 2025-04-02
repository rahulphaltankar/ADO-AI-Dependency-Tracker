import { spawn } from 'child_process';
import path from 'path';

interface RiskFactors {
  teamVelocity: number;
  dependencyComplexity: number;
  resourceAllocation: number;
}

interface Edge {
  source: number;
  target: number;
  weight: number;
}

interface CascadeImpact {
  affectedItems: number[];
  totalDelay: number;
}

class PythonAPI {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    // Use system Python or a specific path
    this.pythonPath = process.env.PYTHON_PATH || 'python';
    this.scriptPath = path.join(process.cwd(), 'server', 'api', 'pythonApi.py');
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
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${errorData}`));
        } else {
          try {
            const result = JSON.parse(outputData);
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

  // Predict risk using scikit-learn model
  async predictRisk(factors: RiskFactors): Promise<number> {
    try {
      const result = await this.callPython('predict_risk', [factors]);
      return result.risk;
    } catch (error) {
      console.error('Error calling predict_risk:', error);
      throw error;
    }
  }

  // Analyze text for dependencies using spaCy
  async analyzeDependency(text: string): Promise<any> {
    try {
      const result = await this.callPython('analyze_dependency', [text]);
      return result;
    } catch (error) {
      console.error('Error calling analyze_dependency:', error);
      throw error;
    }
  }

  // Find critical path in dependency network using NetworkX
  async findCriticalPath(nodes: number[], edges: Edge[]): Promise<number[]> {
    try {
      const result = await this.callPython('find_critical_path', [nodes, edges]);
      return result.path;
    } catch (error) {
      console.error('Error calling find_critical_path:', error);
      throw error;
    }
  }

  // Calculate cascade impact if a work item is delayed
  async calculateCascadeImpact(
    workItemId: number, 
    nodes: number[], 
    edges: Edge[]
  ): Promise<CascadeImpact> {
    try {
      const result = await this.callPython(
        'calculate_cascade_impact', 
        [workItemId, nodes, edges]
      );
      return {
        affectedItems: result.affected_items,
        totalDelay: result.total_delay
      };
    } catch (error) {
      console.error('Error calling calculate_cascade_impact:', error);
      throw error;
    }
  }
}

export const pythonAPI = new PythonAPI();

// NetworkX wrapper for dependency analysis
export default {
  findCriticalPath: async (nodes: number[], edges: Edge[]): Promise<number[]> => {
    return await pythonAPI.findCriticalPath(nodes, edges);
  },
  
  calculateCascadeImpact: async (
    workItemId: number, 
    nodes: number[], 
    edges: Edge[]
  ): Promise<CascadeImpact> => {
    return await pythonAPI.calculateCascadeImpact(workItemId, nodes, edges);
  }
};
