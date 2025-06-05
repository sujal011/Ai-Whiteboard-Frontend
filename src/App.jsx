import { useState } from 'react';
import { Excalidraw, convertToExcalidrawElements, exportToCanvas } from "@excalidraw/excalidraw";
import { Send, Loader2, PanelRightClose, PanelRight } from "lucide-react";
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';
import EditorComponent from './Componets/EditorComp';
import toast, { Toaster } from 'react-hot-toast';
// import { parseLatexToText } from './utils';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [elements, setElements] = useState([]);
  const [dictOfVars, setDictOfVars] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const backendURL = import.meta.env.VITE_API_URL;

  const getSelectedElements=()=>{
    const elements = excalidrawAPI.getSceneElements();
    const selectedElements = elements.filter((el) => el.isSelected);
    console.log(selectedElements);
    
  }



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${backendURL}/generate-mermaid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 503) {
          throw new Error('Gemini API is currently overloaded. Please try again in a few moments.');
        }
        if (response.status === 401) {
          throw new Error('Gemini API key has expired. Please contact the administrator.');
        }
        throw new Error(data.detail || data.message || 'Failed to generate diagram');
      }

      // Parse Mermaid syntax and update Excalidraw
      if (data.mermaid_syntax) {
        await updateScene(data.mermaid_syntax);
        toast.success('Diagram generated successfully!');
      }
    } catch (error) {
      console.error("Error fetching data from backend:", error);
      toast.error(error.message || 'Failed to generate diagram');
    } finally {
      setIsLoading(false);
      setPrompt(''); // Clear the prompt input
    }
  };
  const handleCalculate = async () => {
    setIsLoading(true);

    if (!excalidrawAPI) {
      toast.error('Drawing board not initialized');
      setIsLoading(false);
      return;
    }

    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) {
      toast.error('No elements to calculate');
      setIsLoading(false);
      return;
    }

    try {
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
        // Handle specific error cases
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
          toast.success('Calculation completed successfully!');
        } else {
          toast('No mathematical expressions found in the image', {
            icon: 'ℹ️',
            style: {
              background: '#2d3748',
              color: '#fff',
              border: '1px solid #4299e1',
            },
          });
        }
      }
    } catch (error) {
      console.error("Error processing calculation:", error);
      toast.error(error.message || 'Failed to process calculation');
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  const updateElements=(elements)=>{
    const previousElements = excalidrawAPI.getSceneElements();
    const sceneData = {
      elements:previousElements.concat(elements),
    };
    excalidrawAPI.updateScene(sceneData);
    excalidrawAPI.scrollToContent(elements,
      {
        fitToViewport:true,
        animate:true,
      }
    )
  }

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
      toast.error(errorMessage);
    }
  };
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  

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
      {/* Main Excalidraw Section - Dynamic width based on editor state */}
      <div className={`${isEditorOpen ? 'w-[70%]' : 'w-[95%]'} h-full relative transition-all duration-300 ease-in-out`}>
        <div className="w-full h-full overflow-hidden">
          <Excalidraw
          
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            theme="dark"
            gridModeEnabled
            renderTopRightUI={() => (
                <button
                  className="bg-[#70b1ec] border-none text-white w-max font-bold mr-2 px-3 py-1 rounded"
                  onClick={handleCalculate}
                >
                  Run AI
                </button>
            )}
          />
        </div>

     {/* Floating Chat Interface */}
       <div 
        className={`absolute transition-transform duration-300 ease-in-out ${
          isChatVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          bottom: '20px',
          left: '50%',
          transform: `translateX(-50%) ${isChatVisible ? 'translateY(0)' : 'translateY(100%)'}`,
          width: '90%',
          maxWidth: '800px',
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.5)',
          border: '1px solid #2d2d2d',
          padding: '16px',
          zIndex: 1000,
        }}
      >
        <div className="h-full flex flex-col">
          {/* Title */}
          <div className="mb-2 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-200">AI Drawing Assistant</h3>
              <p className="text-sm text-gray-400">Describe what you want to draw, and I'll help create it</p>
            </div>
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2">
            <div className="relative flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Try 'Draw a flowchart showing user authentication process'"
                className="w-full px-4 py-2 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500 border border-gray-700 bg-[#2d2d2d]"
                style={{
                  height: '70px',
                  maxHeight: '70px'
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPrompt("Draw a flowchart for user registration")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                User Registration Flowchart
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create a mind map for project planning")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Project Planning Mind Map
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Design a system architecture diagram using class diagram")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                System Architecture
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create a pie chart showing market share distribution")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Market Share Pie Chart
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create a git graph showing feature branch workflow")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Git Branch Workflow
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create an XY chart showing sales growth over time")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Sales Growth Chart
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create a sequence diagram for API authentication flow")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                API Auth Sequence
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create an ER diagram for a blog database")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Blog Database ER
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create a gantt chart for project timeline")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Project Timeline
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create a state diagram for a vending machine")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Vending Machine States
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Create a journey diagram for user onboarding")}
                className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
              >
                User Onboarding Journey
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>

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
