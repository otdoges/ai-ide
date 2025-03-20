/**
 * Minimap implementation for Codium AI IDE
 * Inspired by VSCodium's minimap feature
 */

class Minimap {
  constructor() {
    this.editorContainer = document.getElementById('editor-container');
    this.isVisible = true;
    this.scale = 0.2; // Scale factor for the minimap (20% of original size)
    this.minimapWidth = 80; // Width in pixels
    this.editorInstance = null;
    this.minimapInstance = null;
    this.viewportElement = null;
    this.isDragging = false;
    this.lastKnownScrollTop = 0;
    this.contentHeight = 0;
    
    this.init();
  }
  
  init() {
    // Create minimap container
    this.container = document.createElement('div');
    this.container.className = 'minimap-container';
    this.container.style.width = `${this.minimapWidth}px`;
    
    // Create minimap canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'minimap-canvas';
    
    // Create minimap viewport indicator
    this.viewport = document.createElement('div');
    this.viewport.className = 'minimap-viewport';
    
    // Create slider for minimap
    this.slider = document.createElement('div');
    this.slider.className = 'minimap-slider';
    
    // Add elements to container
    this.container.appendChild(this.canvas);
    this.container.appendChild(this.viewport);
    this.container.appendChild(this.slider);
    
    // Append to editor container
    this.editorContainer.appendChild(this.container);
    
    // Store reference to viewport element
    this.viewportElement = this.viewport;
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Listen for Monaco editor initialization
    document.addEventListener('monaco-editor-loaded', (e) => {
      if (e.detail && e.detail.editor) {
        this.connectToEditor(e.detail.editor);
      }
    });
  }
  
