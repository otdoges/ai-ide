// Unified AI service for the IDE
// This service manages AI integration and can use different AI providers

import { githubAI } from './github-ai';
import { mcpServer } from './mcp-server';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// AI Provider types
export type AIProvider = 'github' | 'mcp';

export interface AICompletionOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  model?: string;
}

class AIService {
  private defaultProvider: AIProvider = 'github';

  constructor() {
    // Set default provider from environment if available
    const envProvider = import.meta.env.VITE_DEFAULT_AI_PROVIDER as AIProvider;
    if (envProvider && (envProvider === 'github' || envProvider === 'mcp')) {
      this.defaultProvider = envProvider;
    }
    
    // If MCP is configured and GitHub is not, use MCP as default
    if (mcpServer.isConfigured() && !githubAI) {
      this.defaultProvider = 'mcp';
    }
  }

  /**
   * Set the default AI provider
   */
  setDefaultProvider(provider: AIProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Get the current default AI provider
   */
  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    if (provider === 'mcp') {
      return mcpServer.isConfigured();
    }
    return true; // GitHub provider is always considered available if included
  }

  /**
   * Send a chat completion request to the AI provider
   */
  async getChatCompletion(
    messages: Message[],
    options: AICompletionOptions = {},
    provider?: AIProvider
  ): Promise<string> {
    const useProvider = provider || this.defaultProvider;
    
    if (useProvider === 'mcp' && mcpServer.isConfigured()) {
      return mcpServer.getChatCompletion(messages, options);
    } else {
      // Default to GitHub AI
      return githubAI.getChatCompletion(messages, options);
    }
  }

  /**
   * Stream chat completions for real-time responses
   */
  async streamChatCompletion(
    messages: Message[],
    onUpdate: (content: string) => void,
    onComplete: (fullContent: string) => void,
    options: AICompletionOptions = {},
    provider?: AIProvider
  ): Promise<void> {
    const useProvider = provider || this.defaultProvider;
    
    if (useProvider === 'mcp' && mcpServer.isConfigured()) {
      return mcpServer.streamChatCompletion(messages, onUpdate, onComplete, options);
    } else {
      // Default to GitHub AI
      return githubAI.streamChatCompletion(messages, onUpdate, onComplete, options);
    }
  }

  /**
   * Get code assistance from the AI
   */
  async getCodeAssistance(
    code: string, 
    language: string, 
    query: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are an AI programming assistant. You help the user with their code in ${language}.
                  Your responses should be clear, concise and directly address the user's question.
                  Format code blocks using markdown syntax with appropriate language tags.
                  Be specific and practical in your answers.`
      },
      {
        role: 'user',
        content: `Here's my code in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nMy question: ${query}`
      }
    ];

    return this.getChatCompletion(messages, options);
  }

  /**
   * Stream code assistance from the AI
   */
  async streamCodeAssistance(
    code: string,
    language: string,
    query: string,
    onUpdate: (content: string) => void,
    onComplete: (fullContent: string) => void,
    options: AICompletionOptions = {}
  ): Promise<void> {
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are an AI programming assistant. You help the user with their code in ${language}.
                  Your responses should be clear, concise and directly address the user's question.
                  Format code blocks using markdown syntax with appropriate language tags.
                  Be specific and practical in your answers.`
      },
      {
        role: 'user',
        content: `Here's my code in ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nMy question: ${query}`
      }
    ];

    return this.streamChatCompletion(messages, onUpdate, onComplete, options);
  }
}

// Export singleton instance
export const aiService = new AIService(); 