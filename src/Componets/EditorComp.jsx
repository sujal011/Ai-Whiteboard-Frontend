"use client"

import React, { useEffect, useRef, useState } from 'react'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Checklist from '@editorjs/checklist'
import CodeTool from '@editorjs/code'
import InlineCode from '@editorjs/inline-code'
import { Sparkles, Save, FileDown } from 'lucide-react'
import { parseMarkdownToEditorJS } from '../utils'

const EditorComponent = () => {
  const editorRef = useRef(null)
  const ejInstance = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const backendURL = process.env.NEXT_PUBLIC_API_URL

  const saveContent = async () => {
    if (ejInstance.current) {
      setIsSaving(true)
      try {
        const content = await ejInstance.current.save()
        localStorage.setItem('editor-content', JSON.stringify(content))
        setTimeout(() => setIsSaving(false), 800)
      } catch (error) {
        console.error('Failed to save content:', error)
        setIsSaving(false)
      }
    }
  }

  const loadSavedContent = () => {
    const saved = localStorage.getItem('editor-content')
    return saved ? JSON.parse(saved) : {}
  }

  const exportAsMarkdown = async () => {
    if (ejInstance.current) {
      const content = await ejInstance.current.save()
      let markdown = ''
      content.blocks.forEach(block => {
        switch (block.type) {
          case 'header':
            markdown += '#'.repeat(block.data.level) + ' ' + block.data.text + '\n\n'
            break
          case 'paragraph':
            markdown += block.data.text + '\n\n'
            break
          case 'list':
            block.data.items.forEach(item => {
              markdown += '* ' + item + '\n'
            })
            markdown += '\n'
            break
          case 'code':
            markdown += '```\n' + block.data.code + '\n```\n\n'
            break
          default:
            markdown += block.data.text + '\n\n'
        }
      })

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'notes.md'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    if (text) {
      setSelectedText(text)
    }
  }

  const enhanceWithAI = async () => {
    if (!selectedText) {
      console.log('No text selected')
      return
    }
  
    setIsProcessing(true)
    
    try {
      const response = await fetch(`${backendURL}/ask-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: selectedText
        }),
      })
      
      if (response.ok) {
        const { result } = await response.json()
        
        // Convert markdown to EditorJS blocks
        const blocks = parseMarkdownToEditorJS(result)
        
        // Insert each block
        for (const block of blocks) {
          await ejInstance.current.blocks.insert(
            block.type,
            block.data
          )
        }
        
        setSelectedText('')
      }
    } catch (error) {
      console.error('Failed to enhance text:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (!ejInstance.current) {
      initEditor()
    }
    
    // Add selection event listener
    document.addEventListener('selectionchange', handleTextSelection)
    const autoSaveInterval = setInterval(saveContent, 30000)
    
    return () => {
      if (ejInstance.current) {
        ejInstance.current.destroy()
        ejInstance.current = null
      }
      document.removeEventListener('selectionchange', handleTextSelection)
      clearInterval(autoSaveInterval)
    }
  }, [])

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
        ejInstance.current = editor
      },
      onChange: () => {
        const saveBtn = document.querySelector('.save-button')
        if (saveBtn) saveBtn.classList.add('pending')
      }
    })
  }

  return (
    <div className="h-full w-full bg-white text-gray-800 flex flex-col">
      <div className="flex items-center gap-2 p-2 border-b border-gray-200">
        <button
          onClick={saveContent}
          className={`p-2 rounded hover:bg-gray-100 transition-colors save-button
            ${isSaving ? 'animate-pulse' : ''}`}
          title="Save notes"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={exportAsMarkdown}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Export as Markdown"
        >
          <FileDown className="w-4 h-4" />
        </button>
        <button
          onClick={enhanceWithAI}
          disabled={!selectedText || isProcessing}
          className={`p-2 rounded transition-colors ml-auto
            ${selectedText ? 'hover:bg-gray-100 text-blue-600' : 'text-gray-400 cursor-not-allowed'}
            ${isProcessing ? 'animate-pulse' : ''}`}
          title={selectedText ? 'Enhance selected text with AI' : 'Select text to enhance'}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="editor-container p-4">
          <div ref={editorRef} className="prose max-w-none" />
        </div>
      </div>
      
      <style jsx global>{`
        /* Base Editor Styles */
        .codex-editor {
          color: #333;
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
          color: #111;
        }
        
        h2.ce-header {
          font-size: 1.875em;
          color: #222;
        }
        
        h3.ce-header {
          font-size: 1.5em;
          color: #333;
        }
        
        h4.ce-header {
          font-size: 1.25em;
          color: #444;
        }
        
        /* Paragraphs */
        .ce-paragraph {
          color: #333;
          line-height: 1.6;
          font-size: 1.125em;
        }
        
        /* Lists */
        .cdx-list {
          margin: 1em 0;
          padding-left: 40px;
          color: #333;
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
          background-color: #f4f4f4;
          padding: 1em;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          margin: 1em 0;
        }
        
        .ce-code__textarea {
          color: #333;
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
          background-color: #f4f4f4;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Fira Code', monospace;
          font-size: 0.875em;
          color: #333;
        }
        
        /* Toolbar */
        .ce-toolbar__content {
          max-width: 100%;
          margin: 0;
        }
        
        .ce-toolbar__plus,
        .ce-toolbar__settings-btn {
          color: #333;
          background-color: #f4f4f4;
          border-radius: 4px;
        }
        
        .ce-toolbar__plus:hover,
        .ce-toolbar__settings-btn:hover {
          background-color: #e0e0e0;
        }
        
        /* Block Content */
        .ce-block__content {
          max-width: 100%;
          margin: 0;
          background-color: #fff;
        }
        
        /* Editor Placeholder */
        .codex-editor--empty .ce-block:first-child .ce-paragraph[data-placeholder]:before {
          color: #999;
          font-style: italic;
        }
        
        /* Save Button State */
        .save-button.pending {
          color: #f59e0b;
        }
        
        /* Inline Toolbar */
        .ce-inline-toolbar {
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        }
        
        .ce-inline-toolbar__buttons {
          color: #333;
        }
        
        .ce-inline-tool {
          color: #333;
          padding: 0.5em;
        }
        
        .ce-inline-tool:hover {
          background-color: #f4f4f4;
        }
        
        .ce-inline-tool--active {
          color: #2563eb;
        }
        
        /* Conversion Toolbar */
        .ce-conversion-toolbar {
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        }
        
        .ce-conversion-tool {
          color: #333;
        }
        
        .ce-conversion-tool:hover {
          background-color: #f4f4f4;
        }
        
        .ce-conversion-tool--focused {
          background-color: #f4f4f4;
        }
        
        /* Settings */
        .ce-settings {
          background-color: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        }
        
        .ce-settings__button {
          color: #333;
        }
        
        .ce-settings__button:hover {
          background-color: #f4f4f4;
        }
        
        .ce-settings__button--active {
          color: #2563eb;
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
          border: 2px solid #999;
          border-radius: 3px;
          background-color: transparent;
          cursor: pointer;
        }
        
        .cdx-checklist__item-checkbox:checked {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        
        .cdx-checklist__item-checkbox:checked::after {
          content: '✓';
          display: block;
          text-align: center;
          color: #fff;
          line-height: 1;
          font-size: 14px;
        }
        
        .cdx-checklist__item-text {
          flex-grow: 1;
          outline: none;
          color: #333;
        }
        
        .cdx-checklist__item--checked .cdx-checklist__item-text {
          text-decoration: line-through;
          color: #666;
        }
      `}</style>
    </div>
  )
}

export default EditorComponent

