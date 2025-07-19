import { useState, useCallback } from 'react';

/**
 * Custom hook to manage Excalidraw API and helpers.
 * @returns {Object} { excalidrawAPI, setExcalidrawAPI, getSelectedElements, updateElements }
 */
export function useExcalidrawAPI() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  const getSelectedElements = useCallback(() => {
    if (!excalidrawAPI) return [];
    const elements = excalidrawAPI.getSceneElements();
    return elements.filter((el) => el.isSelected);
  }, [excalidrawAPI]);

  const updateElements = useCallback((elements) => {
    if (!excalidrawAPI) return;
    const previousElements = excalidrawAPI.getSceneElements();
    const sceneData = {
      elements: previousElements.concat(elements),
    };
    excalidrawAPI.updateScene(sceneData);
    excalidrawAPI.scrollToContent(elements, {
      fitToViewport: true,
      animate: true,
    });
  }, [excalidrawAPI]);

  return { excalidrawAPI, setExcalidrawAPI, getSelectedElements, updateElements };
} 