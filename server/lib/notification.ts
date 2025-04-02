import axios from 'axios';
import { Dependency, WorkItem } from '@shared/schema';

interface NotificationPayload {
  title: string;
  message: string;
  riskLevel: 'high' | 'medium' | 'low';
  workItemId?: number;
  dependencyDetails?: {
    sourceItem: string;
    targetItem: string;
    riskScore: number;
    expectedDelay: number;
  };
  actionUrl?: string;
}

export class NotificationService {
  private slackWebhook: string | null;
  private teamsWebhook: string | null;
  private riskThreshold: number;

  constructor(slackWebhook?: string, teamsWebhook?: string, riskThreshold: number = 60) {
    this.slackWebhook = slackWebhook || null;
    this.teamsWebhook = teamsWebhook || null;
    this.riskThreshold = riskThreshold;
  }

  // Check if a dependency should trigger a notification based on risk threshold
  shouldNotify(dependency: Dependency): boolean {
    return (dependency.riskScore || 0) >= this.riskThreshold;
  }

  // Send notification for a high-risk dependency
  async sendDependencyAlert(
    dependency: Dependency, 
    sourceItem: WorkItem, 
    targetItem: WorkItem
  ): Promise<boolean> {
    if (!this.shouldNotify(dependency)) {
      return false;
    }

    const riskLevel = this.getRiskLevel(dependency.riskScore || 0);
    
    const payload: NotificationPayload = {
      title: `New ${riskLevel}-risk dependency detected`,
      message: `${sourceItem.title} (${sourceItem.adoId}) depends on ${targetItem.title} (${targetItem.adoId})`,
      riskLevel: riskLevel,
      workItemId: sourceItem.adoId,
      dependencyDetails: {
        sourceItem: `${sourceItem.adoId}: ${sourceItem.title}`,
        targetItem: `${targetItem.adoId}: ${targetItem.title}`,
        riskScore: dependency.riskScore || 0,
        expectedDelay: dependency.expectedDelay || 0
      },
      actionUrl: this.getWorkItemUrl(sourceItem.adoId)
    };

    let success = true;
    
    if (this.slackWebhook) {
      try {
        await this.sendToSlack(payload);
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
        success = false;
      }
    }
    
    if (this.teamsWebhook) {
      try {
        await this.sendToTeams(payload);
      } catch (error) {
        console.error('Failed to send Teams notification:', error);
        success = false;
      }
    }
    
    return success;
  }

  // Send AI analysis result notification
  async sendAiAnalysisAlert(
    inputText: string,
    relatedWorkItemIds: number[],
    riskScore: number,
    expectedDelay: number
  ): Promise<boolean> {
    const riskLevel = this.getRiskLevel(riskScore);
    
    const payload: NotificationPayload = {
      title: `New AI-detected ${riskLevel}-risk dependency`,
      message: `"${inputText.substring(0, 100)}${inputText.length > 100 ? '...' : ''}"`,
      riskLevel: riskLevel,
      workItemId: relatedWorkItemIds[0],
      dependencyDetails: {
        sourceItem: `AI Analysis`,
        targetItem: `Work Item IDs: ${relatedWorkItemIds.join(', ')}`,
        riskScore: riskScore,
        expectedDelay: expectedDelay
      }
    };

    let success = true;
    
    if (this.slackWebhook) {
      try {
        await this.sendToSlack(payload);
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
        success = false;
      }
    }
    
    if (this.teamsWebhook) {
      try {
        await this.sendToTeams(payload);
      } catch (error) {
        console.error('Failed to send Teams notification:', error);
        success = false;
      }
    }
    
    return success;
  }

  // Send to Slack
  private async sendToSlack(payload: NotificationPayload): Promise<void> {
    if (!this.slackWebhook) {
      throw new Error('Slack webhook URL not configured');
    }

    const color = this.getColorForRiskLevel(payload.riskLevel);
    
    const slackPayload = {
      attachments: [
        {
          color: color,
          pretext: payload.title,
          text: payload.message,
          fields: [
            {
              title: 'Risk Score',
              value: `${payload.dependencyDetails?.riskScore}%`,
              short: true
            },
            {
              title: 'Expected Delay',
              value: `${payload.dependencyDetails?.expectedDelay} days`,
              short: true
            }
          ],
          footer: payload.actionUrl ? `<${payload.actionUrl}|View in Azure DevOps>` : undefined
        }
      ]
    };

    await axios.post(this.slackWebhook, slackPayload);
  }

  // Send to Microsoft Teams
  private async sendToTeams(payload: NotificationPayload): Promise<void> {
    if (!this.teamsWebhook) {
      throw new Error('Teams webhook URL not configured');
    }

    const color = this.getColorForRiskLevel(payload.riskLevel);
    
    const teamsPayload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": color.replace('#', ''),
      "summary": payload.title,
      "sections": [
        {
          "activityTitle": payload.title,
          "activitySubtitle": "ADO-AI Dependency Tracker",
          "text": payload.message,
          "facts": [
            {
              "name": "Risk Score",
              "value": `${payload.dependencyDetails?.riskScore}%`
            },
            {
              "name": "Expected Delay",
              "value": `${payload.dependencyDetails?.expectedDelay} days`
            },
            {
              "name": "Source",
              "value": payload.dependencyDetails?.sourceItem || "N/A"
            },
            {
              "name": "Target",
              "value": payload.dependencyDetails?.targetItem || "N/A"
            }
          ]
        }
      ],
      "potentialAction": payload.actionUrl ? [
        {
          "@type": "OpenUri",
          "name": "View in Azure DevOps",
          "targets": [
            {
              "os": "default",
              "uri": payload.actionUrl
            }
          ]
        }
      ] : []
    };

    await axios.post(this.teamsWebhook, teamsPayload);
  }

  // Helper methods
  private getRiskLevel(riskScore: number): 'high' | 'medium' | 'low' {
    if (riskScore >= 65) return 'high';
    if (riskScore >= 35) return 'medium';
    return 'low';
  }

  private getColorForRiskLevel(level: 'high' | 'medium' | 'low'): string {
    switch (level) {
      case 'high': return '#D13438';
      case 'medium': return '#FFAA44';
      case 'low': return '#0078D4';
      default: return '#0078D4';
    }
  }

  private getWorkItemUrl(workItemId: number): string {
    // This is a placeholder. In a real implementation, this would use 
    // the organization and project from ADO settings
    const organization = process.env.ADO_ORG || 'contoso';
    const project = process.env.ADO_PROJECT || 'ProjectX';
    return `https://dev.azure.com/${organization}/${project}/_workitems/edit/${workItemId}`;
  }
}

// Create notification service with environment variables
export function createNotificationService(): NotificationService {
  return new NotificationService(
    process.env.SLACK_WEBHOOK,
    process.env.TEAMS_WEBHOOK,
    parseInt(process.env.RISK_THRESHOLD || '60')
  );
}

export const notificationService = createNotificationService();
