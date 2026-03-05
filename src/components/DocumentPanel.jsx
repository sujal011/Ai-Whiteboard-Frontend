import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiFetch } from '../utils/api';
import { FileUp, FileText, Loader2, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentPanel = () => {
    const { activeWorkspace } = useWorkspace();
    const [documents, setDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDocuments = async () => {
        if (!activeWorkspace) return;
        setIsLoading(true);
        try {
            const response = await apiFetch(`/api/workspaces/${activeWorkspace.id}/documents`);
            const data = await response.json();
            if (response.ok) {
                setDocuments(data);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [activeWorkspace]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeWorkspace) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/workspaces/${activeWorkspace.id}/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: formData,
            });

            if (response.ok) {
                toast.success('Document uploaded and indexed!');
                fetchDocuments();
            } else {
                const data = await response.json();
                toast.error(data.detail || 'Upload failed');
            }
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    if (!activeWorkspace) return null;

    return (
        <div className="bg-[#232323] rounded-xl border border-gray-800 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Source Documents
                </h3>
                <label className="cursor-pointer p-1.5 bg-[#2d2d2d] hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors group">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                    <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} accept=".pdf,.txt" />
                </label>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll">
                {isLoading && documents.length === 0 ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-4 bg-[#1a1a1a] rounded-lg border border-dashed border-gray-800">
                        <p className="text-xs text-gray-600">No documents uploaded yet</p>
                    </div>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 p-2 bg-[#1a1a1a] hover:bg-[#2d2d2d] rounded-lg border border-gray-800 transition-colors group">
                            <div className="p-2 bg-blue-900/20 rounded-lg">
                                {doc.file_type.includes('pdf') ? <FileCode className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-300 truncate font-medium">{doc.filename}</div>
                                <div className="text-[10px] text-gray-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-500/50" />
                                    Vector Indexed
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <p className="text-[10px] text-gray-600 mt-3 text-center italic">
                Files are automatically processed into vector embeddings for RAG analysis.
            </p>
        </div>
    );
};

export default DocumentPanel;
