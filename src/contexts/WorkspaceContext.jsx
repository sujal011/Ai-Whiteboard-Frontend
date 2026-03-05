import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchWorkspaces = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const response = await apiFetch('/api/workspaces');
            const data = await response.json();
            if (response.ok) {
                setWorkspaces(data);
                // Set first workspace as active by default if none selected
                if (data.length > 0 && !activeWorkspace) {
                    setActiveWorkspace(data[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, activeWorkspace]);

    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);

    const createWorkspace = async (name) => {
        try {
            const response = await apiFetch('/api/workspaces', {
                method: 'POST',
                body: JSON.stringify({ name }),
            });
            const data = await response.json();
            if (response.ok) {
                setWorkspaces(prev => [...prev, data]);
                setActiveWorkspace(data);
                toast.success('Workspace created');
                return data;
            } else {
                throw new Error(data.detail || 'Failed to create workspace');
            }
        } catch (error) {
            toast.error(error.message);
            throw error;
        }
    };

    const deleteWorkspace = async (id) => {
        try {
            const response = await apiFetch(`/api/workspaces/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setWorkspaces(prev => prev.filter(w => w.id !== id));
                if (activeWorkspace?.id === id) {
                    setActiveWorkspace(workspaces.find(w => w.id !== id) || null);
                }
                toast.success('Workspace deleted');
            }
        } catch (error) {
            toast.error('Failed to delete workspace');
        }
    };

    const saveWorkspaceData = async (data = {}) => {
        if (!activeWorkspace) return;
        try {
            const response = await apiFetch(`/api/workspaces/${activeWorkspace.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            const updated = await response.json();
            if (response.ok) {
                setActiveWorkspace(updated);
                setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w));
            }
        } catch (error) {
            console.error('Failed to save workspace data:', error);
        }
    };

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            activeWorkspace,
            setActiveWorkspace,
            isLoading,
            createWorkspace,
            deleteWorkspace,
            saveWorkspaceData,
            refreshWorkspaces: fetchWorkspaces
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
