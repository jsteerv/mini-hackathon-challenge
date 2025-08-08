-- RSS Feeds Table
CREATE TABLE rss_feeds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- YouTube Channels Table
CREATE TABLE youtube_channels (
    id SERIAL PRIMARY KEY,
    channel_name VARCHAR(255) NOT NULL,
    channel_url VARCHAR(500) NOT NULL UNIQUE,
    channel_id VARCHAR(100), -- YouTube channel ID for API calls
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research Topics Table
CREATE TABLE research_topics (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    keywords TEXT, -- JSON array of related keywords
    priority INTEGER DEFAULT 5, -- 1-10 priority scale
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News Items Table (stores aggregated news for each run)
CREATE TABLE news_items (
    id SERIAL PRIMARY KEY,
    run_date DATE NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT NOT NULL,
    relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 10),
    mention_count INTEGER DEFAULT 1,
    source_type VARCHAR(50) NOT NULL, -- 'rss', 'youtube', 'brave_search'
    source_url VARCHAR(500),
    source_name VARCHAR(255),
    article_url VARCHAR(500), -- Link to original article/video
    raw_content TEXT, -- Store original content for reference
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Removed processed_items table - using news_items for deduplication instead

-- Indexes for better performance
CREATE INDEX idx_rss_feeds_active ON rss_feeds (is_active);
CREATE INDEX idx_youtube_channels_active ON youtube_channels (is_active);
CREATE INDEX idx_research_topics_active ON research_topics (is_active);
CREATE INDEX idx_news_items_run_date ON news_items (run_date);
CREATE INDEX idx_news_items_run_date_relevance ON news_items (run_date, relevance_score DESC);
CREATE INDEX idx_news_items_title_run_date ON news_items (title, run_date);
CREATE INDEX idx_news_items_article_url ON news_items (article_url);