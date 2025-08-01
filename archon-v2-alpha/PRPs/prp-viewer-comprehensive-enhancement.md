name: "Comprehensive PRP Viewer and DocsTab Enhancement"
description: |
  ## Purpose
  Comprehensive enhancement of PRP Viewer and DocsTab components based on multi-faceted analysis
  
  ## Core Principles
  1. **Context is King**: All necessary documentation and analysis included
  2. **Validation Loops**: Executable tests at every level
  3. **Information Dense**: Specific patterns and examples from analysis
  4. **Progressive Success**: Start simple, validate, enhance

---

## Goal
Create a comprehensive enhancement of the PRP Viewer and DocsTab components that addresses markdown parsing issues, implements beautiful UI improvements with ID display/copy functionality, adds real-time Socket.IO synchronization, and optimizes performance through lazy loading and state management improvements.

## Why
- **Root Cause Analysis**: MarkdownDocumentRenderer expects structured markdown but receives JSON with embedded markdown
- **User Experience**: Documents need persistent ID display and copy functionality for better workflow
- **Real-time Collaboration**: Multiple users need synchronized document viewing and editing
- **Performance**: Current implementation has rendering issues with complex nested structures
- **State Management**: Document interactions need proper state persistence and synchronization

## What
Create a robust, performance-optimized PRP viewer system that:
- Fixes core markdown parsing for JSON structures with embedded markdown
- Provides enhanced DocumentCard with always-visible ID display and copy functionality
- Implements beautiful CollapsibleSectionRenderer with section-specific styling
- Adds comprehensive Socket.IO real-time synchronization
- Optimizes performance with lazy loading and render batching
- Maintains backward compatibility with existing document formats

### Success Criteria
- [ ] MarkdownDocumentRenderer correctly parses JSON with embedded markdown
- [ ] DocumentCard displays UUID and provides copy functionality (always visible for selected)
- [ ] CollapsibleSectionRenderer has beautiful section-specific styling
- [ ] Real-time document updates broadcast via Socket.IO
- [ ] Document deletion synchronized across all connected clients
- [ ] ID assignment events properly handled
- [ ] Performance optimizations prevent re-render cascades
- [ ] Lazy loading implemented for large document sets
- [ ] Backward compatibility maintained for existing documents
- [ ] Conflict resolution handles simultaneous edits

## All Needed Context

### Analysis Results Summary
```yaml
UI Analysis:
  root_cause: "MarkdownDocumentRenderer expects structured markdown but receives JSON with embedded markdown"
  key_improvements:
    - Enhanced CollapsibleSectionRenderer with section-specific styling
    - Enhanced markdown parser for complex JSON structures
    - EnhancedDocumentCard with ID display and copy functionality
    - State management improvements for document interactions
    - Performance optimizations with lazy loading

Server Analysis:
  current_state: "Documents already have UUIDs"
  requirements:
    - Ensure ID persistence in UI state
    - API endpoints already exist for document operations
    - Backward compatibility maintained
    - No schema changes needed, just proper ID handling in UI

Socket.IO Analysis:
  comprehensive_features_needed:
    - Document update broadcasting
    - Delete operation synchronization
    - ID assignment events
    - Collaborative viewing state sync
    - Conflict resolution for simultaneous edits
    - Performance optimizations with batching

Context Research:
  current_issues:
    - PRPViewer processContent() exists but needs enhancement for nested structures
    - DocumentCard already implemented but needs ID display/copy
    - Task card pattern available for copy functionality reference
    - MarkdownDocumentRenderer parsing issue with JSON structures
    - Performance concerns with multiple re-renders
```

### Current File Structure Analysis
```typescript
// Key files requiring modification:
- archon-ui-main/src/components/prp/PRPViewer.tsx
  // Current processContent() function needs enhancement
  
- archon-ui-main/src/components/prp/components/MarkdownDocumentRenderer.tsx  
  // Core issue: expects markdown string, receives JSON with markdown
  
- archon-ui-main/src/components/project-tasks/DocsTab.tsx
  // DocumentCard implementation needs ID display/copy
  
- archon-ui-main/src/services/socketService.ts
  // Socket.IO integration for real-time updates
```

