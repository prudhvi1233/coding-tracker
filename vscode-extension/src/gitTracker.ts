import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ApiClient } from './apiClient';

const execAsync = promisify(exec);

export class GitTracker {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  public async refreshAllRepositories() {
    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
    if (!gitExtension) {
      console.warn('VS Code Git extension not found.');
      return;
    }

    const api = gitExtension.getAPI(1);
    const repositories = api.repositories;

    if (repositories.length === 0) {
      console.log('No Git repositories found in active workspaces.');
      return;
    }

    for (const repo of repositories) {
      await this.syncRepository(repo);
    }
  }

  private async syncRepository(repo: any) {
    try {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(repo.rootUri);
      const projectId = workspaceFolder ? workspaceFolder.name : repo.rootUri.fsPath.split('/').pop();
      const repositoryName = projectId;
      
      const currentBranch = repo.state.HEAD?.name || '';
      
      // Sanitize remote URL robustly
      let remoteUrlSanitized = '';
      if (repo.state.remotes && repo.state.remotes.length > 0) {
        const rawUrl = repo.state.remotes[0].fetchUrl || '';
        try {
          if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('ssh://')) {
            const parsed = new URL(rawUrl);
            parsed.username = '';
            parsed.password = '';
            parsed.search = ''; // Remove query params which may hold tokens
            remoteUrlSanitized = parsed.toString();
          } else {
            // Handle scp-like SSH: git@github.com:user/repo.git
            const scpMatch = rawUrl.match(/^([^@]+)@([^:]+):(.+)$/);
            if (scpMatch) {
              remoteUrlSanitized = `${scpMatch[2]}:${scpMatch[3]}`;
            } else {
              remoteUrlSanitized = rawUrl.replace(/:\/\/[^@]+@/, '://').replace(/^[^@]+@/, '').split('?')[0];
            }
          }
        } catch (e) {
          remoteUrlSanitized = rawUrl.replace(/:\/\/[^@]+@/, '://').replace(/^[^@]+@/, '').split('?')[0];
        }
      }

      const changedFiles = repo.state.workingTreeChanges.length;
      const stagedFiles = repo.state.indexChanges.length;
      const untrackedFiles = repo.state.untrackedChanges?.length || 0;
      const unstagedFiles = changedFiles - untrackedFiles; // Rough estimate if untracked are grouped
      const isDirty = changedFiles > 0 || stagedFiles > 0 || untrackedFiles > 0;

      // Get recent 50 commits from VS Code Git API
      const rawCommits = await repo.log({ maxEntries: 50 });
      
      const commits = [];
      for (const commit of rawCommits) {
        // Fetch stats (insertions/deletions) using safe read-only git command
        let filesChanged = 0;
        let insertions = 0;
        let deletions = 0;
        
        try {
          // --shortstat gives " 1 file changed, 10 insertions(+), 5 deletions(-)"
          const { stdout } = await execAsync(`git show --shortstat --format="" ${commit.hash}`, { cwd: repo.rootUri.fsPath });
          const statsStr = stdout.trim();
          
          if (statsStr) {
            const filesMatch = statsStr.match(/(\d+) file/);
            const insMatch = statsStr.match(/(\d+) insertion/);
            const delMatch = statsStr.match(/(\d+) deletion/);
            
            if (filesMatch) filesChanged = parseInt(filesMatch[1]);
            if (insMatch) insertions = parseInt(insMatch[1]);
            if (delMatch) deletions = parseInt(delMatch[1]);
          }
        } catch (e) {
          console.error(`Failed to get stats for commit ${commit.hash}`, e);
        }

        commits.push({
          commitHash: commit.hash,
          shortHash: commit.hash.substring(0, 7),
          message: commit.message,
          authorName: commit.authorName,
          timestamp: commit.commitDate,
          filesChanged,
          insertions,
          deletions
        });
      }

      const payload = {
        projectId,
        projectName: projectId,
        repositoryName,
        currentBranch,
        remoteUrlSanitized,
        changedFiles,
        stagedFiles,
        unstagedFiles,
        untrackedFiles,
        isDirty,
        commits
      };

      await this.apiClient.sendGitSync(payload);
      console.log(`Synced repository: ${projectId}`);
    } catch (error) {
      console.error(`Error syncing repository:`, error);
    }
  }
}
