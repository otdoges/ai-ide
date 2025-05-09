import React from 'react';

interface StatusBarProps {
  language: string;
  line: number;
  column: number;
  indentation: string;
  encoding: string;
  branchName?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  language,
  line,
  column,
  indentation,
  encoding,
  branchName,
}) => {
  return (
    <div className="h-6 bg-blue-600 text-white flex items-center text-xs px-2 justify-between">
      <div className="flex space-x-4">
        {branchName && (
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM4.25 1A2.25 2.25 0 002 3.25v9.5A2.25 2.25 0 004.25 15h9.5A2.25 2.25 0 0016 12.75v-9.5A2.25 2.25 0 0014.75 1h-9.5z" />
            </svg>
            {branchName}
          </div>
        )}
        <div>{language}</div>
      </div>
      
      <div className="flex space-x-4">
        <div>Ln {line}, Col {column}</div>
        <div>{indentation}</div>
        <div>{encoding}</div>
      </div>
    </div>
  );
};

export default StatusBar; 