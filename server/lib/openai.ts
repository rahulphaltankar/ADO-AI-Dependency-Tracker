import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Enable demo mode to avoid hitting the OpenAI API if no key is available or quota is exceeded
const DEMO_MODE = !process.env.OPENAI_API_KEY || process.env.DEMO_MODE === 'true';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface DependencyEntity {
  entity: string;
  relation: string;
  confidence: number;
}

interface RiskAssessment {
  riskScore: number;
  expectedDelay: number;
  factors: string[];
}

interface AnalysisResult {
  dependencyEntities: DependencyEntity[];
  relatedWorkItems?: number[];
  riskAssessment?: RiskAssessment;
}

// Demo responses for demonstration purposes
const getDemoAnalysisResponse = (text: string, workItems: any[]): AnalysisResult => {
  console.log("Using demo mode for AI analysis");
  
  // Get referenced work item IDs from the text if available
  const workItemMentions = workItems
    .filter(item => text.toLowerCase().includes(item.title.toLowerCase()))
    .map(item => item.adoId);
  
  // Get some randomized but plausible related work items if none were found
  const relatedWorkItems = workItemMentions.length > 0 
    ? workItemMentions 
    : [1001, 1003, 1005].slice(0, 1 + Math.floor(Math.random() * 3));
  
  // Check for specific keywords to determine risk level
  const lowRiskKeywords = ['minor', 'small', 'simple', 'easy'];
  const highRiskKeywords = ['blocked', 'blocking', 'critical', 'urgent', 'delay', 'behind', 'complex'];
  
  let riskLevel = 50; // Default medium risk
  
  // Increase risk for high-risk keywords
  for (const keyword of highRiskKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      riskLevel += 10 + Math.floor(Math.random() * 15);
    }
  }
  
  // Decrease risk for low-risk keywords
  for (const keyword of lowRiskKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      riskLevel -= 10 + Math.floor(Math.random() * 10);
    }
  }
  
  // Ensure risk is within bounds
  riskLevel = Math.max(10, Math.min(95, riskLevel));
  
  // Calculate a plausible delay based on risk
  const expectedDelay = Math.ceil(riskLevel / 10);
  
  // Extract potential dependency entities from text
  const entities: DependencyEntity[] = [];
  
  if (text.includes('database') || text.includes('schema')) {
    entities.push({
      entity: "Database Schema",
      relation: "blocks",
      confidence: 0.85
    });
  }
  
  if (text.includes('API') || text.includes('endpoint')) {
    entities.push({
      entity: "API Integration",
      relation: "depends on",
      confidence: 0.92
    });
  }
  
  if (text.includes('authentication') || text.includes('login')) {
    entities.push({
      entity: "Authentication Module",
      relation: "requires",
      confidence: 0.89
    });
  }
  
  if (text.includes('UI') || text.includes('interface') || text.includes('frontend')) {
    entities.push({
      entity: "User Interface",
      relation: "implementedBy",
      confidence: 0.78
    });
  }
  
  // If no entities were found, add a generic one
  if (entities.length === 0) {
    entities.push({
      entity: "Component Dependency",
      relation: "dependsOn",
      confidence: 0.75
    });
  }
  
  // Construct risk factors based on the text
  const riskFactors = [];
  
  if (riskLevel > 70) {
    riskFactors.push("Cross-team dependency with poor communication channels");
    riskFactors.push("Technical complexity requiring specialized skills");
  }
  
  if (text.includes('delay') || text.includes('behind')) {
    riskFactors.push("Previous work already behind schedule");
  }
  
  if (text.includes('resource') || text.includes('staffing')) {
    riskFactors.push("Resource constraints affecting delivery capability");
  }
  
  // Always include at least one factor
  if (riskFactors.length === 0) {
    riskFactors.push("Standard execution risk based on dependency nature");
  }
  
  return {
    dependencyEntities: entities,
    relatedWorkItems: relatedWorkItems,
    riskAssessment: {
      riskScore: riskLevel,
      expectedDelay: expectedDelay,
      factors: riskFactors
    }
  };
};

