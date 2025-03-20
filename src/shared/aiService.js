import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const token = process.env.GITHUB_TOKEN;

class AIService {
  constructor() {
    this.client = new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: token
    });
  }

  async generateCompletion(userMessage, systemMessage = "") {
    try {
      const response = await this.client.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage || "You are an AI programming assistant in an IDE. Help with coding questions and provide clear, concise answers." },
          { role: "user", content: userMessage }
        ],
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 1
      });

      return {
        content: response.choices[0].message.content,
        success: true
      };
    } catch (error) {
      console.error("AI Service Error:", error);
      return {
        content: `Error: ${error.message || "Unknown error occurred"}`,
        success: false
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

export default new AIService(); 