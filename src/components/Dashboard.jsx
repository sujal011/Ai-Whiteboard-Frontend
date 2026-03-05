import React, { useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import {
    Layout,
    Files,
    Settings,
    Plus,
    Trash2,
    ExternalLink,
    Search,
    MoreVertical,
    Folder,
    FileText,
    Clock,
    User,
    LogOut,
    X,
    ChevronRight,
    Search as SearchIcon
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Dashboard = ({ onClose }) => {
    const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace, deleteWorkspace } = useWorkspace();
    const { logout, user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState('workspaces'); // 'workspaces' or 'files'

    const filteredWorkspaces = workspaces.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[5000] bg-[#0f0f10] text-gray-200 flex animate-fade-in overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-800 flex flex-col p-4 bg-[#141415]">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Layout className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Whiteboard</span>
                </div>

                <nav className="flex-1 space-y-1">
                    <button
                        onClick={() => setView('workspaces')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${view === 'workspaces' ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    >
                        <Folder className="w-5 h-5" />
                        <span>Workspaces</span>
                    </button>
                    <button
                        onClick={() => setView('files')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${view === 'files' ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
                    >
                        <Files className="w-5 h-5" />
                        <span>All Documents</span>
                    </button>
                    <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Preferences</div>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </button>
                </nav>

                <div className="mt-auto p-2 bg-[#1a1a1c] border border-gray-800 rounded-2xl">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate text-white">{user?.email || 'User'}</div>
                            <div className="text-[10px] text-gray-500">Free Account</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full mt-2 flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-red-400 transition-colors text-xs"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f10]">
                {/* Header */}
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0f0f10]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="relative flex-1 max-w-xl">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search workspaces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4 ml-8">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scroll">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {view === 'workspaces' ? 'Your Workspaces' : 'Recent Files'}
                            </h2>
                            <p className="text-sm text-gray-500">Manage your projects and resources efficiently.</p>
                        </div>
                        {view === 'workspaces' && (
                            <button
                                onClick={() => {/* Trigger create modal (can reuse selector logic) */ }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/40"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Workspace</span>
                            </button>
                        )}
                    </div>

                    {view === 'workspaces' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredWorkspaces.map(w => (
                                <div
                                    key={w.id}
                                    className="group bg-[#1a1a1c] border border-gray-800 rounded-2xl p-5 hover:border-blue-600/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col cursor-pointer active:scale-95"
                                    onClick={() => { setActiveWorkspace(w); onClose(); }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gray-800 group-hover:bg-blue-600/20 rounded-xl flex items-center justify-center transition-colors">
                                            <Folder className={`w-6 h-6 ${activeWorkspace?.id === w.id ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'}`} />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteWorkspace(w.id); }}
                                                className="p-2 text-gray-600 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <MoreVertical className="w-5 h-5 text-gray-700 hover:text-white" />
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg text-white mb-2 truncate group-hover:text-blue-400 transition-colors capitalize">
                                        {w.name}
                                    </h3>
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800/50">
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                            <Clock className="w-3 h-3" />
                                            {dayjs(w.updated_at).fromNow()}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1c] border border-gray-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#141415] border-b border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Document</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Workspace</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {/* This would ideally list documents from all workspaces */}
                                    {workspaces.flatMap(w => (w.documents || []).map(doc => (
                                        <tr key={doc.id} className="hover:bg-[#1e1e21] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                                                        <FileText className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <span className="font-medium text-sm text-gray-200">{doc.filename}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-md font-medium">{w.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">{doc.file_type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-gray-600 hover:text-white transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                            {workspaces.every(w => !w.documents || w.documents.length === 0) && (
                                <div className="p-12 text-center">
                                    <Files className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-50" />
                                    <p className="text-gray-500">No documents found across your workspaces.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
