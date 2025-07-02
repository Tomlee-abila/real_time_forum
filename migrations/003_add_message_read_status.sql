-- Add is_read column to messages table for tracking read status
ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on unread messages
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
