// GitHub AI integration for the AI-IDE
// This service allows the application to connect to GitHub's AI models API

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  model: string;
  stream?: boolean;
}

interface ChatCompletionChoice {
  index: number;
  message: Message;
  finish_reason: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
}

class GitHubAIService {
  private token: string;
  private endpoint: string;
  private model: string;

  constructor() {
    this.token = import.meta.env.VITE_GITHUB_TOKEN as string;
    this.endpoint = import.meta.env.VITE_AI_MODEL_ENDPOINT as string || 'https://models.github.ai/inference';
    this.model = import.meta.env.VITE_AI_MODEL as string || 'meta/Llama-4-Scout-17B-16E-Instruct';

    if (!this.token) {
      console.error('Missing GitHub token. Make sure VITE_GITHUB_TOKEN is set in your .env file.');
    }
  }

  /**
   * Send a chat completion request to the GitHub AI API
   */
  async getChatCompletion(
    messages: Message[],
    options: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    try {
      const { temperature = 0.7, topP = 1.0, maxTokens = 1000 } = options;

      const requestBody: ChatCompletionRequest = {
        messages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        model: this.model
      };

      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub AI API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as ChatCompletionResponse;
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error getting chat completion:', error);
      throw error;
    }
  }

  /**
   * Stream chat completions for real-time responses
   */
  async streamChatCompletion(
    messages: Message[],
    onUpdate: (content: string) => void,
    onComplete: (fullContent: string) => void,
    options: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    } = {}
  ): Promise<void> {
    try {
      const { temperature = 0.7, topP = 1.0, maxTokens = 1000 } = options;

      const requestBody: ChatCompletionRequest = {
        messages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        model: this.model,
        stream: true
      };

      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub AI API Streaming Error: ${response.status} - ${errorText}`);
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
              console.warn('Error parsing streaming response line:', e);
            }
          }
        }

        // Read the next chunk
        return reader.read().then(processChunk);
      };

      reader.read().then(processChunk);
    } catch (error) {
      console.error('Error streaming chat completion:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const githubAI = new GitHubAIService(); 