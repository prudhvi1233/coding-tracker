import * as vscode from 'vscode';
import { ActivityTracker } from './activityTracker';
import { LocalServer } from './localServer';
import { GitTracker } from './gitTracker';
import { ApiClient } from './apiClient';

let tracker: ActivityTracker;
let localServer: LocalServer;
let gitTracker: GitTracker;
let apiClient: ApiClient;
5
export function activate(context: vscode.ExtensionContext) {
  console.log('Coding Tracker is now active!');

  apiClient = new ApiClient(context);
  tracker = new ActivityTracker(apiClient);
  localServer = new LocalServer();
  localServer.start();
  
  gitTracker = new GitTracker(apiClient);
  
  // Sync git on startup
  setTimeout(() => {
    gitTracker.refreshAllRepositories();
  }, 3000);

  const enableCmd = vscode.commands.registerCommand('codingTracker.enable', () => {
    vscode.workspace.getConfiguration('codingTracker').update('enabled', true, true);
    tracker.enable();
    vscode.window.showInformationMessage('Coding Tracker: Enabled');
  });

  const disableCmd = vscode.commands.registerCommand('codingTracker.disable', () => {
    vscode.workspace.getConfiguration('codingTracker').update('enabled', false, true);
    tracker.disable();
    vscode.window.showInformationMessage('Coding Tracker: Disabled');
  });

  const statusCmd = vscode.commands.registerCommand('codingTracker.showStatus', () => {
    tracker.showStatus();
  });

  const snapshotCmd = vscode.commands.registerCommand('codingTracker.saveSnapshot', () => {
    tracker.saveManualSnapshot();
  });

  const refreshGitCmd = vscode.commands.registerCommand('codingTracker.refreshGitData', async () => {
    await gitTracker.refreshAllRepositories();
    vscode.window.showInformationMessage('Git data updated successfully.');
  });

  context.subscriptions.push(enableCmd, disableCmd, statusCmd, snapshotCmd, refreshGitCmd, tracker);
}

export function deactivate() {
  if (tracker) {
    tracker.dispose();
  }
  if (localServer) {
    localServer.stop();
  }
}


