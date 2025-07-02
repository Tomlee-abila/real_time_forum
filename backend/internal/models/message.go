package models

import (
	"errors"
	"strings"
	"time"
)

// Message represents a private message between users
type Message struct {
	ID         string    `json:"id"`
	SenderID   string    `json:"sender_id"`
	ReceiverID string    `json:"receiver_id"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
	IsRead     bool      `json:"is_read"`
	// User information for display
	SenderNickname   string `json:"sender_nickname,omitempty"`
	ReceiverNickname string `json:"receiver_nickname,omitempty"`
}

// MessageCreation represents the data needed to create a message
type MessageCreation struct {
	ReceiverID string `json:"receiver_id"`
	Content    string `json:"content"`
}

// Conversation represents a conversation between two users
type Conversation struct {
	UserID       string    `json:"user_id"`
	UserNickname string    `json:"user_nickname"`
	LastMessage  *Message  `json:"last_message"`
	UnreadCount  int       `json:"unread_count"`
	IsOnline     bool      `json:"is_online"`
	LastSeen     time.Time `json:"last_seen,omitempty"`
}

// MessageHistory represents paginated message history
type MessageHistory struct {
	Messages    []Message `json:"messages"`
	HasMore     bool      `json:"has_more"`
	TotalCount  int       `json:"total_count"`
	CurrentPage int       `json:"current_page"`
}

// UserStatus represents online/offline status
type UserStatus struct {
	UserID     string    `json:"user_id"`
	Nickname   string    `json:"nickname"`
	IsOnline   bool      `json:"is_online"`
	LastSeen   time.Time `json:"last_seen"`
	LastActive time.Time `json:"last_active"`
}

// WebSocketMessage represents a real-time message event
type WebSocketMessage struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}

// MessageEvent represents different types of message events
type MessageEvent struct {
	Type       string      `json:"type"` // "new_message", "message_read", "user_online", "user_offline", "typing"
	Message    *Message    `json:"message,omitempty"`
	UserStatus *UserStatus `json:"user_status,omitempty"`
	UserID     string      `json:"user_id,omitempty"`
}

// Validate validates the message creation data
func (mc *MessageCreation) Validate() error {
	// Validate receiver ID
	if strings.TrimSpace(mc.ReceiverID) == "" {
		return errors.New("receiver ID is required")
	}

	// Validate content
	if strings.TrimSpace(mc.Content) == "" {
		return errors.New("message content is required")
	}
	if len(mc.Content) > 1000 {
		return errors.New("message content must be less than 1000 characters")
	}

	return nil
}
