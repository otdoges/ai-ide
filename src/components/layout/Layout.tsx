import React, { useState, useEffect } from 'react';
import Editor from '../editor/Editor';
import FileExplorer from '../sidebar/FileExplorer';
import Chat from '../chat/Chat';
import CommandPalette from '../editor/CommandPalette';
import Settings from '../settings/Settings';
import StatusBar from './StatusBar';

// Define the Monaco editor instance type
interface MonacoEditorInstance {
  focus: () => void;
  onDidChangeCursorPosition: (callback: (e: { position: { lineNumber: number; column: number } }) => void) => void;
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileItem[];
  path: string;
}

interface Command {
  id: string;
  name: string;
  shortcut?: string;
  action: () => void;
}

export const Layout: React.FC = () => {
  // Mock file structure for demo
  const [files, _setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'src',
      type: 'directory',
      path: '/src',
      children: [
        {
          id: '2',
          name: 'components',
          type: 'directory',
          path: '/src/components',
          children: [
            {
              id: '3',
              name: 'App.tsx',
              type: 'file',
              path: '/src/components/App.tsx',
            },
            {
              id: '4',
              name: 'Index.tsx',
              type: 'file',
              path: '/src/components/Index.tsx',
            },
          ],
        },
        {
          id: '5',
          name: 'utils',
          type: 'directory',
          path: '/src/utils',
          children: [
            {
              id: '6',
              name: 'helpers.ts',
              type: 'file',
              path: '/src/utils/helpers.ts',
            },
          ],
        },
      ],
    },
  ]);

  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [code, setCode] = useState<string>('// Start coding here...');
  const [language, setLanguage] = useState<string>('typescript');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatPanelHeight, setChatPanelHeight] = useState('30%');
  const [theme, setTheme] = useState<string>('vs-dark');
  const [fontSize, setFontSize] = useState<number>(14);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const handleFileSelect = (file: FileItem) => {
    setActiveFile(file);
    // In a real app, you would load the file content here
    setCode(`// Content of ${file.name}\n\nconsole.log('This is a sample file content.');`);
    
    // Set language based on file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
        setLanguage('javascript');
        break;
      case 'ts':
        setLanguage('typescript');
        break;
      case 'tsx':
        setLanguage('typescript');
        break;
      case 'jsx':
        setLanguage('javascript');
        break;
      case 'html':
        setLanguage('html');
        break;
      case 'css':
        setLanguage('css');
        break;
      default:
        setLanguage('plaintext');
    }
  };

  // Command palette commands
  const commands: Command[] = [
    {
      id: '1',
      name: 'Open File',
      shortcut: 'Ctrl+P',
      action: () => {
        console.log('Open file command executed');
      },
    },
    {
      id: '2',
      name: 'Save File',
      shortcut: 'Ctrl+S',
      action: () => {
        console.log('Save file command executed');
      },
    },
    {
      id: '3',
      name: 'Toggle Chat Panel',
      shortcut: 'Ctrl+J',
      action: () => {
        setChatPanelHeight(chatPanelHeight === '30%' ? '10%' : '30%');
      },
    },
    {
      id: '4',
      name: 'Find in File',
      shortcut: 'Ctrl+F',
      action: () => {
        console.log('Find in file command executed');
      },
    },
    {
      id: '5',
      name: 'Find in All Files',
      shortcut: 'Ctrl+Shift+F',
      action: () => {
        console.log('Find in all files command executed');
      },
    },
    {
      id: '6',
      name: 'Open Settings',
      shortcut: 'Ctrl+,',
      action: () => {
        setIsSettingsOpen(true);
      },
    }
  ];

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette shortcut (Ctrl+Shift+P or Cmd+Shift+P)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      
      // Settings shortcut (Ctrl+, or Cmd+,)
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleEditorMount = (editor: MonacoEditorInstance) => {
    editor.onDidChangeCursorPosition(e => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
      
      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        fontSizeEditer={fontSize}
        onThemeChange={setTheme}
        onFontSizeChange={setFontSize}
      />
      
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700">
        <FileExplorer files={files} onFileSelect={handleFileSelect} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Editor */}
        <div className="flex-1">
          {activeFile ? (
            <div className="h-full flex flex-col">
              <div className="bg-gray-800 p-2 text-sm border-b border-gray-700">
                {activeFile.path}
              </div>
              <div className="flex-1">
                <Editor 
                  defaultLanguage={language}
                  defaultValue={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorMount}
                  path={activeFile.path}
                  theme={theme}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center p-6">
                <h2 className="text-xl mb-4">Welcome to AI-IDE</h2>
                <p className="mb-2">Select a file from the explorer to start editing</p>
                <p className="text-sm">Press <kbd className="bg-gray-700 px-2 py-1 rounded">Ctrl+Shift+P</kbd> to open the command palette</p>
                <p className="text-sm mt-2">Press <kbd className="bg-gray-700 px-2 py-1 rounded">Ctrl+,</kbd> to open settings</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat */}
        <div className="border-t border-gray-700" style={{ height: chatPanelHeight }}>
          <Chat 
            activeFile={activeFile ? {
              name: activeFile.name,
              path: activeFile.path,
              content: code
            } : undefined}
            language={language}
          />
        </div>
        
        {/* Status Bar */}
        <StatusBar 
          language={language}
          line={cursorPosition.line}
          column={cursorPosition.column}
          indentation="Spaces: 2"
          encoding="UTF-8"
          branchName="main"
        />
      </div>
    </div>
  );
};

export default Layout; 