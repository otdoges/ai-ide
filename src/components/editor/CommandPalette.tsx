import React, { useState, useEffect, useRef } from 'react';

interface Command {
  id: string;
  name: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter commands based on search term
    const filtered = commands.filter((command) =>
      command.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchTerm, commands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  const executeCommand = (command: Command) => {
    command.action();
    onClose();
  };

  // Scroll selected command into view
  useEffect(() => {
    const selectedElement = document.getElementById(`command-${selectedIndex}`);
    if (selectedElement && commandsContainerRef.current) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[20vh] z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or search..."
          className="w-full p-4 bg-gray-700 text-white focus:outline-none"
          autoFocus
        />
        <div 
          ref={commandsContainerRef}
          className="max-h-80 overflow-y-auto"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-gray-400">No commands found</div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                id={`command-${index}`}
                key={command.id}
                className={`p-3 flex justify-between items-center cursor-pointer ${
                  index === selectedIndex ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                onClick={() => executeCommand(command)}
              >
                <div className="text-white">{command.name}</div>
                {command.shortcut && (
                  <div className="text-gray-400 text-sm">{command.shortcut}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette; 