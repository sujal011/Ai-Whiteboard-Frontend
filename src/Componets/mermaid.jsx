import React, { useEffect, useState } from 'react';
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements, Excalidraw } from "@excalidraw/excalidraw";

// Optionally reset Mermaid diagram registrations
import mermaid from 'mermaid';

const MermaidToExcalidraw = () => {
  const [elements, setElements] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state for async rendering

  const convert = async (diagramDefinition) => {
    try {
      // Reset Mermaid instance before parsing (prevents re-registration issues)
      mermaid.initialize({ startOnLoad: false });

      // Parse Mermaid definition to Excalidraw elements
      const { elements, files } = await parseMermaidToExcalidraw(diagramDefinition, {
        fontSize: 5,
      });

      // Convert parsed elements to full Excalidraw elements
      const excalidrawElements = convertToExcalidrawElements(elements);

      // Set elements in state and indicate loading is complete
      setElements(excalidrawElements);
      setLoading(false); // Done loading, set loading to false
    } catch (e) {
      console.error("Error converting Mermaid to Excalidraw:", e);
      setLoading(false); // Set loading to false even on error to stop the loading state
    }
  };

  useEffect(() => {
    // Example Mermaid diagram to convert
    const mermaidDiagram = `
      graph TD
        A[Start] --> B[User Enters Information]
        B --> C[Submit Registration Form]
        C -->|Validate Information| D[Validation Successful]
        D --> E[Create User Account]
        E --> F[Account Created Successfully]
        C -->|Validation Error| G[Validation Failed]
        G --> H[Error: Invalid Information]
    `;
    
    convert(mermaidDiagram);
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Display loading indicator while waiting for elements
  }

  return (
    <>
      <Excalidraw
        initialData={{
          elements,
          appState: {
            zenModeEnabled: true,
            theme: "dark",
            gridColor: "#2d2d2d",
          },
          scrollToContent: true,
        }}
        theme="dark"
      />
    </>
  );
};

export default MermaidToExcalidraw;
