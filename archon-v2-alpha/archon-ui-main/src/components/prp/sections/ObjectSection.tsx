import React from 'react';
import { Box, FileText } from 'lucide-react';
import { PRPSectionProps } from '../types/prp.types';
import { formatKey, formatValue } from '../utils/formatters';

/**
 * Component for rendering complex object structures with nested data
 * Used for sections like design systems, architecture, etc.
 */
export const ObjectSection: React.FC<PRPSectionProps> = ({ 
  title, 
  data, 
  icon = <Box className="w-5 h-5" />,
  accentColor = 'indigo',
  isDarkMode = false,
  defaultOpen = true 
}) => {
  if (!data || typeof data !== 'object') return null;

  const colorMap = {
    blue: 'from-blue-400 to-blue-600 border-blue-500',
    purple: 'from-purple-400 to-purple-600 border-purple-500',
    green: 'from-green-400 to-green-600 border-green-500',
    orange: 'from-orange-400 to-orange-600 border-orange-500',
    pink: 'from-pink-400 to-pink-600 border-pink-500',
    cyan: 'from-cyan-400 to-cyan-600 border-cyan-500',
    indigo: 'from-indigo-400 to-indigo-600 border-indigo-500',
    emerald: 'from-emerald-400 to-emerald-600 border-emerald-500',
  };

  const bgColorMap = {
    blue: 'bg-blue-50 dark:bg-blue-950',
    purple: 'bg-purple-50 dark:bg-purple-950',
    green: 'bg-green-50 dark:bg-green-950',
    orange: 'bg-orange-50 dark:bg-orange-950',
    pink: 'bg-pink-50 dark:bg-pink-950',
    cyan: 'bg-cyan-50 dark:bg-cyan-950',
    indigo: 'bg-indigo-50 dark:bg-indigo-950',
    emerald: 'bg-emerald-50 dark:bg-emerald-950',
  };

  const renderNestedObject = (obj: any, depth: number = 0): React.ReactNode => {
    if (!obj || typeof obj !== 'object') {
      return <span className="text-gray-700 dark:text-gray-300">{formatValue(obj)}</span>;
    }

    if (Array.isArray(obj)) {
      return (
        <ul className="space-y-2 mt-2">
          {obj.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <div className="flex-1">{renderNestedObject(item, depth + 1)}</div>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className={`space-y-3 ${depth > 0 ? 'mt-2' : ''}`}>
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className={`${depth > 0 ? 'ml-4' : ''}`}>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {formatKey(key)}
                </h5>
                <div className="text-sm">
                  {renderNestedObject(value, depth + 1)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-lg p-6 ${bgColorMap[accentColor as keyof typeof bgColorMap] || bgColorMap.indigo} border-l-4 ${colorMap[accentColor as keyof typeof colorMap].split(' ')[2]}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[accentColor as keyof typeof colorMap].split(' ').slice(0, 2).join(' ')} text-white shadow-lg`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {title}
          </h3>
        </div>
        
        {renderNestedObject(data)}
      </div>
    </div>
  );
};