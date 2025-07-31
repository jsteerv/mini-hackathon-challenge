import React from 'react';
import { ParsedMarkdownDocument, parseMarkdownToDocument, isDocumentWithMetadata, isMarkdownContent } from '../utils/markdownParser';
import { MetadataSection } from '../sections/MetadataSection';
import { MarkdownSectionRenderer } from './MarkdownSectionRenderer';

interface MarkdownDocumentRendererProps {
  content: any;
  isDarkMode?: boolean;
  sectionOverrides?: Record<string, React.ComponentType<any>>;
}

/**
 * Renders markdown documents with metadata header and flowing content sections
 * Handles both pure markdown strings and documents with metadata + content structure
 */
export const MarkdownDocumentRenderer: React.FC<MarkdownDocumentRendererProps> = ({
  content,
  isDarkMode = false,
  sectionOverrides = {}
}) => {
  try {
    let parsedDocument: ParsedMarkdownDocument;
    let documentMetadata: any = {};

  console.log('MarkdownDocumentRenderer: Processing content:', {
    type: typeof content,
    keys: typeof content === 'object' && content !== null ? Object.keys(content) : [],
    isDocWithMetadata: typeof content === 'object' && content !== null ? isDocumentWithMetadata(content) : false
  });

  // Handle different content structures
  if (typeof content === 'string') {
    console.log('MarkdownDocumentRenderer: Processing pure markdown string');
    // Pure markdown string
    parsedDocument = parseMarkdownToDocument(content);
    // Create synthetic metadata for display
    documentMetadata = {
      title: parsedDocument.title || 'Document',
      document_type: 'markdown'
    };
  } else if (typeof content === 'object' && content !== null) {
    console.log('MarkdownDocumentRenderer: Processing object content');
    
    // Extract all potential metadata fields first
    const metadataFields = ['title', 'version', 'author', 'date', 'status', 'document_type', 'created_at', 'updated_at'];
    metadataFields.forEach(field => {
      if (content[field]) {
        documentMetadata[field] = content[field];
      }
    });
    
    // Find the markdown content in any field
    let markdownContent = '';
    
    // First check common markdown field names
    if (typeof content.markdown === 'string') {
      markdownContent = content.markdown;
      console.log('MarkdownDocumentRenderer: Found markdown in "markdown" field');
    } else if (typeof content.content === 'string' && isMarkdownContent(content.content)) {
      markdownContent = content.content;
      console.log('MarkdownDocumentRenderer: Found markdown in "content" field');
    } else {
      // Look for markdown content in any field
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string' && isMarkdownContent(value)) {
          markdownContent = value;
          console.log(`MarkdownDocumentRenderer: Found markdown in field '${key}'`);
          break;
        }
      }
    }
    
    if (markdownContent) {
      console.log('MarkdownDocumentRenderer: Parsing markdown content:', {
        contentLength: markdownContent.length,
        contentPreview: markdownContent.substring(0, 100) + '...'
      });
      parsedDocument = parseMarkdownToDocument(markdownContent);
      console.log('MarkdownDocumentRenderer: Parsed document:', {
        sectionsCount: parsedDocument.sections.length,
        sections: parsedDocument.sections.map(s => ({ title: s.title, type: s.type }))
      });
    } else {
      // No markdown content found, create empty document
      console.log('MarkdownDocumentRenderer: No markdown content found in document');
      parsedDocument = { sections: [], metadata: {}, hasMetadata: false };
    }
    
    // Use document title from metadata if available
    if (content.title && !parsedDocument.title) {
      parsedDocument.title = content.title;
    }
  } else {
    console.log('MarkdownDocumentRenderer: Unexpected content structure');
    // Fallback for unexpected content structure
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Unable to parse document content</p>
      </div>
    );
  }

  // ALWAYS show metadata - force hasMetadata to true
  parsedDocument.hasMetadata = true;

  // Combine parsed metadata with document metadata and add defaults
  const finalMetadata = {
    // Default values for better display
    document_type: 'prp',
    version: '1.0',
    status: 'draft',
    ...parsedDocument.metadata,
    ...documentMetadata,
    title: parsedDocument.title || documentMetadata.title || 'Untitled Document'
  };

  console.log('MarkdownDocumentRenderer: Final render data:', {
    hasMetadata: parsedDocument.hasMetadata,
    finalMetadata,
    sectionsCount: parsedDocument.sections.length,
    sections: parsedDocument.sections.map(s => ({ title: s.title, type: s.type, templateType: s.templateType }))
  });

  return (
    <div className="markdown-document-renderer">
      {/* ALWAYS show metadata header */}
      <MetadataSection content={finalMetadata} isDarkMode={isDarkMode} />

      {/* Document Sections */}
      <div className="space-y-2">
        {parsedDocument.sections.map((section, index) => (
          <MarkdownSectionRenderer
            key={`${section.sectionKey}-${index}`}
            section={section}
            index={index}
            isDarkMode={isDarkMode}
            sectionOverrides={sectionOverrides}
          />
        ))}
      </div>

      {/* Empty state */}
      {parsedDocument.sections.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No content sections found in this document.</p>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('MarkdownDocumentRenderer: Error rendering content:', error);
    
    // Provide a meaningful error display instead of black screen
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Rendering Document</h3>
        <p className="text-red-600 dark:text-red-300 text-sm mb-4">
          There was an error rendering this document. The content may be in an unexpected format.
        </p>
        
        {/* Show raw content for debugging */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:underline">
            Show raw content
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-96">
            {typeof content === 'string' 
              ? content 
              : JSON.stringify(content, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
};