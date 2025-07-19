import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import QuickPrompts from './QuickPrompts';

/**
 * Floating chat interface for AI Drawing Assistant.
 * @param {Object} props
 * @param {string} props.prompt
 * @param {Function} props.setPrompt
 * @param {boolean} props.isLoading
 * @param {Function} props.handleSubmit
 * @param {boolean} [props.isChatVisible]
 */
const ChatBox = ({ prompt, setPrompt, isLoading, handleSubmit, isChatVisible }) => (
  <div
    className={`absolute transition-transform duration-300 ease-in-out ${isChatVisible ? 'translate-y-0' : 'translate-y-full'}`}
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

export default ChatBox; 