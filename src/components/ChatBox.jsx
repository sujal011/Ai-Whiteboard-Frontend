import React, { useRef } from 'react';
import { Send, Loader2, Minus, Maximize2 } from 'lucide-react';
import QuickPrompts from './QuickPrompts';

/**
 * Floating chat interface for AI Drawing Assistant.
 * @param {Object} props
 * @param {string} props.prompt
 * @param {Function} props.setPrompt
 * @param {boolean} props.isLoading
 * @param {Function} props.handleSubmit
 * @param {boolean} [props.isChatVisible]
 * @param {Object} props.position - {top, left}
 * @param {Function} props.setPosition
 * @param {boolean} props.isMinimized
 * @param {Function} props.onMinimize
 * @param {Function} props.onRestore
 */
const CHATBOX_WIDTH = 600;
const CHATBOX_MIN_HEIGHT = 60;

const ChatBox = ({ prompt, setPrompt, isLoading, handleSubmit, isChatVisible, position, setPosition, isMinimized, onMinimize, onRestore }) => {
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Mouse event handlers for dragging
  const onMouseDown = (e) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    setPosition({
      top: Math.max(0, Math.min(window.innerHeight - CHATBOX_MIN_HEIGHT, e.clientY - dragOffset.current.y)),
      left: Math.max(0, Math.min(window.innerWidth - CHATBOX_WIDTH, e.clientX - dragOffset.current.x)),
    });
  };
  const onMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // Minimized view: show only the header docked at the bottom
  if (isMinimized) {
    return (
      <div
        className="fixed"
        style={{
          left: position.left,
          bottom: 0,
          width: CHATBOX_WIDTH,
          minWidth: 320,
          maxWidth: '95vw',
          backgroundColor: '#232323',
          borderRadius: '12px 12px 0 0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          border: '1px solid #2d2d2d',
          zIndex: 1100,
          cursor: 'default',
          height: CHATBOX_MIN_HEIGHT,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="flex items-center justify-between w-full px-4 py-2 cursor-move select-none"
          onMouseDown={onMouseDown}
          style={{ userSelect: 'none' }}
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-200">AI Drawing Assistant</h3>
          </div>
          <button
            onClick={onRestore}
            className="ml-2 p-1 rounded hover:bg-gray-700"
            title="Maximize"
          >
            <Maximize2 className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    );
  }

  // Full chat view
  return (
    <div
      className={`absolute transition-transform duration-300 ease-in-out ${isChatVisible ? 'translate-y-0' : 'translate-y-full'}`}
      style={{
        top: position.top,
        left: position.left,
        width: CHATBOX_WIDTH,
        minWidth: 320,
        maxWidth: '95vw',
        backgroundColor: '#1e1e1e',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        border: '1px solid #2d2d2d',
        padding: '0 0 16px 0',
        zIndex: 1100,
        cursor: 'default',
      }}
    >
      {/* Drag handle and minimize button */}
      <div
        className="flex items-center justify-between px-4 py-2 cursor-move bg-[#232323] rounded-t-lg select-none"
        onMouseDown={onMouseDown}
        style={{ userSelect: 'none' }}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-200">AI Drawing Assistant</h3>
        </div>
        <button
          onClick={onMinimize}
          className="ml-2 p-1 rounded hover:bg-gray-700"
          title="Minimize"
        >
          <Minus className="w-5 h-5 text-gray-300" />
        </button>
      </div>
      <div className="px-4 pt-2">
        <p className="text-sm text-gray-400 mb-2">Describe what you want to draw, and I'll help create it</p>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2">
          <div className="relative flex-1">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Try 'Draw a flowchart showing user authentication process'"
              className="w-full px-4 py-2 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500 border border-gray-700 bg-[#2d2d2d]"
              style={{ height: '70px', maxHeight: '70px' }}
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
          <QuickPrompts setPrompt={setPrompt} />
        </form>
      </div>
    </div>
  );
};

export default ChatBox; 