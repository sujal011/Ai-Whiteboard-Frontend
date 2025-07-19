/**
 * Converts markdown text to EditorJS block format.
 * @param {string} markdown - The markdown string to convert.
 * @returns {Array} Array of EditorJS block objects.
 */
export const parseMarkdownToEditorJS = (markdown) => {
    if (!markdown) {
      console.error('No markdown content provided');
      return [];
    }

    // Handle the case where the entire content is a code block
    const codeBlockMatch = markdown.match(/^```(\w*)\n([\s\S]*?)```$/);
    if (codeBlockMatch) {
      return [{
        type: 'code',
        data: {
          code: codeBlockMatch[2].trim(),
          language: codeBlockMatch[1] || ''
        }
      }];
    }

    // Split content into lines
    const lines = markdown.split('\n');
    const blocks = [];
    let codeBlock = null;
    let currentList = null;
    let currentChecklist = null;
    let currentOrderedList = null;
    let currentBlockquote = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines unless we're in a special block
      if (!line && !codeBlock && !currentBlockquote) continue;
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (codeBlock) {
          // End of code block
          blocks.push({
            type: 'code',
            data: {
              code: codeBlock.code.join('\n'),
              language: codeBlock.language || ''
            }
          });
          codeBlock = null;
        } else {
          // Start of code block
          const language = line.slice(3).trim();
          codeBlock = {
            language,
            code: []
          };
        }
        continue;
      }
      
      if (codeBlock) {
        codeBlock.code.push(line);
        continue;
      }

      // Handle blockquotes
      if (line.startsWith('>')) {
        if (!currentBlockquote) {
          currentBlockquote = [];
        }
        currentBlockquote.push(line.slice(1).trim());
        continue;
      } else if (currentBlockquote) {
        blocks.push({
          type: 'paragraph',
          data: {
            text: currentBlockquote.join('\n'),
            style: 'blockquote'
          }
        });
        currentBlockquote = null;
      }
      
      // Handle headers
      const headerMatch = line.match(/^(#{1,6})\s(.+)$/);
      if (headerMatch) {
        // Close any open lists before starting a header
        if (currentList || currentChecklist || currentOrderedList) {
          if (currentList) {
            blocks.push({
              type: 'list',
              data: {
                style: 'unordered',
                items: currentList
              }
            });
            currentList = null;
          }
          if (currentChecklist) {
            blocks.push({
              type: 'checklist',
              data: {
                items: currentChecklist
              }
            });
            currentChecklist = null;
          }
          if (currentOrderedList) {
            blocks.push({
              type: 'list',
              data: {
                style: 'ordered',
                items: currentOrderedList
              }
            });
            currentOrderedList = null;
          }
        }

        blocks.push({
          type: 'header',
          data: {
            text: headerMatch[2],
            level: headerMatch[1].length
          }
        });
        continue;
      }
      
      // Handle checklists
      const checklistMatch = line.match(/^[-*]\s\[([ x])\]\s(.+)$/);
      if (checklistMatch) {
        if (!currentChecklist) {
          currentChecklist = [];
        }
        currentChecklist.push({
          text: checklistMatch[2],
          checked: checklistMatch[1] === 'x'
        });
        continue;
      } else if (currentChecklist) {
        blocks.push({
          type: 'checklist',
          data: {
            items: currentChecklist
          }
        });
        currentChecklist = null;
      }
      
      // Handle unordered lists
      const unorderedMatch = line.match(/^[-*]\s(.+)$/);
      if (unorderedMatch) {
        if (!currentList) {
          currentList = [];
        }
        currentList.push(unorderedMatch[1]);
        continue;
      } else if (currentList) {
        blocks.push({
          type: 'list',
          data: {
            style: 'unordered',
            items: currentList
          }
        });
        currentList = null;
      }
      
      // Handle ordered lists
      const orderedMatch = line.match(/^\d+\.\s(.+)$/);
      if (orderedMatch) {
        if (!currentOrderedList) {
          currentOrderedList = [];
        }
        currentOrderedList.push(orderedMatch[1]);
        continue;
      } else if (currentOrderedList) {
        blocks.push({
          type: 'list',
          data: {
            style: 'ordered',
            items: currentOrderedList
          }
        });
        currentOrderedList = null;
      }
      
      // Handle horizontal rules
      if (line.match(/^[-*_]{3,}$/)) {
        blocks.push({
          type: 'paragraph',
          data: {
            text: '---',
            style: 'horizontal-rule'
          }
        });
        continue;
      }
      
      // Handle inline formatting
      let text = line;
      if (text.includes('`') || text.includes('*') || text.includes('**') || text.includes('>')) {
        // Replace markdown formatting with HTML
        text = text
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>');
      }
      
      // Default to paragraph if no other formatting matches
      if (text) {
        blocks.push({
          type: 'paragraph',
          data: {
            text: text
          }
        });
      }
    }
    
    // Handle any remaining open blocks
    if (currentList) {
      blocks.push({
        type: 'list',
        data: {
          style: 'unordered',
          items: currentList
        }
      });
    }
    if (currentChecklist) {
      blocks.push({
        type: 'checklist',
        data: {
          items: currentChecklist
        }
      });
    }
    if (currentOrderedList) {
      blocks.push({
        type: 'list',
        data: {
          style: 'ordered',
          items: currentOrderedList
        }
      });
    }
    if (currentBlockquote) {
      blocks.push({
        type: 'paragraph',
        data: {
          text: currentBlockquote.join('\n'),
          style: 'blockquote'
        }
      });
    }
    
    return blocks;
  };

/**
 * Converts LaTeX string to readable text for display.
 * @param {string} latexString - The LaTeX string to convert.
 * @returns {string} The converted readable text.
 */
export const parseLatexToText = (latexString) => {
    return latexString
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)") // Replace \sqrt{...} with √(...)
    .replace(/\^2/g, "²") // Replace ^2 with superscript 2
    .replace(/\\text\{([^}]+)\}/g, "$1") // Remove \text{}
    .replace(/\s*h\s*=\s*/g, "\nh = ") // Add line breaks before "h ="
    .replace(/\s*Taking the square root of both sides:/, "\nTaking the square root of both sides:") // Add a break before explanation
    .replace(/(\d+)\s*\+\s*(\d+)/g, "$1 + $2") // Ensure spaces around additions
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
  };
  