### Known Issues & Root Causes
```typescript
// CRITICAL ISSUE 1: JSON Structure Mismatch
// MarkdownDocumentRenderer expects:
type ExpectedInput = string; // Pure markdown

// But receives:
type ActualInput = {
  document_type: "prp",
  title: "PRP Title",
  sections: {
    goal: "markdown content here...",
    why: ["item1", "item2"],
    what: {
      description: "markdown content...",
      success_criteria: ["criterion1", "criterion2"]
    }
  }
};

// CRITICAL ISSUE 2: ID Display Pattern
// Current DocumentCard lacks persistent ID display
// Need pattern similar to TaskCard with copy functionality

// CRITICAL ISSUE 3: State Management
// Document interactions don't persist properly
// Selected document state not synchronized with ID persistence

// CRITICAL ISSUE 4: Socket.IO Integration Missing
// No real-time synchronization for document operations
// Concurrent editing conflicts not handled
```

### Existing Patterns & References
```typescript
// Pattern 1: TaskCard Copy Functionality (Reference)
// File: archon-ui-main/src/components/task-card/TaskCard.tsx
const handleCopyId = () => {
  navigator.clipboard.writeText(task.id);
  showToast('Task ID copied', 'success');
};

// Pattern 2: CollapsibleSection Pattern
// File: archon-ui-main/src/components/ui/CollapsibleSection.tsx
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  // Implementation available for reference
};

// Pattern 3: Socket.IO Event Pattern
// File: archon-ui-main/src/services/socketService.ts
socket.emit('document:update', { projectId, documentId, content });
socket.on('document:updated', (data) => {
  // Handle real-time updates
});
```

### Library Dependencies & Constraints
```json
{
  "dependencies": {
    "react": "^18.x",
    "socket.io-client": "^4.x",
    "lucide-react": "latest",
    "@headlessui/react": "latest"
  },
  "constraints": {
    "react_18_strict_mode": "Components double-mount in development",
    "socket_io_cleanup": "Must properly cleanup listeners to prevent memory leaks",
    "lazy_loading": "Use React.lazy() and Suspense for performance",
    "state_persistence": "Use proper keys for React list rendering"
  }
}
```

## Implementation Blueprint

### Phase 1: Fix Core Markdown Parsing Issue
```typescript
// UPDATE: archon-ui-main/src/components/prp/components/MarkdownDocumentRenderer.tsx
// Add enhanced JSON-to-Markdown conversion

interface EnhancedDocumentContent {
  document_type?: string;
  title?: string;
  [key: string]: any;
}

const MarkdownDocumentRenderer: React.FC<{
  content: string | EnhancedDocumentContent;
  isDarkMode: boolean;
}> = ({ content, isDarkMode }) => {
  const processContentToMarkdown = (input: string | EnhancedDocumentContent): string => {
    // If already a string, return as-is
    if (typeof input === 'string') {
      return input;
    }
    
    // Convert structured content to markdown
    let markdown = '';
    
    // Handle title
    if (input.title) {
      markdown += `# ${input.title}\n\n`;
    }
    
    // Process each section dynamically
    Object.entries(input).forEach(([key, value]) => {
      if (key === 'title' || key === 'document_type') return;
      
      const sectionTitle = formatSectionTitle(key);
      markdown += `## ${sectionTitle}\n\n`;
      markdown += formatSectionContent(value);
      markdown += '\n\n';
    });
    
    return markdown;
  };
  
  const formatSectionTitle = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const formatSectionContent = (value: any): string => {
    if (Array.isArray(value)) {
      return value.map(item => `- ${item}`).join('\n');
    }
    
    if (typeof value === 'object' && value !== null) {
      let result = '';
      Object.entries(value).forEach(([subKey, subValue]) => {
        const subTitle = formatSectionTitle(subKey);
        result += `### ${subTitle}\n\n`;
        result += formatSectionContent(subValue);
        result += '\n\n';
      });
      return result;
    }
    
    return String(value);
  };
  
  const markdownContent = processContentToMarkdown(content);
  
  return (
    <div 
      className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}
      dangerouslySetInnerHTML={{ 
        __html: marked(markdownContent, { breaks: true }) 
      }}
    />
  );
};
```

### Phase 2: Enhanced DocumentCard with ID Display/Copy
```typescript
// UPDATE: archon-ui-main/src/components/project-tasks/DocumentCard.tsx
// Add persistent ID display and copy functionality

