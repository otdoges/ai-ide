# Codium AI IDE

VSCodium-like IDE with integrated AI assistant

## Features

- Modern, VSCodium-like interface
- Built-in AI coding assistant
- File explorer and editor
- Syntax highlighting with Monaco Editor
- Customizable themes
- Cross-platform (Windows, macOS, Linux)

## Installation

### Prerequisites

- Node.js 18.0 or later
- pnpm 8.0 or later

### Windows

```bash
# Clone the repository
git clone https://github.com/yourusername/codium-ai-ide.git
cd codium-ai-ide

# Run the installation script
.\scripts\install.bat
```

### macOS/Linux

```bash
# Clone the repository
git clone https://github.com/yourusername/codium-ai-ide.git
cd codium-ai-ide

# Make the script executable
chmod +x scripts/install.sh

# Run the installation script
./scripts/install.sh
```

## Running the Application

```bash
pnpm start
```

## Development

```bash
# Run in development mode with hot reload
pnpm dev
```

## Building for Distribution

```bash
pnpm build
```

This will create distributables in the `dist` directory.

## Configuration

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
```

## License

MIT

## Acknowledgments

- [Electron](https://www.electronjs.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [VSCodium](https://github.com/VSCodium/vscodium)
- [GitHub AI Models](https://github.com/features/copilot) 
