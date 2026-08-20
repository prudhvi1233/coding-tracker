import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../AuthContext';
import { User, LogOut, Laptop, Download, Trash2, ShieldAlert } from 'lucide-react';
import { safeFormatDate } from '../utils/dateUtils';


export default function Profile() {
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await apiClient.get(`/devices`);
      setDevices(res.data);
    } catch (e) {
      console.error('Error fetching devices', e);
    }
  };

  const generateDeviceToken = async () => {
    if (!newDeviceName) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/devices`, { deviceName: newDeviceName });
      setGeneratedToken(res.data.rawToken);
      setNewDeviceName('');
      fetchDevices();
    } catch (e) {
      console.error('Error generating token', e);
    }
    setLoading(false);
  };

  const revokeDevice = async (id: string) => {
    try {
      await apiClient.post(`/devices/${id}/revoke`);
      fetchDevices();
    } catch (e) {
      console.error('Error revoking device', e);
    }
  };

  const exportData = async () => {
    try {
      const res = await apiClient.post(`/account/export`, { includeCodeSnapshots: false });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coding-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const deleteAccount = async () => {
    const confirmation = prompt('Type "DELETE MY ACCOUNT" to confirm absolute deletion of all your data.');
    if (confirmation === 'DELETE MY ACCOUNT') {
      try {
        await apiClient.post(`/account/delete`, { confirmation });
        logout();
      } catch (e) {
        alert('Failed to delete account. Did you type it exactly?');
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/30 p-8 rounded-2xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <User className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">{user?.displayName}</h2>
            <p className="text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 font-medium rounded-xl transition-all border border-slate-700 hover:border-rose-500/30"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Devices Panel */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-indigo-400" />
            Connected Devices
          </h3>
          
          <div className="space-y-4 mb-6">
            {devices.length === 0 ? (
              <p className="text-slate-400 text-sm">No connected devices.</p>
            ) : (
              devices.map(device => (
                <div key={device._id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div>
                    <h4 className="font-medium text-slate-200">{device.deviceName}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Added: {safeFormatDate(device.createdAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button 
                    onClick={() => revokeDevice(device._id)}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-6 border-t border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Connect VS Code Extension</h4>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newDeviceName}
                onChange={e => setNewDeviceName(e.target.value)}
                placeholder="e.g. My MacBook Pro"
                className="flex-1 bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 focus:outline-none focus:border-indigo-500"
              />
              <button 
                onClick={generateDeviceToken}
                disabled={loading || !newDeviceName}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
              >
                Generate Token
              </button>
            </div>
            {generatedToken && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-sm text-emerald-400 mb-2 font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Copy this token exactly once into your VS Code extension settings:
                </p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 block p-3 bg-slate-900 rounded-lg text-emerald-300 break-all select-all border border-slate-800">
                    {generatedToken}
                  </code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedToken)}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all whitespace-nowrap"
                  >
                    Copy Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Management Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" />
              Export Data
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Download a complete JSON archive of all your tracking history, goals, and analytics. Source code snapshots are excluded by default for security.
            </p>
            <button 
              onClick={exportData}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all border border-slate-700 hover:border-indigo-500"
            >
              <Download className="w-4 h-4" />
              Download JSON Archive
            </button>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-rose-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <ShieldAlert className="w-32 h-32 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-rose-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button 
              onClick={deleteAccount}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-rose-500/20"
            >
              <ShieldAlert className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
