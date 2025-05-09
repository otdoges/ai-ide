import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { aiService, Message as AIMessage } from '../../services/ai/ai-service';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  activeFile?: {
    name: string;
    path: string;
    content?: string;
  };
  language: string;
}

export const Chat: React.FC<ChatProps> = ({
  activeFile,
  language
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! How can I help you with your code today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: input,
        timestamp: new Date(),
      };
      
      // Add user message to UI
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      
      try {
        // Create AI message
        const aiMessages: AIMessage[] = [
          {
            role: 'system',
            content: `You are an AI programming assistant. You help the user with their code.
                     Be informative, helpful, and concise in your responses.`
          }
        ];
        
        // Add context about the current file
        if (activeFile?.content) {
          aiMessages.push({
            role: 'system',
            content: `The user is currently working on file "${activeFile.name}" (${language}) with the following content:
                      \`\`\`${language}
                      ${activeFile.content}
                      \`\`\``
          });
        }
        
        // Add previous messages for context (limited to last 6 for performance)
        const conversationHistory = messages.slice(-6).map(msg => ({
          role: msg.role as AIMessage['role'],
          content: msg.content
        }));
        
        aiMessages.push(...conversationHistory);
        
        // Add user's current message
        aiMessages.push({
          role: 'user',
          content: input
        });

        // Stream the AI response
        setStreamingContent('');
        await aiService.streamChatCompletion(
          aiMessages,
          (content) => {
            // Update streaming content as it arrives
            setStreamingContent(content);
          },
          (fullContent) => {
            // When complete, add the message to the chat
            const assistantMessage: ChatMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: fullContent,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingContent('');
            setIsLoading(false);
          }
        );
      } catch (error) {
        console.error('Error getting AI response:', error);
        // Add error message
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="p-2 text-sm font-semibold border-b border-gray-700 flex justify-between items-center">
        <span>AI CHAT</span>
        <div className="flex space-x-2">
          <select 
            className="bg-gray-800 text-xs rounded px-2 py-1 border border-gray-700"
            onChange={(e) => aiService.setDefaultProvider(e.target.value as 'github' | 'mcp')}
            defaultValue={aiService.getDefaultProvider()}
          >
            <option value="github">GitHub AI</option>
            <option value="mcp">MCP Server</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className="text-xs text-gray-300 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {/* Streaming message display */}
        {streamingContent && (
          <div className="text-left mb-4">
            <div className="inline-block p-3 rounded-lg bg-gray-700 text-gray-100 max-w-xs md:max-w-md lg:max-w-lg">
              <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
              <div className="text-xs text-gray-300 mt-1">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator when no streaming content yet */}
        {isLoading && !streamingContent && (
          <div className="text-left mb-4">
            <div className="inline-block p-3 rounded-lg bg-gray-700 text-gray-100">
              <p className="text-sm">Thinking...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for assistance with your code..."
            className="flex-1 bg-gray-800 text-white p-2 rounded-l-lg focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`bg-blue-600 text-white p-2 rounded-r-lg ${
              isLoading || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat; 