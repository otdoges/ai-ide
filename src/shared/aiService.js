import 'dotenv/config';
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

class AIService {
  constructor() {
    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async generateCompletion(prompt) {
    if (!this.client.apiKey) {
      return {
        success: false,
        content: 'OpenAI API key is missing. Please set OPENAI_API_KEY environment variable.'
      };
    }

    try {
      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        success: true,
        content: response.choices[0].message.content
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        content: error.message || 'An error occurred while generating the completion'
      };
    }
  }

  async generateCodeCompletion(code, language, prompt) {
    const systemMessage = `You are an expert programmer. The user will provide code in ${language} and ask for assistance. 
    Provide concise, helpful responses. When showing code, use proper syntax highlighting.`;
    
    const userMessage = `
Code:
\`\`\`${language}
${code}
\`\`\`

${prompt}`;

    return this.generateCompletion(userMessage, systemMessage);
  }
}

// Export a singleton instance
const aiService = new AIService();
export default aiService; 