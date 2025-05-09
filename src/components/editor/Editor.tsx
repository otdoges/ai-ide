import React, { useState } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';

// Define the type for the Monaco Editor instance
interface MonacoEditorInstance {
  focus: () => void;
  onDidChangeCursorPosition: (callback: (e: any) => void) => void;
}

interface EditorProps {
  defaultLanguage?: string;
  defaultValue?: string;
  theme?: string;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: MonacoEditorInstance) => void;
  path?: string;
}

export const Editor: React.FC<EditorProps> = ({
  defaultLanguage = 'javascript',
  defaultValue = '// Start coding here...',
  theme = 'vs-dark',
  onChange,
  onMount,
  path
}) => {
  const [value, setValue] = useState(defaultValue);

  const handleEditorChange = (value: string | undefined) => {
    setValue(value || '');
    if (onChange) {
      onChange(value);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editor.focus();
    
    // Pass the editor instance to the parent component if callback is provided
    if (onMount) {
      onMount(editor);
    }
  };

  return (
    <div className="h-full w-full">
      <MonacoEditor
        height="100%"
        width="100%"
        language={defaultLanguage}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        path={path}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          renderLineHighlight: 'all',
          fontSize: 14,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
          },
        }}
      />
    </div>
  );
};

export default Editor; 