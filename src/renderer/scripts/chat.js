/**
 * Chat Assistant for Codium AI IDE
 * Implements VSCodium-like AI assistant
 */
class ChatAssistant {
  constructor() {
    this.container = null;
    this.messagesContainer = null;
    this.inputContainer = null;
    this.input = null;
    this.sendButton = null;
    this.closeButton = null;
    this.toggleButton = null;
    this.messageHistory = [];
    this.isProcessing = false;
    this.aiModel = 'gpt-4o';
    this.codeLanguageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'yaml': 'yaml',
      'sh': 'bash',
      'bat': 'batch',
      'ps1': 'powershell',
      'sql': 'sql',
    };
  }

  /**
   * Initialize the chat assistant
   */
  init() {
    // Find chat container
    this.container = document.querySelector('.chat-container');
    if (!this.container) {
      console.error('Chat container not found');
      return;
    }

    // Get chat elements
    this.messagesContainer = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-button');
    this.closeButton = document.querySelector('.chat-close');

    // Get activity bar chat toggle button
    this.toggleButton = document.querySelector('.activity-bar-icon[title="AI Assistant"]');

    // Set up event listeners
    this.setupEventListeners();

    // Load message history from local storage
    this.loadMessageHistory();

    // Add initial message if history is empty
    if (this.messageHistory.length === 0) {
      this.addAIMessage('Hello! I\'m your AI assistant. How can I help you with your code today?');
    } else {
      // Render message history
      this.renderMessageHistory();
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Send button click
    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => this.sendMessage());
    }

    // Enter key in input
    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto resize textarea
      this.input.addEventListener('input', this.autoResizeTextarea.bind(this));
    }

    // Close button click
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.toggleChat());
    }

    // Toggle button click
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => this.toggleChat());
    }

    // Keyboard shortcut (Ctrl+Shift+A)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.toggleChat();
      }
    });
  }

  /**
   * Auto resize textarea based on content
   */
  autoResizeTextarea() {
    if (!this.input) return;
    
    this.input.style.height = 'auto';
    this.input.style.height = (this.input.scrollHeight) + 'px';
    
    // Limit to max height
    const maxHeight = 150;
    if (this.input.scrollHeight > maxHeight) {
      this.input.style.height = maxHeight + 'px';
      this.input.style.overflowY = 'auto';
    } else {
      this.input.style.overflowY = 'hidden';
    }
  }

  /**
   * Toggle chat visibility
   */
  toggleChat() {
    // Toggle container visibility
    if (this.container.classList.contains('hidden')) {
      // Show chat
      this.container.classList.remove('hidden');
      document.querySelector('.container').classList.add('show-chat');
      
      // Focus input
      setTimeout(() => {
        this.input.focus();
      }, 0);
      
      // Highlight toggle button
      if (this.toggleButton) {
        const allIcons = document.querySelectorAll('.activity-bar-icon');
        allIcons.forEach(icon => icon.classList.remove('active'));
        this.toggleButton.classList.add('active');
      }
    } else {
      // Hide chat
      this.container.classList.add('hidden');
      document.querySelector('.container').classList.remove('show-chat');
      
      // Remove highlight from toggle button
      if (this.toggleButton && this.toggleButton.classList.contains('active')) {
        this.toggleButton.classList.remove('active');
        
        // Restore active state to Explorer
        document.querySelector('.activity-bar-icon[title="Explorer"]').classList.add('active');
      }
    }
  }

  /**
   * Send a message
   */
  sendMessage() {
    if (!this.input || this.isProcessing) return;
    
    const message = this.input.value.trim();
    if (!message) return;
    
    // Add user message to UI
    this.addUserMessage(message);
    
    // Clear input
    this.input.value = '';
    this.autoResizeTextarea();
    
    // Process message
    this.processMessage(message);
  }

  /**
   * Process message and get AI response
   */
  async processMessage(message) {
    // Set processing state
    this.isProcessing = true;
    this.sendButton.disabled = true;
    
    // Add loading indicator
    const loadingMessage = this.addLoadingMessage();
    
    try {
      // Get current editor content for context
      const editorContent = this.getEditorContent();
      
      // Prepare prompt with context
      let prompt = message;
      if (editorContent) {
        prompt = `${message}\n\nContext (current file):\n\`\`\`\n${editorContent}\n\`\`\``;
      }
      
      // Get AI response (mock for now, would be replaced with actual API call)
      const response = await this.getAIResponse(prompt);
      
      // Remove loading message
      loadingMessage.remove();
      
      // Add AI response to UI
      this.addAIMessage(response);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Remove loading message
      loadingMessage.remove();
      
      // Add error message
      this.addAIMessage('Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      // Reset processing state
      this.isProcessing = false;
      this.sendButton.disabled = false;
    }
  }

  /**
   * Mock AI response (would be replaced with actual API call)
   */
  async getAIResponse(prompt) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return canned responses based on prompt content
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return 'Hello! How can I help you with your code today?';
    }
    
    if (lowerPrompt.includes('create file') || lowerPrompt.includes('new file')) {
      return 'To create a new file, you can:\n\n1. Click the "New File" button in the explorer sidebar\n2. Use the keyboard shortcut Ctrl+N\n3. Right-click in the explorer and select "New File"';
    }
    
    if (lowerPrompt.includes('shortcut') || lowerPrompt.includes('keyboard')) {
      return 'Here are some useful keyboard shortcuts:\n\n- Ctrl+N: New file\n- Ctrl+S: Save file\n- Ctrl+F: Find\n- Ctrl+H: Replace\n- Ctrl+P: Quick open file\n- Ctrl+Shift+P: Command palette\n- Ctrl+`: Toggle terminal\n- Ctrl+Shift+A: Toggle AI assistant';
    }
    
    if (lowerPrompt.includes('javascript') || lowerPrompt.includes('js')) {
      return 'Here\'s an example of a JavaScript function:\n\n```javascript\nfunction calculateSum(a, b) {\n  return a + b;\n}\n\n// Example usage\nconst result = calculateSum(5, 10);\nconsole.log(result); // 15\n```\n\nIs there something specific about JavaScript you\'d like to know?';
    }
    
    if (lowerPrompt.includes('css')) {
      return 'Here\'s an example of a responsive CSS layout using flexbox:\n\n```css\n.container {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 16px;\n}\n\n.item {\n  flex: 1 1 300px;\n  padding: 20px;\n  border-radius: 4px;\n  background-color: #f5f5f5;\n}\n\n@media (max-width: 768px) {\n  .item {\n    flex: 1 1 100%;\n  }\n}\n```';
    }
    
    // Default response
    return 'I\'m here to help you with coding tasks, answer programming questions, and assist with your projects. What would you like to know or do?';
  }

  /**
   * Add user message to UI
   */
  addUserMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', 'user-message');
    messageEl.textContent = message;
    
    if (this.messagesContainer) {
      this.messagesContainer.appendChild(messageEl);
      this.scrollToBottom();
    }
    
    // Add to history
    this.messageHistory.push({ role: 'user', content: message });
    this.saveMessageHistory();
  }

  /**
   * Add AI message to UI
   */
  addAIMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', 'ai-message');
    
    // Process markdown and code blocks
    const formattedMessage = this.formatMessage(message);
    messageEl.innerHTML = formattedMessage;
    
    if (this.messagesContainer) {
      this.messagesContainer.appendChild(messageEl);
      this.scrollToBottom();
    }
    
    // Add to history
    this.messageHistory.push({ role: 'assistant', content: message });
    this.saveMessageHistory();
    
    // Set up code block functionality
    this.setupCodeBlockActions(messageEl);
  }

  /**
   * Add loading message indicator
   */
  addLoadingMessage() {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', 'ai-message', 'loading-message');
    
    const loadingDots = document.createElement('div');
    loadingDots.classList.add('loading-dots');
    loadingDots.innerHTML = '<span></span><span></span><span></span>';
    
    messageEl.appendChild(loadingDots);
    
    if (this.messagesContainer) {
      this.messagesContainer.appendChild(messageEl);
      this.scrollToBottom();
    }
    
    return messageEl;
  }

  /**
   * Format message with markdown and code highlighting
   */
  formatMessage(message) {
    // Replace code blocks with syntax highlighting
    let formattedMessage = message.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
      // Map language alias to full name
      const fullLanguage = this.codeLanguageMap[language] || language || 'plaintext';
      
      // Create code block with copy button
      return `<pre class="code-block" data-language="${fullLanguage}">
                <div class="code-header">
                  <span class="code-language">${fullLanguage}</span>
                  <button class="code-copy-btn" title="Copy code">
                    <i class="codicon codicon-copy"></i>
                  </button>
                </div>
                <code class="language-${fullLanguage}">${this.escapeHtml(code)}</code>
              </pre>`;
    });
    
    // Replace inline code
    formattedMessage = formattedMessage.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Replace new lines
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');
    
    return formattedMessage;
  }

  /**
   * Setup code block actions (copy, execute)
   */
  setupCodeBlockActions(messageEl) {
    const codeBlocks = messageEl.querySelectorAll('.code-block');
    
    codeBlocks.forEach(block => {
      const copyBtn = block.querySelector('.code-copy-btn');
      const codeEl = block.querySelector('code');
      
      if (copyBtn && codeEl) {
        copyBtn.addEventListener('click', () => {
          // Get code text (unescape HTML entities)
          const tempEl = document.createElement('div');
          tempEl.innerHTML = codeEl.innerHTML.replace(/<br>/g, '\n');
          const codeText = tempEl.textContent;
          
          // Copy to clipboard
          navigator.clipboard.writeText(codeText)
            .then(() => {
              // Change button icon temporarily
              copyBtn.innerHTML = '<i class="codicon codicon-check"></i>';
              setTimeout(() => {
                copyBtn.innerHTML = '<i class="codicon codicon-copy"></i>';
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy code:', err);
            });
        });
      }
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Scroll messages container to bottom
   */
  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  /**
   * Get current editor content for context
   */
  getEditorContent() {
    if (window.monacoEditor) {
      return window.monacoEditor.getValue();
    }
    return '';
  }

  /**
   * Save message history to local storage
   */
  saveMessageHistory() {
    try {
      // Limit history length
      if (this.messageHistory.length > 100) {
        this.messageHistory = this.messageHistory.slice(-100);
      }
      
      localStorage.setItem('chat-history', JSON.stringify(this.messageHistory));
    } catch (error) {
      console.error('Failed to save message history:', error);
    }
  }

  /**
   * Load message history from local storage
   */
  loadMessageHistory() {
    try {
      const savedHistory = localStorage.getItem('chat-history');
      if (savedHistory) {
        this.messageHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
      this.messageHistory = [];
    }
  }

  /**
   * Render message history
   */
  renderMessageHistory() {
    if (!this.messagesContainer) return;
    
    // Clear messages container
    this.messagesContainer.innerHTML = '';
    
    // Render each message
    this.messageHistory.forEach(message => {
      if (message.role === 'user') {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', 'user-message');
        messageEl.textContent = message.content;
        this.messagesContainer.appendChild(messageEl);
      } else if (message.role === 'assistant') {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', 'ai-message');
        messageEl.innerHTML = this.formatMessage(message.content);
        this.messagesContainer.appendChild(messageEl);
        this.setupCodeBlockActions(messageEl);
      }
    });
    
    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Clear chat history
   */
  clearChatHistory() {
    if (confirm('Are you sure you want to clear all chat history?')) {
      this.messageHistory = [];
      this.saveMessageHistory();
      
      // Add initial message
      this.messagesContainer.innerHTML = '';
      this.addAIMessage('Chat history has been cleared. How can I help you today?');
    }
  }
}

// Initialize chat assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatAssistant = new ChatAssistant();
  window.chatAssistant.init();
}); 