import { useState, useEffect } from 'react';
import { useExcalidrawAPI } from './hooks/useExcalidrawAPI';
import { useAsyncRequest } from './hooks/useAsyncRequest';
import { Excalidraw, convertToExcalidrawElements, exportToCanvas } from "@excalidraw/excalidraw";
import { Send, Loader2, PanelRightClose, PanelRight } from "lucide-react";
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';
import EditorComponent from './components/EditorComponent';
import { Toaster } from 'react-hot-toast';
import { BACKEND_URL } from './config';
import { showSuccessToast, showErrorToast, showInfoToast } from './utils/toastUtils';
import ChatBox from './components/ChatBox';
import ExcalidrawBoard from './components/ExcalidrawBoard';
import ResizableSidebar from './components/ResizableSidebar';
import { useAuth } from './contexts/AuthContext';
import { useWorkspace } from './contexts/WorkspaceContext';
import AuthPage from './components/AuthPage';
import { apiFetch } from './utils/api';
import WorkspaceSelector from './components/WorkspaceSelector';
import Dashboard from './components/Dashboard';

// Default chatbox position (centered at bottom)
const defaultChatBoxPosition = { top: window.innerHeight - 280, left: window.innerWidth / 2 - 300 };

const App = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeWorkspace, saveWorkspaceData } = useWorkspace();
  const [prompt, setPrompt] = useState('');
  const [dictOfVars, setDictOfVars] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [editorWidth, setEditorWidth] = useState(400);
  const [excalidrawWidth, setExcalidrawWidth] = useState(window.innerWidth - editorWidth);
  const [chatBoxPosition, setChatBoxPosition] = useState(defaultChatBoxPosition);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isCalculateLoading, setIsCalculateLoading] = useState(false);
  const backendURL = BACKEND_URL;
  const { excalidrawAPI, setExcalidrawAPI, getSelectedElements, updateElements } = useExcalidrawAPI();
  const { execute: executeAsync, loading: asyncLoading } = useAsyncRequest();

  // Load workspace data when it changes
  useEffect(() => {
    if (activeWorkspace && excalidrawAPI) {
      if (activeWorkspace.excalidraw_data) {
        excalidrawAPI.updateScene({ elements: activeWorkspace.excalidraw_data.elements || [] });
      } else {
        excalidrawAPI.updateScene({ elements: [] });
      }
    }
  }, [activeWorkspace?.id, excalidrawAPI]);

  // Auto-save Excalidraw data
  useEffect(() => {
    if (!activeWorkspace || !excalidrawAPI) return;

    const autoSave = async () => {
      const elements = excalidrawAPI.getSceneElements();
      if (elements && elements.length > 0) {
        await saveWorkspaceData({
          excalidraw_data: { elements }
        });
      }
    };

    const interval = setInterval(autoSave, 60000); // Every minute
    return () => clearInterval(interval);
  }, [activeWorkspace?.id, excalidrawAPI]);

  // Update excalidrawWidth when editorWidth or window size changes
  useEffect(() => {
    const handleResize = () => {
      setExcalidrawWidth(window.innerWidth - (isEditorOpen ? editorWidth : 0));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [editorWidth, isEditorOpen]);

  // --- handleSubmit: New Multi-Command Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const lowerPrompt = prompt.toLowerCase();

    // Command Routing
    if (lowerPrompt.startsWith('/generate')) {
      await handleGenerate(prompt.replace('/generate', '').trim());
    } else if (lowerPrompt.startsWith('/ask')) {
      await handleAsk(prompt.replace('/ask', '').trim());
    } else if (lowerPrompt.startsWith('/general')) {
      await handleGeneral(prompt.replace('/general', '').trim());
    } else if (prompt.includes('@whiteboard')) {
      await handleWhiteboardContext(prompt);
    } else {
      // Default to generate if no command specified
      await handleGenerate(prompt);
    }
  };

  const handleGenerate = async (cleanPrompt) => {
    await executeAsync(async () => {
      const response = await apiFetch('/api/chat/generate', {
        method: "POST",
        body: JSON.stringify({ prompt: cleanPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to generate');
      if (data.result) await updateScene(data.result);
      setPrompt('');
      showSuccessToast('Diagram generated!');
    });
  };

  const handleAsk = async (cleanPrompt) => {
    if (!activeWorkspace) return showErrorToast('Select a workspace first');

    // Check for @ file mention in the original prompt
    const fileMention = prompt.match(/@([^\s]+)/);
    let documentId = null;

    if (fileMention) {
      const filename = fileMention[1];
      const doc = activeWorkspace.documents?.find(d => d.filename === filename);
      if (doc) documentId = doc.id;
    }

    await executeAsync(async () => {
      const response = await apiFetch('/api/chat/ask', {
        method: "POST",
        body: JSON.stringify({
          question: cleanPrompt.replace(/@[^\s]+/, '').trim(),
          workspace_id: activeWorkspace.id,
          document_id: documentId // Backend should support filtering by specific doc
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to ask AI');

      setPrompt('');
      showSuccessToast(documentId ? `Answer from ${fileMention[1]}` : 'Answer from documents');
    });
  };

  const handleGeneral = async (cleanPrompt) => {
    await executeAsync(async () => {
      const response = await apiFetch('/api/chat/general', {
        method: "POST",
        body: JSON.stringify({ prompt: cleanPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'AI Assistant failed');
      setPrompt('');
      showSuccessToast('Assistance provided!');
    });
  };

  const handleWhiteboardContext = async (fullPrompt) => {
    if (!excalidrawAPI) return;
    await executeAsync(async () => {
      const elements = excalidrawAPI.getSceneElements();
      const canvas = await exportToCanvas({
        elements,
        appState: { ...excalidrawAPI.getAppState(), exportWithDarkMode: true },
        files: excalidrawAPI.getFiles()
      });

      const response = await apiFetch('/api/chat/general', {
        method: "POST",
        body: JSON.stringify({
          image_base64: canvas.toDataURL('image/png'),
          prompt: fullPrompt.replace('@whiteboard', '').trim()
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Visual analysis failed');
      setPrompt('');
      showSuccessToast('Whiteboard context processed!');
    });
  };

  // --- handleCalculate: Legacy Run AI Button ---
  const handleCalculate = async () => {
    setIsCalculateLoading(true);
    try {
      await executeAsync(async () => {
        if (!excalidrawAPI) {
          showErrorToast('Drawing board not initialized');
          return;
        }
        const elements = excalidrawAPI.getSceneElements();
        if (!elements || !elements.length) {
          showErrorToast('No elements to calculate');
          return;
        }
        const canvas = await exportToCanvas({
          elements,
          appState: {
            ...excalidrawAPI.getAppState(),
            exportWithDarkMode: true,
          },
          files: excalidrawAPI.getFiles(),
          getDimensions: () => { return { width: window.innerWidth, height: innerHeight } }
        });

        const response = await apiFetch('/api/chat/general', {
          method: "POST",
          body: JSON.stringify({
            image_base64: canvas.toDataURL('image/png'),
            dict_of_vars: dictOfVars,
            prompt: "Calculate the expressions in this image and return results with steps"
          }),
        });
        const resp = await response.json();
        if (!response.ok) {
          if (response.status === 503) {
            throw new Error('Gemini API is currently overloaded. Please try again in a few moments.');
          }
          throw new Error(resp.detail || resp.message || 'Failed to calculate');
        }

        if (resp.result) {
          let resultData;
          try {
            resultData = JSON.parse(resp.result);
          } catch (e) {
            resultData = [{ expr: 'Image Input', result: resp.result, assign: false }];
          }

          if (resultData && resultData.length > 0) {
            const { result, expr, steps } = resultData[0];
            const curElements = excalidrawAPI.getSceneElements();
            const lastEl = curElements[curElements.length - 1];
            const xPos = lastEl.x;
            const xWidth = lastEl.width;
            const yPos = lastEl.y;
            const yHeight = lastEl.height;

            const elementsTobeUpdated = [
              {
                type: "text",
                x: xPos + xWidth + 50,
                y: yPos,
                width: 500,
                height: 50,
                text: `Expression : ${expr || 'Analysis'}`,
                fontSize: 20,
                strokeColor: "#008000"
              },
              {
                type: "text",
                x: xPos + xWidth + 50,
                y: yPos + 40,
                width: 500,
                height: 50,
                text: `Answer : ${result}`,
                fontSize: 20,
                strokeColor: "#008000"
              }
            ];
            if (steps) {
              elementsTobeUpdated.push({
                type: "text",
                x: xPos + xWidth + 50,
                y: yPos + 80,
                width: 500,
                height: 200,
                text: `Steps : \n${steps}`,
                fontSize: 20,
                strokeColor: "#008000"
              });
            }
            const elements = convertToExcalidrawElements(elementsTobeUpdated);
            updateElements(elements);
            showSuccessToast('Analysis completed successfully!');
          }
        }
        setPrompt('');
      });
    } finally {
      setIsCalculateLoading(false);
    }
  };

  // --- updateScene: Parses Mermaid and updates Excalidraw scene ---
  const updateScene = async (diagramDefinition) => {
    try {
      if (!diagramDefinition || typeof diagramDefinition !== 'string') {
        throw new Error('Invalid diagram definition');
      }
      const cleanedDefinition = diagramDefinition.trim();
      const { elements, files } = await parseMermaidToExcalidraw(cleanedDefinition);

      if (!elements || elements.length === 0) {
        throw new Error('No valid elements could be generated from the diagram');
      }

      const updatedElements = convertToExcalidrawElements(elements);
      updateElements(updatedElements);

      if (files && Object.keys(files).length > 0) {
        excalidrawAPI.addFiles(Object.values(files));
      }
    } catch (error) {
      console.error("Error updating scene:", error);
      showErrorToast('Failed to update diagram: ' + error.message);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1a1a1a]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <AuthPage />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#1a1a1a]">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1c',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
        }}
      />

      <WorkspaceSelector onDashboardOpen={() => setIsDashboardOpen(true)} />

      {isDashboardOpen && <Dashboard onClose={() => setIsDashboardOpen(false)} />}

      {/* Main Excalidraw Section */}
      <ExcalidrawBoard
        setExcalidrawAPI={setExcalidrawAPI}
        handleCalculate={handleCalculate}
        isEditorOpen={isEditorOpen}
        isCalculateLoading={isCalculateLoading}
        width={excalidrawWidth}
      />
      {/* Floating Chat Interface */}
      <ChatBox
        prompt={prompt}
        setPrompt={setPrompt}
        isLoading={isLoading || asyncLoading}
        handleSubmit={handleSubmit}
        isChatVisible={isChatVisible}
        activeWorkspace={activeWorkspace}
        position={chatBoxPosition}
        setPosition={setChatBoxPosition}
        isMinimized={isChatMinimized}
        onMinimize={() => setIsChatMinimized(true)}
        onRestore={() => setIsChatMinimized(false)}
      />
      <ResizableSidebar
        isOpen={isEditorOpen}
        onOpen={() => setIsEditorOpen(true)}
        onClose={() => setIsEditorOpen(false)}
        width={editorWidth}
        setWidth={setEditorWidth}
      >
        <EditorComponent />
      </ResizableSidebar>
    </div>
  );
};

export default App;
