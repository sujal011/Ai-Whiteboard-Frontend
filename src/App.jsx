import { useState, useEffect } from 'react';
import { Excalidraw, convertToExcalidrawElements, exportToCanvas } from "@excalidraw/excalidraw";
import { Send, Loader2 } from "lucide-react";
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [elements, setElements] = useState([]);
  const [dictOfVars, setDictOfVars] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const backendURL = import.meta.env.VITE_API_URL;



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) return;
    setIsLoading(true);

    try {
      // Send the prompt to the backend
      const response = await fetch(`${backendURL}/generate-mermaid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend Response:', data);

      // Parse Mermaid syntax and update Excalidraw
      if (data.mermaid_syntax) {
        await updateScene(data.mermaid_syntax);
      }
    } catch (error) {
      console.error("Error fetching data from backend:", error);
    } finally {
      setIsLoading(false);
      setPrompt(''); // Clear the prompt input
    }
  };
  const handleCalculate = async () => {

    setIsLoading(true);
    // convert to canvas 

    if (!excalidrawAPI) {
      return
    }
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) {
      return
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

    try {
      // Send the prompt to the backend
      const response = await fetch(`${backendURL}/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image:canvas.toDataURL('image/png'),
          dict_of_vars:dictOfVars
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const resp = await response.json();
      console.log('Backend Response:', resp);

      if (resp) {
        console.log('Responnse: ',resp);
        resp.data.forEach((data) => {
          if (data.assign === true) {
              // dict_of_vars[resp.result] = resp.answer;
              setDictOfVars({
                  ...dictOfVars,
                  [data.expr]: data.result
              });
          }
      });
        const {result,expr}=resp.data[0];
        const curElements = excalidrawAPI.getSceneElements();
        const xPos = curElements[curElements.length-1].x
        const xWidth = curElements[curElements.length-1].width
        const yPos = curElements[curElements.length-1].y
        const yHeight = curElements[curElements.length-1].height
        const elements=convertToExcalidrawElements([
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
        ]);
        updateElements(elements)
      }
    } catch (error) {
      console.error("Error fetching data from backend:", error);
    } finally {
      setIsLoading(false);
      setPrompt(''); // Clear the prompt input
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
    
    const { elements, files } = await parseMermaidToExcalidraw(diagramDefinition);
    
    const updatedElements = convertToExcalidrawElements(elements);
    // console.log(files)
    updateElements(updatedElements);
    if (files) {
      excalidrawAPI.addFiles(Object.values(files));
    }
    
    excalidrawAPI.addFiles(files)
  };
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [canvasUrl, setCanvasUrl] = useState("");
  const displayCanvas = async () => {
  
    // const sample = 
    
  }

  return (
    <>
      {/* Global styles for better scrolling */}
      <style>
        {`
          * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          *::-webkit-scrollbar {
            display: none;
          }
          
          .custom-scroll {
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .custom-scroll::-webkit-scrollbar {
            display: none;
          }
          
          textarea {
            overflow: auto;
          }
        `}
      </style>

      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'relative', 
        backgroundColor: '#1a1a1a',
        overflow: 'hidden'
      }}>
        
        
        
        {/* Excalidraw Canvas */}
        <div style={{ 
          width: '100%', 
          height: 'calc(100% - 180px)',
          overflow: 'hidden'
        }}>
       
        
          <Excalidraw
          excalidrawAPI={(api)=>setExcalidrawAPI(api)}
            // initialData={{
            //   elements: convertToExcalidrawElements([
            //     {
            //        "type":"diamond",
            //        "x":100,
            //        "y":100,
            //        "label":{
            //           "text":"apple",
            //           "wrapText":"wrap",
            //           "fontSize":14,
            //           "fontName":"Arial"
            //        }
            //     },
            //     {
            //        "type":"rectangle",
            //        "x":300,
            //        "y":290,
            //        "width":200,
            //        "height":100,
            //        "label":{
            //           "text":"pieapple",
            //           "wrapText":"wrap",
            //           "fontSize":14,
            //           "fontName":"Arial"
            //        }
            //     }
            //  ]),
            //   appState: { 
            //     theme: "dark",
            //     gridColor: "#2d2d2d"
            //   },
            //   scrollToContent: true,
            // }}
            theme="dark"
            gridModeEnabled
            renderTopRightUI={() => {
              return (
                <>
                <button
                  style={{
                    background: "#70b1ec",
                    border: "none",
                    color: "#fff",
                    width: "max-content",
                    fontWeight: "bold",
                  }}
                  onClick={handleCalculate}
                  >
                  Run Ai
                </button>
                <button
                  style={{
                    background: "#70b1ec",
                    border: "none",
                    color: "#fff",
                    width: "max-content",
                    fontWeight: "bold",
                  }}
                  onClick={()=>{
                    console.log(excalidrawAPI.getSceneElements());
                    
                  }}
                  >
                  get elements
                </button>
                  </>
                 );
                }}
          />
        </div>

        {/* Chat Interface */}
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '180px',
            backgroundColor: '#1e1e1e',
            borderTop: '2px solid #2d2d2d',
            zIndex: 1000,
            padding: '16px',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Title */}
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-200">AI Drawing Assistant</h3>
              <p className="text-sm text-gray-400">Describe what you want to draw, and I'll help create it</p>
            </div>

            {/* Chat Form */}
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2">
              <div className="relative flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Try 'Draw a flowchart showing user authentication process'"
                  style={{
                    backgroundColor: '#2d2d2d',
                    height: '70px',
                    maxHeight: '70px'
                  }}
                  className="w-full px-4 py-2 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500 border border-gray-700"
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
                  onClick={() => setPrompt("Design a system architecture diagram")}
                  className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  System Architecture
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
