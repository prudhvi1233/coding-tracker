import * as http from 'http';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export class LocalServer {
  private server: http.Server | null = null;
  private readonly PORT = 55555;
  private token: string = '';

  constructor() {
    this.ensureToken();
  }

  private ensureToken() {
    const configDir = path.join(os.homedir(), '.codingtracker');
    const tokenFile = path.join(configDir, 'local_token');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    if (fs.existsSync(tokenFile)) {
      this.token = fs.readFileSync(tokenFile, 'utf8').trim();
    } else {
      this.token = crypto.randomUUID();
      fs.writeFileSync(tokenFile, this.token, 'utf8');
    }
  }

  public start() {
    if (this.server) return;

    this.server = http.createServer(async (req, res) => {
      // Security Fix: Strict CORS
      const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
      const origin = req.headers.origin || '';
      
      if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // Drop requests from unauthorized origins completely
        if (origin) {
          res.writeHead(403);
          res.end();
          return;
        }
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Parse Auth Header
      const authHeader = req.headers.authorization;
      const clientToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (clientToken !== this.token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized', message: 'Invalid local integration token' }));
        return;
      }

      if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'Connected', 
          version: '1.0.0',
          workspaces: vscode.workspace.workspaceFolders?.map(wf => wf.name) || []
        }));
        return;
      }

      if (req.method === 'POST' && req.url === '/open') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const data = JSON.stringify(body) ? JSON.parse(body) : {};
            const { projectName, relativeFilePath, line } = data;

            if (!projectName || !relativeFilePath) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Bad Request', message: 'Missing projectName or relativeFilePath' }));
              return;
            }

            // 1. Find the workspace
            const workspaceFolders = vscode.workspace.workspaceFolders || [];
            const targetWorkspace = workspaceFolders.find(wf => wf.name === projectName);

            if (!targetWorkspace) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Project Not Found', message: `The project "${projectName}" is not open in VS Code.` }));
              return;
            }

            // 2. Resolve safe path
            const workspaceRoot = targetWorkspace.uri.fsPath;
            const requestedPath = path.join(workspaceRoot, relativeFilePath);
            
            // 3. Verify file exists first so realpathSync doesn't throw ENOENT
            if (!fs.existsSync(requestedPath)) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'File Not Found', message: 'File not found locally.' }));
              return;
            }

            // 4. Path traversal protection using realpath to resolve symlinks and Windows casing
            const realWorkspaceRoot = fs.realpathSync(workspaceRoot);
            const realRequestedPath = fs.realpathSync(requestedPath);
            const relative = path.relative(realWorkspaceRoot, realRequestedPath);

            if (relative.startsWith('..') || path.isAbsolute(relative)) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Forbidden', message: 'Path traversal prevented.' }));
              return;
            }

            // 5. Open the file in VS Code
            const document = await vscode.workspace.openTextDocument(realRequestedPath);
            const editor = await vscode.window.showTextDocument(document, { preview: false });

            // Optional line navigation
            if (typeof line === 'number' && line > 0) {
              const targetLine = line - 1; // 0-indexed
              const position = new vscode.Position(targetLine, 0);
              editor.selection = new vscode.Selection(position, position);
              editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Opened in VS Code' }));

          } catch (e: any) {
            console.error('Error handling /open:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', message: e.message }));
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    });

    this.server.listen(this.PORT, '127.0.0.1', () => {
      console.log(`Coding Tracker Local Bridge listening on port ${this.PORT}`);
    });
  }

  public stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
