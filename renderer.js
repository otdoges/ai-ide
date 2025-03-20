require('dotenv').config(); // Load environment variables from .env file
const path = require('path');
const fs = require('fs');

// Initialize Monaco Editor
require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' }});

let editor;
require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '// Welcome to AI-Powered IDE\n// Start coding or ask questions in the chat!',
        language: 'javascript',
        theme: 'vs-dark',
        minimap: { enabled: true },
        automaticLayout: true
    });
});

// Initialize AI Chat
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = process.env.GITHUB_TOKEN; // Access GITHUB_TOKEN from environment variables
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

async function sendMessage(message) {
    // Add user message to chat
    addMessageToChat('user', message);

    try {
        const client = ModelClient(
            "https://models.inference.ai.azure.com",
            new AzureKeyCredential(token)
        );

        const response = await client.path("/chat/completions").post({
            body: {
                messages: [
                    { role: "system", content: "You are an AI programming assistant in an IDE. Help with coding questions and provide clear, concise answers." },
                    { role: "user", content: message }
                ],
                model: "gpt-4o",
                temperature: 0.7,
                max_tokens: 4096,
                top_p: 1
            }
        });

        if (isUnexpected(response)) {
            throw response.body.error;
        }

        const aiResponse = response.body.choices[0].message.content;
        addMessageToChat('ai', aiResponse);
    } catch (err) {
        addMessageToChat('ai', `Error: ${err.message}`);
    }
}

function addMessageToChat(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners
sendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        sendMessage(message);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
    }
});

// Split.js initialization
Split(['.editor-container', '.chat-container'], {
    sizes: [70, 30],
    minSize: [200, 200],
    gutterSize: 8,
    cursor: 'col-resize'
}); 