# VSCodium-style IDE with AI

A powerful desktop IDE built with Electron that mimics VSCodium's look and feel while integrating AI assistant capabilities.

![VSCodium-style IDE with AI Screenshot](screenshot.png)

## Features

- **Modern VSCode-like UI**: Familiar interface with activity bar, file explorer, editor, and panels
- **Monaco Editor**: The same editor that powers VS Code, with syntax highlighting, code completion, and more
- **AI Assistant**: Built-in AI chat powered by GitHub's AI models for coding help
- **File Management**: Open, edit, and save files with ease
- **Terminal Integration**: Built-in terminal for running commands
- **Command Palette**: Quick access to commands and settings
- **Customizable**: Themes, settings, and more to make it your own

## Getting Started

### Prerequisites

- Node.js 18.x or later
- pnpm 8.x or later

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/vscodium-style-ide.git
   cd vscodium-style-ide
   ```

2. Install dependencies using pnpm:
   ```
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your GitHub token:
   ```
   GITHUB_TOKEN=your_github_token_here
   ```

4. Start the application:
   ```
   pnpm start
   ```

### Build

To build the application for your platform:
```
pnpm build
```

## Development

### Project Structure

- `main.js` - Main Electron process
- `renderer.js` - Renderer process
- `preload.js` - Preload script for secure IPC
- `index.html` - Main UI
- `styles.css` - CSS styles
- `.env` - Environment variables (not committed to source control)

### Development Scripts

- `pnpm start` - Run the application
- `pnpm dev` - Run the application in development mode
- `pnpm build` - Build the application

## Using the AI Assistant

The AI assistant uses GitHub's AI models to help with coding questions. To use it:

1. Click on the AI Assistant icon in the activity bar
2. Type your question in the chat input
3. Press Enter or click Send

The AI assistant can help with:
- Answering coding questions
- Explaining code
- Suggesting code solutions
- Debugging issues

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [VSCodium](https://github.com/VSCodium/vscodium)
- [GitHub AI Models](https://github.com/features/copilot) 