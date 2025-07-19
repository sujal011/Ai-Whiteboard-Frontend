import { useEffect, useState } from 'react';

/**
 * Custom hook to track selected text in the document.
 * @returns {string} selectedText
 */
export function useSelection() {
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      setSelectedText(text);
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, []);

  return selectedText;
} 