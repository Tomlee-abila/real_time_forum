-- Add user_status table for tracking online/offline status
CREATE TABLE IF NOT EXISTS user_status (
    user_id TEXT PRIMARY KEY,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_status_online ON user_status(is_online);
CREATE INDEX IF NOT EXISTS idx_user_status_last_active ON user_status(last_active);
