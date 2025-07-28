import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CrawlingProgressCard } from '../CrawlingProgressCard';
import { CrawlProgressData } from '../../../services/crawlProgressService';
import { knowledgeBaseService } from '../../../services/knowledgeBaseService';

// Mock the knowledge base service
vi.mock('../../../services/knowledgeBaseService', () => ({
  knowledgeBaseService: {
    stopCrawl: vi.fn()
  }
}));

// Mock the useTerminalScroll hook
vi.mock('../../../hooks/useTerminalScroll', () => ({
  useTerminalScroll: () => ({ current: null })
}));

describe('CrawlingProgressCard', () => {
  const mockProgressData: CrawlProgressData = {
    progressId: 'test-progress-123',
    status: 'processing',
    percentage: 50,
    currentUrl: 'https://example.com',
    logs: ['Starting crawl...', 'Processing page 1...']
  };

  const mockOnStop = vi.fn();
  const mockOnComplete = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stop button for active crawls', () => {
    render(
      <CrawlingProgressCard
        progressData={mockProgressData}
        onComplete={mockOnComplete}
        onError={mockOnError}
        onStop={mockOnStop}
      />
    );

    const stopButton = screen.getByTitle('Stop Crawl');
    expect(stopButton).toBeInTheDocument();
  });

  it('does not render stop button for completed crawls', () => {
    const completedData = { ...mockProgressData, status: 'completed' };
    
    render(
      <CrawlingProgressCard
        progressData={completedData}
        onComplete={mockOnComplete}
        onError={mockOnError}
        onStop={mockOnStop}
      />
    );

    const stopButton = screen.queryByTitle('Stop Crawl');
    expect(stopButton).not.toBeInTheDocument();
  });

  it('does not render stop button for cancelled crawls', () => {
    const cancelledData = { ...mockProgressData, status: 'cancelled' };
    
    render(
      <CrawlingProgressCard
        progressData={cancelledData}
        onComplete={mockOnComplete}
        onError={mockOnError}
        onStop={mockOnStop}
      />
    );

    const stopButton = screen.queryByTitle('Stop Crawl');
    expect(stopButton).not.toBeInTheDocument();
  });

  it('calls onStop callback when stop button is clicked', async () => {
    render(
      <CrawlingProgressCard
        progressData={mockProgressData}
        onComplete={mockOnComplete}
        onError={mockOnError}
        onStop={mockOnStop}
      />
    );

    const stopButton = screen.getByTitle('Stop Crawl');
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(mockOnStop).toHaveBeenCalledTimes(1);
    });
  });

  it('disables stop button while stopping', async () => {
    render(
      <CrawlingProgressCard
        progressData={mockProgressData}
        onComplete={mockOnComplete}
        onError={mockOnError}
        onStop={mockOnStop}
      />
    );

    const stopButton = screen.getByTitle('Stop Crawl');
    fireEvent.click(stopButton);

    // Button should be disabled while stopping
    expect(stopButton).toHaveAttribute('disabled');
  });

  it('shows stopping status in UI', () => {
    const stoppingData = { ...mockProgressData, status: 'stopping' };
    
    render(
      <CrawlingProgressCard
        progressData={stoppingData}
        onComplete={mockOnComplete}
        onError={mockOnError}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText('Stopping crawl...')).toBeInTheDocument();
  });

  it('shows cancelled status in UI', () => {
    const cancelledData = { ...mockProgressData, status: 'cancelled' };
    
    render(
      <CrawlingProgressCard
        progressData={cancelledData}
        onComplete={mockOnComplete}
        onError={mockOnError}
        onStop={mockOnStop}
      />
    );

    expect(screen.getByText('Crawling cancelled')).toBeInTheDocument();
  });
});