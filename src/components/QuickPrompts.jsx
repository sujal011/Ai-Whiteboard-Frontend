import React from 'react';

/**
 * Renders a row of quick-prompt buttons for the chat interface.
 * @param {Object} props
 * @param {Function} props.setPrompt - Function to set the chat prompt.
 */
const QuickPrompts = ({ setPrompt }) => (
  <div className="flex gap-2 flex-wrap">
    <button type="button" onClick={() => setPrompt("Draw a flowchart for user registration")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      User Registration Flowchart
    </button>
    <button type="button" onClick={() => setPrompt("Create a mind map for project planning")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      Project Planning Mind Map
    </button>
    <button type="button" onClick={() => setPrompt("Design a system architecture diagram using class diagram")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      System Architecture
    </button>
    <button type="button" onClick={() => setPrompt("Create a pie chart showing market share distribution")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      Market Share Pie Chart
    </button>
    <button type="button" onClick={() => setPrompt("Create a git graph showing feature branch workflow")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      Git Branch Workflow
    </button>
    <button type="button" onClick={() => setPrompt("Create an XY chart showing sales growth over time")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      Sales Growth Chart
    </button>
    <button type="button" onClick={() => setPrompt("Create a sequence diagram for API authentication flow")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      API Auth Sequence
    </button>
    <button type="button" onClick={() => setPrompt("Create an ER diagram for a blog database")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      Blog Database ER
    </button>
    <button type="button" onClick={() => setPrompt("Create a gantt chart for project timeline")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      Project Timeline
    </button>
    <button type="button" onClick={() => setPrompt("Create a state diagram for a vending machine")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      Vending Machine States
    </button>
    <button type="button" onClick={() => setPrompt("Create a journey diagram for user onboarding")}
      className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors border border-gray-700">
      User Onboarding Journey
    </button>
  </div>
);

export default QuickPrompts; 