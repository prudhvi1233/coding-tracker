import * as vscode from 'vscode';
import { ApiClient } from './apiClient';

export class SnapshotClient {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public async sendSnapshot(snapshotData: any) {
    // Rely on offline queue!
    await this.apiClient.sendSnapshot(snapshotData);
    return { success: true, queued: true };
  }
}
