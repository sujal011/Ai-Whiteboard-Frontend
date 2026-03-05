import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, ChevronDown, Layout, LogOut, Loader2, Grid } from 'lucide-react';

const WorkspaceSelector = ({ onDashboardOpen }) => {
    const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, deleteWorkspace, isLoading } = useWorkspace();
    const { logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;
        await createWorkspace(newWorkspaceName);
        setNewWorkspaceName('');
        setShowCreateModal(false);
    };

    return (
        <div className="fixed top-4 left-4 z-[2000] flex items-center gap-2">
            <button
                onClick={onDashboardOpen}
                className="p-2.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-gray-700 rounded-xl text-blue-400 transition-all shadow-lg active:scale-95"
                title="Dashboard"
            >
                <Grid className="w-6 h-6" />
            </button>

            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-gray-700 rounded-xl text-white transition-all shadow-lg"
                >
                    <Layout className="w-5 h-5 text-blue-400" />
                    <span className="font-medium max-w-[150px] truncate">
                        {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                    <div className="absolute top-full mt-2 w-64 bg-[#1e1e1e] border border-gray-800 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Workspaces</span>
                            <button
                                onClick={() => { setShowCreateModal(true); setIsMenuOpen(false); }}
                                className="p-1 hover:bg-gray-800 rounded text-blue-400"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto custom-scroll">
                            {workspaces.map(w => (
                                <div key={w.id} className="group flex items-center px-2">
                                    <button
                                        onClick={() => { setActiveWorkspace(w); setIsMenuOpen(false); }}
                                        className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeWorkspace?.id === w.id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-800'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${activeWorkspace?.id === w.id ? 'bg-blue-400' : 'bg-gray-600'}`} />
                                        <span className="truncate">{w.name}</span>
                                    </button>
                                    <button
                                        onClick={() => deleteWorkspace(w.id)}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-800">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm p-6 bg-[#1e1e1e] border border-gray-800 rounded-2xl shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold text-white mb-4">New Workspace</h2>
                        <form onSubmit={handleCreate}>
                            <input
                                autoFocus
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                placeholder="Workspace Name..."
                                className="w-full px-4 py-3 bg-[#2d2d2d] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white mb-6"
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceSelector;
