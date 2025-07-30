import React from 'react';
import { FileText } from 'lucide-react';
import { SectionProps } from '../types/prp.types';
import { formatKey, formatValue } from '../utils/formatters';

/**
 * Generic fallback section component that intelligently renders any data structure
 */
export const GenericSection: React.FC<SectionProps> = ({
  title,
  data,
  icon = <FileText className="w-5 h-5" />,
  accentColor = 'gray',
  defaultOpen = true,
  isDarkMode = false,
}) => {
  const renderValue = (value: any, depth: number = 0): React.ReactNode => {
    const indent = depth * 16;
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Empty</span>;
    }
    
    // Handle primitives
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-gray-700 dark:text-gray-300">{formatValue(value)}</span>;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">No items</span>;
      }
      
      // Check if it's an array of primitives
      const isSimpleArray = value.every(item => 
        typeof item === 'string' || 
        typeof item === 'number' || 
        typeof item === 'boolean'
      );
      
      if (isSimpleArray) {
        return (
          <ul className="space-y-1 mt-2">
            {value.map((item, index) => (
              <li key={index} className="flex items-start gap-2" style={{ marginLeft: indent }}>
                <span className="text-gray-400 mt-0.5">•</span>
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        );
      }
      
      // Array of objects
      return (
        <div className="space-y-2 mt-2">
          {value.map((item, index) => (
            <div key={index} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4" style={{ marginLeft: indent }}>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Item {index + 1}
              </div>
              {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-gray-400 italic">No properties</span>;
      }
      
      return (
        <div className="space-y-2 mt-2">
          {entries.map(([key, val]) => (
            <div key={key} className="flex flex-col" style={{ marginLeft: indent }}>
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-700 dark:text-gray-300 min-w-fit">
                  {formatKey(key)}:
                </span>
                {typeof val === 'object' && val !== null && (Array.isArray(val) || Object.keys(val).length > 0) ? (
                  <div className="flex-1">{renderValue(val, depth + 1)}</div>
                ) : (
                  <div className="flex-1">{renderValue(val, depth)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback for any other type
    return <span className="text-gray-700 dark:text-gray-300">{String(value)}</span>;
  };
  
  const getBackgroundColor = () => {
    const colorMap = {
      blue: 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      purple: 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      green: 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      orange: 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      pink: 'bg-pink-50/50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
      cyan: 'bg-cyan-50/50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
      gray: 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
    };
    return colorMap[accentColor as keyof typeof colorMap] || colorMap.gray;
  };
  
  return (
    <div className={`p-4 rounded-lg border ${getBackgroundColor()}`}>
      <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="overflow-x-auto">
        {renderValue(data)}
      </div>
    </div>
  );
};