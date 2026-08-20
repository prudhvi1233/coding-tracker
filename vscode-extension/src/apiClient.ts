import axios from 'axios';
import * as vscode from 'vscode';
import * as crypto from 'crypto';

interface QueueItem {
  eventId: string;
  endpoint: string;
  payload: any;
  timestamp: number;
}

export class ApiClient {
  private queue: QueueItem[] = [];
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(private context: vscode.ExtensionContext) {
    this.queue = context.globalState.get<QueueItem[]>('codingTracker.offlineQueue', []);
    // Attempt to sync every 1 minute
    this.syncInterval = setInterval(() => this.processQueue(), 60000);
  }

  public dispose() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  private getToken(): string {
    return vscode.workspace.getConfiguration('codingTracker').get<string>('deviceToken', '');
  }

  private getApiUrl(): string {
    return vscode.workspace.getConfiguration('codingTracker').get<string>('apiUrl', 'http://localhost:5000/api');
  }

  public async sendActivity(activityData: any) {
    const eventId = crypto.randomUUID();
    const payload = {
      ...activityData,
      eventId
    };
    
    this.queueItem('/activity', payload);
  }

  public async sendGitSync(gitData: any) {
    const eventId = crypto.randomUUID();
    const payload = {
      ...gitData,
      eventId
    };
    
    this.queueItem('/git/sync', payload);
  }
  
  public async sendSnapshot(snapshotData: any) {
    const eventId = crypto.randomUUID();
    const payload = {
      ...snapshotData,
      eventId
    };
    
    this.queueItem('/snapshots', payload);
  }

  private queueItem(endpoint: string, payload: any) {
    this.queue.push({
      eventId: payload.eventId || crypto.randomUUID(),
      endpoint,
      payload,
      timestamp: Date.now()
    });

    // Enforce max queue size to prevent memory leaks (e.g. max 10,000 items)
    if (this.queue.length > 10000) {
      this.queue.shift(); // Drop oldest
    }
    this.saveQueue();

    // Attempt immediate sync
    this.processQueue();
  }

  private async processQueue() {
    if (this.isSyncing || this.queue.length === 0) return;
    
    const token = this.getToken();
    if (!token) {
      console.warn('Coding Tracker: Device token missing. Data will be queued until configured.');
      return;
    }

    this.isSyncing = true;
    const apiUrl = this.getApiUrl();

    // Process up to 50 items at a time
    const batch = this.queue.slice(0, 50);
    const successfulIds = new Set<string>();

    for (const item of batch) {
      try {
        await axios.post(`${apiUrl}${item.endpoint}`, item.payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000
        });
        successfulIds.add(item.eventId);
      } catch (error: any) {
        // If 401 Unauthorized, token is invalid. 
        if (error.response?.status === 401) {
          vscode.window.showErrorMessage('Coding Tracker: Device Token is invalid or revoked. Please update your settings.');
          // Do not drop the item; wait for valid token
          break; // Stop processing batch
        }
        
        // If 4xx (except 401/408/429), drop it as it's a bad request
        if (error.response && error.response.status >= 400 && error.response.status < 500 && ![401, 408, 429].includes(error.response.status)) {
           console.error('Coding Tracker: Unrecoverable request, dropping event.', error.message);
           successfulIds.add(item.eventId); // treat as "processed" so it gets removed
        }
        
        // Otherwise (Network Error, 5xx), it's probably offline. Stop processing the batch and retry later.
        console.warn('Coding Tracker: Network error syncing data, will retry later.');
        break;
      }
    }

    // Remove successful or unrecoverable items from the queue
    this.queue = this.queue.filter(item => !successfulIds.has(item.eventId));
    this.isSyncing = false;
    this.saveQueue();
  }

  private saveQueue() {
    this.context.globalState.update('codingTracker.offlineQueue', this.queue);
  }
}
