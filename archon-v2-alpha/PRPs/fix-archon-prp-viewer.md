name: "Fix Archon PRP Viewer Component"
description: |
  ## Purpose
  Fix rendering issues in PRPViewer and enhance DocsTab with card-based document selection
  
  ## Core Principles
  1. **Context is King**: All necessary documentation included
  2. **Validation Loops**: Executable tests at every level
  3. **Information Dense**: Specific patterns and examples
  4. **Progressive Success**: Start simple, validate, enhance

---

## Goal
Fix [Image #1] rendering issues in PRPViewer and replace dropdown selector with horizontally scrollable document cards that support deletion and show document types, while ensuring seamless handling of both markdown strings and structured PRP objects.

## Why
- **User Impact**: Documents show [Image #1] instead of proper content, breaking the user experience
- **Integration Issues**: MCP tools create structured JSON documents that aren't rendered correctly
- **UI Enhancement**: Current dropdown is limited and doesn't show document types or allow deletion
- **Consistency**: Need unified handling of legacy markdown and new structured PRP formats

## What
Create a robust PRP viewer that:
- Renders all document types correctly without [Image #1] placeholders
- Provides beautiful card-based document selection UI
- Handles both markdown strings and structured PRP objects seamlessly
- Supports document deletion from cards
- Shows document type badges (PRP, Technical, Business, etc.)
- Maintains smooth transitions between view and edit modes

### Success Criteria
- [ ] PRPViewer renders all content without [Image #1] placeholders
- [ ] Document cards scroll horizontally with proper overflow handling
- [ ] Each card shows: type icon, title, and delete button on hover
- [ ] Structured PRP objects convert to markdown correctly for editing
- [ ] Beautiful view mode renders PRPs with collapsible sections
- [ ] Delete functionality works with proper confirmation
- [ ] Active document card has clear visual indication
- [ ] Performance: Smooth transitions and no lag with 50+ documents

## All Needed Context

### Documentation & References
```yaml
- file: archon-ui-main/src/components/prp/PRPViewer.tsx
  why: Current PRPViewer component that needs fixing
  lines: 1-183
  
- file: archon-ui-main/src/components/project-tasks/DocsTab.tsx
  why: Parent component managing document selection
  lines: 500-1093
  
- file: archon-ui-main/src/components/project-tasks/MilkdownEditor.tsx
  why: Markdown editor that needs to handle PRP conversion
  lines: 36-100
  
- file: archon-ui-main/src/components/ui/Card.tsx
  why: Existing card component for consistent styling
  
- doc: React 18 Hooks
  section: useRef, useEffect for DOM manipulation
  critical: Proper cleanup to prevent memory leaks
  
- pattern: ShadCN UI card components
  why: Consistent with Archon's UI design system
```

### Current Issues Analysis
```typescript
// ISSUE 1: [Image #1] rendering
// The PRPViewer doesn't handle image references in markdown
// Need to parse and replace [Image #N] with proper rendering

// ISSUE 2: Content type detection
// DocsTab line 963-969 shows basic content handling:
viewMode === 'beautiful' ? (
  <PRPViewer 
    content={selectedDocument.content || {}} 
    isDarkMode={isDarkMode}
  />
)

// ISSUE 3: Dropdown limitations (line 876-889)
<select value={selectedDocument?.id || ''} onChange={(e) => {
  const doc = documents.find(d => d.id === e.target.value);
  if (doc) setSelectedDocument(doc);
}}>

// ISSUE 4: MilkdownEditor PRP conversion (lines 84-100)
// Converts PRP to markdown but may miss image references
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: MCP tools create documents with this structure:
{
  id: "doc-timestamp",
  title: "Document Title",
  content: {
    document_type: "prp",
    title: "PRP Title",
    // ... nested PRP structure
  },
  document_type: "prp"
}

// CRITICAL: Milkdown editor expects markdown strings
// Must convert structured content before editing

// GOTCHA: React 18 strict mode double-mounts components
// Use cleanup functions in useEffect

// GOTCHA: Horizontal scroll needs explicit width constraints
// Use flex-shrink-0 on cards to prevent compression
```

## Implementation Blueprint

### Phase 1: Document Card Component
```typescript
// archon-ui-main/src/components/project-tasks/DocumentCard.tsx
interface DocumentCardProps {
  document: ProjectDoc;
  isActive: boolean;
  onSelect: (doc: ProjectDoc) => void;
  onDelete: (docId: string) => void;
  isDarkMode: boolean;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isActive,
  onSelect,
  onDelete,
  isDarkMode
}) => {
  const [showDelete, setShowDelete] = useState(false);
  
  const getDocumentIcon = (type?: string) => {
    switch (type) {
      case 'prp': return <Rocket className="w-4 h-4" />;
      case 'technical': return <Code className="w-4 h-4" />;
      case 'business': return <Briefcase className="w-4 h-4" />;
      case 'meeting_notes': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };
  
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'prp': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'technical': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'business': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
    }
  };
  
  return (
    <div
      className={`
        relative flex-shrink-0 w-48 p-4 rounded-lg cursor-pointer
        transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 shadow-lg' 
          : 'bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
      onClick={() => onSelect(document)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Document Type Badge */}
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mb-2 ${getTypeColor(document.document_type)}`}>
        {getDocumentIcon(document.document_type)}
        <span>{document.document_type || 'document'}</span>
      </div>
      
      {/* Title */}
      <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
        {document.title}
      </h4>
      
      {/* Metadata */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {new Date(document.updated_at).toLocaleDateString()}
      </p>
      
      {/* Delete Button */}
      {showDelete && !isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${document.title}"?`)) {
              onDelete(document.id);
            }
          }}
          className="absolute top-2 right-2 p-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
