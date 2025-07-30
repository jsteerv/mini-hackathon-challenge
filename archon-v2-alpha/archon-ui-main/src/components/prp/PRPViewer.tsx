import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PRPContent } from './types/prp.types';
import { MetadataSection } from './sections/MetadataSection';
import { SectionRenderer } from './renderers/SectionRenderer';
import './PRPViewer.css';

interface PRPViewerProps {
  content: PRPContent;
  isDarkMode?: boolean;
  sectionOverrides?: Record<string, React.ComponentType<any>>;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

/**
 * Process content to handle [Image #N] placeholders
 */
const processContent = (content: any): any => {
  if (typeof content === 'string') {
    // Replace [Image #N] with proper markdown image syntax
    return content.replace(/\[Image #(\d+)\]/g, (match, num) => {
      return `![Image ${num}](placeholder-image-${num})`;
    });
  }
  
  if (Array.isArray(content)) {
    return content.map(item => processContent(item));
  }
  
  if (typeof content === 'object' && content !== null) {
    const processed: any = {};
    for (const [key, value] of Object.entries(content)) {
      processed[key] = processContent(value);
    }
    return processed;
  }
  
  return content;
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  accentColor = 'blue'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorMap = {
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600',
    green: 'from-green-400 to-green-600',
    orange: 'from-orange-400 to-orange-600',
    pink: 'from-pink-400 to-pink-600',
    cyan: 'from-cyan-400 to-cyan-600',
    indigo: 'from-indigo-400 to-indigo-600',
    emerald: 'from-emerald-400 to-emerald-600',
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 dark:bg-black/20 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group"
      >
        {icon && (
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[accentColor as keyof typeof colorMap] || colorMap.blue} text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex-1 text-left">
          {title}
        </h2>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[50000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-4 pl-4">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Flexible PRP Viewer that dynamically renders sections based on content structure
 */
export const PRPViewer: React.FC<PRPViewerProps> = ({ 
  content, 
  isDarkMode = false,
  sectionOverrides = {}
}) => {
  if (!content || typeof content !== 'object') {
    return <div className="text-gray-500">No PRP content available</div>;
  }

  // Process content to handle [Image #N] placeholders
  const processedContent = processContent(content);

  // Extract sections (skip metadata fields)
  const metadataFields = ['title', 'version', 'author', 'date', 'status', 'document_type'];
  const sections = Object.entries(processedContent).filter(([key]) => !metadataFields.includes(key));
  
  // Debug: Log sections being rendered
  console.log('PRP Sections found:', sections.map(([key]) => key));
  
  // Group sections by type for better organization
  const sectionGroups = {
    overview: ['context', 'overview', 'background', 'objectives', 'requirements'],
    personas: ['user_personas', 'personas', 'users', 'stakeholders'],
    flows: ['user_flows', 'flows', 'journeys', 'workflows'],
    metrics: ['success_metrics', 'metrics', 'kpis', 'goals'],
    ui: ['ui_improvements', 'visual_design', 'interaction_patterns', 'responsive_design'],
    planning: ['implementation_plan', 'plan', 'phases', 'roadmap', 'timeline'],
    technical: ['technical_implementation', 'architecture', 'tech_stack', 'component_architecture'],
    validation: ['validation_gates', 'testing', 'quality', 'acceptance_criteria'],
    information: ['information_architecture', 'current_state_analysis'],
  };
  
  // Sort sections by group
  const sortedSections = sections.sort(([a], [b]) => {
    const getGroupIndex = (key: string) => {
      const normalizedKey = key.toLowerCase();
      for (let i = 0; i < Object.keys(sectionGroups).length; i++) {
        const group = Object.keys(sectionGroups)[i];
        if (sectionGroups[group as keyof typeof sectionGroups].some(g => normalizedKey.includes(g))) {
          return i;
        }
      }
      return 999; // Put ungrouped sections at the end
    };
    
    return getGroupIndex(a) - getGroupIndex(b);
  });

  return (
    <div className={`prp-viewer ${isDarkMode ? 'dark' : ''}`}>
      {/* Metadata Header */}
      <MetadataSection content={processedContent} isDarkMode={isDarkMode} />

      {/* Dynamic Sections */}
      {sortedSections.map(([sectionKey, sectionData], index) => {
        // Check if this should be a collapsible section
        const isComplexSection = 
          typeof sectionData === 'object' && 
          sectionData !== null && 
          !Array.isArray(sectionData) &&
          Object.keys(sectionData).length > 0;
        
        const section = (
          <SectionRenderer
            key={sectionKey}
            sectionKey={sectionKey}
            data={sectionData}
            index={index}
            isDarkMode={isDarkMode}
            sectionOverrides={sectionOverrides}
          />
        );
        
        // Wrap complex sections in collapsible containers
        if (isComplexSection) {
          const normalizedKey = sectionKey.toLowerCase();
          let accentColor = 'blue';
          
          // Determine accent color based on section type
          if (normalizedKey.includes('persona')) accentColor = 'purple';
          else if (normalizedKey.includes('flow')) accentColor = 'pink';
          else if (normalizedKey.includes('metric')) accentColor = 'green';
          else if (normalizedKey.includes('ui') || normalizedKey.includes('design')) accentColor = 'indigo';
          else if (normalizedKey.includes('plan')) accentColor = 'orange';
          else if (normalizedKey.includes('technical')) accentColor = 'cyan';
          else if (normalizedKey.includes('validation')) accentColor = 'emerald';
          else if (normalizedKey.includes('information') || normalizedKey.includes('architecture')) accentColor = 'blue';
          
          return (
            <CollapsibleSection
              key={sectionKey}
              title={sectionKey.replace(/_/g, ' ').split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
              accentColor={accentColor}
              defaultOpen={index < 5} // Open first 5 sections by default
            >
              {section}
            </CollapsibleSection>
          );
        }
        
        // Simple sections don't need collapsible wrapper
        return <div key={sectionKey} className="mb-6">{section}</div>;
      })}
      
      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No additional sections found in this PRP document.</p>
        </div>
      )}
    </div>
  );
};