import { Copy, Check } from 'lucide-react';

const EnhancedDocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isActive,
  onSelect,
  onDelete,
  isDarkMode
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(document.id);
      setIdCopied(true);
      showToast('Document ID copied', 'success');
      setTimeout(() => setIdCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy ID', 'error');
    }
  };
  
  return (
    <div
      className={`
        relative flex-shrink-0 w-64 p-4 rounded-lg cursor-pointer
        transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 shadow-lg ring-2 ring-blue-500/20' 
          : 'bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
      `}
      onClick={() => onSelect(document)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Document Type Badge */}
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-3 ${getTypeColor(document.document_type)}`}>
        {getDocumentIcon(document.document_type)}
        <span>{document.document_type || 'document'}</span>
      </div>
      
      {/* Title */}
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-3">
        {document.title}
      </h4>
      
      {/* ID Display - Always visible for selected, hover for others */}
      <div className={`
        flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 mb-2
        ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        transition-opacity duration-200
      `}>
        <code className="text-xs text-gray-600 dark:text-gray-400 font-mono flex-1 truncate">
          {document.id}
        </code>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopyId();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Copy ID"
        >
          {idCopied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3 text-gray-500" />
          )}
        </button>
      </div>
      
      {/* Metadata */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>{new Date(document.updated_at).toLocaleDateString()}</p>
        <p className="truncate">Last modified: {document.updated_by || 'Unknown'}</p>
      </div>
      
      {/* Delete Button */}
      {showDelete && !isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${document.title}"?\n\nID: ${document.id}`)) {
              onDelete(document.id);
            }
          }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-blue-500/5 pointer-events-none" />
      )}
    </div>
  );
};
```

### Phase 3: Enhanced CollapsibleSectionRenderer
```typescript
// CREATE: archon-ui-main/src/components/prp/components/CollapsibleSectionRenderer.tsx
// Beautiful section-specific styling with animations

interface CollapsibleSectionProps {
  title: string;
  content: any;
  sectionKey: string;
  isDarkMode: boolean;
  defaultOpen?: boolean;
}

