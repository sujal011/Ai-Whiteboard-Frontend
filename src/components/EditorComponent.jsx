import React, { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSelection } from '../hooks/useSelection';
import { useAsyncRequest } from '../hooks/useAsyncRequest';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Checklist from '@editorjs/checklist';
import CodeTool from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import { Sparkles, Save, FileDown, FileUp } from 'lucide-react';
import { parseMarkdownToEditorJS } from '../utils/utils';
import toast from 'react-hot-toast';

/**
 * EditorComponent provides a rich text editor with AI enhancement and markdown export.
 */
const EditorComponent = () => {
  const editorRef = useRef(null);
  const ejInstance = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const selectedText = useSelection();
  const backendURL = import.meta.env.VITE_API_URL;

  const [editorContent, setEditorContent] = useLocalStorage('editor-content', {});

  /**
   * Saves the current editor content to localStorage.
   */
  const saveContent = async () => {
    if (ejInstance.current) {
      setIsSaving(true);
      try {
        const content = await ejInstance.current.save();
        setEditorContent(content);
        setTimeout(() => setIsSaving(false), 800);
      } catch (error) {
        console.error('Failed to save content:', error);
        setIsSaving(false);
      }
    }
  };

  /**
   * Loads saved content from localStorage.
   */
  const loadSavedContent = () => editorContent;

  /**
   * Exports the current editor content as a markdown file.
   */
  const exportAsMarkdown = async () => {
    if (ejInstance.current) {
      const content = await ejInstance.current.save();
      let markdown = '';
      content.blocks.forEach(block => {
        switch (block.type) {
          case 'header':
            markdown += '#'.repeat(block.data.level) + ' ' + block.data.text + '\n\n';
            break;
          case 'paragraph':
            markdown += block.data.text + '\n\n';
            break;
          case 'list':
            block.data.items.forEach(item => {
              markdown += '* ' + item + '\n';
            });
            markdown += '\n';
            break;
          case 'code':
            markdown += '```\n' + block.data.code + '\n```\n\n';
            break;
          default:
            markdown += block.data.text + '\n\n';
        }
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notes.md';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const { execute: executeAI, loading: isProcessing } = useAsyncRequest();
  const enhanceWithAI = async () => {
    if (!selectedText) {
      console.log('No text selected');
      return;
    }
    await executeAI(async () => {
      const response = await fetch(`${backendURL}/ask-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: selectedText }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.result) {
        throw new Error('Invalid response from AI service');
      }
      const blocks = parseMarkdownToEditorJS(data.result);
      if (!blocks) {
        throw new Error('Failed to process AI response');
      }
      // Insert blocks at the current cursor position or at the end
      const currentBlockIndex = ejInstance.current.blocks.getCurrentBlockIndex();
      for (const block of blocks) {
        await ejInstance.current.blocks.insert(
          block.type,
          block.data,
          {},
          currentBlockIndex >= 0 ? currentBlockIndex + 1 : undefined
        );
      }
      await saveContent();
      toast.success('Answer generated successfully!');
    });
  };

  useEffect(() => {
    if (!ejInstance.current) {
      initEditor();
    }
    const autoSaveInterval = setInterval(saveContent, 30000);
    return () => {
      if (ejInstance.current) {
        ejInstance.current.destroy();
        ejInstance.current = null;
      }
      clearInterval(autoSaveInterval);
    };
  }, []);

  const initEditor = () => {
    const editor = new EditorJS({
      holder: editorRef.current,
      tools: {
        header: {
          class: Header,
          config: {
            levels: [1, 2, 3, 4],
            defaultLevel: 3
          }
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        checklist: {
          class: Checklist,
          inlineToolbar: true,
        },
        code: {
          class: CodeTool,
          config: {
            placeholder: 'Enter code here...'
          }
        },
        inlineCode: {
          class: InlineCode
        },
      },
      placeholder: 'Let\'s write something...',
      data: loadSavedContent(),
      onReady: () => {
        ejInstance.current = editor;
      },
      onChange: () => {
        const saveBtn = document.querySelector('.save-button');
        if (saveBtn) saveBtn.classList.add('pending');
      }
    });
  };

  return (
    <div className="h-full w-full bg-[#1a1a1a] text-gray-200 flex flex-col">
      <div className="flex items-center gap-2 p-2 border-b border-gray-700">
        <button
          onClick={saveContent}
          className={`p-2 rounded hover:bg-gray-700 transition-colors save-button
            ${isSaving ? 'animate-pulse' : ''}`}
          title="Save notes"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={exportAsMarkdown}
          className="p-2 rounded hover:bg-gray-700 transition-colors"
          title="Export as Markdown"
        >
          <FileDown className="w-4 h-4" />
        </button>
        <button
          onClick={enhanceWithAI}
          disabled={!selectedText || isProcessing}
          className={`p-2 rounded transition-colors ml-auto
            ${selectedText ? 'hover:bg-gray-700 text-blue-400' : 'text-gray-500 cursor-not-allowed'}
            ${isProcessing ? 'animate-pulse' : ''}`}
          title={selectedText ? 'Enhance selected text with AI' : 'Select text to enhance'}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="editor-container p-4">
          <div ref={editorRef} className="prose prose-invert max-w-none" />
        </div>
      </div>
      
      {/* Existing styles remain the same */}
      <style jsx global>{`
        /* Base Editor Styles */
        .codex-editor {
          color: #e5e5e5;
        }
        
        /* Block Spacing */
        .ce-block {
          margin: 1.5em 0;
        }
        
        /* Headings */
        .ce-header {
          padding: 0.5em 0;
          margin: 0;
          line-height: 1.25;
          font-weight: 600;
          outline: none;
        }
        
        h1.ce-header {
          font-size: 2.25em;
          color: #fff;
        }
        
        h2.ce-header {
          font-size: 1.875em;
          color: #f3f4f6;
        }
        
        h3.ce-header {
          font-size: 1.5em;
          color: #e5e7eb;
        }
        
        h4.ce-header {
          font-size: 1.25em;
          color: #d1d5db;
        }
        
        /* Paragraphs */
        .ce-paragraph {
          color: #e5e5e5;
          line-height: 1.6;
          font-size: 1.125em;
        }
        
        /* Lists */
        .cdx-list {
          margin: 1em 0;
          padding-left: 40px;
          color: #e5e5e5;
        }
        
        .cdx-list__item {
          padding: 0.25em 0;
          line-height: 1.6;
        }
        
        .cdx-list--unordered {
          list-style: disc;
        }
        
        .cdx-list--ordered {
          list-style: decimal;
        }
        
        /* Code Block */
        .ce-code {
          background-color: #2d2d2d;
          padding: 1em;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          margin: 1em 0;
        }
        
        .ce-code__textarea {
          color: #e5e5e5;
          background-color: transparent;
          border: none;
          resize: none;
          outline: none;
          min-height: 100px;
          font-size: 0.875em;
          line-height: 1.5;
          width: 100%;
        }
        
        /* Inline Code */
        .cdx-inline-code {
          background-color: #2d2d2d;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Fira Code', monospace;
          font-size: 0.875em;
          color: #e5e5e5;
        }
        
        /* Toolbar */
        .ce-toolbar__content {
          max-width: 100%;
          margin: 0;
        }
        
        .ce-toolbar__plus,
        .ce-toolbar__settings-btn {
          color: #e5e5e5;
          background-color: #2d2d2d;
          border-radius: 4px;
        }
        
        .ce-toolbar__plus:hover,
        .ce-toolbar__settings-btn:hover {
          background-color: #404040;
        }
        
        /* Block Content */
        .ce-block__content {
          max-width: 100%;
          margin: 0;
          background-color: #1a1a1a;
        }
        
        /* Editor Placeholder */
        .codex-editor--empty .ce-block:first-child .ce-paragraph[data-placeholder]:before {
          color: #666;
          font-style: italic;
        }
        
        /* Save Button State */
        .save-button.pending {
          color: #fbbf24;
        }
        
        /* Inline Toolbar */
        .ce-inline-toolbar {
          background-color: #2d2d2d;
          border: 1px solid #404040;
          border-radius: 4px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.3);
        }
        
        .ce-inline-toolbar__buttons {
          color: #e5e5e5;
        }
        
        .ce-inline-tool {
          color: #e5e5e5;
          padding: 0.5em;
        }
        
        .ce-inline-tool:hover {
          background-color: #404040;
        }
        
        .ce-inline-tool--active {
          color: #60a5fa;
        }
        
        /* Conversion Toolbar */
        .ce-conversion-toolbar {
          background-color: #2d2d2d;
          border: 1px solid #404040;
          border-radius: 4px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.3);
        }
        
        .ce-conversion-tool {
          color: #e5e5e5;
        }
        
        .ce-conversion-tool:hover {
          background-color: #404040;
        }
        
        .ce-conversion-tool--focused {
          background-color: #404040;
        }
        
        /* Settings */
        .ce-settings {
          background-color: #2d2d2d;
          border: 1px solid #404040;
          border-radius: 4px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.3);
        }
        
        .ce-settings__button {
          color: #e5e5e5;
        }
        
        .ce-settings__button:hover {
          background-color: #404040;
        }
        
        .ce-settings__button--active {
          color: #60a5fa;
        }

         /* Checklist Styles */
  .cdx-checklist {
    margin: 1em 0;
  }
  
  .cdx-checklist__item {
    display: flex;
    align-items: flex-start;
    margin: 0.5em 0;
  }
  
  .cdx-checklist__item-checkbox {
    width: 20px;
    height: 20px;
    margin-right: 0.5em;
    margin-top: 0.2em;
    appearance: none;
    border: 2px solid #666;
    border-radius: 3px;
    background-color: transparent;
    cursor: pointer;
  }
  
  .cdx-checklist__item-checkbox:checked {
    background-color: #60a5fa;
    border-color: #60a5fa;
  }
  
  .cdx-checklist__item-checkbox:checked::after {
    content: '✓';
    display: block;
    text-align: center;
    color: #1a1a1a;
    line-height: 1;
    font-size: 14px;
  }
  
  .cdx-checklist__item-text {
    flex-grow: 1;
    outline: none;
    color: #e5e5e5;
  }
  
  .cdx-checklist__item--checked .cdx-checklist__item-text {
    text-decoration: line-through;
    color: #888;
  }
      `}</style>
    </div>
  );
};

export default EditorComponent;