```

### Phase 2: Update DocsTab Document Selector
```typescript
// Replace lines 874-890 in DocsTab.tsx with:

{/* Document Cards Container */}
<div className="relative">
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
    {documents.map(doc => (
      <DocumentCard
        key={doc.id}
        document={doc}
        isActive={selectedDocument?.id === doc.id}
        onSelect={setSelectedDocument}
        onDelete={async (docId) => {
          try {
            // Remove from local state
            setDocuments(prev => prev.filter(d => d.id !== docId));
            if (selectedDocument?.id === docId) {
              setSelectedDocument(documents[0] || null);
            }
            showToast('Document deleted', 'success');
          } catch (error) {
            showToast('Failed to delete document', 'error');
          }
        }}
        isDarkMode={isDarkMode}
      />
    ))}
    
    {/* Add New Document Card */}
    <div
      onClick={() => setShowTemplateModal(true)}
      className="flex-shrink-0 w-48 h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 flex flex-col items-center justify-center cursor-pointer transition-colors group"
    >
      <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors mb-2" />
      <span className="text-sm text-gray-500 group-hover:text-blue-500">New Document</span>
    </div>
  </div>
</div>
```

### Phase 3: Fix PRPViewer Content Rendering
```typescript
// Update PRPViewer.tsx to handle image placeholders
// Add after line 75:

