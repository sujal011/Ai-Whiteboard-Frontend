export const parseMarkdownToEditorJS = (markdown) => {
    // Split content into lines
    const lines = markdown.split('\n');
    const blocks = [];
    let codeBlock = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line && !codeBlock) continue;
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (codeBlock) {
          // End of code block
          blocks.push({
            type: 'code',
            data: {
              code: codeBlock.code.join('\n')
            }
          });
          codeBlock = null;
        } else {
          // Start of code block
          codeBlock = {
            code: []
          };
        }
        continue;
      }
      
      if (codeBlock) {
        codeBlock.code.push(line);
        continue;
      }
      
      // Handle headers
      const headerMatch = line.match(/^(#{1,6})\s(.+)$/);
      if (headerMatch) {
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
        const items = [];
        while (i < lines.length) {
          const currentLine = lines[i].trim();
          const match = currentLine.match(/^[-*]\s\[([ x])\]\s(.+)$/);
          if (!match) break;
          
          items.push({
            text: match[2],
            checked: match[1] === 'x'
          });
          i++;
        }
        i--; // Adjust index since we've looked ahead
        
        blocks.push({
          type: 'checklist',
          data: {
            items
          }
        });
        continue;
      }
      
      // Handle unordered lists
      if (line.match(/^[-*]\s(.+)$/)) {
        const items = [];
        while (i < lines.length && lines[i].trim().match(/^[-*]\s(.+)$/)) {
          items.push(lines[i].trim().replace(/^[-*]\s/, ''));
          i++;
        }
        i--; // Adjust index since we've looked ahead
        
        blocks.push({
          type: 'list',
          data: {
            style: 'unordered',
            items
          }
        });
        continue;
      }
      
      // Handle ordered lists
      if (line.match(/^\d+\.\s(.+)$/)) {
        const items = [];
        while (i < lines.length && lines[i].trim().match(/^\d+\.\s(.+)$/)) {
          items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
          i++;
        }
        i--; // Adjust index since we've looked ahead
        
        blocks.push({
          type: 'list',
          data: {
            style: 'ordered',
            items
          }
        });
        continue;
      }
      
      // Handle inline code
      if (line.includes('`')) {
        const text = line.replace(/`([^`]+)`/g, '<code>$1</code>');
        blocks.push({
          type: 'paragraph',
          data: {
            text
          }
        });
        continue;
      }
      
      // Default to paragraph
      blocks.push({
        type: 'paragraph',
        data: {
          text: line
        }
      });
    }
    
    return blocks;
  };

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
  