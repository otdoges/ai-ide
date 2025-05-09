# AI IDE

An AI-powered integrated development environment built with Electron, React, TypeScript, and Supabase.

## Features

- 🧠 AI-powered coding assistance
- 📝 Monaco code editor with syntax highlighting
- 📁 File explorer and management
- 🎯 Command palette for quick actions
- ⚡ Electron-based cross-platform support
- 🔄 Supabase backend for user and project data

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Git LFS (for handling large files)

### Installation

1. **Install Git LFS**

```bash
# For Ubuntu/Debian
sudo apt-get install git-lfs

# For macOS
brew install git-lfs

# For Windows
# Download from https://git-lfs.github.com
```

2. **Setup Git LFS**

```bash
git lfs install
```

3. **Clone the repository**

```bash
git clone https://github.com/yourusername/ai-ide.git
cd ai-ide
```

4. **Install dependencies**

```bash
pnpm install
```

5. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your own configuration
```

### Development

```bash
# Start development server
pnpm dev

# For Linux (with GTK fix)
pnpm dev:linux
# or
./run-linux.sh
```

### Building

```bash
# Build for production
pnpm build
```

## Git LFS

This project uses Git LFS for managing large files. Git LFS replaces large files with text pointers inside Git, while storing the file contents on a remote server.

Important files tracked by Git LFS:
- `*.AppImage`
- `*.asar`
- Application binaries

## Project Structure

```
ai-ide/
├── electron/        # Electron main process code
├── src/
│   ├── assets/      # Static assets
│   ├── components/  # React components
│   │   ├── chat/    # AI chat components
│   │   ├── editor/  # Monaco editor components
│   │   ├── layout/  # Layout components
│   │   ├── settings/# Settings components
│   │   └── sidebar/ # Sidebar components
│   ├── services/    # Service modules
│   │   ├── ai/      # AI service
│   │   └── database/# Supabase integration
├── public/          # Public static files
└── docs/            # Documentation
```

## Running on Linux

If you encounter GTK version conflicts on Linux, use the provided `run-linux.sh` script or run:

```bash
GTK_VERSION=3 GDK_BACKEND= pnpm dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
