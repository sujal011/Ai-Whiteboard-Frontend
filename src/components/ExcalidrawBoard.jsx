import React from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Loader2 } from 'lucide-react';

/**
 * Main Excalidraw drawing area with Run AI button.
 * @param {Object} props
 * @param {function} props.setExcalidrawAPI
 * @param {function} props.handleCalculate
 * @param {boolean} props.isEditorOpen
 * @param {boolean} props.isCalculateLoading
 */
const ExcalidrawBoard = ({ setExcalidrawAPI, handleCalculate, isEditorOpen, isCalculateLoading }) => (
  <div className={`${isEditorOpen ? 'w-[70%]' : 'w-[95%]'} h-full relative transition-all duration-300 ease-in-out`}>
    <div className="w-full h-full overflow-hidden">
      <Excalidraw
        excalidrawAPI={setExcalidrawAPI}
        theme="dark"
        gridModeEnabled
        renderTopRightUI={() => (
          <button
            className="bg-[#70b1ec] border-none text-white w-max font-bold mr-2 px-3 py-1 rounded flex items-center justify-center"
            onClick={handleCalculate}
            disabled={isCalculateLoading}
          >
            {isCalculateLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Run AI
          </button>
        )}
      />
    </div>
  </div>
);

export default ExcalidrawBoard; 