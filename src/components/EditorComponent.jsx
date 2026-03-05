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
import { Sparkles, Save, FileDown, FileUp, Loader2 } from 'lucide-react';
import { parseMarkdownToEditorJS } from '../utils/utils';
import toast from 'react-hot-toast';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { apiFetch } from '../utils/api';
import DocumentPanel from './DocumentPanel';

/**
 * EditorComponent provides a rich text editor with AI enhancement and markdown export.
 */
const EditorComponent = () => {
  const { activeWorkspace, saveWorkspaceData } = useWorkspace();
  const editorRef = useRef(null);
  const ejInstance = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const selectedText = useSelection();

  // Use workspace data if available, otherwise fallback to local storage
  const [localContent, setLocalContent] = useLocalStorage('editor-content', {});

  /**
   * Saves the current editor content to backend workspace.
   */
  const handleSave = async () => {
    if (ejInstance.current && activeWorkspace) {
      setIsSaving(true);
      try {
        const content = await ejInstance.current.save();
        await saveWorkspaceData({
          editorjs_data: content
        });
        setTimeout(() => setIsSaving(false), 800);
      } catch (error) {
        console.error('Failed to save content:', error);
        setIsSaving(false);
      }
    }
  };

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
            markdown += (block.data.text || '') + '\n\n';
        }
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-${activeWorkspace?.name || 'export'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const { execute: executeAI, loading: isProcessing } = useAsyncRequest();
  const enhanceWithAI = async () => {
    if (!selectedText) return;
    if (!activeWorkspace) {
      toast.error('Please select or create a workspace first');
      return;
    }

    await executeAI(async () => {
      const response = await apiFetch('/api/chat/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: selectedText,
          workspace_id: activeWorkspace.id
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `AI request failed`);
      }

      if (!data || !data.result) {
        throw new Error('Invalid response from AI service');
      }
      const blocks = parseMarkdownToEditorJS(data.result);

      // Insert blocks at the current cursor position
      const currentBlockIndex = ejInstance.current.blocks.getCurrentBlockIndex();
      for (const block of blocks) {
        await ejInstance.current.blocks.insert(
          block.type,
          block.data,
          {},
          currentBlockIndex >= 0 ? currentBlockIndex + 1 : undefined
        );
      }
      await handleSave();
      toast.success('AI insights added!');
    });
  };

  // Switch content when workspace changes
  useEffect(() => {
    if (ejInstance.current && activeWorkspace) {
      ejInstance.current.isReady.then(() => {
        const data = activeWorkspace.editorjs_data || { blocks: [] };
        ejInstance.current.render(data);
      });
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (!ejInstance.current) {
      initEditor();
    }
    const autoSaveInterval = setInterval(handleSave, 60000); // Auto-save every minute
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
      placeholder: 'Type something or select text for AI insights from documents...',
      data: activeWorkspace?.editorjs_data || localContent,
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
      <div className="flex items-center gap-2 p-3 border-b border-gray-800 bg-[#1e1e1e]">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mr-auto">Editor</h2>
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg hover:bg-gray-700 transition-colors save-button bg-[#2d2d2d]
            ${isSaving ? 'text-blue-400' : 'text-gray-400'}`}
          title="Save to Cloud"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
        <button
          onClick={exportAsMarkdown}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors bg-[#2d2d2d] text-gray-400"
          title="Export as Markdown"
        >
          <FileDown className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-800 mx-1" />
        <button
          onClick={enhanceWithAI}
          disabled={!selectedText || isProcessing}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold
            ${selectedText ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20' : 'bg-[#2d2d2d] text-gray-600 cursor-not-allowed'}
            ${isProcessing ? 'animate-pulse' : ''}`}
          title={selectedText ? 'Ask AI about selected text using source documents' : 'Select text to ask AI'}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI RAG
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="p-6">
          <DocumentPanel />
          <div className="editor-container">
            <div ref={editorRef} className="prose prose-invert max-w-none" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ce-block__content { max-width: 100% !important; }
        .ce-toolbar__content { max-width: 100% !important; }
        .codex-editor { color: #e5e5e5; }
        .ce-paragraph { font-size: 1.05rem; line-height: 1.7; color: #d1d5db; }
        .ce-header { color: #f3f4f6; margin-top: 1.5em; margin-bottom: 0.5em; }
        .ce-toolbar__plus, .ce-toolbar__settings-btn { background-color: #2d2d2d; color: #9ca3af; border-radius: 6px; }
        .ce-toolbar__plus:hover, .ce-toolbar__settings-btn:hover { background-color: #374151; color: #fff; }
        .save-button.pending { color: #fbbf24 !important; }

        /* Custom scroll for editor */
        .editor-container { padding-bottom: 100px; }
        
        /* Checklist Styles */
        .cdx-checklist__item-checkbox { border-color: #4b5563; }
        .cdx-checklist__item-text { color: #d1d5db; }
        .cdx-checklist__item--checked .cdx-checklist__item-text { color: #6b7280; }
        
        /* Code Block */
        .ce-code { background-color: #111827; border: 1px solid #374151; border-radius: 8px; }
        .ce-code__textarea { color: #d1d5db; font-family: 'Fira Code', ui-monospace, monospace; }
      `}</style>
    </div>
  );
};

export default EditorComponent;
