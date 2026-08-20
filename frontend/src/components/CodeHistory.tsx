import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Folder, FileText, Clock, ChevronRight, Hash, FileCode2 } from 'lucide-react';


export default function CodeHistory() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [vsCodeStatus, setVsCodeStatus] = useState<'Checking' | 'Connected' | 'Disconnected' | 'Unauthorized'>('Checking');
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    checkVsCodeConnection();
  }, []);

  const checkVsCodeConnection = async (overrideToken?: string) => {
    try {
      const token = overrideToken || localStorage.getItem('vsCodeToken');
      if (!token) {
        setVsCodeStatus('Unauthorized');
        return;
      }
      setLocalToken(token);
      
      try {
        const res = await axios.get('http://127.0.0.1:55555/status', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 2000
        });
        if (res.data.status === 'Connected') {
          setVsCodeStatus('Connected');
          if (overrideToken) localStorage.setItem('vsCodeToken', overrideToken);
        } else {
          setVsCodeStatus('Disconnected');
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setVsCodeStatus('Unauthorized');
        } else {
          setVsCodeStatus('Disconnected');
        }
      }
    } catch (error) {
      setVsCodeStatus('Disconnected');
    }
  };

  const openInVsCode = async () => {
    if (vsCodeStatus !== 'Connected' || !localToken || !selectedProject || !selectedFile) {
      setActionMessage('VS Code connection not available. Open VS Code with the Coding Tracker extension enabled.');
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }

    try {
      setActionMessage('Opening...');
      const res = await axios.post('http://127.0.0.1:55555/open', {
        projectName: selectedProject,
        relativeFilePath: selectedFile
      }, {
        headers: { Authorization: `Bearer ${localToken}` }
      });
      
      if (res.data.success) {
        setActionMessage('✓ Opened in VS Code');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setActionMessage(`Error: ${error.response.data.message}`);
      } else {
        setActionMessage('Failed to open file in VS Code.');
      }
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/projects`);
      setProjects(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const selectProject = async (project: string) => {
    setSelectedProject(project);
    setSelectedFile(null);
    setSnapshots([]);
    setSelectedSnapshot(null);
    setLoading(true);
    try {
      const res = await apiClient.get(`/projects/${project}/files`);
      setFiles(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const selectFile = async (file: string) => {
    setSelectedFile(file);
    setSelectedSnapshot(null);
    setLoading(true);
    try {
      const res = await apiClient.get(`/snapshots?projectName=${selectedProject}&relativeFilePath=${encodeURIComponent(file)}`);
      setSnapshots(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const viewSnapshot = async (snapshotId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/snapshots/${snapshotId}`);
      setSelectedSnapshot(res.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-12 gap-6 min-h-[70vh]">
      {/* Sidebar Browser */}
      <div className="col-span-4 glass-panel rounded-2xl p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
          <Folder className="w-5 h-5 text-indigo-400" />
          Projects
        </h3>
        
        {!selectedProject ? (
          <div className="flex flex-col gap-2">
            {projects.length > 0 ? projects.map(p => (
              <button key={p} onClick={() => selectProject(p)} className="text-left px-4 py-3 bg-slate-800/50 hover:bg-slate-700 rounded-lg border border-slate-700/50 text-slate-300 hover:text-white transition-colors flex justify-between items-center">
                <span>{p}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            )) : <p className="text-slate-500 text-sm">No projects found.</p>}
          </div>
        ) : !selectedFile ? (
          <div className="flex flex-col gap-2">
            <button onClick={() => setSelectedProject(null)} className="text-indigo-400 text-sm hover:underline mb-2 flex items-center gap-1">
              &larr; Back to Projects
            </button>
            <h4 className="text-slate-300 font-medium text-sm border-b border-slate-700 pb-2 mb-2">{selectedProject}</h4>
            {files.map(f => (
              <button key={f} onClick={() => selectFile(f)} className="text-left px-4 py-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg border border-slate-700/50 text-slate-300 hover:text-white transition-colors flex justify-between items-center">
                <div className="truncate flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{f}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
             <button onClick={() => setSelectedFile(null)} className="text-indigo-400 text-sm hover:underline mb-2 flex items-center gap-1">
              &larr; Back to Files
            </button>
            <h4 className="text-slate-300 font-medium text-sm border-b border-slate-700 pb-2 mb-2 break-all">{selectedFile}</h4>
            <div className="flex flex-col gap-2">
              {snapshots.map(s => (
                <button 
                  key={s._id} 
                  onClick={() => viewSnapshot(s._id)} 
                  className={`text-left px-4 py-3 rounded-lg border transition-colors ${selectedSnapshot?._id === s._id ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-slate-800/50 hover:bg-slate-700 border-slate-700/50 text-slate-300'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{safeFormatDate(s.timestamp || s.createdAt, 'MMM d, yyyy')}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${s.manual ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {s.manual ? 'Manual' : 'Automatic'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {safeFormatDate(s.timestamp || s.createdAt, 'h:mm:ss a')}
                    <span className="ml-auto flex items-center gap-1"><Hash className="w-3 h-3"/> {s.lineCount} lines</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Code Viewer */}
      <div className="col-span-8 glass-panel rounded-2xl flex flex-col overflow-hidden max-h-[80vh]">
        {loading && !selectedSnapshot && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {!selectedSnapshot && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <FileCode2 className="w-16 h-16 mb-4 opacity-50" />
            <p>Select a project, file, and snapshot to view code history.</p>
          </div>
        )}

        {selectedSnapshot && (
          <>
            <div className="bg-slate-900/80 p-4 border-b border-slate-700/50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-white font-mono text-sm">{selectedSnapshot.fileName}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedSnapshot.projectName} • {selectedSnapshot.language}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-slate-300">{safeFormatDate(selectedSnapshot.timestamp || selectedSnapshot.createdAt, 'MMM d, yyyy • h:mm:ss a')}</p>
                  <p className="text-xs text-slate-500 mt-1">{selectedSnapshot.manual ? 'Manual Snapshot' : 'Automatic Snapshot'} • {selectedSnapshot.lineCount} lines</p>
                </div>
                
                <div className="h-8 w-px bg-slate-700/50"></div>
                
                <div className="flex flex-col items-end gap-1">
                  {vsCodeStatus === 'Unauthorized' ? (
                    <button 
                      onClick={() => {
                        const t = window.prompt("Enter your VS Code integration token (found in ~/.codingtracker/local_token)");
                        if (t) checkVsCodeConnection(t);
                      }}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    >
                      Authenticate VS Code
                    </button>
                  ) : (
                    <button 
                      onClick={openInVsCode}
                      disabled={vsCodeStatus !== 'Connected'}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        vsCodeStatus === 'Connected' 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      }`}
                    >
                      Open in VS Code
                    </button>
                  )}
                  {actionMessage ? (
                    <span className="text-xs text-emerald-400">{actionMessage}</span>
                  ) : (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${vsCodeStatus === 'Connected' ? 'bg-emerald-500' : vsCodeStatus === 'Checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      {vsCodeStatus === 'Connected' ? 'VS Code Connected' : vsCodeStatus === 'Checking' ? 'Checking connection...' : vsCodeStatus === 'Unauthorized' ? 'Authentication Required' : 'VS Code Disconnected'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              <SyntaxHighlighter
                language={selectedSnapshot.language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                showLineNumbers
              >
                {selectedSnapshot.code}
              </SyntaxHighlighter>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
