import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

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

export async function analyzeDependencyText(text: string, workItems: any[]): Promise<AnalysisResult> {
  try {
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
    throw new Error("Failed to analyze dependencies with AI");
  }
}

export async function enrichDependencyData(dependencyGraph: any, teamVelocity: any): Promise<any> {
  try {
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
    throw new Error("Failed to enrich dependency data with AI");
  }
}