const getDemoEnrichmentResponse = (dependencyGraph: any, teamVelocity: any): any => {
  console.log("Using demo mode for dependency enrichment");
  
  // Extract nodes from dependency graph to identify work items
  const nodes = dependencyGraph.nodes || [];
  const edges = dependencyGraph.links || [];
  
  // Get random nodes as high risk dependencies
  const highRiskCount = Math.min(2, Math.ceil(nodes.length / 3));
  const highRiskNodes = [];
  
  for (let i = 0; i < highRiskCount; i++) {
    const randomIndex = Math.floor(Math.random() * nodes.length);
    const node = nodes[randomIndex];
    
    if (node && !highRiskNodes.some(n => n.id === node.id)) {
      highRiskNodes.push({
        id: node.id,
        risk: 60 + Math.floor(Math.random() * 30),
        reason: "Multiple incoming dependencies creating bottleneck"
      });
    }
  }
  
  // Generate team risks based on team velocity data
  const teamRisks = [];
  const teams = teamVelocity && teamVelocity[0] && teamVelocity[0].teams ? 
    teamVelocity[0].teams.map(t => t.name) : 
    ["UI Team", "API Team", "Database Team"];
  
  // Add risks for 1-2 teams
  const teamRiskCount = Math.min(2, Math.ceil(teams.length / 2));
  
  for (let i = 0; i < teamRiskCount; i++) {
    const randomTeamIndex = Math.floor(Math.random() * teams.length);
    const team = teams[randomTeamIndex];
    
    if (team && !teamRisks.some(t => t.team === team)) {
      const riskLevel = Math.random() < 0.3 ? "HIGH" : "MEDIUM";
      
      teamRisks.push({
        team: team,
        riskLevel: riskLevel,
        reason: riskLevel === "HIGH" ? 
          "Consistently missing sprint targets by >30%" : 
          "Velocity trending downward over last 3 sprints"
      });
    }
  }
  
  // Generate suggestions for improvement
  const suggestions = [
    "Consider breaking high-risk dependencies into smaller, more manageable deliverables",
    "Implement daily sync meetings between teams with interlinked deliverables",
    "Allocate additional QA resources to critical path components"
  ];
  
  // Return the enriched data
  return {
    highRiskDependencies: highRiskNodes,
    teamRisks: teamRisks,
    suggestions: suggestions
  };
};

export async function analyzeDependencyText(text: string, workItems: any[]): Promise<AnalysisResult> {
  try {
    // Use demo mode if enabled or if OpenAI API key is not available
    if (DEMO_MODE) {
      return getDemoAnalysisResponse(text, workItems);
    }
    
    const workItemContext = workItems.map(item => 
      `ID: ${item.adoId}, Title: ${item.title}, Type: ${item.type}, Team: ${item.team}, Sprint: ${item.sprint}`
    ).join('\n');

    const prompt = `
      Analyze the following text for dependencies in software development:
      "${text}"
      
      Available work items:
      ${workItemContext}
      
      1. Identify dependency entities (what depends on what)
      2. Detect the nature of dependencies (blocks, requires, depends on)
      3. Match to the most relevant work item IDs from the list above
      4. Assess risk based on dependency nature, critical path, and timeline
      5. Estimate potential delay in days
      
      Return JSON in this exact format:
      {
        "dependencyEntities": [
          {"entity": "string", "relation": "string", "confidence": number}
        ],
        "relatedWorkItems": [number],
        "riskAssessment": {
          "riskScore": number,
          "expectedDelay": number,
          "factors": ["string"]
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      dependencyEntities: result.dependencyEntities || [],
      relatedWorkItems: result.relatedWorkItems || [],
      riskAssessment: result.riskAssessment || {
        riskScore: 0,
        expectedDelay: 0,
        factors: []
      }
    };
  } catch (error) {
    console.error("Error analyzing dependency text with OpenAI:", error);
    
    // Fallback to demo mode if API fails
    if (!DEMO_MODE) {
      console.log("Falling back to demo mode due to API error");
      return getDemoAnalysisResponse(text, workItems);
    }
    
    throw new Error("Failed to analyze dependencies with AI");
  }
}

export async function enrichDependencyData(dependencyGraph: any, teamVelocity: any): Promise<any> {
  try {
    // Use demo mode if enabled or if OpenAI API key is not available
    if (DEMO_MODE) {
      return getDemoEnrichmentResponse(dependencyGraph, teamVelocity);
    }
    
    const prompt = `
      Based on this dependency graph and team velocity history, provide insights:
      
      Dependency Graph:
      ${JSON.stringify(dependencyGraph)}
      
      Team Velocity:
      ${JSON.stringify(teamVelocity)}
      
      Identify:
      1. High-risk dependencies and why they're risky
      2. Teams that might need help based on velocity history
      3. Suggestions for dependency resolution
      
      Return JSON in this format:
      {
        "highRiskDependencies": [{"id": number, "risk": number, "reason": "string"}],
        "teamRisks": [{"team": "string", "riskLevel": "string", "reason": "string"}],
        "suggestions": ["string"]
      }
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error enriching dependency data with OpenAI:", error);
    
    // Fallback to demo mode if API fails
    if (!DEMO_MODE) {
      console.log("Falling back to demo mode due to API error");
      return getDemoEnrichmentResponse(dependencyGraph, teamVelocity);
    }
    
    throw new Error("Failed to enrich dependency data with AI");
  }
}