  setupEventListeners() {
    // Toggle minimap when clicking the slider
    this.slider.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleVisibility();
    });
    
    // Handle viewport dragging
    this.viewport.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.startDragging(e);
    });
    
    // Handle click on minimap canvas to scroll to position
    this.canvas.addEventListener('click', (e) => {
      this.scrollToCanvasPosition(e);
    });
    
    // Global events for drag handling
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.updateDragPosition(e);
      }
    });
    
    document.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.container.classList.remove('dragging');
    });
    
    // Listen for editor scroll events
    window.addEventListener('resize', () => {
      this.updateMinimapSize();
      this.renderMinimap();
    });
    
    // Listen for theme changes
    document.addEventListener('theme-changed', () => {
      this.renderMinimap();
    });
  }
  
  connectToEditor(editor) {
    this.editorInstance = editor;
    
    // Create the minimap model
    this.setupMinimap();
    
    // Initial render
    this.updateMinimapSize();
    this.renderMinimap();
    
    // Listen for editor changes
    editor.onDidScrollChange(() => {
      this.updateViewportPosition();
    });
    
    editor.onDidChangeModelContent(() => {
      this.renderMinimap();
    });
    
    editor.onDidChangeModel(() => {
      this.renderMinimap();
    });
  }
  
  setupMinimap() {
    if (!this.editorInstance) return;
    
    // Monaco Editor has built-in minimap feature that we can control
    // But here we're implementing our own for more control over rendering
    
    // Disable Monaco's built-in minimap
    this.editorInstance.updateOptions({
      minimap: {
        enabled: false
      }
    });
    
    // Get context for canvas
    this.ctx = this.canvas.getContext('2d');
  }
  
  updateMinimapSize() {
    if (!this.editorInstance) return;
    
    const editorHeight = this.editorContainer.clientHeight;
    const editorWidth = this.editorContainer.clientWidth;
    
    // Update canvas size
    this.canvas.width = this.minimapWidth * window.devicePixelRatio;
    this.canvas.height = editorHeight * window.devicePixelRatio;
    this.canvas.style.width = `${this.minimapWidth}px`;
    this.canvas.style.height = `${editorHeight}px`;
    
    // Get content height from the editor
    const model = this.editorInstance.getModel();
    if (model) {
      const lineCount = model.getLineCount();
      const lineHeight = this.editorInstance.getOption(monaco.editor.EditorOption.lineHeight);
      this.contentHeight = lineCount * lineHeight;
      
      // Update viewport size
      const visibleRanges = this.editorInstance.getVisibleRanges();
      if (visibleRanges.length > 0) {
        const firstLine = this.editorInstance.getTopForLineNumber(1);
        const lastVisibleLineNumber = model.getLineCount();
        const lastLine = this.editorInstance.getTopForLineNumber(lastVisibleLineNumber) + lineHeight;
        
        const editorScrollHeight = lastLine - firstLine;
        const viewportRatio = editorHeight / editorScrollHeight;
        
        // Handle case where the entire content fits in the editor
        const viewportHeight = Math.min(editorHeight, Math.max(30, viewportRatio * editorHeight));
        
        this.viewport.style.height = `${viewportHeight}px`;
      }
    }
  }
  
  renderMinimap() {
    if (!this.editorInstance || !this.ctx) return;
    
    const model = this.editorInstance.getModel();
    if (!model) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Scale for high DPI displays
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Get editor colors
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--bg-primary');
    const fgColor = computedStyle.getPropertyValue('--fg-primary');
    const commentColor = computedStyle.getPropertyValue('--editor-comment') || '#6A9955';
    const stringColor = computedStyle.getPropertyValue('--editor-string') || '#CE9178';
    const keywordColor = computedStyle.getPropertyValue('--editor-keyword') || '#569CD6';
    
    // Set the background
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.minimapWidth, this.canvas.height / window.devicePixelRatio);
    
    // Get visible content for rendering
    const lineCount = model.getLineCount();
    const lineHeight = this.editorInstance.getOption(monaco.editor.EditorOption.lineHeight);
    const minimapLineHeight = Math.max(1, Math.floor(lineHeight * this.scale));
    
    // Render lines
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber);
      
      // Calculate y position
      const y = (lineNumber - 1) * minimapLineHeight;
      
      // Simple token-based coloring
      this.renderMinimapLine(lineContent, y, minimapLineHeight, {
        default: fgColor,
        comment: commentColor,
        string: stringColor,
        keyword: keywordColor
      });
    }
    
    // Reset scale for next render
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Update viewport position
    this.updateViewportPosition();
  }
  
  renderMinimapLine(line, y, height, colors) {
    // This is a simplified version of syntax highlighting for the minimap
    // In a real implementation, you would use Monaco's tokenization
    
    // Default empty line
    if (!line.trim()) {
      return;
    }
    
    // Very basic syntax highlighting simulation
    // For a real implementation, use Monaco's token information
    
    // Comments (start with //)
    if (line.trim().startsWith('//')) {
      this.drawMinimapToken(0, this.minimapWidth, y, height, colors.comment);
      return;
    }
    
    // Multi-line comment check (basic)
    if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      this.drawMinimapToken(0, this.minimapWidth, y, height, colors.comment);
      return;
    }
    
    // String detection (very simple)
    if (line.includes('"') || line.includes("'")) {
      // Check for strings
      const quoteIndices = [];
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"' || line[i] === "'") {
          quoteIndices.push(i);
        }
      }
      
      if (quoteIndices.length >= 2) {
        // Draw a segment for the string
        const startX = Math.floor(quoteIndices[0] * this.scale);
        const endX = Math.floor(quoteIndices[quoteIndices.length - 1] * this.scale);
        if (endX > startX) {
          this.drawMinimapToken(startX, endX - startX + 1, y, height, colors.string);
        }
      }
    }
    
    // Keywords (simplified)
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'class', 'import', 'export'];
    keywords.forEach(keyword => {
      if (line.includes(keyword)) {
        const index = line.indexOf(keyword);
        const startX = Math.floor(index * this.scale);
        const width = Math.floor(keyword.length * this.scale);
        this.drawMinimapToken(startX, width, y, height, colors.keyword);
      }
    });
    
    // Draw default text representation
    const indent = line.search(/\S|$/);
    const contentLength = line.trim().length;
    if (contentLength > 0) {
      const startX = Math.floor(indent * this.scale);
      const width = Math.floor(contentLength * this.scale);
      this.drawMinimapToken(startX, width, y, height, colors.default);
    }
  }
  
  drawMinimapToken(x, width, y, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }
  
  updateViewportPosition() {
    if (!this.editorInstance) return;
    
    // Get the scroll information from the editor
    const scrollTop = this.editorInstance.getScrollTop();
    const scrollHeight = this.editorInstance.getScrollHeight();
    const editorHeight = this.editorContainer.clientHeight;
    
    // Calculate viewport position
    const viewportTop = Math.floor(scrollTop / scrollHeight * this.canvas.clientHeight);
    
    // Update viewport position
    this.viewport.style.top = `${viewportTop}px`;
    
    // Store last known scroll position
    this.lastKnownScrollTop = scrollTop;
  }
  
  startDragging(e) {
    this.isDragging = true;
    this.container.classList.add('dragging');
    
    // Calculate offset within the viewport for accurate dragging
    this.dragOffset = e.clientY - this.viewport.getBoundingClientRect().top;
  }
  
  updateDragPosition(e) {
    if (!this.isDragging || !this.editorInstance) return;
    
    // Calculate new position within canvas
    const canvasRect = this.canvas.getBoundingClientRect();
    const relativeY = e.clientY - canvasRect.top - this.dragOffset;
    
    // Clamp position to canvas boundaries
    const maxTop = canvasRect.height - this.viewport.offsetHeight;
    const newTop = Math.max(0, Math.min(relativeY, maxTop));
    
    // Update viewport position
    this.viewport.style.top = `${newTop}px`;
    
    // Calculate corresponding scroll position
    const scrollFraction = newTop / canvasRect.height;
    const newScrollTop = scrollFraction * this.editorInstance.getScrollHeight();
    
    // Update editor scroll position
    this.editorInstance.setScrollTop(newScrollTop);
  }
  
  scrollToCanvasPosition(e) {
    if (!this.editorInstance) return;
    
    // Calculate new position within canvas
    const canvasRect = this.canvas.getBoundingClientRect();
    const relativeY = e.clientY - canvasRect.top;
    
    // Calculate the target line number based on the click position
    const clickFraction = relativeY / canvasRect.height;
    const model = this.editorInstance.getModel();
    
    if (model) {
      const lineCount = model.getLineCount();
      const targetLine = Math.max(1, Math.min(Math.floor(clickFraction * lineCount), lineCount));
      
      // Scroll to the target line
      this.editorInstance.revealLineInCenter(targetLine);
    }
  }
  
  toggleVisibility() {
    this.isVisible = !this.isVisible;
    
    if (this.isVisible) {
      this.container.classList.remove('collapsed');
      this.canvas.style.display = 'block';
      this.viewport.style.display = 'block';
      this.slider.classList.remove('collapsed');
    } else {
      this.container.classList.add('collapsed');
      this.canvas.style.display = 'none';
      this.viewport.style.display = 'none';
      this.slider.classList.add('collapsed');
    }
    
    // Trigger a resize event to update the editor layout
    window.dispatchEvent(new Event('resize'));
  }
}

// Initialize minimap when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.minimap = new Minimap();
}); 