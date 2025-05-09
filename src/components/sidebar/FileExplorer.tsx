import React, { useState } from 'react';
import { FaFolder, FaFolderOpen, FaFile, FaChevronRight, FaChevronDown } from 'react-icons/fa';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileItem[];
  path: string;
}

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
}

const FileTreeItem: React.FC<{
  item: FileItem;
  onFileSelect: (file: FileItem) => void;
  level: number;
}> = ({ item, onFileSelect, level }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (item.type === 'directory') {
      setIsOpen(!isOpen);
    }
  };

  const handleFileSelect = () => {
    if (item.type === 'file') {
      onFileSelect(item);
    }
  };

  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer`}
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={item.type === 'directory' ? handleToggle : handleFileSelect}
      >
        <span className="mr-1">
          {item.type === 'directory' ? (
            isOpen ? (
              <span className="flex items-center">
                <FaChevronDown className="mr-1 text-gray-400" size={10} />
                <FaFolderOpen className="text-blue-400" />
              </span>
            ) : (
              <span className="flex items-center">
                <FaChevronRight className="mr-1 text-gray-400" size={10} />
                <FaFolder className="text-blue-400" />
              </span>
            )
          ) : (
            <FaFile className="text-gray-400" />
          )}
        </span>
        <span className="ml-1 text-sm truncate">{item.name}</span>
      </div>
      
      {isOpen && item.children && (
        <div className="ml-2">
          {item.children.map((child) => (
            <FileTreeItem 
              key={child.id} 
              item={child} 
              onFileSelect={onFileSelect} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect }) => {
  return (
    <div className="h-full overflow-auto bg-gray-800 text-white">
      <div className="p-2 text-sm font-semibold border-b border-gray-700">
        EXPLORER
      </div>
      <div className="p-1">
        {files.map((file) => (
          <FileTreeItem 
            key={file.id} 
            item={file} 
            onFileSelect={onFileSelect} 
            level={0}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer; 