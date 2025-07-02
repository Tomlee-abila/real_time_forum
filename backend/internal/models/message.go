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
