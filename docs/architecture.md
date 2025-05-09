# Component Architecture Diagram

```mermaid
flowchart TD
    App --> Layout
    Layout -->|Panel| Editor
    Layout -->|Panel| FileExplorer
    Layout -->|Panel| Chat
    Layout -->|Panel| CommandPalette
    Layout -->|Panel| Settings
    Layout -->|Panel| StatusBar
    Editor --> MonacoEditor
    FileExplorer --> FileTree
    Chat --> AIService
    CommandPalette --> Commands
    Settings --> ThemeConfig
    StatusBar --> GitBranch
    StatusBar --> CursorPosition
```

## Key Components
- **App**: Root entry, renders Layout.
- **Layout**: Manages all main panels and modals.
- **Editor**: Monaco Editor integration.
- **FileExplorer**: File tree and file operations.
- **Chat**: AI chat interface.
- **CommandPalette**: Quick command launcher.
- **Settings**: Theme and font configuration.
- **StatusBar**: Shows branch, language, cursor, etc.

_This diagram reflects the current/planned structure. Update as you add new features!_
