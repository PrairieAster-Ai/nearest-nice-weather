-- Simplified database schema for Vercel PostgreSQL
-- User feedback collection (simplified from analytics.user_feedback)
CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    feedback_text TEXT NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45), -- Support IPv6
    session_id VARCHAR(255),
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User analytics tracking (simplified from analytics.user_events)
CREATE TABLE IF NOT EXISTS user_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL, -- 'weather_search', 'map_interaction', 'feedback_submit', etc.
    event_data JSONB,
    user_location POINT, -- Simplified geometry
    user_agent TEXT,
    ip_address VARCHAR(45),
    page_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_session_time ON user_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_type_time ON user_events(event_type, created_at);

-- Insert sample data to verify setup
INSERT INTO user_feedback (email, feedback_text, session_id, page_url) VALUES
    ('test@example.com', 'This is a test feedback entry to verify the database setup is working correctly.', 'test_session_1', 'https://www.nearestniceweather.com')
ON CONFLICT DO NOTHING;
