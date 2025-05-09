// MCP Server integration for AI-IDE
// This service connects to an MCP server for AI model access

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MCPCompletionRequest {
  messages: Message[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
}

class MCPServerService {
  private apiKey: string;
  private serverUrl: string;
  private model: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_MCP_SERVER_API_KEY as string;
    this.serverUrl = import.meta.env.VITE_MCP_SERVER_URL as string;
    this.model = import.meta.env.VITE_MCP_SERVER_MODEL as string || 'meta/Llama-4-Scout-17B-16E-Instruct';

    if (!this.apiKey || !this.serverUrl) {
      console.warn('MCP Server configuration incomplete. Check VITE_MCP_SERVER_API_KEY and VITE_MCP_SERVER_URL in .env file.');
    }
  }

  /**
   * Check if the MCP server is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey) && Boolean(this.serverUrl);
  }

  /**
   * Send a completion request to the MCP server
   */
  async getChatCompletion(
    messages: Message[],
    options: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('MCP Server is not properly configured. Please check your environment variables.');
    }

    try {
      const { temperature = 0.7, topP = 1.0, maxTokens = 1000, model = this.model } = options;

      const requestBody: MCPCompletionRequest = {
        messages,
        temperature,
        topP,
        maxTokens,
        model
      };

      const response = await fetch(`${this.serverUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MCP Server Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting MCP chat completion:', error);
      throw error;
    }
  }

  /**
   * Stream chat completions from the MCP server for real-time responses
   */
  async streamChatCompletion(
    messages: Message[],
    onUpdate: (content: string) => void,
    onComplete: (fullContent: string) => void,
    options: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('MCP Server is not properly configured. Please check your environment variables.');
    }

    try {
      const { temperature = 0.7, topP = 1.0, maxTokens = 1000, model = this.model } = options;

      const requestBody: MCPCompletionRequest = {
        messages,
        temperature,
        topP,
        maxTokens,
        stream: true,
        model
      };

      const response = await fetch(`${this.serverUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MCP Server Streaming Error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';

      const processChunk = async ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
        if (done) {
          onComplete(fullContent);
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE data
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const jsonData = JSON.parse(line.substring(6));
              if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                const content = jsonData.choices[0].delta.content;
                fullContent += content;
                onUpdate(fullContent);
              }
            } catch (e) {
              // Continue if there's an error parsing a line
              console.warn('Error parsing streaming response line:', e);
            }
          }
        }

        // Read the next chunk
        return reader.read().then(processChunk);
      };

      reader.read().then(processChunk);
    } catch (error) {
      console.error('Error streaming MCP chat completion:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mcpServer = new MCPServerService(); 