import { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../AuthContext';
import { LogOut, Laptop, Download, Trash2, ShieldAlert, Key, Copy, Check } from 'lucide-react';
import { safeFormatDate } from '../utils/dateUtils';
import { Badge } from './common/Badge';

export default function Profile() {
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleCopyToken = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
    <div className="space-y-8 animate-fadeIn">
      {/* Profile Banner */}
      <div className="glass-card p-6 md:p-8 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xl font-bold">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold text-white tracking-tight">{user?.displayName}</h2>
            <p className="text-xs font-mono text-slate-400">{user?.email}</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30 text-xs font-mono font-semibold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Devices */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-400" />
              Connected VS Code Extensions
            </h3>
            <Badge variant="indigo">{devices.length} Devices</Badge>
          </div>
          
          <div className="space-y-3">
            {devices.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No connected device tokens.</p>
            ) : (
              devices.map(device => (
                <div key={device._id} className="flex items-center justify-between p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 font-mono">
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">{device.deviceName}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Created: {safeFormatDate(device.createdAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button 
                    onClick={() => revokeDevice(device._id)}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-5 border-t border-slate-800/80 space-y-3">
            <h4 className="text-xs font-mono font-semibold text-slate-300">Generate Extension Device Token</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newDeviceName}
                onChange={e => setNewDeviceName(e.target.value)}
                placeholder="Device label (e.g., Work Laptop)"
                className="flex-1 bg-slate-900/60 border border-slate-700/60 text-white font-mono text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500"
              />
              <button 
                onClick={generateDeviceToken}
                disabled={loading || !newDeviceName}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0"
              >
                Generate
              </button>
            </div>

            {generatedToken && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 font-mono">
                <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Copy this device token into VS Code extension settings:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 block p-2.5 bg-slate-950 rounded-lg text-emerald-400 text-xs break-all border border-slate-800 select-all">
                    {generatedToken}
                  </code>
                  <button 
                    onClick={handleCopyToken}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data & Security Management */}
        <div className="space-y-6">
          {/* Export */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              Telemetry Export
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Export a complete JSON archive containing your developer telemetry, goal progress, and activity stats.
            </p>
            <button 
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono font-semibold rounded-xl transition-all border border-slate-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              Download JSON Archive
            </button>
          </div>

          {/* Danger Zone */}
          <div className="glass-card p-6 rounded-2xl border border-rose-500/30 space-y-4">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Danger Zone
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Permanently remove your account and erase all associated coding activity data from the database.
            </p>
            <button 
              onClick={deleteAccount}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-mono font-semibold rounded-xl transition-all border border-rose-500/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
