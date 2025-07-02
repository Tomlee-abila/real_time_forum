package models

import (
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
