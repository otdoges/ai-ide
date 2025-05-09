import React, { useState } from 'react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  fontSizeEditer: number;
  onThemeChange: (theme: string) => void;
  onFontSizeChange: (size: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  currentTheme,
  fontSizeEditer,
  onThemeChange,
  onFontSizeChange,
}) => {
  const [theme, setTheme] = useState(currentTheme);
  const [fontSize, setFontSize] = useState(fontSizeEditer);

  const handleSave = () => {
    onThemeChange(theme);
    onFontSizeChange(fontSize);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
            >
              <option value="vs-dark">Dark (Default)</option>
              <option value="vs">Light</option>
              <option value="hc-black">High Contrast Dark</option>
              <option value="hc-light">High Contrast Light</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">
              Editor Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 