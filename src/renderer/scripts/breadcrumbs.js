/**
 * Breadcrumbs Navigation Component
 * Inspired by VSCodium's breadcrumbs navigation
 */

class BreadcrumbsNavigation {
  constructor() {
    this.container = null;
    this.currentPath = [];
    this.currentSymbols = [];
    this.isVisible = true;
    this.activeEditor = null;
    
    this.init();
  }
  
  init() {
    // Create breadcrumbs container
    this.container = document.createElement('div');
    this.container.className = 'breadcrumbs-container';
    
    // Create breadcrumbs button for responsive mode
    const breadcrumbsButton = document.createElement('div');
    breadcrumbsButton.className = 'breadcrumbs-button';
    breadcrumbsButton.title = 'Focus Breadcrumbs';
    breadcrumbsButton.innerHTML = '<i class="codicon codicon-list-flat"></i>';
    breadcrumbsButton.addEventListener('click', () => this.focusBreadcrumbs());
    
    // Create breadcrumbs content
    const breadcrumbsContent = document.createElement('div');
    breadcrumbsContent.className = 'breadcrumbs-content';
    
    // Create file path breadcrumbs
    const pathBreadcrumbs = document.createElement('div');
    pathBreadcrumbs.className = 'breadcrumbs-path';
    
    // Create symbol breadcrumbs
    const symbolBreadcrumbs = document.createElement('div');
    symbolBreadcrumbs.className = 'breadcrumbs-symbols';
    
    // Assemble the structure
    breadcrumbsContent.appendChild(pathBreadcrumbs);
    breadcrumbsContent.appendChild(symbolBreadcrumbs);
    
    this.container.appendChild(breadcrumbsButton);
    this.container.appendChild(breadcrumbsContent);
    
    // Insert after tabs
    const tabsElement = document.querySelector('.tabs');
    if (tabsElement && tabsElement.parentNode) {
      tabsElement.parentNode.insertBefore(this.container, tabsElement.nextSibling);
    }
    
    // Store references
    this.breadcrumbsButton = breadcrumbsButton;
    this.breadcrumbsContent = breadcrumbsContent;
    this.pathBreadcrumbs = pathBreadcrumbs;
    this.symbolBreadcrumbs = symbolBreadcrumbs;
    
    // Register event listeners
    this.registerEventListeners();
    
    // Initial render
    this.renderBreadcrumbs();
  }
  
  registerEventListeners() {
    // Listen for tab changes
    document.addEventListener('tab-activated', (e) => {
      if (e.detail && e.detail.filePath) {
        this.setCurrentPath(e.detail.filePath);
      }
    });
    
    // Listen for editor changes
    document.addEventListener('editor-content-changed', (e) => {
      if (e.detail && e.detail.editor) {
        this.activeEditor = e.detail.editor;
        this.updateSymbolBreadcrumbs();
      }
    });
    
    // Toggle breadcrumbs visibility
    document.addEventListener('keydown', (e) => {
      // Alt+B to toggle breadcrumbs
      if (e.altKey && e.key === 'b') {
        e.preventDefault();
        this.toggleVisibility();
      }
    });
    
    // Update breadcrumbs on window resize
    window.addEventListener('resize', () => {
      this.adjustResponsiveLayout();
    });
  }
  
  setCurrentPath(filePath) {
    if (!filePath) {
      this.currentPath = [];
      this.renderBreadcrumbs();
      return;
    }
    
    // Parse the file path into segments
    const segments = filePath.split(/[\\/]/);
    this.currentPath = segments;
    
    // Attempt to find a language for this file
    const extension = segments[segments.length - 1].split('.').pop();
    this.detectLanguage(extension);
    
    // Update the breadcrumbs
    this.renderBreadcrumbs();
  }
  
  detectLanguage(extension) {
    // This would be more comprehensive in a real implementation
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascriptreact',
      'tsx': 'typescriptreact',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'go': 'go',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'rs': 'rust',
      'sh': 'shell',
      'bat': 'bat',
      'ps1': 'powershell'
    };
    