const processContent = (content: any): any => {
  if (typeof content === 'string') {
    // Replace [Image #N] with proper rendering
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

// Update line 82 to use processed content:
const processedContent = processContent(content);
const sections = Object.entries(processedContent).filter(([key]) => !metadataFields.includes(key));
```

### Phase 4: Enhanced MilkdownEditor PRP Conversion
```typescript
// Update MilkdownEditor.tsx convertPRPToMarkdown function
// Add comprehensive field handling:

const convertPRPToMarkdown = (content: any): string => {
  let markdown = `# ${content.title || doc.title}\n\n`;
  
  // Metadata section
  if (content.version || content.author || content.date || content.status) {
    markdown += `## Metadata\n\n`;
    if (content.version) markdown += `- **Version:** ${content.version}\n`;
    if (content.author) markdown += `- **Author:** ${content.author}\n`;
    if (content.date) markdown += `- **Date:** ${content.date}\n`;
    if (content.status) markdown += `- **Status:** ${content.status}\n`;
    markdown += '\n';
  }
  
  // Goal section
  if (content.goal) {
    markdown += `## Goal\n\n${content.goal}\n\n`;
  }
  
  // Why section
  if (content.why) {
    markdown += `## Why\n\n`;
    if (Array.isArray(content.why)) {
      content.why.forEach(item => markdown += `- ${item}\n`);
    } else {
      markdown += `${content.why}\n`;
    }
    markdown += '\n';
  }
  
  // What section
  if (content.what) {
    markdown += `## What\n\n`;
    if (typeof content.what === 'string') {
      markdown += `${content.what}\n\n`;
    } else if (content.what.description) {
      markdown += `${content.what.description}\n\n`;
      
      if (content.what.success_criteria) {
        markdown += `### Success Criteria\n\n`;
        content.what.success_criteria.forEach((criterion: string) => {
          markdown += `- [ ] ${criterion}\n`;
        });
        markdown += '\n';
      }
    }
  }
  
  // Handle all other sections dynamically
  const handledKeys = ['title', 'version', 'author', 'date', 'status', 'goal', 'why', 'what', 'document_type'];
  
  Object.entries(content).forEach(([key, value]) => {
    if (!handledKeys.includes(key) && value) {
      const sectionTitle = key.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      markdown += `## ${sectionTitle}\n\n`;
      markdown += formatValue(value);
      markdown += '\n';
    }
  });
  
  return markdown;
};

// Helper function to format values
const formatValue = (value: any, indent = ''): string => {
  if (Array.isArray(value)) {
    return value.map(item => `${indent}- ${formatValue(item, indent + '  ')}`).join('\n') + '\n';
  }
  
  if (typeof value === 'object' && value !== null) {
    let result = '';
    Object.entries(value).forEach(([key, val]) => {
      const formattedKey = key.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      if (typeof val === 'string' || typeof val === 'number') {
        result += `${indent}**${formattedKey}:** ${val}\n\n`;
      } else {
        result += `${indent}### ${formattedKey}\n\n${formatValue(val, indent)}`;
      }
    });
    return result;
  }
  
  return String(value);
};
```

### Task List
```yaml
Task 1: Create DocumentCard component
  - CREATE: archon-ui-main/src/components/project-tasks/DocumentCard.tsx
  - Pattern: Follow existing Card component patterns
  - Include: Type badges, delete functionality, hover states

Task 2: Update DocsTab document selector
  - MODIFY: archon-ui-main/src/components/project-tasks/DocsTab.tsx
  - Replace: Lines 874-890 with card-based selector
  - Add: Horizontal scroll container with proper constraints

Task 3: Fix PRPViewer content processing
  - MODIFY: archon-ui-main/src/components/prp/PRPViewer.tsx
  - Add: processContent function to handle [Image #N] placeholders
  - Update: Content processing pipeline

Task 4: Enhance MilkdownEditor PRP conversion
  - MODIFY: archon-ui-main/src/components/project-tasks/MilkdownEditor.tsx
  - Update: convertPRPToMarkdown function
  - Add: Comprehensive field handling and formatting

Task 5: Add CSS for scrollbar styling
  - MODIFY: archon-ui-main/src/index.css or create new CSS module
  - Add: Tailwind scrollbar utilities
  - Style: Thin scrollbar for card container

Task 6: Write comprehensive tests
  - CREATE: archon-ui-main/src/components/project-tasks/__tests__/DocumentCard.test.tsx
  - CREATE: archon-ui-main/src/components/prp/__tests__/PRPViewer.test.tsx
  - Coverage: Component rendering, user interactions, edge cases
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# TypeScript compilation
cd archon-ui-main
npm run type-check

# Linting
npm run lint

# Format check
npm run format:check
```

### Level 2: Component Tests
```bash
# Run component tests
npm run test -- DocumentCard.test.tsx
npm run test -- PRPViewer.test.tsx

# Test coverage
npm run test:coverage -- --collectCoverageFrom='src/components/project-tasks/**/*.tsx'
```

### Level 3: Integration Testing
```bash
# Start development server
npm run dev

# Manual testing checklist:
# 1. Create documents of each type (PRP, Technical, Business, Markdown)
# 2. Verify cards display correctly with proper icons and colors
# 3. Test horizontal scrolling with 10+ documents
# 4. Verify active document highlighting
# 5. Test delete functionality with confirmation
# 6. Switch between beautiful and markdown view modes
# 7. Edit a PRP in markdown mode and save
# 8. Verify [Image #1] placeholders are gone
```

### Level 4: Performance Validation
```bash
# React DevTools Profiler
# 1. Open React DevTools Profiler
# 2. Start recording
# 3. Create 50 documents
# 4. Scroll through cards rapidly
# 5. Switch between documents
# 6. Verify no performance degradation

# Bundle size check
npm run build
npm run analyze
# Ensure bundle size increase < 10KB
```

### Level 5: E2E Testing
```typescript
// cypress/e2e/prp-viewer.cy.ts
describe('PRP Viewer', () => {
  it('renders document cards correctly', () => {
    cy.visit('/project/test-id');
    cy.get('[data-testid="document-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="document-card"]').first().should('contain', 'PRP');
  });
  
  it('handles document deletion', () => {
    cy.visit('/project/test-id');
    cy.get('[data-testid="document-card"]').first().trigger('mouseenter');
    cy.get('[data-testid="delete-button"]').click();
    cy.on('window:confirm', () => true);
    cy.get('[data-testid="toast"]').should('contain', 'Document deleted');
  });
  
  it('switches between view modes', () => {
    cy.visit('/project/test-id');
    cy.get('[data-testid="view-mode-beautiful"]').click();
    cy.get('.prp-viewer').should('be.visible');
    cy.get('[data-testid="view-mode-markdown"]').click();
    cy.get('.milkdown-editor').should('be.visible');
  });
});
```

## Success Metrics
- Zero [Image #N] placeholders in rendered content
- Document card selection < 50ms response time
- Horizontal scroll performance smooth at 60fps
- All document types render correctly
- Delete confirmation prevents accidental deletion
- Beautiful/markdown mode switch < 100ms