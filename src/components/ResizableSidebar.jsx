import React, { useRef, useState, useEffect } from 'react';

/**
 * Resizable, draggable sidebar for the EditorComponent.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onOpen
 * @param {function} props.onClose
 * @param {number} props.width
 * @param {function} props.setWidth
 * @param {React.ReactNode} props.children
 */
const MIN_WIDTH = 300;
const MAX_WIDTH = 0.8; // 80vw

const ResizableSidebar = ({ isOpen, onOpen, onClose, width, setWidth, children }) => {
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const animationFrame = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [pendingWidth, setPendingWidth] = useState(null);
  const [contentVisible, setContentVisible] = useState(false);

  // Fade in content on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setContentVisible(true), 120);
    } else {
      setContentVisible(false);
    }
  }, [isOpen]);

  // Mouse event handlers for resizing
  const onMouseDown = (e) => {
    isDragging.current = true;
    setDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(() => {
      const screenWidth = window.innerWidth;
      let newWidth = screenWidth - e.clientX;
      newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, screenWidth * MAX_WIDTH));
      setPendingWidth(newWidth);
    });
  };
  const onMouseUp = () => {
    isDragging.current = false;
    setDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    if (pendingWidth !== null) {
      setWidth(pendingWidth);
      setPendingWidth(null);
    }
  };

  // Apply pending width (from rAF) to sidebar
  useEffect(() => {
    if (pendingWidth !== null) {
      setWidth(pendingWidth);
    }
    // eslint-disable-next-line
  }, [pendingWidth]);

  // Sidebar styles
  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: isOpen ? width : 0,
    minWidth: isOpen ? MIN_WIDTH : 0,
    maxWidth: `80vw`,
    background: '#18181b',
    borderLeft: isOpen ? '1px solid #2d2d2d' : 'none',
    boxShadow: isOpen ? '-4px 0 16px rgba(0,0,0,0.2)' : 'none',
    transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1), min-width 0.35s cubic-bezier(0.22, 1, 0.36, 1), max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
    zIndex: 1200,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    opacity: isOpen ? 1 : 0,
  };

  // Drag handle styles
  const dragHandleStyle = {
    position: 'absolute',
    left: -8,
    top: 0,
    width: 16,
    height: '100%',
    cursor: 'ew-resize',
    zIndex: 1201,
    background: dragging ? 'rgba(112,177,236,0.12)' : 'transparent',
    transition: 'background 0.2s',
    display: isOpen ? 'block' : 'none',
  };

  // Closed handle (show when sidebar is closed)
  if (!isOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          zIndex: 1202,
          background: '#232323',
          borderRadius: '8px 0 0 8px',
          border: '1px solid #2d2d2d',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
          width: 32,
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={onOpen}
        title="Open Editor"
      >
        <div style={{ width: 6, height: 32, background: '#70b1ec', borderRadius: 3 }} />
      </div>
    );
  }

  return (
    <aside style={sidebarStyle}>
      {/* Drag handle */}
      <div
        ref={dragRef}
        style={dragHandleStyle}
        onMouseDown={onMouseDown}
        title="Resize"
      >
        <div style={{ width: 4, height: 48, background: dragging ? '#70b1ec' : '#70b1ec', opacity: dragging ? 1 : 0.7, borderRadius: 2, margin: 'auto', boxShadow: dragging ? '0 0 8px #70b1ec' : 'none', transition: 'box-shadow 0.2s, opacity 0.2s' }} />
      </div>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          left: 16,
          zIndex: 1202,
          background: 'transparent',
          color: '#fff',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
        }}
        title="Close Editor"
      >
        ×
      </button>
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 16px 16px 32px', opacity: contentVisible ? 1 : 0, transition: 'opacity 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {children}
      </div>
    </aside>
  );
};

export default ResizableSidebar; 