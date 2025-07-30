import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Target, Users, BarChart3, 
  Workflow, CheckCircle2, Clock, Layers, Code, 
  Brain, Sparkles, Zap, Shield, Gauge, Award,
  Navigation, BookOpen, Settings, Database
} from 'lucide-react';

interface PRPViewerProps {
  content: any;
  isDarkMode?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

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
    cyan: 'from-cyan-400 to-cyan-600'
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 rounded-lg bg-white/5 dark:bg-black/20 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group"
      >
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[accentColor as keyof typeof colorMap]} text-white shadow-lg group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex-1 text-left">
          {title}
        </h2>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-4 pl-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const PersonaCard: React.FC<{ persona: any; personaKey: string }> = ({ persona, personaKey }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getPersonaIcon = (key: string) => {
    if (key.includes('admin')) return '👨‍💼';
    if (key.includes('formulator')) return '🧪';
    if (key.includes('purchasing')) return '💰';
    return '👤';
  };

  return (
    <div className="mb-4 group">
      <div 
        className="p-6 rounded-xl bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className="text-4xl">{getPersonaIcon(personaKey)}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              {persona.name || personaKey}
            </h3>
            {persona.role && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{persona.role}</p>
            )}
            
            {persona.goals && (
              <div className={`transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`}>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Goals
                </h4>
                <ul className="space-y-1 mb-4">
                  {persona.goals.map((goal: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {persona.pain_points && (
              <div className={`transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`}>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Pain Points
                </h4>
                <ul className="space-y-1">
                  {persona.pain_points.map((point: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-500 text-right">
          Click to {isExpanded ? 'collapse' : 'expand'} details
        </div>
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ metric: string; category: string }> = ({ metric, category }) => {
  const getCategoryColor = (cat: string) => {
    if (cat.includes('admin')) return 'from-blue-400 to-blue-600';
    if (cat.includes('business')) return 'from-purple-400 to-purple-600';
    if (cat.includes('customer')) return 'from-green-400 to-green-600';
    return 'from-gray-400 to-gray-600';
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('admin')) return <Settings className="w-4 h-4" />;
    if (cat.includes('business')) return <BarChart3 className="w-4 h-4" />;
    if (cat.includes('customer')) return <Users className="w-4 h-4" />;
    return <Gauge className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 group">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(category)} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
        {getCategoryIcon(category)}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{metric}</p>
    </div>
  );
};

const FlowDiagram: React.FC<{ flow: any; flowName: string }> = ({ flow, flowName }) => {
  const renderFlowNode = (obj: any, depth: number = 0): React.ReactNode => {
    return Object.entries(obj).map(([key, value]) => {
      const nodeKey = `${flowName}-${key}-${depth}`;
      
      if (typeof value === 'string') {
        return (
          <div key={nodeKey} className="flex items-center gap-2 p-2 ml-4">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{key}:</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
          </div>
        );
      } else if (typeof value === 'object' && value !== null) {
        return (
          <div key={nodeKey} className="mb-3">
            <div className="flex items-center gap-2 p-2 font-medium text-gray-800 dark:text-white">
              <Navigation className="w-4 h-4 text-purple-500" />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
            <div className="ml-6 border-l-2 border-purple-200 dark:border-purple-800 pl-4">
              {renderFlowNode(value, depth + 1)}
            </div>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
      <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
        <Workflow className="w-5 h-5 text-purple-500" />
        {flowName.replace(/_/g, ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')}
      </h4>
      {renderFlowNode(flow)}
    </div>
  );
};

export const PRPViewer: React.FC<PRPViewerProps> = ({ content, isDarkMode = false }) => {
  if (!content || typeof content !== 'object') {
    return <div className="text-gray-500">No PRP content available</div>;
  }

  return (
    <div className={`prp-viewer ${isDarkMode ? 'dark' : ''}`}>
      {/* Header with metadata */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          {content.title || 'Product Requirements Prompt'}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm">
          {content.version && (
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Version {content.version}</span>
            </div>
          )}
          {content.author && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">{content.author}</span>
            </div>
          )}
          {content.date && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">{content.date}</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Section */}
      {content.context && (
        <CollapsibleSection 
          title="Context" 
          icon={<Brain className="w-5 h-5" />}
          accentColor="blue"
        >
          <div className="space-y-4">
            {content.context.scope && (
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Scope
                </h4>
                <p className="text-gray-700 dark:text-gray-300">{content.context.scope}</p>
              </div>
            )}
            
            {content.context.background && (
              <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  Background
                </h4>
                <p className="text-gray-700 dark:text-gray-300">{content.context.background}</p>
              </div>
            )}
            
            {content.context.objectives && (
              <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-500" />
                  Objectives
                </h4>
                <ul className="space-y-2">
                  {content.context.objectives.map((obj: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* User Personas */}
      {content.user_personas && (
        <CollapsibleSection 
          title="User Personas" 
          icon={<Users className="w-5 h-5" />}
          accentColor="purple"
        >
          <div className="grid gap-4">
            {Object.entries(content.user_personas).map(([key, persona]) => (
              <PersonaCard key={key} persona={persona} personaKey={key} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* User Flows */}
      {content.user_flows && (
        <CollapsibleSection 
          title="User Flows" 
          icon={<Workflow className="w-5 h-5" />}
          accentColor="pink"
        >
          <div className="grid gap-4">
            {Object.entries(content.user_flows).map(([flowName, flow]) => (
              <FlowDiagram key={flowName} flow={flow} flowName={flowName} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Success Metrics */}
      {content.success_metrics && (
        <CollapsibleSection 
          title="Success Metrics" 
          icon={<BarChart3 className="w-5 h-5" />}
          accentColor="green"
        >
          <div className="grid gap-4">
            {Object.entries(content.success_metrics).map(([category, metrics]: [string, any]) => (
              <div key={category}>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 capitalize">
                  {category.replace(/_/g, ' ')}
                </h4>
                <div className="grid gap-2">
                  {Array.isArray(metrics) ? 
                    metrics.map((metric: string, idx: number) => (
                      <MetricItem key={idx} metric={metric} category={category} />
                    )) :
                    Object.entries(metrics).map(([key, value]) => (
                      <MetricItem key={key} metric={`${key}: ${value}`} category={category} />
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Implementation Plan */}
      {content.implementation_plan && (
        <CollapsibleSection 
          title="Implementation Plan" 
          icon={<Clock className="w-5 h-5" />}
          accentColor="orange"
        >
          <div className="space-y-4">
            {Object.entries(content.implementation_plan).map(([phase, details]: [string, any]) => (
              <div key={phase} className="p-4 rounded-lg bg-gradient-to-r from-orange-50/50 to-yellow-50/50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800">
                <h4 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  {phase.toUpperCase()}
                  {details.duration && (
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                      ({details.duration})
                    </span>
                  )}
                </h4>
                {details.deliverables && (
                  <ul className="space-y-1">
                    {details.deliverables.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Technical Implementation */}
      {content.technical_implementation && (
        <CollapsibleSection 
          title="Technical Implementation" 
          icon={<Code className="w-5 h-5" />}
          accentColor="cyan"
        >
          <div className="grid gap-4">
            {Object.entries(content.technical_implementation).map(([section, details]: [string, any]) => (
              <div key={section} className="p-4 rounded-lg bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-500" />
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </h4>
                <div className="space-y-2">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5"></div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Validation Gates */}
      {content.validation_gates && (
        <CollapsibleSection 
          title="Validation Gates" 
          icon={<Shield className="w-5 h-5" />}
          accentColor="green"
        >
          <div className="grid gap-4">
            {Object.entries(content.validation_gates).map(([category, items]: [string, any]) => (
              <div key={category} className="p-4 rounded-lg bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-3 capitalize flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  {category}
                </h4>
                {Array.isArray(items) && (
                  <ul className="space-y-1">
                    {items.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};