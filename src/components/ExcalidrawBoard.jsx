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
 * @param {number} props.width
 */
const ExcalidrawBoard = ({ setExcalidrawAPI, handleCalculate, isEditorOpen, isCalculateLoading, width }) => (
  <div
    style={{
      width: width,
      height: '100vh',
      transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      position: 'relative',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
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