const CollapsibleSectionRenderer: React.FC<CollapsibleSectionProps> = ({
  title,
  content,
  sectionKey,
  isDarkMode,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const getSectionIcon = (key: string) => {
    const iconMap = {
      goal: Target,
      why: HelpCircle,
      what: CheckSquare,
      context: Info,
      implementation: Code,
      validation: TestTube,
      success_criteria: Award,
      tasks: ListTodo,
      gotchas: AlertTriangle,
    };
    
    const IconComponent = iconMap[key.toLowerCase()] || FileText;
    return <IconComponent className="w-4 h-4" />;
  };
  
  const getSectionColor = (key: string) => {
    const colorMap = {
      goal: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20',
      why: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20',
      what: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20',
      context: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/20',
      implementation: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/20',
      validation: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20',
      success_criteria: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20',
      tasks: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20',
      gotchas: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20',
    };
    
    return colorMap[key.toLowerCase()] || 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50';
  };
  
  const formatContent = (value: any): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <ul className="space-y-2">
          {value.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 mt-1 text-gray-400 flex-shrink-0" />
              <span>{formatContent(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="space-y-4">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {formatSectionTitle(key)}
              </h4>
              <div className="text-gray-700 dark:text-gray-300">
                {formatContent(val)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'string' && value.startsWith('```')) {
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm">{value.replace(/```\w*\n?/, '').replace(/```$/, '')}</code>
        </pre>
      );
    }
    
    return <div className="prose prose-sm max-w-none dark:prose-invert">{String(value)}</div>;
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden mb-4 ${getSectionColor(sectionKey)}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {getSectionIcon(sectionKey)}
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <div
        ref={contentRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-gray-200/50 dark:border-gray-700/50">
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
};
```

### Phase 4: Socket.IO Real-time Synchronization
```typescript
// UPDATE: archon-ui-main/src/services/socketService.ts
// Add comprehensive document synchronization

class DocumentSyncService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private batchQueue: Array<{type: string, data: any}> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  
  connect(projectId: string) {
    this.socket = io('/documents', {
      query: { projectId }
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    if (!this.socket) return;
    
    // Document update events
    this.socket.on('document:updated', (data) => {
      this.emit('documentUpdated', data);
    });
    
    // Document deletion events
    this.socket.on('document:deleted', (data) => {
      this.emit('documentDeleted', data);
    });
    
    // ID assignment events
    this.socket.on('document:id_assigned', (data) => {
      this.emit('documentIdAssigned', data);
    });
    
    // Collaborative viewing state
    this.socket.on('document:viewer_joined', (data) => {
      this.emit('viewerJoined', data);
    });
    
    this.socket.on('document:viewer_left', (data) => {
      this.emit('viewerLeft', data);
    });
    
    // Conflict resolution
    this.socket.on('document:conflict', (data) => {
      this.emit('documentConflict', data);
    });
  }
  
  // Batched operations for performance
  updateDocument(documentId: string, content: any, immediate = false) {
    const updateData = { documentId, content, timestamp: Date.now() };
    
    if (immediate) {
      this.socket?.emit('document:update', updateData);
    } else {
      this.batchQueue.push({ type: 'update', data: updateData });
      this.scheduleBatchFlush();
    }
  }
  
  deleteDocument(documentId: string) {
    this.socket?.emit('document:delete', { documentId });
  }
  
  joinDocumentViewing(documentId: string) {
    this.socket?.emit('document:join_viewing', { documentId });
  }
  
  leaveDocumentViewing(documentId: string) {
    this.socket?.emit('document:leave_viewing', { documentId });
  }
  
  private scheduleBatchFlush() {
    if (this.batchTimeout) return;
    
    this.batchTimeout = setTimeout(() => {
      this.flushBatch();
      this.batchTimeout = null;
    }, 500); // 500ms batching window
  }
  
  private flushBatch() {
    if (this.batchQueue.length === 0) return;
    
    const updates = this.batchQueue.filter(item => item.type === 'update');
    if (updates.length > 0) {
      this.socket?.emit('document:batch_update', updates.map(item => item.data));
    }
    
    this.batchQueue = [];
  }
  
  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  disconnect() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.flushBatch(); // Flush remaining updates
    }
    
    this.socket?.disconnect();
    this.socket = null;
    this.eventListeners.clear();
  }
}

export const documentSyncService = new DocumentSyncService();
```

### Phase 5: Performance Optimizations
```typescript
// UPDATE: archon-ui-main/src/components/project-tasks/DocsTab.tsx
// Add lazy loading and performance optimizations

const LazyDocumentCard = React.lazy(() => 
  import('./DocumentCard').then(module => ({ default: module.EnhancedDocumentCard }))
);

const OptimizedDocsTab: React.FC<DocsTabProps> = (props) => {
  const [visibleDocuments, setVisibleDocuments] = useState<ProjectDoc[]>([]);
  const [loadedCount, setLoadedCount] = useState(20); // Initial load
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Virtualized document rendering
  const memoizedDocuments = useMemo(() => {
    return documents.slice(0, loadedCount);
  }, [documents, loadedCount]);
  
  // Intersection observer for lazy loading
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.dataset.documentId) {
            const documentId = entry.target.dataset.documentId;
            // Load document content if needed
          }
        });
      },
      { threshold: 0.1 }
    );
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
  
  // Load more documents on scroll
  const handleScroll = useCallback(
    debounce((e: React.UIEvent<HTMLDivElement>) => {
      const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
      const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
      
      if (scrollPercentage > 0.8 && loadedCount < documents.length) {
        setLoadedCount(prev => Math.min(prev + 10, documents.length));
      }
    }, 100),
    [documents.length, loadedCount]
  );
  
  return (
    <div className="space-y-4">
      {/* Document Cards Container with Lazy Loading */}
      <div 
        ref={containerRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
        onScroll={handleScroll}
      >
        <Suspense fallback={<DocumentCardSkeleton />}>
          {memoizedDocuments.map((doc, index) => (
            <LazyDocumentCard
              key={doc.id}
              document={doc}
              isActive={selectedDocument?.id === doc.id}
              onSelect={setSelectedDocument}
              onDelete={handleDeleteDocument}
              isDarkMode={isDarkMode}
              data-document-id={doc.id}
              ref={(el) => {
                if (el && observerRef.current) {
                  observerRef.current.observe(el);
                }
              }}
            />
          ))}
        </Suspense>
        
        {/* Loading indicator */}
        {loadedCount < documents.length && (
          <div className="flex-shrink-0 w-48 h-32 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        
        {/* Add New Document Card */}
        <AddDocumentCard onClick={() => setShowTemplateModal(true)} />
      </div>
    </div>
  );
};

// Skeleton component for loading states
const DocumentCardSkeleton: React.FC = () => (
  <div className="flex-shrink-0 w-64 h-32 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
);
```

### Task List with Agent Assignments
```yaml
Priority 1 Tasks (Immediate):
  task_1:
    title: "Fix MarkdownDocumentRenderer JSON parsing"
    description: "Enhance MarkdownDocumentRenderer to handle JSON with embedded markdown"
    agent: "archon-ui-expert"
    files:
      - archon-ui-main/src/components/prp/components/MarkdownDocumentRenderer.tsx
    success_criteria:
      - JSON structures with embedded markdown render correctly
      - Backward compatibility with pure markdown strings maintained
      - Performance impact < 10ms for typical documents
    
  task_2:
    title: "Implement Enhanced DocumentCard with ID display"
    description: "Add persistent ID display and copy functionality to DocumentCard"
    agent: "archon-ui-expert"
    files:
      - archon-ui-main/src/components/project-tasks/DocumentCard.tsx
      - archon-ui-main/src/components/project-tasks/DocsTab.tsx  
    success_criteria:
      - ID always visible for selected documents
      - Copy functionality works with toast confirmation
      - Visual feedback for copy action
      - Hover states for non-selected documents

Priority 2 Tasks (Important):
  task_3:
    title: "Create CollapsibleSectionRenderer with beautiful styling"
    description: "Implement enhanced CollapsibleSectionRenderer with section-specific styling"
    agent: "archon-ui-expert"
    files:
      - CREATE: archon-ui-main/src/components/prp/components/CollapsibleSectionRenderer.tsx
      - UPDATE: archon-ui-main/src/components/prp/PRPViewer.tsx
    success_criteria:
      - Section-specific icons and colors
      - Smooth animations for expand/collapse
      - Proper content formatting for different data types
      - Responsive design for mobile/tablet
      
  task_4:
    title: "Implement Socket.IO real-time document synchronization"  
    description: "Add comprehensive real-time synchronization for document operations"
    agent: "archon-socketio-expert"
    files:
      - UPDATE: archon-ui-main/src/services/socketService.ts
      - UPDATE: archon-ui-main/src/components/project-tasks/DocsTab.tsx
      - UPDATE: python/src/server/services/socket_handlers.py
    success_criteria:
      - Document updates broadcast in real-time
      - Delete operations synchronized across clients
      - ID assignment events properly handled
      - Conflict resolution for simultaneous edits
      - Performance batching implemented

Priority 3 Tasks (Enhancement):  
  task_5:
    title: "Implement performance optimizations and lazy loading"
    description: "Add lazy loading, virtualization, and render optimizations"
    agent: "archon-ui-expert"
    files:
      - UPDATE: archon-ui-main/src/components/project-tasks/DocsTab.tsx
      - CREATE: archon-ui-main/src/hooks/useVirtualizedDocuments.ts
      - CREATE: archon-ui-main/src/components/project-tasks/DocumentCardSkeleton.tsx
    success_criteria:
      - Lazy loading for large document sets (>50 documents)
      - Smooth scroll performance at 60fps
      - Memory usage optimized with proper cleanup
      - Intersection observer for efficient loading
```

## Validation Loop

### Level 1: Syntax & Type Checking
```bash
cd archon-ui-main

# TypeScript compilation
npm run type-check

# Linting with auto-fix
npm run lint -- --fix

# Format check
npm run format:check
```

### Level 2: Unit Testing
```bash
# Component tests
npm run test -- MarkdownDocumentRenderer.test.tsx
npm run test -- DocumentCard.test.tsx  
npm run test -- CollapsibleSectionRenderer.test.tsx

# Test coverage for critical components
npm run test:coverage -- --collectCoverageFrom='src/components/prp/**/*.tsx'
npm run test:coverage -- --collectCoverageFrom='src/components/project-tasks/**/*.tsx'
```

### Level 3: Integration Testing
```bash
# Start development server
npm run dev

# Manual testing checklist:
# 1. Create documents with JSON structure (PRP format)
# 2. Verify MarkdownDocumentRenderer handles JSON correctly  
# 3. Test DocumentCard ID display and copy functionality
# 4. Verify CollapsibleSectionRenderer styling and animations
# 5. Test Socket.IO real-time updates with multiple browser tabs
# 6. Verify performance with 50+ documents
# 7. Test lazy loading scroll behavior
# 8. Verify conflict resolution with simultaneous edits
```

### Level 4: Socket.IO Testing
```bash
# Socket.IO server testing
cd python
uv run pytest tests/test_socket_handlers.py -v

# Real-time functionality testing:
# 1. Open multiple browser tabs
# 2. Create/update/delete documents in one tab
# 3. Verify real-time updates in other tabs  
# 4. Test conflict resolution with simultaneous edits
# 5. Verify performance with multiple connected clients
```

### Level 5: Performance Validation
```javascript
// React DevTools Profiler
// 1. Record interaction with 100+ documents
// 2. Measure render times for document selection
// 3. Verify lazy loading reduces initial render time
// 4. Check memory usage during extended usage

// Lighthouse Performance Testing
// 1. npm run build
// 2. Serve production build
// 3. Run Lighthouse on /project/:id page
// 4. Verify Performance score > 90
// 5. Ensure First Contentful Paint < 1.5s
```

## Success Metrics
- MarkdownDocumentRenderer handles JSON structures without errors
- DocumentCard ID copy functionality works with <100ms response
- CollapsibleSectionRenderer animations smooth at 60fps
- Socket.IO updates propagate to all clients within <200ms
- Lazy loading reduces initial render time by >40%
- Memory usage stable during extended use (no leaks)
- Performance score maintained >90 in Lighthouse
- User satisfaction: Zero "[Image #N]" rendering issues

## Project Integration
- **Project ID**: 3cdb2ac1-2648-4555-ab08-d95d15599cca
- **Document Type**: prp
- **Priority**: high
- **Estimated Effort**: 3-5 days
- **Dependencies**: None (can start immediately)
- **Backward Compatibility**: Maintained for all existing documents