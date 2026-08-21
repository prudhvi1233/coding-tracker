import * as vscode from 'vscode';
import { ApiClient } from './apiClient';
import { SnapshotClient } from './snapshotClient';
import * as crypto from 'crypto';

export class ActivityTracker {
  private statusBarItem: vscode.StatusBarItem;
  private disposable: vscode.Disposable;
  private apiClient: ApiClient;
  private snapshotClient: SnapshotClient;
  private enabled: boolean;
  private lastSentTime: Record<string, number> = {};
  private lastSnapshotTime: Record<string, number> = {};
  private recentlyRenamedPaths: Map<string, number> = new Map();
  private readonly DEBOUNCE_TIME = 30000; // 30 seconds debounce per file for activity

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.snapshotClient = new SnapshotClient(this.apiClient);
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'codingTracker.showStatus';
    
    this.enabled = vscode.workspace.getConfiguration('codingTracker').get<boolean>('enabled', true);
    
    this.updateStatusBar();

    const subscriptions: vscode.Disposable[] = [];
    vscode.workspace.onDidSaveTextDocument(this.onDidSaveTextDocument, this, subscriptions);
    vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration, this, subscriptions);

    // Watch for file rename and move events
    vscode.workspace.onDidRenameFiles(this.onDidRenameFiles, this, subscriptions);

    // Watch for file deletion events
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
    fileWatcher.onDidDelete((uri) => this.onDidDeleteFile(uri), this, subscriptions);
    subscriptions.push(fileWatcher);

    this.disposable = vscode.Disposable.from(...subscriptions);
  }

  public enable() {
    this.enabled = true;
    this.updateStatusBar();
  }

  public disable() {
    this.enabled = false;
    this.updateStatusBar();
  }

  public showStatus() {
    const status = this.enabled ? 'Active' : 'Inactive';
    vscode.window.showInformationMessage(`Coding Tracker is currently ${status}`);
  }

  private updateStatusBar() {
    if (this.enabled) {
      this.statusBarItem.text = '$(pulse) Coding Tracker Active';
      this.statusBarItem.tooltip = 'Coding activity is being tracked';
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  private onDidChangeConfiguration(e: vscode.ConfigurationChangeEvent) {
    if (e.affectsConfiguration('codingTracker.enabled')) {
      this.enabled = vscode.workspace.getConfiguration('codingTracker').get<boolean>('enabled', true);
      this.updateStatusBar();
    }
  }

  private shouldIgnoreFile(fileName: string, filePath: string, ignoredFolders: string[]): boolean {
    if (fileName === '.env' || fileName.startsWith('.env.')) return true;
    
    // Ignore known sensitive or generated extensions
    const ignoredExtensions = ['.pem', '.key', '.p12', '.pfx', '.crt', '.cer', '.db', '.sqlite', '.log'];
    if (ignoredExtensions.some(ext => fileName.endsWith(ext))) return true;

    if (ignoredFolders.some(folder => filePath.includes(`/${folder}/`) || filePath.includes(`\\${folder}\\`))) {
      return true;
    }
    return false;
  }

  // Handle File Rename and Move events
  private async onDidRenameFiles(e: vscode.FileRenameEvent) {
    if (!this.enabled) return;

    for (const file of e.files) {
      const oldUri = file.oldUri;
      const newUri = file.newUri;

      if (oldUri.scheme !== 'file' || newUri.scheme !== 'file') continue;

      const oldPath = oldUri.fsPath;
      const newPath = newUri.fsPath;

      // Cache oldPath to ignore subsequent file delete events for this path
      this.recentlyRenamedPaths.set(oldPath, Date.now());
      setTimeout(() => {
        this.recentlyRenamedPaths.delete(oldPath);
      }, 5000);

      const oldFileName = oldPath.split(/[/\\]/).pop() || '';
      const newFileName = newPath.split(/[/\\]/).pop() || '';

      const config = vscode.workspace.getConfiguration('codingTracker');
      const ignoredFolders = config.get<string[]>('ignoredFolders', ['node_modules', '.git', 'dist', 'build', 'coverage']);
      if (this.shouldIgnoreFile(oldFileName, oldPath, ignoredFolders)) continue;

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(oldUri) || vscode.workspace.getWorkspaceFolder(newUri);
      const projectName = workspaceFolder ? workspaceFolder.name : 'Unknown Project';
      const oldRelativeFilePath = workspaceFolder ? vscode.workspace.asRelativePath(oldUri, false) : oldFileName;
      const newRelativeFilePath = workspaceFolder ? vscode.workspace.asRelativePath(newUri, false) : newFileName;

      await this.apiClient.sendRenameFile({
        projectName,
        oldRelativeFilePath,
        oldFileName,
        newRelativeFilePath,
        newFileName
      });
    }
  }

  // Handle File Deletion events
  private async onDidDeleteFile(uri: vscode.Uri) {
    if (!this.enabled || uri.scheme !== 'file') return;

    const filePath = uri.fsPath;

    // Check if this path was recently renamed/moved
    const renamedAt = this.recentlyRenamedPaths.get(filePath);
    if (renamedAt && (Date.now() - renamedAt < 5000)) {
      return; // Skip delete processing for renamed/moved file
    }

    const fileName = filePath.split(/[/\\]/).pop() || '';
    const config = vscode.workspace.getConfiguration('codingTracker');
    const ignoredFolders = config.get<string[]>('ignoredFolders', ['node_modules', '.git', 'dist', 'build', 'coverage']);
    if (this.shouldIgnoreFile(fileName, filePath, ignoredFolders)) return;

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    const projectName = workspaceFolder ? workspaceFolder.name : 'Unknown Project';
    const relativeFilePath = workspaceFolder ? vscode.workspace.asRelativePath(uri, false) : fileName;

    await this.apiClient.sendDeleteFile({
      projectName,
      relativeFilePath,
      fileName
    });
  }

  public async saveManualSnapshot() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active file to snapshot.');
      return;
    }

    const document = editor.document;
    const config = vscode.workspace.getConfiguration('codingTracker');
    
    if (!config.get<boolean>('manualSnapshotEnabled', true)) {
       vscode.window.showWarningMessage('Manual snapshots are disabled in settings.');
       return;
    }

    await this.processSnapshot(document, true);
  }

  private async onDidSaveTextDocument(document: vscode.TextDocument) {
    if (!this.enabled) return;

    const uri = document.uri;
    if (uri.scheme !== 'file') return;

    const filePath = uri.fsPath;
    const fileName = filePath.split(/[/\\]/).pop() || '';
    const config = vscode.workspace.getConfiguration('codingTracker');
    const ignoredFolders = config.get<string[]>('ignoredFolders', ['node_modules', '.git', 'dist', 'build', 'coverage']);
    const maxFileSize = config.get<number>('maxFileSize', 1048576);

    if (this.shouldIgnoreFile(fileName, filePath, ignoredFolders)) return;

    const totalLines = document.lineCount;
    if (totalLines > maxFileSize / 20) return; 

    // ---- Phase 1: Activity Tracking ----
    const now = Date.now();
    let activityTracked = false;
    
    if (!this.lastSentTime[filePath] || now - this.lastSentTime[filePath] >= this.DEBOUNCE_TIME) {
      this.lastSentTime[filePath] = now;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      const projectName = workspaceFolder ? workspaceFolder.name : 'Unknown Project';
      const relativeFilePath = workspaceFolder ? vscode.workspace.asRelativePath(uri, false) : fileName;

      const activity = {
        fileName,
        relativeFilePath,
        language: document.languageId,
        projectName,
        totalLines,
        timestamp: new Date().toISOString()
      };

      await this.apiClient.sendActivity(activity);
      activityTracked = true;
    }

    // ---- Phase 2: Snapshot Tracking ----
    if (config.get<boolean>('snapshotsEnabled', true)) {
      await this.processSnapshot(document, false);
    }
  }

  private async processSnapshot(document: vscode.TextDocument, isManual: boolean) {
    const uri = document.uri;
    if (uri.scheme !== 'file') return;

    const filePath = uri.fsPath;
    const fileName = filePath.split(/[/\\]/).pop() || '';
    const config = vscode.workspace.getConfiguration('codingTracker');
    const ignoredFolders = config.get<string[]>('ignoredFolders', ['node_modules', '.git', 'dist', 'build', 'coverage']);
    const maxSnapshotFileSize = config.get<number>('maxSnapshotFileSize', 1048576);
    const intervalMinutes = config.get<number>('snapshotIntervalMinutes', 10);

    if (this.shouldIgnoreFile(fileName, filePath, ignoredFolders)) {
      if (isManual) vscode.window.showWarningMessage('Cannot snapshot ignored or sensitive files.');
      return;
    }

    const code = document.getText();
    const codeSize = Buffer.byteLength(code, 'utf8');

    if (codeSize > maxSnapshotFileSize) {
      if (isManual) vscode.window.showWarningMessage('File is too large for a snapshot.');
      return;
    }

    const now = Date.now();
    const intervalMs = intervalMinutes * 60 * 1000;

    // Skip automatic snapshot if interval hasn't passed
    if (!isManual && this.lastSnapshotTime[filePath] && (now - this.lastSnapshotTime[filePath] < intervalMs)) {
      return;
    }

    const contentHash = crypto.createHash('sha256').update(code).digest('hex');
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    const projectName = workspaceFolder ? workspaceFolder.name : 'Unknown Project';
    const relativeFilePath = workspaceFolder ? vscode.workspace.asRelativePath(uri, false) : fileName;

    const snapshotData = {
      projectName,
      relativeFilePath,
      fileName,
      language: document.languageId,
      code,
      contentHash,
      lineCount: document.lineCount,
      timestamp: new Date().toISOString(),
      manual: isManual
    };

    await this.snapshotClient.sendSnapshot(snapshotData);
    this.lastSnapshotTime[filePath] = now;
    if (isManual) vscode.window.showInformationMessage('Snapshot queued successfully.');
  }

  public dispose() {
    this.disposable.dispose();
    this.statusBarItem.dispose();
  }
}