    this.currentLanguage = languageMap[extension] || 'plaintext';
  }
  
  updateSymbolBreadcrumbs() {
    // This would use the Monaco editor's model to get real symbols
    // For this demo, we'll create a simulated structure
    
    if (!this.activeEditor || !this.currentLanguage) {
      this.currentSymbols = [];
      this.renderBreadcrumbs();
      return;
    }
    
    // Simulate getting cursor position and symbols from editor
    // In a real implementation, this would parse the document and find:
    // - Classes
    // - Functions/methods
    // - Namespaces
    // - And other symbols based on the language
    
    // Demo symbols for JavaScript
    if (this.currentLanguage === 'javascript' || this.currentLanguage === 'typescript') {
      this.currentSymbols = [
        { type: 'class', name: 'AppComponent', icon: 'symbol-class' },
        { type: 'method', name: 'render', icon: 'symbol-method' }
      ];
    } 
    // Demo symbols for Python
    else if (this.currentLanguage === 'python') {
      this.currentSymbols = [
        { type: 'class', name: 'DataProcessor', icon: 'symbol-class' },
        { type: 'method', name: 'process_data', icon: 'symbol-method' }
      ];
    } 
    // Demo symbols for HTML
    else if (this.currentLanguage === 'html') {
      this.currentSymbols = [
        { type: 'element', name: 'body', icon: 'symbol-field' },
        { type: 'element', name: 'div.container', icon: 'symbol-field' }
      ];
    } 
    // Demo symbols for CSS
    else if (this.currentLanguage === 'css') {
      this.currentSymbols = [
        { type: 'selector', name: '.container', icon: 'symbol-field' }
      ];
    } else {
      // Default for other languages
      this.currentSymbols = [];
    }
    
    this.renderBreadcrumbs();
  }
  
  renderBreadcrumbs() {
    // Clear existing breadcrumbs
    this.pathBreadcrumbs.innerHTML = '';
    this.symbolBreadcrumbs.innerHTML = '';
    
    // Render path breadcrumbs
    if (this.currentPath.length > 0) {
      let path = '';
      
      this.currentPath.forEach((segment, index) => {
        // Add separator for all but the first item
        if (index > 0) {
          const separator = document.createElement('span');
          separator.className = 'breadcrumb-separator';
          separator.innerHTML = '<i class="codicon codicon-chevron-right"></i>';
          this.pathBreadcrumbs.appendChild(separator);
        }
        
        // Build the path for this segment
        path += (index > 0 ? '/' : '') + segment;
        
        // Create the breadcrumb item
        const item = document.createElement('div');
        item.className = 'breadcrumb-item';
        
        // Add icon based on type
        const icon = document.createElement('span');
        icon.className = 'breadcrumb-icon';
        
        if (index === this.currentPath.length - 1) {
          // Last item (file)
          icon.innerHTML = '<i class="codicon codicon-file"></i>';
        } else {
          // Folder
          icon.innerHTML = '<i class="codicon codicon-folder"></i>';
        }
        
        const label = document.createElement('span');
        label.className = 'breadcrumb-label';
        label.textContent = segment;
        
        // Add dropdown indicator
        const dropdown = document.createElement('span');
        dropdown.className = 'breadcrumb-dropdown';
        dropdown.innerHTML = '<i class="codicon codicon-chevron-down"></i>';
        
        item.appendChild(icon);
        item.appendChild(label);
        item.appendChild(dropdown);
        
        // Make clickable
        item.addEventListener('click', (e) => {
          this.showPathDropdown(item, path, index);
          e.stopPropagation();
        });
        
        this.pathBreadcrumbs.appendChild(item);
      });
    }
    
    // Render symbol breadcrumbs
    if (this.currentSymbols.length > 0) {
      // Add a visual separator between path and symbols
      const pathSymbolSeparator = document.createElement('span');
      pathSymbolSeparator.className = 'breadcrumb-path-symbol-separator';
      this.symbolBreadcrumbs.appendChild(pathSymbolSeparator);
      
      this.currentSymbols.forEach((symbol, index) => {
        // Add separator for all but the first item
        if (index > 0) {
          const separator = document.createElement('span');
          separator.className = 'breadcrumb-separator';
          separator.innerHTML = '<i class="codicon codicon-chevron-right"></i>';
          this.symbolBreadcrumbs.appendChild(separator);
        }
        
        // Create the breadcrumb item
        const item = document.createElement('div');
        item.className = 'breadcrumb-item';
        
        // Add icon based on symbol type
        const icon = document.createElement('span');
        icon.className = 'breadcrumb-icon';
        icon.innerHTML = `<i class="codicon codicon-${symbol.icon}"></i>`;
        
        const label = document.createElement('span');
        label.className = 'breadcrumb-label';
        label.textContent = symbol.name;
        
        // Add dropdown indicator
        const dropdown = document.createElement('span');
        dropdown.className = 'breadcrumb-dropdown';
        dropdown.innerHTML = '<i class="codicon codicon-chevron-down"></i>';
        
        item.appendChild(icon);
        item.appendChild(label);
        item.appendChild(dropdown);
        
        // Make clickable
        item.addEventListener('click', (e) => {
          this.showSymbolDropdown(item, symbol, index);
          e.stopPropagation();
        });
        
        this.symbolBreadcrumbs.appendChild(item);
      });
    }
    
    // Adjust layout for responsive design
    this.adjustResponsiveLayout();
  }
  
  adjustResponsiveLayout() {
    const containerWidth = this.container.offsetWidth;
    const contentWidth = this.breadcrumbsContent.scrollWidth;
    
    if (contentWidth > containerWidth - 40) {
      // Not enough space, switch to compact mode
      this.container.classList.add('compact');
    } else {
      // Enough space, use full mode
      this.container.classList.remove('compact');
    }
  }
  
  showPathDropdown(element, path, level) {
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'breadcrumb-dropdown-menu';
    
    // Simulate getting siblings at this path level
    const siblings = this.getPathSiblings(path, level);
    
    siblings.forEach(sibling => {
      const item = document.createElement('div');
      item.className = 'breadcrumb-dropdown-item';
      
      const icon = document.createElement('span');
      icon.className = 'breadcrumb-dropdown-icon';
      
      if (sibling.type === 'file') {
        icon.innerHTML = '<i class="codicon codicon-file"></i>';
      } else {
        icon.innerHTML = '<i class="codicon codicon-folder"></i>';
      }
      
      const label = document.createElement('span');
      label.className = 'breadcrumb-dropdown-label';
      label.textContent = sibling.name;
      
      item.appendChild(icon);
      item.appendChild(label);
      
      // Highlight current item
      if (this.currentPath[level] === sibling.name) {
        item.classList.add('active');
      }
      
      // Make clickable
      item.addEventListener('click', () => {
        this.navigateToPath(path, sibling.name, level);
        this.removeDropdowns();
      });
      
      dropdown.appendChild(item);
    });
    
    // Position the dropdown
    const rect = element.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.minWidth = `${rect.width}px`;
    
    // Add to document
    document.body.appendChild(dropdown);
    
    // Remove when clicking outside
    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target !== element) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    };
    
    // Delay adding the event listener to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', closeDropdown);
    }, 0);
  }
  
  showSymbolDropdown(element, currentSymbol, level) {
    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'breadcrumb-dropdown-menu';
    
    // Simulate getting symbols at this level
    const symbols = this.getSymbolSiblings(currentSymbol.type, level);
    
    symbols.forEach(symbol => {
      const item = document.createElement('div');
      item.className = 'breadcrumb-dropdown-item';
      
      const icon = document.createElement('span');
      icon.className = 'breadcrumb-dropdown-icon';
      icon.innerHTML = `<i class="codicon codicon-${symbol.icon}"></i>`;
      
      const label = document.createElement('span');
      label.className = 'breadcrumb-dropdown-label';
      label.textContent = symbol.name;
      
      item.appendChild(icon);
      item.appendChild(label);
      
      // Highlight current item
      if (currentSymbol.name === symbol.name) {
        item.classList.add('active');
      }
      
      // Make clickable
      item.addEventListener('click', () => {
        this.navigateToSymbol(symbol);
        this.removeDropdowns();
      });
      
      dropdown.appendChild(item);
    });
    
    // Position the dropdown
    const rect = element.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.minWidth = `${rect.width}px`;
    
    // Add to document
    document.body.appendChild(dropdown);
    
    // Remove when clicking outside
    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target !== element) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    };
    
    // Delay adding the event listener to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', closeDropdown);
    }, 0);
  }
  
  getPathSiblings(path, level) {
    // In a real implementation, this would query the file system
    // For this demo, we'll return some fake siblings
    return [
      { name: 'src', type: 'folder' },
      { name: 'dist', type: 'folder' },
      { name: 'public', type: 'folder' },
      { name: 'node_modules', type: 'folder' },
      { name: 'package.json', type: 'file' },
      { name: 'README.md', type: 'file' }
    ];
  }
  
  getSymbolSiblings(type, level) {
    // In a real implementation, this would query the code model
    // For this demo, we'll return some fake symbols
    
    if (type === 'class') {
      return [
        { type: 'class', name: 'AppComponent', icon: 'symbol-class' },
        { type: 'class', name: 'HeaderComponent', icon: 'symbol-class' },
        { type: 'class', name: 'FooterComponent', icon: 'symbol-class' },
        { type: 'class', name: 'SidebarComponent', icon: 'symbol-class' }
      ];
    } else if (type === 'method') {
      return [
        { type: 'method', name: 'render', icon: 'symbol-method' },
        { type: 'method', name: 'componentDidMount', icon: 'symbol-method' },
        { type: 'method', name: 'handleClick', icon: 'symbol-method' },
        { type: 'method', name: 'updateState', icon: 'symbol-method' }
      ];
    } else {
      return [];
    }
  }
  
  navigateToPath(basePath, itemName, level) {
    // In a real implementation, this would open the file or navigate to folder
    console.log(`Navigate to: ${basePath}/${itemName}`);
    
    // For this demo, we'll just log it
    // In a real app, you would dispatch an event to open the file
    const newPath = this.currentPath.slice(0, level);
    newPath[level] = itemName;
    
    // If it's a file, simulate opening it
    if (itemName.includes('.')) {
      const fullPath = newPath.join('/');
      console.log(`Opening file: ${fullPath}`);
      
      // Dispatch event to open file
      const event = new CustomEvent('open-file', {
        detail: { path: fullPath }
      });
      document.dispatchEvent(event);
    }
    // If it's a folder, update the breadcrumbs
    else {
      this.setCurrentPath(newPath.join('/'));
    }
  }
  
  navigateToSymbol(symbol) {
    // In a real implementation, this would navigate to the symbol in the editor
    console.log(`Navigate to symbol: ${symbol.name}`);
    
    // For this demo, we'll just log it
    // In a real app, you would use the Monaco editor to reveal the symbol
    if (this.activeEditor) {
      // Simulate jumping to symbol position
      console.log(`Jumping to ${symbol.type} ${symbol.name} in editor`);
    }
  }
  
  removeDropdowns() {
    // Remove all dropdown menus
    document.querySelectorAll('.breadcrumb-dropdown-menu').forEach(menu => {
      menu.remove();
    });
  }
  
  focusBreadcrumbs() {
    this.breadcrumbsContent.focus();
    
    // Show the first dropdown
    if (this.currentPath.length > 0) {
      const firstItem = this.pathBreadcrumbs.querySelector('.breadcrumb-item');
      if (firstItem) {
        const path = this.currentPath[0];
        this.showPathDropdown(firstItem, path, 0);
      }
    }
  }
  
  toggleVisibility() {
    this.isVisible = !this.isVisible;
    
    if (this.isVisible) {
      this.container.style.display = 'flex';
    } else {
      this.container.style.display = 'none';
    }
  }
}

// Initialize breadcrumbs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.breadcrumbs = new BreadcrumbsNavigation();
}); 