import { useState } from 'react';
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
// import { parseLatexToText } from './utils/utils';

// Default chatbox position (centered at bottom)
const defaultChatBoxPosition = { top: window.innerHeight - 220, left: window.innerWidth / 2 - 400 };

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [dictOfVars, setDictOfVars] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [chatBoxPosition, setChatBoxPosition] = useState(defaultChatBoxPosition);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const backendURL = BACKEND_URL;
  const { excalidrawAPI, setExcalidrawAPI, getSelectedElements, updateElements } = useExcalidrawAPI();
  const { execute: executeAsync, loading: asyncLoading } = useAsyncRequest();

  // --- handleSubmit: Handles prompt submission and diagram generation ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      showErrorToast('Please enter a prompt');
      return;
    }
    await executeAsync(async () => {
      const response = await fetch(`${backendURL}/generate-mermaid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Gemini API is currently overloaded. Please try again in a few moments.');
        }
        if (response.status === 401) {
          throw new Error('Gemini API key has expired. Please contact the administrator.');
        }
        throw new Error(data.detail || data.message || 'Failed to generate diagram');
      }
      if (data.mermaid_syntax) {
        await updateScene(data.mermaid_syntax);
        showSuccessToast('Diagram generated successfully!');
      }
      setPrompt('');
    });
  };
  // --- handleCalculate: Handles AI calculation on Excalidraw elements ---
  const handleCalculate = async () => {
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
        getDimensions: () => { return {width: window.innerWidth, height: innerHeight}}
      });
      const ctx = canvas.getContext("2d");
      ctx.font = "30px Virgil";
      const response = await fetch(`${backendURL}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: canvas.toDataURL('image/png'),
          dict_of_vars: dictOfVars
        }),
      });
      const resp = await response.json();
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Gemini API is currently overloaded. Please try again in a few moments.');
        }
        throw new Error(resp.detail || resp.message || 'Failed to calculate');
      }
      if (resp.status === 'success') {
        if (resp.data.length > 0) {
          resp.data.forEach((data) => {
            if (data.assign === true) {
              setDictOfVars({
                ...dictOfVars,
                [data.expr]: data.result
              });
            }
          });
          const {result, expr} = resp.data[0];
          const steps = resp.data[0].steps;
          const curElements = excalidrawAPI.getSceneElements();
          const xPos = curElements[curElements.length-1].x;
          const xWidth = curElements[curElements.length-1].width;
          const yPos = curElements[curElements.length-1].y;
          const yHeight = curElements[curElements.length-1].height;
          const elementsTobeUpdated = [
            {
              type: "text",
              x: xPos+xWidth,
              y: yPos+yHeight,
              width: 1000,
              height: 300,
              text: `Expression : ${expr}`,
              fontSize: 20,
              strokeColor:"#008000"
            },
            {
              type: "text",
              x: xPos+xWidth,
              y: yPos+40+yHeight,
              width: 500,
              height: 300,
              text: `Answer : ${result}`,
              fontSize: 20,
              strokeColor:"#008000"
            }
          ];
          if(steps) {
            elementsTobeUpdated.push({
              type: "text",
              x: xPos+xWidth,
              y: yPos+80+yHeight,
              width: 500,
              height: 300,
              text: `steps : \n${steps}`,
              fontSize: 20,
              strokeColor:"#008000"
            });
          }
          const elements = convertToExcalidrawElements(elementsTobeUpdated);
          updateElements(elements);
          showSuccessToast('Calculation completed successfully!');
        } else {
          showInfoToast('No mathematical expressions found in the image');
        }
      }
      setPrompt('');
    });
  };

  // --- updateScene: Parses Mermaid and updates Excalidraw scene ---
  const updateScene = async (diagramDefinition) => {
    try {
      // Basic validation before attempting to parse
      if (!diagramDefinition || typeof diagramDefinition !== 'string') {
        throw new Error('Invalid diagram definition');
      }

      // Clean up the diagram definition
      const cleanedDefinition = diagramDefinition.trim();
      
      // Validate that it starts with a valid diagram type
      // const validDiagramTypes = [
      //   'flowchart', 'sequenceDiagram', 'classDiagram',
      //   'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey',
      //   'mindmap', 'xychart-beta', 'gitGraph'
      // ];
      
      // const startsWithValidType = validDiagramTypes.some(type => 
      //   cleanedDefinition.toLowerCase().startsWith(type)
      // );
      
      // if (!startsWithValidType) {
      //   throw new Error('Invalid diagram type. Please try again with a different prompt.');
      // }

      const { elements, files } = await parseMermaidToExcalidraw(cleanedDefinition);
      
      if (!elements || elements.length === 0) {
        throw new Error('No valid elements could be generated from the diagram');
      }
      
      const updatedElements = convertToExcalidrawElements(elements);
      updateElements(updatedElements);
      
      // Only add files if they exist and are not empty
      if (files && Object.keys(files).length > 0) {
        excalidrawAPI.addFiles(Object.values(files));
      }
    } catch (error) {
      console.error("Error updating scene:", error);
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to update diagram';
      if (error.message.includes('Parse error')) {
        errorMessage = 'The generated diagram syntax is invalid. Please try again with a different prompt.';
      } else if (error.message.includes('Invalid diagram type')) {
        errorMessage = error.message;
      } else if (error.message.includes('No valid elements')) {
        errorMessage = 'Could not generate a valid diagram. Please try again with a different prompt.';
      }
      showErrorToast(errorMessage);
    }
  };
  

  return (
    <div className="flex h-screen w-screen bg-[#1a1a1a]">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#2d3748',
              color: '#fff',
              border: '1px solid #48bb78',
            },
          },
          error: {
            style: {
              background: '#2d3748',
              color: '#fff',
              border: '1px solid #f56565',
            },
          },
        }}
      />
      {/* Main Excalidraw Section */}
      <ExcalidrawBoard
        setExcalidrawAPI={setExcalidrawAPI}
        handleCalculate={handleCalculate}
        isEditorOpen={isEditorOpen}
      />
      {/* Floating Chat Interface */}
      <ChatBox
        prompt={prompt}
        setPrompt={setPrompt}
        isLoading={isLoading || asyncLoading}
        handleSubmit={handleSubmit}
        isChatVisible={isChatVisible}
        position={chatBoxPosition}
        setPosition={setChatBoxPosition}
        isMinimized={isChatMinimized}
        onMinimize={() => setIsChatMinimized(true)}
        onRestore={() => setIsChatMinimized(false)}
      />
      {/* Toggle Button */}
      <button
        onClick={() => setIsEditorOpen(!isEditorOpen)}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-50 bg-[#1e1e1e] text-gray-200 p-2 rounded-l-md border-l border-t border-b border-gray-700 hover:bg-[#2d2d2d] transition-colors"
      >
        {isEditorOpen ? (
          <PanelRightClose className="w-5 h-5" />
        ) : (
          <PanelRight className="w-5 h-5" />
        )}
      </button>
      {/* Editor.js Section - Collapsible */}
      <div 
        className={`
          h-full border-l border-gray-700 transition-all duration-300 ease-in-out
          ${isEditorOpen ? 'w-[30%] opacity-100' : 'w-[0%] opacity-0'}
        `}
      >
        {isEditorOpen && <EditorComponent />}
      </div>
    </div>
  );
};

export default App;
