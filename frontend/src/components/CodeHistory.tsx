import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiClient } from '../api/apiClient';
import { safeFormatDate } from '../utils/dateUtils';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import { FileActionModal } from './common/FileActionModal';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Folder, 
  FileText, 
  Clock, 
  ChevronRight, 
  Hash, 
  FileCode,
  Search,
  ExternalLink,
  ArrowLeft,
  ShieldAlert,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';

export default function CodeHistory() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [vsCodeStatus, setVsCodeStatus] = useState<'Checking' | 'Connected' | 'Disconnected' | 'Unauthorized'>('Checking');
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeMenuFile, setActiveMenuFile] = useState<string | null>(null);

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'delete' | 'rename' | null;
    fileName: string;
  }>({
    isOpen: false,
    type: null,
    fileName: ''
  });

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
      setActionMessage('VS Code connection not available');
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
    setSearchQuery('');
    fetchProjectFiles(project);
  };

  const fetchProjectFiles = async (project: string) => {
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

  const openModal = (type: 'delete' | 'rename', fileName: string) => {
    setActiveMenuFile(null);
    setModalState({
      isOpen: true,
      type,
      fileName
    });
  };

  const handleConfirmDelete = async () => {
    if (!selectedProject || !modalState.fileName) return;
    const fileName = modalState.fileName;

    await apiClient.post('/activity/delete-file', {
      projectName: selectedProject,
      fileName: fileName,
      relativeFilePath: fileName
    });

    if (selectedFile === fileName) {
      setSelectedFile(null);
      setSelectedSnapshot(null);
      setSnapshots([]);
    }
    fetchProjectFiles(selectedProject);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!selectedProject || !modalState.fileName) return;
    const oldFileName = modalState.fileName;

    await apiClient.post('/activity/rename', {
      projectName: selectedProject,
      oldFileName: oldFileName,
      oldRelativeFilePath: oldFileName,
      newFileName: newName,
      newRelativeFilePath: newName
    });

    if (selectedFile === oldFileName) {
      setSelectedFile(newName);
    }
    fetchProjectFiles(selectedProject);
  };

  const filteredProjects = projects.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = files.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* Action Modal */}
      <FileActionModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        fileName={modalState.fileName}
        projectName={selectedProject || ''}
        onClose={() => setModalState({ isOpen: false, type: null, fileName: '' })}
        onConfirmDelete={handleConfirmDelete}
        onConfirmRename={handleConfirmRename}
      />

      {/* Page Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Activity Explorer</h1>
        <p className="text-xs text-slate-400 mt-1">Browse projects, files, and inspect versioned code snapshots</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Navigation Sidebar Explorer */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-4 flex flex-col gap-4 max-h-[750px] border border-slate-800/80">
          {/* Header & Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                {selectedFile ? 'Snapshots' : selectedProject ? 'Project Files' : 'Projects'}
              </h3>
              {selectedProject && (
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                  {selectedProject}
                </span>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={selectedProject ? "Filter files..." : "Filter projects..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Navigation Views */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {!selectedProject ? (
              filteredProjects.length > 0 ? (
                filteredProjects.map(p => (
                  <button 
                    key={p} 
                    onClick={() => selectProject(p)} 
                    className="w-full text-left px-3.5 py-3 bg-slate-900/40 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 hover:border-slate-700/80 text-slate-300 hover:text-white transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform" />
                      <span className="text-xs font-mono font-medium truncate">{p}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-8">No matching projects found.</p>
              )
            ) : !selectedFile ? (
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedProject(null)} 
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold mb-2 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
                </button>
                <div className="space-y-1.5">
                  {filteredFiles.map(f => (
                    <div key={f} className="relative group">
                      <button 
                        onClick={() => selectFile(f)} 
                        className="w-full text-left px-3.5 py-2.5 bg-slate-900/40 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                      >
                        <div className="truncate flex items-center gap-2.5 min-w-0 pr-6">
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 shrink-0" />
                          <span className="text-xs font-mono truncate">{f}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>

                      {/* 3-Dots Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuFile(activeMenuFile === f ? null : f);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer z-10"
                        title="Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuFile === f && (
                        <div className="absolute right-2 top-8 z-40 w-44 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1 font-mono text-xs text-left">
                          <button
                            onClick={() => openModal('rename', f)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Rename File
                          </button>
                          <button
                            onClick={() => openModal('delete', f)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete History
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedFile(null)} 
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold mb-2 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Files
                </button>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-indigo-300 break-all mb-3 flex items-center justify-between">
                  <span className="truncate">{selectedFile}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openModal('rename', selectedFile)}
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Rename File"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openModal('delete', selectedFile)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/10"
                      title="Delete File History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {snapshots.map(s => {
                    const isSelected = selectedSnapshot?._id === s._id;
                    return (
                      <button 
                        key={s._id} 
                        onClick={() => viewSnapshot(s._id)} 
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-white shadow-xs' 
                            : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-mono font-semibold">{safeFormatDate(s.timestamp || s.createdAt, 'MMM d, yyyy')}</span>
                          <Badge variant={s.manual ? 'amber' : 'emerald'}>
                            {s.manual ? 'Manual' : 'Auto'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {safeFormatDate(s.timestamp || s.createdAt, 'h:mm:ss a')}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Hash className="w-3 h-3" /> {s.lineCount} lines
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Viewer Panel */}
        <div className="lg:col-span-8 glass-card rounded-2xl border border-slate-800/80 flex flex-col overflow-hidden max-h-[750px]">
          {loading && !selectedSnapshot && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
                <span className="text-xs font-mono text-slate-400">Fetching Code Telemetry...</span>
              </div>
            </div>
          )}

          {!selectedSnapshot && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <EmptyState
                icon={FileCode}
                title="Select a Code Snapshot"
                description="Choose a project and file from the left explorer to preview code history snapshots and diff telemetry."
              />
            </div>
          )}

          {selectedSnapshot && (
            <>
              {/* Snapshot Header Controls */}
              <div className="bg-slate-950/80 p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white font-mono">{selectedSnapshot.fileName}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Project: <span className="text-slate-200">{selectedSnapshot.projectName}</span> • Language: <span className="text-indigo-300">{selectedSnapshot.language}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <p className="text-xs font-mono text-slate-200">
                      {safeFormatDate(selectedSnapshot.timestamp || selectedSnapshot.createdAt, 'MMM d, yyyy • h:mm:ss a')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedSnapshot.lineCount} lines • {selectedSnapshot.manual ? 'Manual Save' : 'Auto Save'}
                    </p>
                  </div>

                  <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                  {/* VS Code Launcher & Actions */}
                  <div className="flex items-center gap-2">
                    {vsCodeStatus === 'Unauthorized' ? (
                      <button
                        onClick={() => {
                          const t = window.prompt("Enter your VS Code integration token (found in ~/.codingtracker/local_token)");
                          if (t) checkVsCodeConnection(t);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Authenticate VS Code
                      </button>
                    ) : (
                      <button
                        onClick={openInVsCode}
                        disabled={vsCodeStatus !== 'Connected'}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          vsCodeStatus === 'Connected'
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open in VS Code
                      </button>
                    )}
                    {actionMessage && <span className="text-[11px] text-indigo-400 font-mono animate-pulse">{actionMessage}</span>}

                    <button
                      onClick={() => openModal('rename', selectedSnapshot.fileName)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 cursor-pointer"
                      title="Rename File"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    </button>

                    <button
                      onClick={() => openModal('delete', selectedSnapshot.fileName)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 border border-zinc-800 cursor-pointer"
                      title="Delete File History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Highlighter */}
              <div className="flex-1 overflow-auto bg-[#0d1117] custom-scrollbar text-xs font-mono">
                <SyntaxHighlighter
                  language={selectedSnapshot.language || 'text'}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                  showLineNumbers
                >
                  {selectedSnapshot.code || ''}
                </SyntaxHighlighter>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
