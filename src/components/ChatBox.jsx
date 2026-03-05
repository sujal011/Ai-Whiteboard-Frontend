import React, { useRef, useState, useEffect } from 'react';
import { Send, Loader2, Minus, Maximize2, Hash, FileText, Image as ImageIcon, Sparkles, Command } from 'lucide-react';
import QuickPrompts from './QuickPrompts';

/**
 * Enhanced Floating chat interface with Slash (/) and At (@) command support.
 */
const CHATBOX_WIDTH = 600;
const CHATBOX_MIN_HEIGHT = 64;

const ChatBox = ({
  prompt,
  setPrompt,
  isLoading,
  handleSubmit,
  isChatVisible,
  position,
  setPosition,
  isMinimized,
  onMinimize,
  onRestore,
  activeWorkspace
}) => {
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState(null); // '/' or '@'
  const [selectedIndex, setSelectedIndex] = useState(0);

  const COMMANDS = [
    { key: '/generate', desc: 'Create diagrams from text', icon: Sparkles },
    { key: '/ask', desc: 'Ask about uploaded documents', icon: FileText },
    { key: '/general', desc: 'General AI assistance', icon: Command }
  ];

  const CONTEXTS = [
    { key: '@whiteboard', desc: 'Current canvas as context', icon: ImageIcon },
    ...(activeWorkspace?.documents || []).map(doc => ({
      key: `@${doc.filename}`,
      desc: `File: ${doc.filename}`,
      icon: FileText,
      id: doc.id
    }))
  ];

  const currentSuggestions = suggestionType === '/' ? COMMANDS : CONTEXTS;

  const onMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('textarea')) return;
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

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % currentSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + currentSuggestions.length) % currentSuggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(currentSuggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const applySuggestion = (suggestion) => {
    const lastChar = prompt.lastIndexOf(suggestionType);
    const newPrompt = prompt.substring(0, lastChar) + suggestion.key + ' ';
    setPrompt(newPrompt);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const lastPart = prompt.split(' ').pop();
    if (lastPart.startsWith('/')) {
      setSuggestionType('/');
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else if (lastPart.startsWith('@')) {
      setSuggestionType('@');
      setShowSuggestions(true);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [prompt]);

  if (isMinimized) {
    return (
      <div
        className="fixed glass-effect animate-fade-in active-glow"
        style={{
          left: position.left,
          bottom: 0,
          width: CHATBOX_WIDTH,
          borderRadius: '16px 16px 0 0',
          zIndex: 2500,
        }}
      >
        <div
          className="flex items-center justify-between w-full px-5 py-3 cursor-move select-none"
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">AI Assistant</h3>
          </div>
          <button onClick={onRestore} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Maximize2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${isChatVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{
        top: position.top,
        left: position.left,
        width: CHATBOX_WIDTH,
        zIndex: 2500,
      }}
    >
      <div className="glass-effect rounded-2xl shadow-2xl border border-white/10 overflow-hidden active-glow origin-bottom">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 cursor-move bg-white/[0.02] border-b border-white/5 select-none"
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Assistant</h3>
            {activeWorkspace && (
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-500 border border-white/5">
                {activeWorkspace.name}
              </span>
            )}
          </div>
          <button onClick={onMinimize} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Minus className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="relative group">
            {/* Suggestion Popover */}
            {showSuggestions && currentSuggestions.length > 0 && (
              <div className="absolute bottom-full mb-3 w-72 bg-[#1a1a1c] border border-gray-800 rounded-xl shadow-2xl overflow-hidden py-2 z-50 animate-fade-in translate-y-[-10px]">
                {currentSuggestions.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${i === selectedIndex ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-400'}`}
                  >
                    <s.icon className={`w-4 h-4 ${i === selectedIndex ? 'text-white' : 'text-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{s.key}</div>
                      <div className={`text-[10px] truncate ${i === selectedIndex ? 'text-blue-100' : 'text-gray-600'}`}>{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type / for commands or @ for context..."
                className="w-full px-5 py-4 bg-[#0f0f10] border border-gray-800 rounded-2xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none placeholder-gray-600 transition-all font-medium leading-relaxed"
                style={{ height: '100px' }}
                disabled={isLoading}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                {prompt.includes('/') && <Hash className="w-4 h-4 text-blue-500" />}
                {prompt.includes('@') && <ImageIcon className="w-4 h-4 text-purple-500" />}
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </form>

          <QuickPrompts setPrompt={setPrompt} />
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
